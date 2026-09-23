import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertLoadCoverage, assertGameCoverage, assertMemoryCoverage } from './performance-coverage.mjs';
import { assetPath, verifyRelease } from './release.mjs';

export const REQUIRED_TRACK = 'bs-s4-14';
export const REQUIRED_PROFILES = [
  { name: 'desktop', viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1,
    cpuSlowdown: 1, downloadMbps: 25, uploadMbps: 5, latencyMs: 40, isMobile: false, hasTouch: false },
  { name: 'mobile-emulated', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2,
    cpuSlowdown: 4, downloadMbps: 10, uploadMbps: 2, latencyMs: 100, isMobile: true, hasTouch: true },
];
const LOAD_SCENARIOS = ['home-first-visit', 'song-cold', 'duo-cold'];
const GAME_SCENARIOS = ['hard-fx-off', 'hard-fx-max', 'duo-fx-max'];
export const BUDGETS = {
  homeMs: 1500, playReadyMs: 4000, minimumFps: 59.9, maximumFrameMs: 50.1,
  maximumConsecutiveMissedIntervals: 1, canvasDrawMs: 5, fieldSampleTolerance: 3,
  minimumLoadRepeats: 3, minimumMemoryCycles: 8, maximumDecodedBytes: 64 * 1024 * 1024,
  maximumFinalHeapRangeBytes: 1024 * 1024,
};

function validator() {
  const issues = [];
  const check = (condition, message) => { if (!condition) issues.push(message); return !!condition; };
  const number = (value, label, minimum = 0, integer = false) => check(
    Number.isFinite(value) && value >= minimum && (!integer || Number.isInteger(value)),
    `${label} must be a finite ${integer ? 'integer' : 'number'} >= ${minimum}`,
  );
  const maximum = (value, label, limit, minimum = 0) => {
    if (number(value, label, minimum)) check(value <= limit, `${label} ${value} exceeds ${limit}`);
  };
  return { issues, check, number, maximum };
}

function durationSummary(summary, label, v) {
  v.number(summary?.samples, `${label}.samples`, 1, true);
  for (const key of ['totalMs', 'p50Ms', 'p95Ms', 'p99Ms', 'maxMs']) v.number(summary?.[key], `${label}.${key}`);
  if (['totalMs', 'p50Ms', 'p95Ms', 'p99Ms', 'maxMs', 'samples'].every(key => Number.isFinite(summary?.[key]))) {
    v.check(summary.p50Ms <= summary.p95Ms && summary.p95Ms <= summary.p99Ms && summary.p99Ms <= summary.maxMs,
      `${label} percentiles must be ordered and bounded by maxMs`);
    v.check(summary.totalMs >= summary.maxMs && summary.totalMs <= summary.samples * summary.maxMs + 0.001,
      `${label}.totalMs is inconsistent with sample count and maximum`);
  }
}

/** Per-row coverage is recalculated; a stored covered:true never grants a pass. */
export function evaluateObservationBudget(row, { track, cycles } = {}) {
  const v = validator();
  let coverage = null;
  try {
    assert(row && typeof row === 'object', 'Missing observation');
    coverage = row.kind === 'load' ? assertLoadCoverage(row)
      : row.kind === 'game' ? assertGameCoverage(row, track)
        : row.kind === 'memory' ? assertMemoryCoverage(row, { cycles })
          : assert.fail(`Unknown observation kind: ${row.kind}`);
  } catch (error) { v.issues.push(`Coverage: ${error.message}`); }
  if (!row || typeof row !== 'object') return { passed: false, coverage, issues: v.issues };
  if (row.error) v.issues.push('Observation contains an error');
  if (row.status !== undefined && row.status !== 'measured') v.issues.push(`Observation status is ${row.status}`);
  if (row.coverage?.covered === false) v.issues.push('Observation records failed coverage');

  if (row.kind === 'load') {
    const home = row.scenario === 'home-first-visit';
    v.maximum(row.summary?.readyMs, 'readyMs', home ? BUDGETS.homeMs : BUDGETS.playReadyMs, Number.MIN_VALUE);
    if (home) {
      v.maximum(row.probe?.paint?.firstContentfulPaintMs, 'home FCP', BUDGETS.homeMs, Number.MIN_VALUE);
      v.maximum(row.probe?.paint?.largestContentfulPaintMs, 'home LCP', BUDGETS.homeMs, Number.MIN_VALUE);
    }
  } else if (row.kind === 'game') {
    const frame = row.probe?.frames;
    durationSummary(frame, 'frames', v);
    if (v.number(frame?.observedFps, 'frames.observedFps', Number.MIN_VALUE)) {
      v.check(frame.observedFps >= BUDGETS.minimumFps, `frames.observedFps ${frame.observedFps} is below ${BUDGETS.minimumFps}`);
      if (Number.isFinite(frame.totalMs) && frame.totalMs > 0 && Number.isFinite(frame.samples)) {
        v.check(Math.abs(frame.observedFps - frame.samples * 1000 / frame.totalMs) < 0.0001,
          'frames.observedFps disagrees with measured intervals');
      }
    }
    v.check(frame?.targetFps === 60, 'Frame cadence must use the fixed 60 Hz target');
    v.maximum(frame?.maxMs, 'frames.maxMs', BUDGETS.maximumFrameMs, Number.MIN_VALUE);
    if (v.number(frame?.longestConsecutiveMissedIntervals, 'frames.longestConsecutiveMissedIntervals', 0, true)) {
      v.maximum(frame.longestConsecutiveMissedIntervals, 'frames.longestConsecutiveMissedIntervals', BUDGETS.maximumConsecutiveMissedIntervals);
    }

    const draw = row.probe?.canvasDraw;
    durationSummary(draw, 'canvasDraw', v);
    v.maximum(draw?.maxMs, 'canvasDraw.maxMs', BUDGETS.canvasDrawMs);
    const fields = row.scenario === 'duo-fx-max' ? ['1', '2'] : ['1'];
    const fieldSamples = draw?.fieldSamples;
    if (v.check(fieldSamples && typeof fieldSamples === 'object' && !Array.isArray(fieldSamples), 'Missing canvasDraw.fieldSamples')) {
      v.check(JSON.stringify(Object.keys(fieldSamples).sort()) === JSON.stringify(fields), `canvasDraw.fieldSamples requires exactly field(s) ${fields.join(', ')}`);
      for (const field of fields) {
        if (v.number(fieldSamples[field], `canvasDraw.fieldSamples.${field}`, 1, true) && Number.isFinite(frame?.samples)) {
          v.check(Math.abs(fieldSamples[field] - frame.samples) <= BUDGETS.fieldSampleTolerance,
            `canvasDraw field ${field} has ${fieldSamples[field]} samples versus ${frame.samples} frames (tolerance ${BUDGETS.fieldSampleTolerance})`);
        }
      }
      v.check(Object.values(fieldSamples).reduce((sum, value) => sum + value, 0) === draw.samples,
        'canvasDraw.samples must equal the sum of per-field samples');
    }
    for (const key of ['p50', 'p95', 'max']) v.number(draw?.visibleNotes?.[key], `canvasDraw.visibleNotes.${key}`);
    if (draw?.visibleNotes) {
      v.check(draw.visibleNotes.p50 <= draw.visibleNotes.p95 && draw.visibleNotes.p95 <= draw.visibleNotes.max,
        'canvasDraw visible note percentiles must be ordered');
      v.number(draw.visibleNotes.max, 'canvasDraw.visibleNotes.max', 0, true);
    }
    if (v.check(Array.isArray(draw?.overBudget), 'Missing canvasDraw.overBudget observations')) {
      v.check(draw.overBudget.length === 0, `canvasDraw has ${draw.overBudget.length} actual over-budget observation(s)`);
      for (const sample of draw.overBudget) {
        for (const key of ['startedAtMs', 'durationMs', 'songTimeMs']) v.number(sample?.[key], `canvasDraw.overBudget.${key}`);
        v.number(sample?.noteObjects, 'canvasDraw.overBudget.noteObjects', 0, true);
        v.check(fields.includes(String(sample?.field)), 'canvasDraw over-budget observation has an unknown field');
      }
    }
    if (track?.id) {
      v.check(row.probe?.autoplay?.chartId === track.id, 'Autoplay chartId differs from report.config.track.id');
      if (row.scenario !== 'duo-fx-max') v.check(row.outcomes?.lastRun?.track_id === track.id, 'Result track_id differs from report.config.track.id');
    }
  } else if (row.kind === 'memory') {
    v.number(cycles, 'Memory configured cycles', BUDGETS.minimumMemoryCycles, true);
    const points = Array.isArray(row.points) ? row.points : [];
    const final = points.at(-1);
    v.check(final?.label === 'after-interrupted-loads', 'The final memory observation must be after-interrupted-loads');
    const exitPoints = points.filter(point => ['library-initial', 'after-restarts-exit', 'after-interrupted-loads'].includes(point?.label) || /^song-exit-\d+$/.test(point?.label));
    for (const point of exitPoints) {
      v.number(point.gc?.completedCollections, `${point.label} completed GC collections`, 1, true);
      v.maximum(point.probe?.resources?.liveDecodedBufferBytes,
        point.label === 'after-interrupted-loads' ? 'Final live decoded audio bytes' : `${point.label} live decoded audio bytes`, BUDGETS.maximumDecodedBytes);
    }
    v.number(final?.heap?.usedSize, 'Final post-GC heap bytes');
    v.number(final?.dom?.jsEventListeners, 'Final event listeners', 0, true);
    if (Number.isInteger(cycles) && cycles >= 4) {
      const lastFour = Array.from({ length: 4 }, (_, index) => points.find(point => point?.label === `song-exit-${cycles - 3 + index}`));
      for (const [index, point] of lastFour.entries()) {
        const label = `song-exit-${cycles - 3 + index}`;
        v.number(point?.heap?.usedSize, `${label} heap bytes`);
        v.number(point?.dom?.jsEventListeners, `${label} listeners`, 0, true);
        v.number(point?.gc?.completedCollections, `${label} completed GC collections`, 1, true);
        if (index > 0 && point && lastFour[index - 1]) {
          v.check(points.indexOf(point) > points.indexOf(lastFour[index - 1]), 'Last four song-exit observations are not chronological');
          v.check(point.dom?.jsEventListeners <= lastFour[index - 1].dom?.jsEventListeners,
            `Event listeners grew at ${label}`);
        }
      }
      const heaps = lastFour.map(point => point?.heap?.usedSize);
      if (heaps.every(Number.isFinite)) {
        v.maximum(Math.max(...heaps) - Math.min(...heaps), 'Last four post-GC heap range bytes', BUDGETS.maximumFinalHeapRangeBytes);
        if (Number.isFinite(final?.heap?.usedSize)) v.maximum(Math.max(0, final.heap.usedSize - Math.max(...heaps)),
          'Final interrupted-load post-GC heap growth bytes', BUDGETS.maximumFinalHeapRangeBytes);
      }
      const lastListeners = lastFour.at(-1)?.dom?.jsEventListeners;
      if (Number.isFinite(lastListeners) && Number.isFinite(final?.dom?.jsEventListeners)) {
        v.check(final.dom.jsEventListeners <= lastListeners, 'Event listeners grew after interrupted loads');
      }
    }
  }
  return { passed: v.issues.length === 0, coverage, issues: v.issues };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
function fingerprint(row) {
  // Re-numbering a copied observation or changing its old coverage badge does
  // not make it a new browser run, even when copied into a different report.
  const { iteration, coverage, ...evidence } = row;
  return createHash('sha256').update(JSON.stringify(canonical(evidence))).digest('hex');
}

/** Evaluate combined reports against one current artifact and the fixed matrix. */
export function evaluatePerformanceBudget(reports, { artifactSha256, actualTracks, sources = [] } = {}) {
  const issues = [];
  const observations = [];
  const seenReports = new Set();
  const seenEvidence = new Set();
  const matrix = REQUIRED_PROFILES.flatMap(profile => [
    ...LOAD_SCENARIOS.map(scenario => ({ track: REQUIRED_TRACK, profile: profile.name, kind: 'load', scenario, required: 3, covered: 0 })),
    ...GAME_SCENARIOS.map(scenario => ({ track: REQUIRED_TRACK, profile: profile.name, kind: 'game', scenario, required: 1, covered: 0 })),
    { track: REQUIRED_TRACK, profile: profile.name, kind: 'memory', scenario: null, required: 1, covered: 0 },
  ]);
  if (!/^[a-f\d]{64}$/.test(artifactSha256 ?? '')) issues.push('Current release has no valid artifactSha256');
  const actualTrackMap = new Map();
  if (!Array.isArray(actualTracks) || actualTracks.length === 0) issues.push('Actual candidate track metadata is required');
  for (const actual of Array.isArray(actualTracks) ? actualTracks : []) {
    if (typeof actual?.id !== 'string' || !actual.id || !Number.isFinite(actual.duration) || actual.duration < 2 ||
      !Number.isInteger(actual.hardNotes) || actual.hardNotes < 1 || actualTrackMap.has(actual.id)) {
      issues.push('Actual candidate track metadata is invalid or duplicated');
    } else actualTrackMap.set(actual.id, actual);
  }
  if (!Array.isArray(reports) || reports.length === 0) issues.push('At least one completed performance report is required');
  const tracks = new Set();
  for (const [index, report] of (Array.isArray(reports) ? reports : []).entries()) {
    const source = sources[index] ?? `report[${index}]`;
    const header = validator();
    header.check(report?.schema === 1, 'Expected performance report schema 1');
    header.check(report?.status === 'measured', 'Report status must be measured');
    header.check(!report?.error, 'Report contains a run error');
    if (report?.errors !== undefined) header.check(Array.isArray(report.errors) && report.errors.length === 0, 'Report contains runtime errors');
    header.check(report?.artifactSha256 === artifactSha256, 'Report artifactSha256 differs from current dist/release.json (old or mixed artifact)');
    const start = Date.parse(report?.startedAt);
    const end = Date.parse(report?.completedAt);
    header.check(Number.isFinite(start) && Number.isFinite(end) && end >= start, 'Report must have valid startedAt and completedAt');
    const identity = `${report?.artifactSha256}:${report?.startedAt}:${report?.completedAt}`;
    header.check(!seenReports.has(identity), 'Repeated report cannot supply independent observations');
    seenReports.add(identity);
    const track = report?.config?.track;
    header.check(typeof track?.id === 'string' && track.id.length > 0, 'Missing config.track.id');
    header.number(track?.duration, 'config.track.duration', 2);
    header.number(track?.hardNotes, 'config.track.hardNotes', 1, true);
    const actualTrack = actualTrackMap.get(track?.id);
    header.check(!!actualTrack, 'Report track is absent from the verified current candidate');
    if (actualTrack) {
      header.check(track.duration === actualTrack.duration, `config.track.duration differs from verified catalog (${actualTrack.duration})`);
      header.check(track.hardNotes === actualTrack.hardNotes, `config.track.hardNotes differs from verified Hard chart (${actualTrack.hardNotes})`);
    }
    if (track?.id) tracks.add(track.id);
    const profiles = report?.config?.profiles;
    header.check(Array.isArray(profiles) && profiles.length > 0, 'Missing config.profiles');
    const validProfiles = new Set();
    for (const profile of Array.isArray(profiles) ? profiles : []) {
      const expected = REQUIRED_PROFILES.find(item => item.name === profile?.name);
      try {
        assert(expected, `Unknown profile ${profile?.name}`);
        assert(!validProfiles.has(profile.name), `Duplicate profile ${profile.name}`);
        for (const [key, value] of Object.entries(expected)) assert.deepEqual(profile[key], value, `${profile.name}.${key} differs from the fixed lab profile`);
        validProfiles.add(profile.name);
      } catch (error) { header.issues.push(error.message); }
    }
    header.check(Array.isArray(report?.observations) && report.observations.length > 0, 'Missing report observations');
    const config = report?.config;
    const suite = config?.suite;
    header.check(['all', 'load', 'game', 'memory'].includes(suite), 'Invalid configured suite');
    const configuredKinds = suite === 'all' ? ['load', 'game', 'memory'] : [suite];
    const reportRows = Array.isArray(report?.observations) ? report.observations : [];
    if (configuredKinds.includes('game')) {
      header.check(Array.isArray(config?.gameScenarios) && config.gameScenarios.length > 0 &&
        new Set(config.gameScenarios).size === config.gameScenarios.length && config.gameScenarios.every(scenario => GAME_SCENARIOS.includes(scenario)),
      'Invalid config.gameScenarios');
    }
    for (const kind of configuredKinds) {
      const repeats = kind === 'load' ? config?.repeats : kind === 'game' ? config?.gameRepeats : 1;
      header.number(repeats, `${kind} configured repeats`, 1, true);
      const scenarios = kind === 'load' ? LOAD_SCENARIOS : kind === 'game' && Array.isArray(config?.gameScenarios) ? config.gameScenarios : [null];
      for (const profile of validProfiles) for (const scenario of scenarios) {
        const count = reportRows.filter(row => row?.kind === kind && row?.profile === profile && (row?.scenario ?? null) === scenario).length;
        header.check(count === repeats, `Incomplete configured report: ${profile} ${kind} ${scenario ?? ''} expects ${repeats} observation(s), has ${count}`);
      }
    }
    issues.push(...header.issues.map(issue => `${source}: ${issue}`));
    const iterations = new Set();
    for (const [rowIndex, row] of (Array.isArray(report?.observations) ? report.observations : []).entries()) {
      const evaluated = evaluateObservationBudget(row, { track: actualTrack ?? track, cycles: report.config?.cycles });
      const rowIssues = [...evaluated.issues];
      if (!configuredKinds.includes(row?.kind)) rowIssues.push('Observation kind is outside the configured suite');
      if (row?.kind === 'game' && (!Array.isArray(config?.gameScenarios) || !config.gameScenarios.includes(row.scenario))) rowIssues.push('Game scenario is outside config.gameScenarios');
      if (!validProfiles.has(row?.profile)) rowIssues.push('Observation profile is not a validated report profile');
      if (row?.artifactSha256 !== undefined && row.artifactSha256 !== artifactSha256) rowIssues.push('Observation belongs to another artifact');
      if (row?.kind === 'load' || row?.kind === 'game') {
        const configured = row.kind === 'load' ? report.config?.repeats : report.config?.gameRepeats;
        if (!Number.isInteger(configured) || configured < 1 || !Number.isInteger(row.iteration) || row.iteration < 1 || row.iteration > configured) {
          rowIssues.push('Observation iteration is invalid for configured repeat count');
        }
      }
      const iterationKey = [row?.kind, row?.profile, row?.scenario, row?.iteration].join(':');
      if (iterations.has(iterationKey)) rowIssues.push('Repeated observation iteration');
      iterations.add(iterationKey);
      if (row && typeof row === 'object') {
        const evidenceKey = `${track?.id}:${fingerprint(row)}`;
        if (seenEvidence.has(evidenceKey)) rowIssues.push('Duplicate evidence is not an independent observation');
        seenEvidence.add(evidenceKey);
      }
      const entry = { source, index: rowIndex, track: track?.id, kind: row?.kind, profile: row?.profile,
        scenario: row?.scenario ?? null, iteration: row?.iteration ?? null, passed: header.issues.length === 0 && rowIssues.length === 0,
        coverageValid: header.issues.length === 0 && evaluated.coverage?.covered === true && !rowIssues.some(issue => /Duplicate|Repeated|iteration|profile|artifact/i.test(issue)), issues: rowIssues };
      observations.push(entry);
      issues.push(...rowIssues.map(issue => `${source} observation ${rowIndex + 1}: ${issue}`));
      if (entry.coverageValid) {
        const slot = matrix.find(item => item.track === entry.track && item.profile === entry.profile && item.kind === entry.kind && item.scenario === entry.scenario);
        if (slot) slot.covered++;
      }
    }
  }
  const missing = matrix.filter(slot => slot.covered < slot.required).map(slot => ({ ...slot, missing: slot.required - slot.covered }));
  for (const slot of missing) issues.push(`Incomplete matrix: ${slot.track} ${slot.profile} ${slot.kind} ${slot.scenario ?? ''} needs ${slot.required}, has ${slot.covered}`);
  return {
    schema: 1, status: issues.length === 0 ? 'pass' : 'fail', overallPass: issues.length === 0,
    performanceBudgetEvaluated: true, artifactSha256, budgets: BUDGETS,
    scope: { requiredTrack: REQUIRED_TRACK, additionalTracks: [...tracks].filter(id => id !== REQUIRED_TRACK), profiles: REQUIRED_PROFILES,
      notes: [
        'Every supplied observation is checked; peak-track data cannot replace the default stress-track matrix.',
        '59.9 FPS and 50.1 ms are experimental 60 Hz cadence guard values, including timestamp tolerance.',
        'canvasDraw measures CPU/wall time to submit Canvas2D commands, not GPU completion or browser composition.',
        'Mobile game rows dispatch synthetic touch PointerEvents through the play canvas; this exercises game input handlers but not native pointer capture, OS touch sampling, physical ergonomics or haptics.',
        'All post-GC exits enforce the PCM cap; final interrupted-load heap/listeners are compared with the last song exits. These bounded regressions are not proof of indefinitely leak-free playback.',
        'Automated browser profiles only; BS-D001 physical-device acceptance remains cancelled and is not reported as passed.',
      ] },
    matrix, missing, observations, issues,
  };
}

function main(args) {
  if (args.includes('--help')) {
    console.log('Usage: npm run performance:check -- [--output result.json] <results.json> [more-results.json ...]\nChecks the fixed performance matrix against current apps/beatscape/dist/release.json.');
    return;
  }
  let output;
  const paths = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output') {
      assert(args[i + 1] && !args[i + 1].startsWith('--'), '--output requires a path');
      output = resolve(args[++i]);
    } else {
      assert(!args[i].startsWith('--'), `Unknown option ${args[i]}`);
      paths.push(resolve(args[i]));
    }
  }
  assert(paths.length, 'Provide at least one performance results.json; use --help for usage');
  // Hash/validate the actual current files, not just the manifest's claim.
  const release = verifyRelease();
  const dist = fileURLToPath(new URL('../dist/', import.meta.url));
  const catalog = JSON.parse(readFileSync(resolve(dist, 'catalog.json'), 'utf8'));
  const actualTracks = catalog.tracks.map(track => ({ id: track.track_id, duration: track.duration_sec,
    hardNotes: JSON.parse(readFileSync(assetPath(dist, track.charts.hard), 'utf8')).total_notes }));
  const result = evaluatePerformanceBudget(paths.map(path => JSON.parse(readFileSync(path, 'utf8'))), { artifactSha256: release.artifactSha256, actualTracks, sources: paths });
  const json = JSON.stringify(result, null, 2) + '\n';
  if (output) writeFileSync(output, json);
  console.log(json.trimEnd());
  if (!result.overallPass) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(`Performance budget check could not run: ${error.message}`); process.exitCode = 2; }
}
