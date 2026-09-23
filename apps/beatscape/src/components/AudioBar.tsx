import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { connectPreviewOutput } from "../audio/previewOutput";
import { useMusicVolume } from "../storage/useMusicVolume";

type Props = {
  src: string;
  label?: string;
  preload?: "metadata" | "none";
  className?: string;
  /** Toggle-only presentation for dense discovery cards. */
  compact?: boolean;
  /**
   * 人工选段的试听起点（秒）。
   *
   * 每首入口曲挑的是最能代表它的那一段（一般是 drop 起点），而不是从歌曲
   * 开头的铺垫放起 —— 玩家不该先听 20 秒前奏再猜这首适不适合自己。
   * 0 / 省略 = 从头播放。
   */
  startSec?: number;
  /** 试听长度（秒）。到点自动停回起点；0 / 省略 = 整首。 */
  segmentSec?: number;
};

/** MM:SS — shared by the readout, the drag bubble and aria-valuetext. */
function fmt(s: number): string {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Arrow-key step (s) and PageUp/PageDown step (s) for the seek slider. */
const STEP = 5;
const PAGE = 10;

// Media previews are one listening surface, even when a page renders many
// players. Claiming a new one pauses the previous owner before it can overlap.
let activePreviewAudio: HTMLAudioElement | null = null;

/** End of the buffered range that contains the playhead (0 if unknown). */
function bufferedEnd(el: HTMLAudioElement): number {
  const b = el.buffered;
  if (!b || b.length === 0) return 0;
  const now = el.currentTime;
  for (let i = 0; i < b.length; i += 1) {
    if (b.start(i) <= now && now <= b.end(i)) return b.end(i);
  }
  return b.end(b.length - 1);
}

/** Live duration, or 0 while metadata is unknown (NaN before load). */
function durationOf(el: HTMLAudioElement | null): number {
  const d = el?.duration ?? 0;
  return Number.isFinite(d) && d > 0 ? d : 0;
}

/**
 * Custom audio player bar — replaces the native <audio controls> with the
 * RESONANCE look (hard edges, flat ink, comic skew; PRD §7.6). Play/pause
 * toggle, drag-to-seek progress, buffered range, and MM:SS times. All state
 * comes from the hidden <audio> element's native events.
 *
 * Perf: while dragging we write the fill/thumb/bubble straight to the DOM via
 * refs and commit React state once on pointerup — the bar renders at most
 * twice per gesture instead of once per pointermove. The track rect is cached
 * at pointerdown for the same reason (getBoundingClientRect forces layout).
 */
export function AudioBar({
  src,
  label,
  preload = "metadata",
  className,
  compact = false,
  startSec = 0,
  segmentSec = 0,
}: Props) {
  const musicVolume = useMusicVolume();
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const dragRef = useRef(false);
  const pendingRef = useRef(0);
  const pendingSeekRef = useRef(false);
  const outputRef = useRef<ReturnType<typeof connectPreviewOutput> | null>(null);

  const hasSegment = segmentSec > 0;
  const segmentStart = hasSegment ? Math.max(0, startSec) : 0;
  const segmentEnd = hasSegment ? segmentStart + segmentSec : Infinity;

  const [playing, setPlaying] = useState(false);
  const [outputError, setOutputError] = useState(false);
  const [resumeError, setResumeError] = useState(false);
  // Keep media time absolute internally. Segmented previews translate it to a
  // 0…segmentSec timeline for the visible slider and readout.
  const [time, setTime] = useState(segmentStart);
  const [dur, setDur] = useState(0);
  const [buf, setBuf] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (el && activePreviewAudio === el) {
      el.pause();
      activePreviewAudio = null;
    }
    setPlaying(false);
    setOutputError(false);
    setResumeError(false);
    setTime(segmentStart);
    setDur(0);
    setBuf(0);
    pendingRef.current = segmentStart;
    pendingSeekRef.current = false;
    rectRef.current = null;
    dragRef.current = false;
  }, [segmentSec, segmentStart, src]);

  useEffect(() => {
    const el = audioRef.current;
    const pauseWhenHidden = () => {
      if (document.visibilityState === "hidden") el?.pause();
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      outputRef.current?.disconnect();
      outputRef.current = null;
      if (el && activePreviewAudio === el) {
        el.pause();
        activePreviewAudio = null;
      }
    };
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (outputRef.current) outputRef.current.setVolume(musicVolume);
    else {
      el.volume = musicVolume;
      el.muted = musicVolume === 0;
    }
    if (musicVolume === 0 && !el.paused) el.pause();
  }, [musicVolume]);

  const visibleDuration = hasSegment ? segmentSec : dur;
  const visibleTime = hasSegment
    ? Math.min(visibleDuration, Math.max(0, time - segmentStart))
    : time;
  const visibleBuffer = hasSegment
    ? Math.min(visibleDuration, Math.max(0, buf - segmentStart))
    : buf;
  const toMediaTime = (seconds: number) => hasSegment ? segmentStart + seconds : seconds;
  const toVisibleTime = (seconds: number) => hasSegment
    ? Math.min(visibleDuration, Math.max(0, seconds - segmentStart))
    : seconds;

  const toggle = () => {
    const el = audioRef.current;
    if (!el || musicVolume === 0 || outputError) return;
    if (!el.paused) {
      el.pause();
      return;
    }
    if (!outputRef.current) {
      try {
        outputRef.current = connectPreviewOutput(el, musicVolume);
      } catch {
        // Never fall back to a potentially full-volume native preview on iOS.
        el.muted = true;
        setOutputError(true);
        return;
      }
    }
    outputRef.current.setVolume(musicVolume);
    setResumeError(false);
    // 选段：起点之前、或已经放完一段，都回到选段起点再开始。
    if (hasSegment && (el.currentTime < segmentStart - 0.1 || el.currentTime >= segmentEnd - 0.05)) {
      if (el.readyState > 0) {
        el.currentTime = segmentStart;
        setTime(segmentStart);
      } else {
        // preload="none" deliberately keeps the network idle. Preserve the
        // highlight start until metadata arrives after this user-initiated play.
        pendingRef.current = segmentStart;
        pendingSeekRef.current = true;
      }
    }
    // Start both operations in this click gesture: iOS requires a user action
    // for media playback, and a suspended Web Audio context needs resuming.
    void outputRef.current.resume().catch(() => {
      el.muted = true;
      el.pause();
      setResumeError(true);
    });
    void el.play().catch(() => {
      if (activePreviewAudio === el) activePreviewAudio = null;
      setPlaying(false);
    });
  };

  const onPlay = (el: HTMLAudioElement) => {
    const previous = activePreviewAudio;
    activePreviewAudio = el;
    if (previous && previous !== el) previous.pause();
    setPlaying(true);
  };

  const onPause = (el: HTMLAudioElement) => {
    if (activePreviewAudio === el) activePreviewAudio = null;
    setPlaying(false);
  };

  /** Paint the bar without a React re-render (used during pointer drags). */
  const paint = (seconds: number, total: number) => {
    const pct = total > 0 ? Math.min(100, Math.max(0, (seconds / total) * 100)) : 0;
    if (fillRef.current) fillRef.current.style.width = `${pct}%`;
    if (thumbRef.current) thumbRef.current.style.left = `calc(${pct}% - 4px)`;
    if (timeRef.current) timeRef.current.textContent = `${fmt(seconds)} / ${fmt(total)}`;
    if (bubbleRef.current) {
      bubbleRef.current.style.left = `${pct}%`;
      bubbleRef.current.textContent = fmt(seconds);
    }
  };

  /** Jump to a position on the visible timeline (segment-relative when set). */
  const seekTo = (seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    const total = hasSegment ? segmentSec : durationOf(el);
    const nextVisible = total > 0 ? Math.min(total, Math.max(0, seconds)) : 0;
    const next = toMediaTime(nextVisible);
    // Safari throws InvalidStateError when currentTime is set before metadata.
    if (el.readyState > 0 && total > 0) {
      el.currentTime = next;
      pendingSeekRef.current = false;
    } else if (hasSegment) {
      pendingRef.current = next;
      pendingSeekRef.current = true;
    }
    setTime(next);
  };

  /** Relative jump (keyboard arrows / PageUp / PageDown). */
  const nudge = (delta: number) => {
    const el = audioRef.current;
    if (!el) return;
    const total = hasSegment ? segmentSec : durationOf(el);
    if (total <= 0) return;
    const base = toVisibleTime(el.readyState > 0 ? el.currentTime : time);
    seekTo(base + delta);
  };

  const seekAt = (clientX: number) => {
    const el = audioRef.current;
    const rect = rectRef.current;
    if (!el || !rect || rect.width <= 0) return;
    const total = hasSegment ? segmentSec : durationOf(el);
    if (total <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const nextVisible = ratio * total;
    const next = toMediaTime(nextVisible);
    paint(nextVisible, total);
    if (el.readyState > 0) {
      el.currentTime = next;
      pendingSeekRef.current = false;
    } else {
      pendingSeekRef.current = true;
    }
    pendingRef.current = next;
  };

  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = false;
    rootRef.current?.classList.remove("is-dragging");
    setTime(pendingRef.current);
  };

  const onDown = (e: ReactPointerEvent) => {
    if (!barRef.current) return;
    rectRef.current = barRef.current.getBoundingClientRect();
    dragRef.current = true;
    rootRef.current?.classList.add("is-dragging");
    e.currentTarget.setPointerCapture?.(e.pointerId);
    seekAt(e.clientX);
  };
  const onMove = (e: ReactPointerEvent) => {
    if (dragRef.current) seekAt(e.clientX);
  };
  const onUp = () => endDrag();

  const onKeyDown = (e: ReactKeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        nudge(-STEP);
        break;
      case "ArrowRight":
      case "ArrowUp":
        nudge(STEP);
        break;
      case "PageDown":
        nudge(-PAGE);
        break;
      case "PageUp":
        nudge(PAGE);
        break;
      case "Home":
        seekTo(0);
        break;
      case "End":
        // Stop just short of the end so we don't immediately fire `ended`.
        seekTo(Math.max(0, (hasSegment ? segmentSec : durationOf(audioRef.current)) - 0.25));
        break;
      case " ":
      case "Enter":
        toggle();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const pct = visibleDuration > 0 ? Math.min(100, (visibleTime / visibleDuration) * 100) : 0;
  const bufPct = visibleDuration > 0 ? Math.min(100, (visibleBuffer / visibleDuration) * 100) : 0;
  const controlLabel = outputError
    ? `Preview unavailable — ${label ?? "track"}`
    : musicVolume === 0
    ? `Preview muted — ${label ?? "track"}. Music muted in Settings`
    : resumeError
    ? `Retry preview — ${label ?? "track"}`
    : compact
    ? `${playing ? "Pause" : "Play"} preview — ${label ?? "track"}`
    : label
      ? `${playing ? "Pause" : "Play"} — ${label}`
      : playing ? "Pause" : "Play";

  return (
    <div
      className={`audiobar${compact ? " audiobar-compact" : ""}${className ? ` ${className}` : ""}`}
      data-playing={playing || undefined}
      ref={rootRef}
    >
      <audio
        ref={audioRef}
        src={src}
        preload={preload}
        aria-label={compact && label ? `Preview ${label}` : label}
        onPlay={(event) => onPlay(event.currentTarget)}
        onPause={(event) => onPause(event.currentTarget)}
        // timeupdate would fight the drag we are painting by hand.
        onTimeUpdate={(e) => {
          if (dragRef.current) return;
          const el = e.target as HTMLAudioElement;
          // 选段播完就停回起点，而不是一路放到下一首的段落里去。
          if (hasSegment && el.currentTime >= segmentEnd) {
            el.pause();
            el.currentTime = segmentStart;
            setTime(segmentStart);
            return;
          }
          setTime(el.currentTime);
        }}
        onProgress={(e) => {
          if (dragRef.current) return;
          setBuf(bufferedEnd(e.target as HTMLAudioElement));
        }}
        onLoadedMetadata={(e) => {
          const el = e.target as HTMLAudioElement;
          setDur(el.duration);
          if (!hasSegment) return;
          const requested = pendingSeekRef.current ? pendingRef.current : segmentStart;
          const lastPlayable = Math.max(0, el.duration - 0.01);
          const next = Math.min(lastPlayable, Math.max(segmentStart, requested));
          el.currentTime = next;
          setTime(next);
          pendingSeekRef.current = false;
        }}
        onDurationChange={(e) => setDur((e.target as HTMLAudioElement).duration)}
        onError={(event) => {
          if (activePreviewAudio === event.currentTarget) activePreviewAudio = null;
          setPlaying(false);
        }}
        // Without this the toggle button stays stuck on the "pause" icon.
        onEnded={() => {
          setPlaying(false);
          setTime(segmentStart);
          const el = audioRef.current;
          if (el) {
            if (activePreviewAudio === el) activePreviewAudio = null;
            el.currentTime = segmentStart;
          }
        }}
      />
      <button
        type="button"
        className="audiobar-toggle"
        onClick={toggle}
        aria-label={controlLabel}
        title={outputError ? "Audio preview unavailable in this browser" : musicVolume === 0 ? "Music muted in Settings" : resumeError ? "Audio interrupted; tap to retry" : undefined}
        // 只能用 src 判空，不能用 ready/dur 门禁：首页用 preload="none"，
        // 浏览器不预拉元数据 → onLoadedMetadata / onCanPlay 都不触发 →
        // dur=0 且 ready=false，按钮会被永久 disabled。而"点播放"恰恰是
        // 唯一能触发加载的动作，形成死锁（首页播放条点不动）。
        // 元数据迟到由 seekTo/nudge 里的 readyState>0 兜住。
        disabled={!src || musicVolume === 0 || outputError}
      >
        {playing ? <span className="audiobar-ic audiobar-ic-pause" /> : <span className="audiobar-ic audiobar-ic-play" />}
        {compact && <span className="audiobar-compact-label">{outputError ? "Unavailable" : musicVolume === 0 ? "Muted" : resumeError ? "Retry" : playing ? "Pause" : "Preview"}</span>}
      </button>
      {!compact && (
        <>
          <div
            className="audiobar-track"
            ref={barRef}
            role="slider"
            tabIndex={0}
            aria-label={label ? `Seek — ${label}` : "Seek"}
            aria-valuemin={0}
            aria-valuemax={Math.round(visibleDuration) || 0}
            aria-valuenow={Math.round(visibleTime)}
            aria-valuetext={`${fmt(visibleTime)} of ${fmt(visibleDuration)}`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onLostPointerCapture={onUp}
            onKeyDown={onKeyDown}
          >
            <div className="audiobar-buffer" style={{ width: `${bufPct}%` }} />
            <div className="audiobar-fill" ref={fillRef} style={{ width: `${pct}%` }} />
            <div className="audiobar-thumb" ref={thumbRef} style={{ left: `calc(${pct}% - 4px)` }} />
            <span className="audiobar-bubble" ref={bubbleRef} style={{ left: `${pct}%` }}>{fmt(time)}</span>
          </div>
          {/* Single interpolated child on purpose: paint() rewrites this span via
              textContent during drags, which only reuses (and keeps React's
              reference to) the existing node when there is exactly one Text child. */}
          <span className="audiobar-time" ref={timeRef}>
            {outputError ? "Unavailable" : musicVolume === 0 ? "Muted" : resumeError ? "Tap to retry" : `${fmt(visibleTime)} / ${fmt(visibleDuration)}`}
          </span>
        </>
      )}
    </div>
  );
}
