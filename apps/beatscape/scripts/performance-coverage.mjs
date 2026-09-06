import assert from 'node:assert/strict';

/**
 * Evidence completeness only. These assertions deliberately do not judge FPS,
 * render-time, loading-time, or memory-growth budgets. Save the row before
 * calling an assertion so a failed run remains reviewable.
 */
const finite = (value, label, minimum = 0) => {
  assert(Number.isFinite(value) && value >= minimum, `${label} must be a finite number >= ${minimum}`);
  return value;
};
const integer = (value, label, minimum = 0) => {
  finite(value, label, minimum);
  assert(Number.isInteger(value), `${label} must be an integer`);
  return value;
};
const array = (value, label) => {
  assert(Array.isArray(value), `${label} must be an array`);
  return value;
};
const sumCounts = (counts, label) => {
  assert(array(counts, label).length === 4, `${label} must contain perfect, great, good, miss`);
  return counts.reduce((sum, count, index) => sum + integer(count, `${label}[${index}]`), 0);
};
const noRuntimeErrors = (row) => {
  assert.equal(array(row.errors, 'errors').length, 0, 'Runtime errors invalidate coverage');
  assert.equal(array(row.failedRequests, 'failedRequests').length, 0, 'Failed requests invalidate coverage');
};

export function assertGameCoverage(row, { duration, hardNotes } = {}) {
  assert.equal(row.kind, 'game', 'Expected a game evidence row');
  finite(duration, 'Expected song duration', 2);
  integer(hardNotes, 'Expected Hard judgment count', 1);
  assert(['hard-fx-off', 'hard-fx-max', 'duo-fx-max'].includes(row.scenario), 'Unknown game scenario');
  noRuntimeErrors(row);

  const probe = row.probe;
  assert(probe && typeof probe === 'object', 'Missing game probe');
  const minimumMs = (duration - 2) * 1000;
  finite(probe.measuredMs, 'Measured wall time', minimumMs);
  finite(probe.frames?.totalMs, 'Sampled frame interval duration', minimumMs);
  integer(probe.frames?.samples, 'Frame samples', 1);
  integer(probe.appFrameCpu?.samples, 'Application frame CPU samples', 1);

  const duo = row.scenario === 'duo-fx-max';
  const playerCount = duo ? 2 : 1;
  if (duo) {
    const players = array(row.outcomes?.duoPlayers, 'outcomes.duoPlayers');
    assert.equal(players.length, 2, 'Duo requires exactly two structured player results');
    assert.deepEqual(players.map((player) => player.player).sort(), ['P1', 'P2'], 'Duo results require one P1 and one P2');
    for (const player of players) {
      assert.equal(sumCounts(player.counts, `${player.player} counts`), hardNotes, `${player.player} did not judge the full Hard chart`);
    }
  } else {
    const run = row.outcomes?.lastRun;
    assert(run && typeof run === 'object', 'Missing single-player lastRun');
    assert.equal(run.totalNotes, hardNotes, 'Single-player totalNotes does not match the measured Hard chart');
    const counts = ['perfect', 'great', 'good', 'miss'].map((key) => run.counts?.[key]);
    assert.equal(sumCounts(counts, 'Single-player counts'), hardNotes, 'Single-player judgments do not cover the full Hard chart');
  }

  const autoplay = probe.autoplay;
  assert(autoplay && typeof autoplay === 'object', 'Missing real-input autoplay evidence');
  assert.equal(autoplay.duo, duo, 'Autoplay mode does not match the scenario');
  const events = integer(autoplay.eventsPerPlayer, 'Scheduled input events per player', 1);
  const players = array(autoplay.players, 'Autoplay players');
  assert.equal(players.length, playerCount, 'Unexpected autoplay player count');
  for (const [index, player] of players.entries()) {
    assert.equal(player.cursor, events, `Autoplay player ${index + 1} did not dispatch the full input queue`);
  }
  assert.equal(autoplay.dispatchedEvents, events * playerCount, 'Dispatched input count does not match the full chart queues');

  if (row.scenario !== 'hard-fx-off') {
    const effects = probe.effects;
    assert(effects && typeof effects === 'object', 'Missing real maximum-effect observations');
    assert.equal(effects.maxSimultaneousSurge3Fields, playerCount, 'Maximum effect scenario did not light every playfield simultaneously');
    assert(finite(effects.surge3Ms, 'Surge level 3 duration') > 30_000, 'Surge level 3 must be observed for more than 30 seconds');
    integer(effects.surge3Frames, 'Surge level 3 frame samples', 1);
    if (duo) {
      // With at most two fields, integrated field-time minus any-field-time is
      // exactly the duration during which both fields are at the maximum tier.
      const togetherMs = finite(effects.surge3FieldMs, 'Duo Surge level 3 field-time') - effects.surge3Ms;
      assert(togetherMs > 30_000, 'Both Duo fields must remain at Surge level 3 together for more than 30 seconds');
    }
    if (row.profile === 'desktop') {
      assert(finite(effects.neon3Ms, 'Desktop NEON level 3 duration') > 30_000, 'Desktop NEON level 3 must be observed for more than 30 seconds');
      integer(effects.neon3Frames, 'Desktop NEON level 3 frame samples', 1);
    }
  }

  return {
    covered: true,
    kind: 'game',
    scenario: row.scenario,
    players: playerCount,
    judgmentObjectsPerPlayer: hardNotes,
    sampledSeconds: probe.frames.totalMs / 1000,
    performanceBudgetEvaluated: false,
  };
}

export function assertLoadCoverage(row) {
  assert.equal(row.kind, 'load', 'Expected a load evidence row');
  assert(['home-first-visit', 'song-cold', 'duo-cold'].includes(row.scenario), 'Unknown load scenario');
  noRuntimeErrors(row);
  finite(row.summary?.readyMs, 'Observed ready time', Number.MIN_VALUE);
  finite(row.probe?.paint?.firstContentfulPaintMs, 'Observed first contentful paint', Number.MIN_VALUE);
  assert(array(row.navigation, 'Navigation timing entries').length > 0, 'Missing navigation timing evidence');
  array(row.resources, 'Resource timing entries');
  if (row.scenario !== 'home-first-visit') {
    // Both fields may share one decoded AudioBuffer after optimization. Require
    // successful audio decoding, without encoding a duplicate-decode bug here.
    const decode = row.probe?.resources?.decodedLifetime;
    integer(decode?.samples, 'Completed audio decode observations', 1);
    assert.equal(decode.failed, 0, 'Audio decoding failed before readiness');
    assert.equal(decode.pending, 0, 'Audio decoding was still pending at readiness');
  }
  return { covered: true, kind: 'load', scenario: row.scenario, performanceBudgetEvaluated: false };
}

export function assertMemoryCoverage(row, { cycles = row.summary?.restarts } = {}) {
  assert.equal(row.kind, 'memory', 'Expected a memory evidence row');
  integer(cycles, 'Expected repeat cycles', 1);
  assert.equal(row.summary?.restarts, cycles, 'Restart count differs from requested coverage');
  assert.equal(row.summary?.songSwitches, cycles, 'Song-switch count differs from requested coverage');
  assert.equal(array(row.errors, 'errors').length, 0, 'Runtime errors invalidate coverage');
  // The interrupted-load scenario deliberately aborts requests. Only that exact
  // browser cancellation is permitted; network/decode failures are not evidence
  // of a successfully exercised lifecycle.
  for (const request of array(row.failedRequests, 'failedRequests')) {
    assert.equal(request?.failure, 'net::ERR_ABORTED', 'Unexpected failed request in memory coverage');
  }
  const points = array(row.points, 'Memory points');
  const labels = points.map((point) => point.label);
  assert.equal(new Set(labels).size, labels.length, 'Duplicate memory point labels');
  const required = ['library-initial', 'playing-warmup', 'after-restarts-exit', 'after-interrupted-loads'];
  for (let i = 1; i <= cycles; i++) required.push(`restart-${i}`, `song-exit-${i}`);
  for (const label of required) assert(labels.includes(label), `Missing memory observation: ${label}`);
  for (const point of points) {
    finite(point.heap?.usedSize, `${point.label} JS heap bytes`);
    integer(point.dom?.nodes, `${point.label} DOM nodes`);
    integer(point.dom?.jsEventListeners, `${point.label} event listeners`);
    integer(point.probe?.resources?.activeLongSources, `${point.label} active music sources`);
    integer(point.probe?.resources?.totalLongSourceStarts, `${point.label} total music source starts`);
    integer(point.probe?.resources?.decodedLifetime?.pending, `${point.label} pending audio decodes`);
    finite(point.probe?.resources?.liveDecodedBufferBytes, `${point.label} live decoded audio bytes`);
  }
  const resourceAt = (label) => points.find((point) => point.label === label).probe.resources;
  const initial = resourceAt('library-initial');
  const warmup = resourceAt('playing-warmup');
  assert.equal(warmup.activeLongSources, 1, 'Warmup must contain one active music source');
  assert(warmup.totalLongSourceStarts > initial.totalLongSourceStarts, 'Warmup did not start music');
  let previousStarts = warmup.totalLongSourceStarts;
  for (let i = 1; i <= cycles; i++) {
    const resources = resourceAt(`restart-${i}`);
    assert.equal(resources.activeLongSources, 1, `restart-${i} must contain one active music source`);
    assert(resources.totalLongSourceStarts > previousStarts, `restart-${i} did not start a new music source; labels alone do not prove a restart`);
    previousStarts = resources.totalLongSourceStarts;
  }
  const exits = ['library-initial', 'after-restarts-exit', 'after-interrupted-loads'];
  for (let i = 1; i <= cycles; i++) exits.push(`song-exit-${i}`);
  for (const label of exits) {
    const resources = resourceAt(label);
    assert.equal(resources.activeLongSources, 0, `${label} retained an active music source after exit`);
    assert.equal(resources.decodedLifetime.pending, 0, `${label} still has pending audio decodes`);
  }
  const afterRestarts = resourceAt('after-restarts-exit');
  assert.equal(afterRestarts.totalLongSourceStarts, previousStarts, 'Exit unexpectedly changed the music source start count');
  previousStarts = afterRestarts.totalLongSourceStarts;
  for (let i = 1; i <= cycles; i++) {
    const resources = resourceAt(`song-exit-${i}`);
    assert.equal(resources.totalLongSourceStarts - previousStarts, 2, `song-exit-${i} must prove two new Duo music source starts`);
    previousStarts = resources.totalLongSourceStarts;
  }
  return { covered: true, kind: 'memory', cycles, observations: points.length, performanceBudgetEvaluated: false };
}
