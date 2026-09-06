import test from 'node:test';
import assert from 'node:assert/strict';
import { assertGameCoverage, assertLoadCoverage, assertMemoryCoverage } from './performance-coverage.mjs';

const expected = { duration: 120, hardNotes: 929 };
const game = (scenario = 'hard-fx-max', profile = 'desktop') => {
  const duo = scenario.startsWith('duo');
  return {
    kind: 'game', scenario, profile, errors: [], failedRequests: [],
    probe: {
      measuredMs: 119_000,
      frames: { samples: 7000, totalMs: 118_900, p95Ms: 200 },
      appFrameCpu: { samples: 7000, p95Ms: 75 },
      effects: { maxSimultaneousSurge3Fields: duo ? 2 : 1, surge3Frames: 5000, surge3Ms: 85_000, surge3FieldMs: duo ? 165_000 : 85_000, neon3Frames: 4000, neon3Ms: 75_000 },
      autoplay: { duo, eventsPerPlayer: 1858, dispatchedEvents: 1858 * (duo ? 2 : 1), players: Array.from({ length: duo ? 2 : 1 }, () => ({ cursor: 1858 })) },
    },
    outcomes: duo ? { duoPlayers: [{ player: 'P2', counts: [900, 29, 0, 0] }, { player: 'P1', counts: [910, 19, 0, 0] }] }
      : { lastRun: { totalNotes: 929, counts: { perfect: 900, great: 29, good: 0, miss: 0 } } },
  };
};

test('complete real-input single and Duo coverage is independent of performance budgets', () => {
  for (const scenario of ['hard-fx-off', 'hard-fx-max', 'duo-fx-max']) {
    const coverage = assertGameCoverage(game(scenario), expected);
    assert.equal(coverage.covered, true);
    assert.equal(coverage.performanceBudgetEvaluated, false);
  }
});

test('a result screen cannot substitute for a complete sampled game duration', () => {
  const short = game();
  short.probe.measuredMs = 12_000;
  assert.throws(() => assertGameCoverage(short, expected), /Measured wall time/);
  const missingIntervals = game();
  missingIntervals.probe.frames.totalMs = 17_000;
  assert.throws(() => assertGameCoverage(missingIntervals, expected), /Sampled frame interval duration/);
  const missingCpu = game();
  delete missingCpu.probe.appFrameCpu;
  assert.throws(() => assertGameCoverage(missingCpu, expected), /Application frame CPU samples/);
});

test('single results must match both expected total and judgment accounting', () => {
  const wrongTotal = game();
  wrongTotal.outcomes.lastRun.totalNotes = 100;
  assert.throws(() => assertGameCoverage(wrongTotal, expected), /totalNotes/);
  const partial = game();
  partial.outcomes.lastRun.counts.perfect = 100;
  assert.throws(() => assertGameCoverage(partial, expected), /full Hard chart/);
  const invalid = game();
  invalid.outcomes.lastRun.counts.miss = -1;
  assert.throws(() => assertGameCoverage(invalid, expected), /finite number/);
});

test('Duo requires structured unique P1 and P2 outcomes, not concatenated result text', () => {
  const legacy = game('duo-fx-max');
  legacy.outcomes = { duoResults: 'P2S10000.00% · x929929/0/0/0P1S10000.00% · x929929/0/0/0' };
  assert.throws(() => assertGameCoverage(legacy, expected), /duoPlayers/);
  const duplicate = game('duo-fx-max');
  duplicate.outcomes.duoPlayers[0].player = 'P1';
  assert.throws(() => assertGameCoverage(duplicate, expected), /one P1 and one P2/);
  const incomplete = game('duo-fx-max');
  incomplete.outcomes.duoPlayers[0].counts = [10, 0, 0, 0];
  assert.throws(() => assertGameCoverage(incomplete, expected), /P2 did not judge/);
});

test('maximum effects must persist and light both Duo fields', () => {
  const short = game();
  short.probe.effects.surge3Ms = 30_000;
  assert.throws(() => assertGameCoverage(short, expected), /more than 30 seconds/);
  const duo = game('duo-fx-max');
  duo.probe.effects.maxSimultaneousSurge3Fields = 1;
  assert.throws(() => assertGameCoverage(duo, expected), /every playfield/);
  const briefOverlap = game('duo-fx-max');
  briefOverlap.probe.effects.surge3FieldMs = briefOverlap.probe.effects.surge3Ms + 1000;
  assert.throws(() => assertGameCoverage(briefOverlap, expected), /together for more than 30 seconds/);
  const noNeon = game();
  noNeon.probe.effects.neon3Ms = 0;
  assert.throws(() => assertGameCoverage(noNeon, expected), /Desktop NEON/);
  noNeon.profile = 'mobile-emulated';
  assert.equal(assertGameCoverage(noNeon, expected).covered, true);
  const off = game('hard-fx-off');
  delete off.probe.effects;
  assert.equal(assertGameCoverage(off, expected).covered, true);
});

test('each real-input player queue and total dispatched events must finish', () => {
  const partial = game('duo-fx-max');
  partial.probe.autoplay.players[1].cursor = 10;
  assert.throws(() => assertGameCoverage(partial, expected), /player 2/);
  const countedTwice = game();
  countedTwice.probe.autoplay.dispatchedEvents *= 2;
  assert.throws(() => assertGameCoverage(countedTwice, expected), /Dispatched input count/);
  const missingPlayer = game('duo-fx-max');
  missingPlayer.probe.autoplay.players.pop();
  assert.throws(() => assertGameCoverage(missingPlayer, expected), /player count/);
});

test('errors and failed requests remain coverage failures even with complete counts', () => {
  const errored = game();
  errored.errors.push('Uncaught audio error');
  assert.throws(() => assertGameCoverage(errored, expected), /Runtime errors/);
  const failed = game();
  failed.failedRequests.push({ url: '/audio.mp3', failure: 'net::ERR_FAILED' });
  assert.throws(() => assertGameCoverage(failed, expected), /Failed requests/);
});

test('load evidence requires actual readiness and paint, but allows one shared Duo decode', () => {
  const row = { kind: 'load', scenario: 'duo-cold', errors: [], failedRequests: [], summary: { readyMs: 8000 },
    probe: { paint: { firstContentfulPaintMs: 2500 }, resources: { decodedLifetime: { samples: 1, failed: 0, pending: 0 } } },
    navigation: [{}], resources: [] };
  assert.equal(assertLoadCoverage(row).performanceBudgetEvaluated, false);
  row.summary.readyMs = null;
  assert.throws(() => assertLoadCoverage(row), /Observed ready time/);
});

function memory() {
  const labels = ['library-initial', 'playing-warmup', 'restart-1', 'restart-2', 'after-restarts-exit', 'song-exit-1', 'song-exit-2', 'after-interrupted-loads'];
  const starts = [0, 1, 2, 3, 3, 5, 7, 7];
  return { kind: 'memory', summary: { restarts: 2, songSwitches: 2 }, errors: [], failedRequests: [],
    points: labels.map((label, index) => ({ label, heap: { usedSize: (index + 1) * 1e8 }, dom: { nodes: 300, jsEventListeners: 4 },
      probe: { resources: { activeLongSources: index >= 1 && index <= 3 ? 1 : 0, totalLongSourceStarts: starts[index],
        decodedLifetime: { pending: 0 }, liveDecodedBufferBytes: 4e7 } } })) };
}

test('memory evidence requires every requested cycle and finite measurements, without a growth budget', () => {
  const row = memory();
  assert.equal(assertMemoryCoverage(row, { cycles: 2 }).performanceBudgetEvaluated, false);
  row.points.splice(3, 1);
  assert.throws(() => assertMemoryCoverage(row, { cycles: 2 }), /restart-2/);
});

test('restart labels cannot pass when the R action never started a new music source', () => {
  const row = memory();
  for (const point of row.points.filter((point) => point.label.startsWith('restart-'))) {
    point.probe.resources.totalLongSourceStarts = 1;
  }
  assert.throws(() => assertMemoryCoverage(row), /restart-1 did not start a new music source/);
});

test('each warmup and restart must actually be playing one music source', () => {
  const warmup = memory();
  warmup.points.find((point) => point.label === 'playing-warmup').probe.resources.activeLongSources = 0;
  assert.throws(() => assertMemoryCoverage(warmup), /Warmup must contain one/);
  const restart = memory();
  restart.points.find((point) => point.label === 'restart-2').probe.resources.activeLongSources = 2;
  assert.throws(() => assertMemoryCoverage(restart), /restart-2 must contain one/);
});

test('exits reject a still-playing source or an unfinished decode', () => {
  for (const label of ['after-restarts-exit', 'song-exit-2', 'after-interrupted-loads']) {
    const active = memory();
    active.points.find((point) => point.label === label).probe.resources.activeLongSources = 1;
    assert.throws(() => assertMemoryCoverage(active), /retained an active music source/);
    const pending = memory();
    pending.points.find((point) => point.label === label).probe.resources.decodedLifetime.pending = 1;
    assert.throws(() => assertMemoryCoverage(pending), /still has pending audio decodes/);
  }
});

test('each song switch must start both Duo music sources even if exit is clean', () => {
  const row = memory();
  row.points.find((point) => point.label === 'song-exit-1').probe.resources.totalLongSourceStarts = 4;
  assert.throws(() => assertMemoryCoverage(row), /song-exit-1 must prove two new Duo/);
});

test('only the explicit expected browser cancellation is permitted in memory requests', () => {
  const row = memory();
  row.failedRequests.push({ url: '/audio.mp3', failure: 'net::ERR_ABORTED' });
  assert.equal(assertMemoryCoverage(row).covered, true);
  row.failedRequests.push({ url: '/other.mp3', failure: 'net::ERR_FAILED' });
  assert.throws(() => assertMemoryCoverage(row), /Unexpected failed request/);
});
