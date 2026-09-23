import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { percentile, summarizeFrames, buildAutoplayEvents, buildTouchAutoplayEvents, installPerformanceProbe } from "./performance-probe.mjs";

test("percentiles interpolate sorted finite observations and preserve missing data", () => {
  assert.equal(percentile([], 0.95), null);
  assert.equal(percentile([NaN, 40, 10, Infinity, 20, 30], 0.5), 25);
  assert.equal(percentile([10, 20, 30, 40], 0.95), 38.5);
  assert.equal(percentile([12], 0.99), 12);
});

test("60 Hz jitter and 120 Hz displays do not become false dropped frames", () => {
  const normal = summarizeFrames([16.5, 16.8, 17.1, 16.3, 24.9]);
  assert.equal(normal.missedIntervals, 0);
  assert.equal(normal.estimatedDroppedFrames, 0);
  assert.equal(normal.longestConsecutiveMissedIntervals, 0);
  const fast = summarizeFrames(Array(120).fill(1000 / 120));
  assert.equal(fast.estimatedDroppedFrames, 0);
  assert.ok(Math.abs(fast.observedFps - 120) < 0.001);
});

test("one long stall and consecutive missed intervals are different measurements", () => {
  const frame = 1000 / 60;
  const summary = summarizeFrames([frame, frame * 2, frame * 3, frame, frame * 6]);
  assert.equal(summary.missedIntervals, 3);
  assert.equal(summary.estimatedDroppedFrames, 8);
  assert.equal(summary.longestConsecutiveMissedIntervals, 2);
  assert.equal(summary.maxMs, 100);
  assert.equal(summary.samples, 5);
});

test("missing and invalid samples do not claim passing FPS", () => {
  const summary = summarizeFrames([NaN, Infinity, 0, -1]);
  assert.equal(summary.samples, 0);
  assert.equal(summary.observedFps, null);
  assert.equal(summary.maxMs, null);
});

test("autoplay preserves real tap, chord, hold and slide input with chart plus user offset", () => {
  const events = buildAutoplayEvents({
    audio_offset_ms: 15,
    notes: [
      { type: "tap", t: 1, lane: 0 },
      { type: "chord", t: 2, lanes: [1, 3] },
      { type: "hold", t: 3, end: 4, lane: 2 },
      { type: "slide", t: 5, end: 6, lane: 0, to: 3 },
    ],
  }, -5);
  assert.deepEqual(events, [
    { timeMs: 1010, lane: 0, type: "keydown" },
    { timeMs: 1018, lane: 0, type: "keyup" },
    { timeMs: 2010, lane: 1, type: "keydown" },
    { timeMs: 2010, lane: 3, type: "keydown" },
    { timeMs: 2018, lane: 1, type: "keyup" },
    { timeMs: 2018, lane: 3, type: "keyup" },
    { timeMs: 3010, lane: 2, type: "keydown" },
    { timeMs: 4010, lane: 2, type: "keyup" },
    { timeMs: 5010, lane: 0, type: "keydown" },
    { timeMs: 5018, lane: 0, type: "keyup" },
    { timeMs: 6010, lane: 3, type: "keydown" },
    { timeMs: 6018, lane: 3, type: "keyup" },
  ]);
});

test("a hold tail releases before a simultaneous new head on the same lane", () => {
  const events = buildAutoplayEvents({ notes: [
    { type: "tap", t: 2, lane: 0 },
    { type: "hold", t: 1, end: 2, lane: 0 },
  ] });
  assert.deepEqual(events.filter((event) => event.timeMs === 2000).map((event) => event.type), ["keyup", "keydown"]);
});

test("touch autoplay uses independent fingers for chords and one drag contact for slides", () => {
  const events = buildTouchAutoplayEvents({ audio_offset_ms: 10, notes: [
    { type: "chord", t: 1, lanes: [0, 3] },
    { type: "hold", t: 2, end: 3, lane: 1 },
    { type: "slide", t: 4, end: 5, lane: 0, to: 2 },
  ] }, -10);
  assert.deepEqual(events.map(({ timeMs, lane, type, contact }) => [timeMs, lane, type, contact]), [
    [1000, 0, "pointerdown", 1], [1000, 3, "pointerdown", 2],
    [1008, 0, "pointerup", 1], [1008, 3, "pointerup", 2],
    [2000, 1, "pointerdown", 3], [3000, 1, "pointerup", 3],
    [4000, 0, "pointerdown", 4], [5000, 2, "pointermove", 4], [5008, 2, "pointerup", 4],
  ]);
});

test("the init function can serialize without module closure dependencies", () => {
  const serialized = new Function(`return (${installPerformanceProbe.toString()})({metricsOnly:true});`)();
  assert.equal(serialized.summarizeFrames([16, 16]).samples, 2);
});

function browserHarness(previousDrawObserver, canvases = []) {
  let now = 0;
  let sequence = 0;
  const rafs = new Map();
  const intervals = new Map();
  const keyboard = [];
  class FakeAudioContext {
    currentTime = 0;
    decodeAudioData(buffer, success) {
      const pending = Promise.resolve(buffer);
      if (success) pending.then(success);
      return pending;
    }
  }
  class FakeSource {
    constructor(context, buffer) {
      this.context = context;
      this.buffer = buffer;
      this.listeners = new Map();
    }
    start() {}
    addEventListener(type, callback) { this.listeners.set(type, callback); }
    finish() { this.listeners.get("ended")?.(); }
  }
  class FakeObserver {
    static supportedEntryTypes = [];
    observe() {}
    disconnect() {}
  }
  const surface = {
    __bsMeasureDraw: previousDrawObserver,
    requestAnimationFrame(callback) { const id = ++sequence; rafs.set(id, callback); return id; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    BaseAudioContext: FakeAudioContext,
    AudioBufferSourceNode: FakeSource,
    dispatchEvent(event) { keyboard.push(event); },
  };
  const context = {
    window: surface,
    document: { body: { dataset: {} }, querySelectorAll: (selector) => selector === "canvas.play-canvas" ? canvases : [] },
    performance: { now: () => now },
    PerformanceObserver: FakeObserver,
    MutationObserver: FakeObserver,
    KeyboardEvent: class { constructor(type, fields) { Object.assign(this, { type }, fields); } },
    PointerEvent: class { constructor(type, fields) { Object.assign(this, { type }, fields); } },
    WeakRef,
    setInterval(callback) { const id = ++sequence; intervals.set(id, callback); return id; },
    clearInterval(id) { intervals.delete(id); },
  };
  vm.runInNewContext(`(${installPerformanceProbe.toString()})();`, context);
  return {
    surface,
    probe: surface.__bsPerf,
    FakeAudioContext,
    FakeSource,
    keyboard,
    advance(ms) { now += ms; },
    frame(time) {
      now = time;
      const pending = [...rafs.values()];
      rafs.clear();
      for (const callback of pending) callback(time);
    },
    pollAutoplay() { for (const callback of intervals.values()) callback(); },
  };
}

test("probe aggregates application CPU at a shared frame timestamp and excludes its own rAF", () => {
  const harness = browserHarness();
  harness.surface.requestAnimationFrame(() => harness.advance(2));
  harness.surface.requestAnimationFrame(() => harness.advance(3));
  harness.frame(10);
  harness.frame(10 + 1000 / 60);
  const snapshot = harness.probe.snapshot();
  assert.equal(snapshot.appRafCallbacks.samples, 2);
  assert.equal(snapshot.appRafCallbacks.totalMs, 5);
  assert.equal(snapshot.appFrameCpu.samples, 1);
  assert.equal(snapshot.appFrameCpu.maxMs, 5);
  assert.equal(snapshot.frames.samples, 1);
  assert.doesNotThrow(() => JSON.stringify(snapshot));
  harness.probe.stop();
});

test("draw samples keep independent fields, skip countdown, and reset without claiming missing data passed", () => {
  const previous = () => {};
  const harness = browserHarness(previous);
  const canvas = {};
  const secondCanvas = {};
  const emit = (durationMs, songTimeMs, target = canvas) => harness.surface.__bsMeasureDraw({
    startedAtMs: 10, durationMs, songTimeMs, noteObjects: 4, canvas: target,
  });
  emit(100, -1);
  assert.equal(harness.probe.snapshot().canvasDraw.samples, 0);
  assert.equal(harness.probe.snapshot().canvasDraw.maxMs, null);
  emit(2, 0);
  emit(6, 100, secondCanvas);
  const draw = harness.probe.snapshot().canvasDraw;
  assert.equal(draw.samples, 2);
  assert.equal(draw.maxMs, 6);
  assert.deepEqual(Object.values(draw.fieldSamples), [1, 1]);
  assert.equal(draw.visibleNotes.max, 4);
  assert.equal(draw.overBudget.length, 1);
  assert.equal(draw.overBudget[0].songTimeMs, 100);
  assert.equal(draw.overBudget[0].startedAtMs, 10);
  assert.doesNotThrow(() => JSON.stringify(draw));
  harness.probe.reset();
  assert.equal(harness.probe.snapshot().canvasDraw.samples, 0);
  assert.equal(harness.probe.snapshot().canvasDraw.maxMs, null);
  emit(1, 200);
  assert.equal(harness.probe.snapshot().canvasDraw.fieldSamples[1], 1);
  const observer = harness.surface.__bsMeasureDraw;
  harness.probe.stop();
  assert.equal(harness.surface.__bsMeasureDraw, previous);
  emit(10, 300);
  observer({ startedAtMs: 30, durationMs: 20, songTimeMs: 300, noteObjects: 4, canvas });
  assert.equal(harness.probe.snapshot().canvasDraw.samples, 1);
});

test("stopping the probe preserves a draw observer installed after it", () => {
  const harness = browserHarness();
  const replacement = () => {};
  harness.surface.__bsMeasureDraw = replacement;
  harness.probe.stop();
  assert.equal(harness.surface.__bsMeasureDraw, replacement);
});

test("delayed-frame timestamps retain the previous application CPU and clear on reset", () => {
  const harness = browserHarness();
  harness.surface.requestAnimationFrame(() => harness.advance(2));
  harness.frame(10);
  harness.frame(60);
  const delayed = harness.probe.snapshot().delayedFrames;
  assert.equal(delayed.length, 1);
  assert.equal(delayed[0].endedAtMs, 60);
  assert.equal(delayed[0].intervalMs, 50);
  assert.equal(delayed[0].previousFrameCpuMs, 2);
  harness.probe.reset();
  assert.equal(harness.probe.snapshot().delayedFrames.length, 0);
  harness.probe.stop();
});

test("decode timeline distinguishes pending and completed work and survives phase reset", async () => {
  const harness = browserHarness();
  const ctx = new harness.FakeAudioContext();
  harness.advance(100);
  const pending = ctx.decodeAudioData({ length: 48000, numberOfChannels: 2, duration: 1 });
  const before = harness.probe.snapshot().decodeTimeline[0];
  assert.equal(before.startedAtMs, 100);
  assert.equal(before.endedAtMs, null);
  harness.advance(20);
  await pending;
  const after = harness.probe.snapshot().decodeTimeline[0];
  assert.equal(after.durationMs, 20);
  assert.equal(after.endedAtMs, 120);
  assert.equal(after.failed, false);
  harness.probe.reset();
  assert.equal(harness.probe.snapshot().decodeTimeline.length, 1);
  assert.equal(harness.probe.snapshot().audioDecode.attempts, 0);
  harness.probe.stop();
});

test("decode counters and weak buffer observations survive reset while phase timings restart", async () => {
  const harness = browserHarness();
  const ctx = new harness.FakeAudioContext();
  const buffer = { length: 48000, numberOfChannels: 2, duration: 1 };
  let successCalls = 0;
  await ctx.decodeAudioData(buffer, () => { successCalls++; });
  assert.equal(successCalls, 1);
  const first = harness.probe.snapshot();
  assert.equal(first.audioDecode.attempts, 1);
  assert.equal(first.audioDecode.samples, 1);
  assert.equal(first.resources.liveDecodedBuffers, 1);
  assert.equal(first.resources.liveDecodedBufferBytes, 384000);
  harness.probe.reset();
  const second = harness.probe.snapshot();
  assert.equal(second.audioDecode.attempts, 0);
  assert.equal(second.resources.decodedLifetime.attempts, 1);
  assert.equal(second.resources.liveDecodedBufferBytes, 384000);
  harness.probe.stop();
});

test("autoplay follows production source clock for both players and survives reset", () => {
  const harness = browserHarness();
  const ctx = new harness.FakeAudioContext();
  harness.probe.autoplay({ track_id: "duo", notes: [{ type: "tap", t: 0.1, lane: 2 }] }, { duo: true });
  const sources = [0, 1].map(() => new harness.FakeSource(ctx, { duration: 120 }));
  for (const source of sources) source.start(3, 0);
  assert.equal(harness.probe.musicTimeMs(), -3000);
  assert.equal(harness.probe.musicStarted(), false);
  harness.probe.reset();
  ctx.currentTime = 3.101;
  harness.pollAutoplay();
  assert.equal(harness.probe.musicStarted(), true);
  assert.deepEqual(harness.keyboard.map((event) => [event.type, event.code]), [["keydown", "ArrowUp"], ["keydown", "KeyW"]]);
  ctx.currentTime = 3.12;
  harness.pollAutoplay();
  assert.deepEqual(harness.keyboard.slice(2).map((event) => [event.type, event.code]), [["keyup", "ArrowUp"], ["keyup", "KeyW"]]);
  assert.equal(harness.probe.snapshot().autoplay.dispatchedEvents, 4);
  assert.equal(harness.probe.snapshot().resources.activeLongSources, 2);
  for (const source of sources) source.finish();
  assert.equal(harness.probe.snapshot().resources.activeLongSources, 0);
  assert.equal(harness.probe.musicTimeMs(), null);
  harness.probe.stop();
});

test("touch autoplay dispatches multi-pointer input to each canvas and restores native capture", () => {
  const pointer = [];
  const nativeCaptures = [];
  const canvases = [0, 1].map((player) => ({
    getBoundingClientRect: () => ({ left: player * 400, top: 10, width: 400, height: 600 }),
    setPointerCapture(pointerId) { nativeCaptures.push([player, pointerId]); },
    dispatchEvent(event) {
      pointer.push([player, event]);
      if (event.type === "pointerdown") this.setPointerCapture(event.pointerId);
    },
  }));
  const captures = canvases.map((canvas) => canvas.setPointerCapture);
  const harness = browserHarness(undefined, canvases);
  const ctx = new harness.FakeAudioContext();
  const chart = { track_id: "touch-duo", notes: [
    { type: "chord", t: 0.1, lanes: [0, 3] },
    { type: "slide", t: 0.2, end: 0.3, lane: 1, to: 2 },
  ] };
  harness.probe.autoplay(chart, { duo: true, inputSurface: "touch" });
  const sources = [0, 1].map(() => new harness.FakeSource(ctx, { duration: 120 }));
  for (const source of sources) source.start(0, 0);
  ctx.currentTime = 0.105;
  harness.pollAutoplay();
  assert.equal(pointer.filter(([, event]) => event.type === "pointerdown").length, 4);
  assert.equal(new Set(pointer.filter(([player, event]) => player === 0 && event.type === "pointerdown")
    .map(([, event]) => event.pointerId)).size, 2);
  assert.equal(harness.keyboard.length, 0);
  assert.deepEqual(nativeCaptures, []);
  ctx.currentTime = 0.21;
  harness.pollAutoplay();
  ctx.currentTime = 0.305;
  harness.pollAutoplay();
  ctx.currentTime = 0.32;
  harness.pollAutoplay();
  const slideEvents = pointer.filter(([player, event]) => player === 0 && event.pointerId === 3).map(([, event]) => event);
  assert.deepEqual(slideEvents.map((event) => event.type), ["pointerdown", "pointermove", "pointerup"]);
  assert.equal(slideEvents[1].clientX, 250);
  const evidence = harness.probe.snapshot().autoplay;
  assert.equal(evidence.inputSurface, "touch");
  assert.equal(evidence.dispatchedEvents, 14);
  assert.equal(evidence.pointerEventsDispatched, 14);
  assert.equal(evidence.keyboardEventsDispatched, 0);
  assert.equal(evidence.players[0].cursor, 7);
  assert.equal(evidence.players[1].cursor, 7);
  harness.probe.stop();
  assert.deepEqual(canvases.map((canvas) => canvas.setPointerCapture), captures);
  canvases[0].setPointerCapture(123);
  assert.deepEqual(nativeCaptures, [[0, 123]]);
});
