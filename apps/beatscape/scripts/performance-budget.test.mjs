import test from 'node:test';
import assert from 'node:assert/strict';
import { BUDGETS, REQUIRED_PROFILES, REQUIRED_TRACK, evaluateObservationBudget, evaluatePerformanceBudget } from './performance-budget.mjs';

const artifactSha256 = 'a'.repeat(64);
const track = { id: REQUIRED_TRACK, duration: 100, hardNotes: 600 };
const actualTracks = [track, { ...track, id: 'bs-peak-extra' }];
const clone = value => structuredClone(value);
const rowCheck = row => evaluateObservationBudget(row, { track, cycles: 8 });
const reportCheck = reports => evaluatePerformanceBudget(reports, { artifactSha256, actualTracks });
function load(scenario = 'home-first-visit', profile = 'desktop', iteration = 1) {
  return { kind: 'load', scenario, profile, iteration, errors: [], failedRequests: [], coverage: { covered: true },
    summary: { readyMs: scenario === 'home-first-visit' ? 1400 : 3900 }, navigation: [{}], resources: [],
    probe: { measurementStartedAtMs: 10 + iteration,
      paint: { firstContentfulPaintMs: 1200, largestContentfulPaintMs: 1300 },
      resources: { decodedLifetime: { samples: 1, failed: 0, pending: 0 } } } };
}
function game(scenario = 'hard-fx-max', profile = 'desktop') {
  const duo = scenario === 'duo-fx-max';
  const count = duo ? 2 : 1;
  return { kind: 'game', scenario, profile, iteration: 1, errors: [], failedRequests: [],
    probe: { measuredMs: 100100,
      frames: { samples: 6000, totalMs: 100000, p50Ms: 16.6, p95Ms: 16.7, p99Ms: 33,
        maxMs: 50.1, observedFps: 60, targetFps: 60, longestConsecutiveMissedIntervals: 1 },
      appFrameCpu: { samples: 6000 },
      canvasDraw: { samples: 6000 * count, totalMs: 6000 * count, p50Ms: 1, p95Ms: 2, p99Ms: 3, maxMs: 5,
        fieldSamples: duo ? { 1: 6000, 2: 6000 } : { 1: 6000 }, visibleNotes: { p50: 3, p95: 6, max: 8 }, overBudget: [] },
      effects: { maxSimultaneousSurge3Fields: count, surge3Frames: 4000, surge3Ms: 60000,
        surge3FieldMs: 60000 * count, neon3Frames: 4000, neon3Ms: 60000 },
      autoplay: { chartId: track.id, duo, inputSurface: profile === 'mobile-emulated' ? 'touch' : 'keyboard',
        eventsPerPlayer: 1200, dispatchedEvents: 1200 * count,
        keyboardEventsDispatched: profile === 'mobile-emulated' ? 0 : 1200 * count,
        pointerEventsDispatched: profile === 'mobile-emulated' ? 1200 * count : 0,
        players: Array.from({ length: count }, () => ({ cursor: 1200 })) },
    },
    outcomes: duo ? { duoPlayers: [{ player: 'P1', counts: [600, 0, 0, 0] }, { player: 'P2', counts: [600, 0, 0, 0] }] }
      : { lastRun: { track_id: track.id, totalNotes: 600, counts: { perfect: 600, great: 0, good: 0, miss: 0 } } },
  };
}
function memory(profile = 'desktop', cycles = 8) {
  const points = [];
  const point = (label, starts, active = 0) => points.push({ label, gc: { completedCollections: 2 },
    heap: { usedSize: 4 * 1024 * 1024 }, dom: { nodes: 300, jsEventListeners: 100 },
    probe: { resources: { activeLongSources: active, totalLongSourceStarts: starts,
      decodedLifetime: { pending: 0 }, liveDecodedBufferBytes: BUDGETS.maximumDecodedBytes } } });
  point('library-initial', 0);
  point('playing-warmup', 1, 1);
  for (let index = 1; index <= cycles; index++) point(`restart-${index}`, 1 + index, 1);
  point('after-restarts-exit', 1 + cycles);
  for (let index = 1; index <= cycles; index++) point(`song-exit-${index}`, 1 + cycles + 2 * index);
  point('after-interrupted-loads', 1 + 3 * cycles);
  return { kind: 'memory', profile, summary: { restarts: cycles, songSwitches: cycles }, errors: [], failedRequests: [], points };
}
function report() {
  const observations = REQUIRED_PROFILES.flatMap(({ name }) => [
    ...['home-first-visit', 'song-cold', 'duo-cold'].flatMap(scenario => [1, 2, 3].map(iteration => load(scenario, name, iteration))),
    ...['hard-fx-off', 'hard-fx-max', 'duo-fx-max'].map(scenario => game(scenario, name)), memory(name),
  ]);
  return { schema: 1, status: 'measured', artifactSha256, startedAt: '2026-09-06T00:00:00.000Z', completedAt: '2026-09-06T00:20:00.000Z',
    config: { suite: 'all', profiles: clone(REQUIRED_PROFILES), repeats: 3, gameRepeats: 1, cycles: 8,
      gameScenarios: ['hard-fx-off', 'hard-fx-max', 'duo-fx-max'], track: clone(track) }, observations };
}
function fails(result, message) {
  assert.equal(result.overallPass ?? result.passed, false);
  assert.match(result.issues.join('\n'), message);
}

test('a complete fixed matrix passes only after independent coverage and every budget are checked', () => {
  const result = reportCheck([report()]);
  assert.deepEqual(result.issues, []);
  assert.equal(result.overallPass, true);
  assert.equal(result.observations.length, 26);
  assert.equal(result.matrix.length, 14);
  assert.equal(result.missing.length, 0);
  assert.match(result.scope.notes.join(' '), /not GPU completion/);
  assert.match(result.scope.notes.join(' '), /synthetic touch PointerEvents/);
  assert.match(result.scope.notes.join(' '), /not proof of indefinitely/);
});

test('independently completed load, game and memory reports can supply one combined matrix', () => {
  const reports = ['load', 'game', 'memory'].map((suite, index) => {
    const evidence = report();
    evidence.config.suite = suite;
    evidence.startedAt = `2026-09-06T0${index}:00:00Z`;
    evidence.completedAt = `2026-09-06T0${index}:20:00Z`;
    evidence.observations = evidence.observations.filter(row => row.kind === suite);
    return evidence;
  });
  assert.equal(reportCheck(reports).overallPass, true);
});

test('home FCP, LCP, readiness and single/Duo cold readiness each enforce inclusive limits', () => {
  const home = load();
  home.summary.readyMs = home.probe.paint.firstContentfulPaintMs = home.probe.paint.largestContentfulPaintMs = 1500;
  assert.equal(rowCheck(home).passed, true);
  for (const key of ['firstContentfulPaintMs', 'largestContentfulPaintMs']) {
    const slow = clone(home); slow.probe.paint[key] = 1500.001;
    fails(rowCheck(slow), /exceeds 1500/);
  }
  home.summary.readyMs = 1500.001;
  fails(rowCheck(home), /readyMs/);
  for (const scenario of ['song-cold', 'duo-cold']) {
    const row = load(scenario); row.summary.readyMs = 4000;
    assert.equal(rowCheck(row).passed, true);
    row.summary.readyMs = 4000.001;
    fails(rowCheck(row), /exceeds 4000/);
  }
});

test('60 Hz guard values have explicit FPS, maximum interval and consecutive-miss boundaries', () => {
  const row = game();
  row.probe.frames.observedFps = 59.9;
  row.probe.frames.totalMs = 6000000 / 59.9;
  assert.equal(rowCheck(row).passed, true);
  const slow = clone(row); slow.probe.frames.observedFps = 59.899; slow.probe.frames.totalMs = 6000000 / 59.899;
  fails(rowCheck(slow), /below 59.9/);
  const stall = clone(row); stall.probe.frames.maxMs = 50.101;
  fails(rowCheck(stall), /frames.maxMs/);
  const consecutive = clone(row); consecutive.probe.frames.longestConsecutiveMissedIntervals = 2;
  fails(rowCheck(consecutive), /ConsecutiveMissedIntervals/);
  const dishonestFps = clone(row); dishonestFps.probe.frames.totalMs = 150000;
  fails(rowCheck(dishonestFps), /disagrees with measured intervals/);
});

test('the maximum actual draw, not p95 or a stored covered badge, enforces 5 ms', () => {
  const row = game();
  assert.equal(rowCheck(row).passed, true);
  row.probe.canvasDraw.maxMs = 5.001;
  fails(rowCheck(row), /canvasDraw.maxMs/);
  row.probe.canvasDraw.maxMs = 5;
  row.probe.canvasDraw.overBudget = [{ startedAtMs: 500, durationMs: 9, songTimeMs: 1, noteObjects: 12, field: 1 }];
  fails(rowCheck(row), /actual over-budget/);
});

test('each field must have real draw samples matching frames within three boundary frames', () => {
  const row = game('duo-fx-max');
  row.probe.canvasDraw.fieldSamples = { 1: 5997, 2: 6003 };
  assert.equal(rowCheck(row).passed, true);
  row.probe.canvasDraw.fieldSamples = { 1: 5996, 2: 6004 };
  fails(rowCheck(row), /tolerance 3/);
  const missingSide = game('duo-fx-max'); delete missingSide.probe.canvasDraw.fieldSamples[2];
  fails(rowCheck(missingSide), /requires exactly field/);
  const countMismatch = game(); countMismatch.probe.canvasDraw.samples++;
  fails(rowCheck(countMismatch), /sum of per-field/);
  const missing = game(); delete missing.probe.canvasDraw;
  fails(rowCheck(missing), /canvasDraw/);
  const zero = game(); zero.probe.canvasDraw.samples = 0;
  fails(rowCheck(zero), /canvasDraw.samples/);
});

test('missing, non-finite, negative, string, and null measurements never become zero-cost passes', () => {
  for (const invalid of [undefined, null, NaN, Infinity, -1, '1']) {
    const draw = game(); draw.probe.canvasDraw.maxMs = invalid;
    fails(rowCheck(draw), /canvasDraw.maxMs/);
    const home = load(); home.probe.paint.largestContentfulPaintMs = invalid;
    fails(rowCheck(home), /home LCP/);
  }
  const row = game(); row.probe.frames.longestConsecutiveMissedIntervals = 0.5;
  fails(rowCheck(row), /integer/);
});

test('memory cap and the final-four post-GC heap range are inclusive bounded regressions', () => {
  const row = memory();
  const lastFour = row.points.filter(point => /^song-exit-[5-8]$/.test(point.label));
  lastFour[1].heap.usedSize += 1024 * 1024;
  assert.equal(rowCheck(row).passed, true);
  lastFour[1].heap.usedSize++;
  fails(rowCheck(row), /heap range bytes/);
  const retained = memory(); retained.points.at(-1).probe.resources.liveDecodedBufferBytes++;
  fails(rowCheck(retained), /Final live decoded audio bytes/);
});

test('memory requires eight real restart/song-switch cycles, GC evidence and no listener growth', () => {
  fails(evaluateObservationBudget(memory('desktop', 7), { track, cycles: 7 }), /configured cycles/);
  const listeners = memory(); listeners.points.find(point => point.label === 'song-exit-6').dom.jsEventListeners++;
  fails(rowCheck(listeners), /listeners grew/);
  const noGc = memory(); delete noGc.points.find(point => point.label === 'song-exit-8').gc;
  fails(rowCheck(noGc), /completed GC/);
  const noRealRestart = memory(); noRealRestart.points.find(point => point.label === 'restart-4').probe.resources.totalLongSourceStarts--;
  fails(rowCheck(noRealRestart), /did not start a new music source/);
  const pending = memory(); pending.points.at(-1).probe.resources.decodedLifetime.pending = 1;
  fails(rowCheck(pending), /pending audio decodes/);
  const alive = memory(); alive.points.at(-1).probe.resources.activeLongSources = 1;
  fails(rowCheck(alive), /retained an active music source/);
});

test('every post-GC exit enforces the PCM cap even if the final cache size recovers', () => {
  for (const label of ['library-initial', 'after-restarts-exit', 'song-exit-1', 'song-exit-8']) {
    const evidence = report();
    const row = evidence.observations.find(row => row.kind === 'memory');
    row.points.find(point => point.label === label).probe.resources.liveDecodedBufferBytes = 1024 * 1024 * 1024;
    fails(reportCheck([evidence]), new RegExp(`${label} live decoded audio bytes`));
  }
  const evidence = report();
  for (const row of evidence.observations.filter(row => row.kind === 'memory')) {
    for (const point of row.points.filter(point => point.label.startsWith('song-exit-'))) point.probe.resources.liveDecodedBufferBytes = 1024 * 1024 * 1024;
  }
  fails(reportCheck([evidence]), /song-exit-8 live decoded audio bytes/);
});

test('final interrupted-load cleanup requires GC, stable listeners and at most 1 MiB extra heap', () => {
  const row = memory();
  row.points.at(-1).heap.usedSize += 1024 * 1024;
  assert.equal(rowCheck(row).passed, true);
  row.points.at(-1).heap.usedSize++;
  fails(rowCheck(row), /Final interrupted-load post-GC heap growth/);
  row.points.at(-1).heap.usedSize = 1;
  row.points.at(-1).dom.jsEventListeners = 1;
  assert.equal(rowCheck(row).passed, true);
  const noGc = memory(); delete noGc.points.at(-1).gc;
  fails(rowCheck(noGc), /after-interrupted-loads completed GC/);
  for (const mutate of [
    point => { point.heap.usedSize = 1024 * 1024 * 1024; },
    point => { point.dom.jsEventListeners = 1000000; },
  ]) {
    const evidence = report(); mutate(evidence.observations.find(row => row.kind === 'memory').points.at(-1));
    fails(reportCheck([evidence]), /post-GC heap growth|listeners grew after interrupted loads/);
  }
});

test('completed measured status and fake covered:true cannot hide runtime, request or coverage failures', () => {
  for (const mutate of [
    row => row.errors.push('Uncaught decoder failure'),
    row => row.failedRequests.push({ failure: 'net::ERR_FAILED' }),
    row => { row.probe.measuredMs = 5000; },
    row => { row.probe.autoplay.players[0].cursor = 1; },
    row => { row.probe.effects.surge3Ms = 1000; },
  ]) {
    const evidence = report();
    const row = evidence.observations.find(row => row.scenario === 'hard-fx-max');
    row.coverage = { covered: true }; mutate(row);
    fails(reportCheck([evidence]), /Coverage:/);
  }
});

test('all reports must match the current artifact; mixed, stale and row-level artifacts fail', () => {
  const stale = report(); stale.artifactSha256 = 'b'.repeat(64);
  fails(reportCheck([stale]), /old or mixed artifact/);
  fails(reportCheck([report(), stale]), /old or mixed artifact/);
  const mixedRow = report(); mixedRow.observations[0].artifactSha256 = 'c'.repeat(64);
  fails(reportCheck([mixedRow]), /another artifact/);
  fails(evaluatePerformanceBudget([report()], { artifactSha256: null }), /Current release/);
});

test('configured song duration and Hard judgments must match actual candidate metadata', () => {
  for (const [key, value] of [['duration', 40], ['hardNotes', 1]]) {
    const evidence = report(); evidence.config.track[key] = value;
    fails(reportCheck([evidence]), /differs from verified catalog|differs from verified Hard chart/);
  }
  const selfConsistent = report();
  selfConsistent.config.track.duration = 40;
  selfConsistent.config.track.hardNotes = 1;
  for (const row of selfConsistent.observations.filter(row => row.kind === 'game')) {
    if (row.outcomes.lastRun) {
      row.outcomes.lastRun.totalNotes = 1;
      row.outcomes.lastRun.counts = { perfect: 1, great: 0, good: 0, miss: 0 };
    } else for (const player of row.outcomes.duoPlayers) player.counts = [1, 0, 0, 0];
    // Self-reported coverage can be internally consistent while measuring a
    // smaller chart. Only the independent candidate metadata exposes this.
    assert.equal(evaluateObservationBudget(row, { track: selfConsistent.config.track }).passed, true);
  }
  fails(reportCheck([selfConsistent]), /differs from verified Hard chart/);
  const spoofed = report(); spoofed.config.track.id = 'not-in-candidate';
  fails(reportCheck([spoofed]), /absent from the verified current candidate/);
  fails(evaluatePerformanceBudget([report()], { artifactSha256 }), /Actual candidate track metadata is required/);
});

test('unfinished, errored, missing-status or invalid completion metadata is rejected', () => {
  for (const mutate of [
    row => { row.status = 'incomplete'; }, row => { delete row.status; },
    row => { row.error = 'Failure after recording observations'; }, row => { delete row.completedAt; },
    row => { row.completedAt = '2026-09-05T23:59:59Z'; },
  ]) {
    const evidence = report(); mutate(evidence);
    assert.equal(reportCheck([evidence]).overallPass, false);
  }
});

test('duplicate rows cannot masquerade as three repetitions even when renumbered', () => {
  const evidence = report();
  evidence.observations[1] = { ...clone(evidence.observations[0]), iteration: 2 };
  evidence.observations[2] = { ...clone(evidence.observations[0]), iteration: 3 };
  const result = reportCheck([evidence]);
  fails(result, /Duplicate evidence/);
  assert.equal(result.missing.find(slot => slot.profile === 'desktop' && slot.scenario === 'home-first-visit').covered, 1);
  const duplicateIteration = report(); duplicateIteration.observations[1].iteration = 1;
  fails(reportCheck([duplicateIteration]), /Repeated observation iteration/);
});

test('duplicate files or copied observations in newly dated reports are rejected', () => {
  fails(reportCheck([report(), report()]), /Repeated report/);
  const copied = report(); copied.startedAt = '2026-09-06T01:00:00Z'; copied.completedAt = '2026-09-06T01:20:00Z';
  fails(reportCheck([report(), copied]), /Duplicate evidence/);
});

test('partial matrices enumerate missing scenarios and cannot return an overall pass', () => {
  const evidence = report();
  evidence.config.suite = 'game';
  evidence.config.profiles = [clone(REQUIRED_PROFILES[0])];
  evidence.config.gameScenarios = ['hard-fx-max'];
  evidence.observations = evidence.observations.filter(row => row.profile === 'desktop' && row.scenario === 'hard-fx-max');
  const result = reportCheck([evidence]);
  fails(result, /Incomplete matrix/);
  assert.equal(result.missing.length, 13);
  assert.ok(result.missing.some(slot => slot.kind === 'memory'));
  assert.ok(result.missing.some(slot => slot.profile === 'mobile-emulated'));
});

test('a report marked measured cannot omit rows promised by its own configured repeats', () => {
  const evidence = report(); evidence.observations.splice(0, 1);
  fails(reportCheck([evidence]), /Incomplete configured report/);
});

test('peak tracks supplement but never replace the default stress-track matrix', () => {
  const peak = report();
  peak.config.track.id = 'bs-peak-extra';
  peak.startedAt = '2026-09-06T02:00:00Z'; peak.completedAt = '2026-09-06T02:20:00Z';
  for (const row of peak.observations.filter(row => row.kind === 'game')) {
    row.probe.autoplay.chartId = peak.config.track.id;
    if (row.outcomes.lastRun) row.outcomes.lastRun.track_id = peak.config.track.id;
  }
  const onlyPeak = reportCheck([peak]);
  fails(onlyPeak, /Incomplete matrix/);
  assert.deepEqual(onlyPeak.scope.additionalTracks, ['bs-peak-extra']);
  assert.equal(onlyPeak.missing.length, 14);
  assert.equal(reportCheck([report(), peak]).overallPass, true);
});

test('names alone do not prove the fixed CPU, network and viewport conditions', () => {
  for (const key of ['cpuSlowdown', 'latencyMs', 'deviceScaleFactor']) {
    const evidence = report(); evidence.config.profiles[1][key] = 1;
    fails(reportCheck([evidence]), /fixed lab profile/);
  }
  const evidence = report(); evidence.config.profiles[1].viewport.width = 1280;
  fails(reportCheck([evidence]), /fixed lab profile/);
});

test('no input, unstructured input and mismatched measured tracks remain failures', () => {
  fails(reportCheck([]), /At least one/);
  fails(reportCheck([null]), /schema/);
  const evidence = report(); evidence.observations.find(row => row.kind === 'game').probe.autoplay.chartId = 'wrong';
  fails(reportCheck([evidence]), /chartId differs/);
  const malformed = report(); malformed.config.gameScenarios = {}; malformed.observations.push(null);
  fails(reportCheck([malformed]), /Invalid config.gameScenarios/);
  const missingPoint = memory(); missingPoint.points[0] = null;
  fails(rowCheck(missingPoint), /Coverage:/);
});
