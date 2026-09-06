/**
 * Read-only runtime instrumentation for the production browser build.
 * Pass installPerformanceProbe directly to Playwright page.addInitScript().
 * It deliberately closes over no module values so browser serialization works.
 */
export function installPerformanceProbe({ metricsOnly = false } = {}) {
  function percentile(values, fraction) {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return null;
    const index = (sorted.length - 1) * Math.max(0, Math.min(1, fraction));
    const lo = Math.floor(index);
    return sorted[lo] + (sorted[Math.ceil(index)] - sorted[lo]) * (index - lo);
  }

  function summarizeDurations(values) {
    const valid = values.filter((value) => Number.isFinite(value) && value >= 0);
    return {
      samples: valid.length,
      totalMs: valid.reduce((total, value) => total + value, 0),
      p50Ms: percentile(valid, 0.5),
      p95Ms: percentile(valid, 0.95),
      p99Ms: percentile(valid, 0.99),
      maxMs: valid.length ? Math.max(...valid) : null,
    };
  }

  function summarizeFrames(values, targetFps = 60) {
    const valid = values.filter((value) => Number.isFinite(value) && value > 0);
    const frameBudgetMs = 1000 / targetFps;
    const missedThresholdMs = frameBudgetMs * 1.5;
    let missedIntervals = 0;
    let estimatedDroppedFrames = 0;
    let consecutive = 0;
    let longestConsecutiveMissedIntervals = 0;
    for (const interval of valid) {
      if (interval > missedThresholdMs) {
        missedIntervals++;
        estimatedDroppedFrames += Math.max(1, Math.round(interval / frameBudgetMs) - 1);
        consecutive++;
        longestConsecutiveMissedIntervals = Math.max(longestConsecutiveMissedIntervals, consecutive);
      } else {
        consecutive = 0;
      }
    }
    const summary = summarizeDurations(valid);
    return {
      ...summary,
      targetFps,
      frameBudgetMs,
      missedThresholdMs,
      observedFps: summary.totalMs ? (valid.length * 1000) / summary.totalMs : null,
      missedIntervals,
      missedIntervalPercent: valid.length ? (100 * missedIntervals) / valid.length : 0,
      estimatedDroppedFrames,
      longestConsecutiveMissedIntervals,
    };
  }

  function buildAutoplayEvents(chart, offsetMs = 0) {
    const result = [];
    const offset = (Number(chart.audio_offset_ms) || 0) + offsetMs;
    const add = (timeMs, lane, type) => result.push({ timeMs: timeMs + offset, lane, type });
    for (const note of chart.notes) {
      const timeMs = note.t * 1000;
      if (note.type === "chord") {
        for (const lane of note.lanes) {
          add(timeMs, lane, "keydown");
          add(timeMs + 8, lane, "keyup");
        }
      } else {
        add(timeMs, note.lane, "keydown");
        add(note.type === "hold" ? note.end * 1000 : timeMs + 8, note.lane, "keyup");
        if (note.type === "slide") {
          add(note.end * 1000, note.to, "keydown");
          add(note.end * 1000 + 8, note.to, "keyup");
        }
      }
    }
    // A hold ending exactly as another note starts must release before pressing.
    return result.sort((a, b) => a.timeMs - b.timeMs || (a.type === b.type ? 0 : a.type === "keyup" ? -1 : 1));
  }

  if (metricsOnly) return { percentile, summarizeFrames, summarizeDurations, buildAutoplayEvents };
  if (window.__bsPerf) return;

  const nativeRaf = window.requestAnimationFrame.bind(window);
  const nativeCancelRaf = window.cancelAnimationFrame.bind(window);
  const decodeRecords = [];
  const sources = [];
  const paint = { firstContentfulPaintMs: null, largestContentfulPaintMs: null, largestContentfulPaintSize: null };
  let sourceSequence = 0;
  let measurementStartedAt = performance.now();
  let decodeBaseline = 0;
  let frameIntervals = [];
  let callbackDurations = [];
  let callbackCpuByFrame = new Map();
  let longTasks = [];
  let previousFrame = null;
  let rafId = null;
  let stopped = false;
  let surge3Fields = 0;
  let neon3 = false;
  let effects = emptyEffects();
  let auto = null;
  let autoTimer = null;

  function emptyEffects() {
    return { surge3Frames: 0, surge3Ms: 0, surge3FieldMs: 0, maxSimultaneousSurge3Fields: 0, neon3Frames: 0, neon3Ms: 0 };
  }

  // Each application callback is timed once; timestamp aggregation also counts
  // the separate field/stats/HUD callbacks in Duo. Probe work uses native rAF.
  window.requestAnimationFrame = function requestAnimationFrame(callback) {
    return nativeRaf((timestamp) => {
      const start = performance.now();
      try {
        callback(timestamp);
      } finally {
        if (!stopped) {
          const duration = performance.now() - start;
          callbackDurations.push(duration);
          callbackCpuByFrame.set(timestamp, (callbackCpuByFrame.get(timestamp) || 0) + duration);
        }
      }
    });
  };

  function readEffects() {
    surge3Fields = document.querySelectorAll('.play-wrap[data-surge="3"]').length;
    neon3 = document.body?.dataset.neon === "3";
  }
  const mutations = new MutationObserver(readEffects);
  mutations.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-surge", "data-neon"] });

  function frame(timestamp) {
    if (stopped) return;
    if (previousFrame !== null) {
      const interval = timestamp - previousFrame;
      frameIntervals.push(interval);
      if (surge3Fields) {
        effects.surge3Frames++;
        effects.surge3Ms += interval;
        effects.surge3FieldMs += interval * surge3Fields;
        effects.maxSimultaneousSurge3Fields = Math.max(effects.maxSimultaneousSurge3Fields, surge3Fields);
      }
      if (neon3) {
        effects.neon3Frames++;
        effects.neon3Ms += interval;
      }
    }
    previousFrame = timestamp;
    rafId = nativeRaf(frame);
  }
  rafId = nativeRaf(frame);

  const observers = [];
  function observe(type, receive) {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) return;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) receive(entry);
    });
    observer.observe({ type, buffered: true });
    observers.push(observer);
  }
  observe("longtask", (entry) => {
    if (entry.startTime >= measurementStartedAt) longTasks.push({ startTimeMs: entry.startTime, durationMs: entry.duration });
  });
  observe("paint", (entry) => {
    if (entry.name === "first-contentful-paint") paint.firstContentfulPaintMs = entry.startTime;
  });
  observe("largest-contentful-paint", (entry) => {
    paint.largestContentfulPaintMs = entry.startTime;
    paint.largestContentfulPaintSize = entry.size;
  });

  const audioPrototype = window.BaseAudioContext?.prototype;
  if (audioPrototype?.decodeAudioData) {
    const decode = audioPrototype.decodeAudioData;
    audioPrototype.decodeAudioData = function decodeAudioData(...args) {
      const record = { startedAtMs: performance.now(), durationMs: null, failed: false, buffer: null };
      decodeRecords.push(record);
      let recorded = false;
      const finish = (buffer, failed = false) => {
        if (recorded) return;
        recorded = true;
        record.durationMs = performance.now() - record.startedAtMs;
        record.failed = failed;
        if (buffer) record.buffer = new WeakRef(buffer);
      };
      // Preserve both promise and legacy callback semantics; record exactly once.
      if (typeof args[1] === "function") {
        const success = args[1];
        args[1] = (buffer) => { finish(buffer); success(buffer); };
      }
      if (typeof args[2] === "function") {
        const failure = args[2];
        args[2] = (error) => { finish(null, true); failure(error); };
      }
      try {
        const pending = decode.apply(this, args);
        pending?.then((buffer) => finish(buffer), () => finish(null, true));
        return pending;
      } catch (error) {
        finish(null, true);
        throw error;
      }
    };
  }

  const sourcePrototype = window.AudioBufferSourceNode?.prototype;
  if (sourcePrototype?.start) {
    const start = sourcePrototype.start;
    sourcePrototype.start = function startMusicSource(...args) {
      const returned = start.apply(this, args);
      // Production SFX are <= 0.85 s. Observe actual song sources, never alter
      // their rate, scheduled start, buffers, or the application's game state.
      if (this.buffer?.duration > 1) {
        const record = {
          id: ++sourceSequence,
          source: new WeakRef(this),
          context: new WeakRef(this.context),
          when: args[0] ?? 0,
          offsetSec: args[1] ?? 0,
          durationSec: this.buffer.duration,
          ended: false,
        };
        sources.push(record);
        this.addEventListener("ended", () => { record.ended = true; }, { once: true });
      }
      return returned;
    };
  }

  function activeSources() {
    return sources.filter((source) => !source.ended && source.source.deref() && source.context.deref());
  }

  function sourceTimeMs(source) {
    const ctx = source?.context.deref();
    return ctx ? (ctx.currentTime - source.when + source.offsetSec) * 1000 : null;
  }

  function musicTimeMs() {
    return sourceTimeMs(activeSources().at(-1));
  }

  function dispatch(player, event) {
    const code = player.keys[event.lane];
    if (!code) return;
    window.dispatchEvent(new KeyboardEvent(event.type, {
      code,
      key: code.startsWith("Key") ? code.slice(3).toLowerCase() : code,
      bubbles: true,
      cancelable: true,
      repeat: false,
    }));
    if (event.type === "keydown") player.pressed.add(event.lane);
    else player.pressed.delete(event.lane);
  }

  function releasePlayer(player) {
    for (const lane of [...player.pressed]) dispatch(player, { type: "keyup", lane });
  }

  function stopAutoplay() {
    if (autoTimer !== null) clearInterval(autoTimer);
    autoTimer = null;
    if (auto) {
      for (const player of auto.players) releasePlayer(player);
      auto.running = false;
    }
  }

  function autoplay(chart, { duo = false, offsetMs = 0 } = {}) {
    stopAutoplay();
    const events = buildAutoplayEvents(chart, offsetMs);
    const keySets = [["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"], ["KeyA", "KeyS", "KeyW", "KeyD"]];
    auto = {
      running: true,
      chartId: chart.track_id,
      duo,
      eventsPerPlayer: events.length,
      dispatchedEvents: 0,
      maximumDispatchLatenessMs: 0,
      dispatchLateness: [],
      players: keySets.slice(0, duo ? 2 : 1).map((keys) => ({ keys, sourceId: null, cursor: 0, pressed: new Set() })),
    };
    autoTimer = setInterval(() => {
      if (!auto?.running) return;
      const currentSources = activeSources().slice(-auto.players.length);
      if (currentSources.length !== auto.players.length) return;
      for (let i = 0; i < auto.players.length; i++) {
        const player = auto.players[i];
        const source = currentSources[i];
        if (player.sourceId !== source.id) {
          releasePlayer(player);
          player.sourceId = source.id;
          player.cursor = 0;
        }
        const songMs = sourceTimeMs(source);
        if (songMs === null) continue;
        while (player.cursor < events.length && events[player.cursor].timeMs <= songMs) {
          const event = events[player.cursor++];
          dispatch(player, event);
          const late = Math.max(0, songMs - event.timeMs);
          auto.maximumDispatchLatenessMs = Math.max(auto.maximumDispatchLatenessMs, late);
          auto.dispatchLateness.push(late);
          auto.dispatchedEvents++;
        }
      }
    }, 2);
  }

  function reset() {
    measurementStartedAt = performance.now();
    decodeBaseline = decodeRecords.length;
    frameIntervals = [];
    callbackDurations = [];
    callbackCpuByFrame = new Map();
    longTasks = [];
    previousFrame = null;
    effects = emptyEffects();
    // Resource references, paint entries, and the real-input autoplayer survive.
  }

  function decodeSummary(records) {
    return {
      attempts: records.length,
      failed: records.filter((record) => record.failed).length,
      pending: records.filter((record) => record.durationMs === null).length,
      ...summarizeDurations(records.flatMap((record) => record.durationMs === null ? [] : [record.durationMs])),
    };
  }

  function snapshot() {
    let liveDecodedBuffers = 0;
    let liveDecodedBufferBytes = 0;
    for (const record of decodeRecords) {
      const buffer = record.buffer?.deref();
      if (!buffer) continue;
      liveDecodedBuffers++;
      liveDecodedBufferBytes += buffer.length * buffer.numberOfChannels * 4;
    }
    const alive = activeSources();
    return {
      measurementStartedAtMs: measurementStartedAt,
      measuredMs: performance.now() - measurementStartedAt,
      frames: summarizeFrames(frameIntervals),
      appRafCallbacks: summarizeDurations(callbackDurations),
      appFrameCpu: summarizeDurations([...callbackCpuByFrame.values()]),
      longTasks: { ...summarizeDurations(longTasks.map((task) => task.durationMs)), entries: [...longTasks] },
      paint: { ...paint },
      audioDecode: decodeSummary(decodeRecords.slice(decodeBaseline)),
      resources: {
        decodedLifetime: decodeSummary(decodeRecords),
        liveDecodedBuffers,
        liveDecodedBufferBytes,
        activeLongSources: alive.length,
        totalLongSourceStarts: sourceSequence,
        currentSongTimeMs: sourceTimeMs(alive.at(-1)),
      },
      effects: { ...effects },
      autoplay: auto ? {
        running: auto.running,
        chartId: auto.chartId,
        duo: auto.duo,
        eventsPerPlayer: auto.eventsPerPlayer,
        dispatchedEvents: auto.dispatchedEvents,
        maximumDispatchLatenessMs: auto.maximumDispatchLatenessMs,
        dispatchLateness: summarizeDurations(auto.dispatchLateness),
        players: auto.players.map((player) => ({ sourceId: player.sourceId, cursor: player.cursor, pressed: [...player.pressed] })),
      } : null,
      measurementNotes: {
        frames: "Native rAF intervals: cadence evidence, not render CPU or GPU completion time.",
        appFrameCpu: "Sum of application rAF callback CPU per shared timestamp; excludes probe rAF, interval input driver and browser paint/GPU work.",
        liveDecodedBufferBytes: "WeakRef-live buffers decoded through decodeAudioData, estimated as channels * samples * 4; excludes SFX createBuffer and native GPU memory. Collect GC before snapshot for retention comparisons.",
      },
    };
  }

  function stop() {
    stopped = true;
    if (rafId !== null) nativeCancelRaf(rafId);
    stopAutoplay();
    mutations.disconnect();
    for (const observer of observers) observer.disconnect();
  }

  window.__bsPerf = { reset, snapshot, autoplay, stopAutoplay, musicTimeMs, musicStarted: () => (musicTimeMs() ?? -1) >= 0, stop };
}

export const percentile = (values, fraction) => installPerformanceProbe({ metricsOnly: true }).percentile(values, fraction);
export const summarizeFrames = (values, targetFps) => installPerformanceProbe({ metricsOnly: true }).summarizeFrames(values, targetFps);
export const buildAutoplayEvents = (chart, offsetMs) => installPerformanceProbe({ metricsOnly: true }).buildAutoplayEvents(chart, offsetMs);
