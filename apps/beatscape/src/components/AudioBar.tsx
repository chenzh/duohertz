import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Props = {
  src: string;
  label?: string;
  preload?: "metadata" | "none";
  className?: string;
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
export function AudioBar({ src, label, preload = "metadata", className }: Props) {
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

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [buf, setBuf] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setTime(0);
    setDur(0);
    setBuf(0);
    rectRef.current = null;
    dragRef.current = false;
  }, [src]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
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

  /** Jump to an absolute position (keyboard Home / End). */
  const seekTo = (seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    const total = durationOf(el);
    const next = total > 0 ? Math.min(total, Math.max(0, seconds)) : 0;
    // Safari throws InvalidStateError when currentTime is set before metadata.
    if (el.readyState > 0 && total > 0) el.currentTime = next;
    setTime(next);
  };

  /** Relative jump (keyboard arrows / PageUp / PageDown). */
  const nudge = (delta: number) => {
    const el = audioRef.current;
    if (!el) return;
    const total = durationOf(el);
    if (total <= 0) return;
    const base = el.readyState > 0 ? el.currentTime : time;
    seekTo(base + delta);
  };

  const seekAt = (clientX: number) => {
    const el = audioRef.current;
    const rect = rectRef.current;
    if (!el || !rect || rect.width <= 0) return;
    const total = durationOf(el);
    if (total <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const next = ratio * total;
    paint(next, total);
    if (el.readyState > 0) el.currentTime = next;
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
        seekTo(Math.max(0, durationOf(audioRef.current) - 0.25));
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

  const pct = dur > 0 ? Math.min(100, (time / dur) * 100) : 0;
  const bufPct = dur > 0 ? Math.min(100, (buf / dur) * 100) : 0;

  return (
    <div className={`audiobar${className ? ` ${className}` : ""}`} ref={rootRef}>
      <audio
        ref={audioRef}
        src={src}
        preload={preload}
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        // timeupdate would fight the drag we are painting by hand.
        onTimeUpdate={(e) => {
          if (dragRef.current) return;
          setTime((e.target as HTMLAudioElement).currentTime);
        }}
        onProgress={(e) => {
          if (dragRef.current) return;
          setBuf(bufferedEnd(e.target as HTMLAudioElement));
        }}
        onLoadedMetadata={(e) => setDur((e.target as HTMLAudioElement).duration)}
        onDurationChange={(e) => setDur((e.target as HTMLAudioElement).duration)}
        onError={() => setPlaying(false)}
        // Without this the toggle button stays stuck on the "pause" icon.
        onEnded={() => {
          setPlaying(false);
          setTime(0);
          const el = audioRef.current;
          if (el) el.currentTime = 0;
        }}
      />
      <button
        type="button"
        className="audiobar-toggle"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        // 只能用 src 判空，不能用 ready/dur 门禁：首页用 preload="none"，
        // 浏览器不预拉元数据 → onLoadedMetadata / onCanPlay 都不触发 →
        // dur=0 且 ready=false，按钮会被永久 disabled。而"点播放"恰恰是
        // 唯一能触发加载的动作，形成死锁（首页播放条点不动）。
        // 元数据迟到由 seekTo/nudge 里的 readyState>0 兜住。
        disabled={!src}
      >
        {playing ? <span className="audiobar-ic audiobar-ic-pause" /> : <span className="audiobar-ic audiobar-ic-play" />}
      </button>
      <div
        className="audiobar-track"
        ref={barRef}
        role="slider"
        tabIndex={0}
        aria-label={label ? `Seek — ${label}` : "Seek"}
        aria-valuemin={0}
        aria-valuemax={Math.round(dur) || 0}
        aria-valuenow={Math.round(time)}
        aria-valuetext={`${fmt(time)} of ${fmt(dur)}`}
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
      <span className="audiobar-time" ref={timeRef}>{`${fmt(time)} / ${fmt(dur)}`}</span>
    </div>
  );
}
