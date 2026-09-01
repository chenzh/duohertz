// Global audio engine — one HTMLAudioElement for the whole app, React
// context split into stable actions (never re-created) and volatile state.
// That split is what lets the feed auto-advance without effect loops.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { trackById, type Track } from "../lib/catalog";
import { buildOrder, nextPos, prevPos, type RepeatMode } from "../lib/queue";
import {
  pushRecent,
  readSavedPlayer,
  subscribeFavorites,
  toggleFavorite,
  writeSavedPlayer,
} from "../lib/storage";

export interface PlayerActions {
  /** Start (or jump inside) a queue context. */
  playContext(ids: string[], startIndex: number, label: string): void;
  /** Like playContext, but never hijacks audio from another context. */
  playContextIfIdle(ids: string[], startIndex: number, label: string): void;
  toggle(): void;
  next(): void;
  prev(): void;
  seekTo(sec: number): void;
  setShuffle(on: boolean): void;
  toggleShuffle(): void;
  cycleRepeat(): void;
  setExpanded(open: boolean): void;
}

export interface PlayerState {
  track: Track | null;
  playing: boolean;
  pos: number;
  dur: number;
  shuffle: boolean;
  repeat: RepeatMode;
  contextLabel: string;
  expanded: boolean;
  /** Autoplay was blocked — waiting for the first user gesture. */
  awaitingGesture: boolean;
  error: boolean;
}

const PlayerActionsContext = createContext<PlayerActions | null>(null);
const PlayerStateContext = createContext<PlayerState | null>(null);

export function usePlayerActions(): PlayerActions {
  const v = useContext(PlayerActionsContext);
  if (!v) throw new Error("usePlayerActions must be used inside <PlayerProvider>");
  return v;
}

export function usePlayerState(): PlayerState {
  const v = useContext(PlayerStateContext);
  if (!v) throw new Error("usePlayerState must be used inside <PlayerProvider>");
  return v;
}

let audioSingleton: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audioSingleton) {
    audioSingleton = new Audio();
    audioSingleton.preload = "auto";
  }
  return audioSingleton;
}

/** Session resume, resolved once at module load — before any React effect
 *  runs, so the feed's auto-arm can never race it (StrictMode included). */
interface BootRestore {
  track: Track;
  posSec: number;
}

let bootRestore: BootRestore | null = null;
{
  const saved = readSavedPlayer();
  const t = saved ? trackById(saved.trackId) : undefined;
  if (saved && t) bootRestore = { track: t, posSec: saved.posSec };
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audio = getAudio();

  const [track, setTrack] = useState<Track | null>(bootRestore?.track ?? null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeatState] = useState<RepeatMode>("all");
  const [contextLabel, setContextLabel] = useState(bootRestore ? "Recently played" : "");
  const [expanded, setExpanded] = useState(false);
  const [awaitingGesture, setAwaitingGesture] = useState(false);
  const [error, setError] = useState(false);

  const contextIdsRef = useRef<string[]>(
    bootRestore ? [bootRestore.track.track_id] : [],
  );
  const orderRef = useRef<number[]>(bootRestore ? [0] : []);
  const orderPosRef = useRef(0);
  const labelRef = useRef(bootRestore ? "Recently played" : "");
  const shuffleRef = useRef(false);
  const repeatRef = useRef<RepeatMode>("all");
  const trackRef = useRef<Track | null>(bootRestore?.track ?? null);

  const play = useCallback(() => {
    audio.play().then(
      () => setAwaitingGesture(false),
      () => setAwaitingGesture(true),
    );
  }, [audio]);

  /** Load whatever the refs currently point at. */
  const load = useCallback(
    (autoplay: boolean) => {
      const t = trackById(contextIdsRef.current[orderRef.current[orderPosRef.current]]);
      if (!t) return;
      const changed = trackRef.current?.track_id !== t.track_id;
      trackRef.current = t;
      setTrack(t);
      setError(false);
      if (changed) {
        setPos(0);
        pushRecent(t.track_id);
        writeSavedPlayer({ trackId: t.track_id, posSec: 0 });
        const abs = new URL(t.stream_audio, window.location.href).href;
        if (audio.src !== abs) {
          audio.src = t.stream_audio;
          audio.currentTime = 0;
        }
      }
      if (autoplay) play();
    },
    [audio, play],
  );

  const playContext = useCallback(
    (ids: string[], startIndex: number, label: string) => {
      if (ids.length === 0) return;
      const first = ids[startIndex] ? startIndex : 0;
      contextIdsRef.current = ids;
      orderRef.current = buildOrder(ids.length, {
        shuffle: shuffleRef.current,
        seed: (Math.random() * 0xffffffff) >>> 0,
        first,
      });
      orderPosRef.current = 0;
      labelRef.current = label;
      setContextLabel(label);
      load(true);
    },
    [load],
  );

  const playContextIfIdle = useCallback(
    (ids: string[], startIndex: number, label: string) => {
      if (labelRef.current && labelRef.current !== label) return;
      if (labelRef.current === label && contextIdsRef.current === ids) {
        // Same live context (feed scrolling) — jump without reshuffling.
        const idx = orderRef.current.indexOf(startIndex);
        if (idx >= 0 && idx !== orderPosRef.current) {
          orderPosRef.current = idx;
          load(true);
        } else if (idx === orderPosRef.current && audio.paused) {
          play();
        }
        return;
      }
      playContext(ids, startIndex, label);
    },
    [audio, load, play, playContext],
  );

  const toggle = useCallback(() => {
    if (!trackRef.current) return;
    if (audio.paused) play();
    else audio.pause();
  }, [audio, play]);

  const next = useCallback(() => {
    if (repeatRef.current === "one" && trackRef.current) {
      audio.currentTime = 0;
      play();
      return;
    }
    const np = nextPos(orderPosRef.current, orderRef.current.length, repeatRef.current);
    if (np === null) {
      audio.pause();
      return;
    }
    orderPosRef.current = np;
    load(true);
  }, [audio, load, play]);

  const prev = useCallback(() => {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setPos(0);
      return;
    }
    const pp = prevPos(orderPosRef.current, orderRef.current.length);
    if (pp === null) {
      audio.currentTime = 0;
      setPos(0);
      return;
    }
    orderPosRef.current = pp;
    load(true);
  }, [audio, load]);

  const seekTo = useCallback(
    (sec: number) => {
      audio.currentTime = sec;
      setPos(sec);
    },
    [audio],
  );

  const setShuffle = useCallback((on: boolean) => {
    shuffleRef.current = on;
    setShuffleState(on);
    const n = contextIdsRef.current.length;
    if (n > 0 && trackRef.current) {
      const first = contextIdsRef.current.indexOf(trackRef.current.track_id);
      orderRef.current = buildOrder(n, {
        shuffle: on,
        seed: (Math.random() * 0xffffffff) >>> 0,
        first: first >= 0 ? first : undefined,
      });
      orderPosRef.current = 0;
    }
  }, []);

  const toggleShuffle = useCallback(() => setShuffle(!shuffleRef.current), [setShuffle]);

  const cycleRepeat = useCallback(() => {
    const nextMode: RepeatMode =
      repeatRef.current === "off" ? "all" : repeatRef.current === "all" ? "one" : "off";
    repeatRef.current = nextMode;
    setRepeatState(nextMode);
  }, []);

  const setExpandedAction = useCallback((open: boolean) => setExpanded(open), []);

  // Audio element events — attached once; handlers only touch refs.
  useEffect(() => {
    const onTime = () => setPos(audio.currentTime);
    const onMeta = () => setDur(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => {
      setPlaying(true);
      setAwaitingGesture(false);
    };
    const onPause = () => {
      setPlaying(false);
      if (trackRef.current) {
        writeSavedPlayer({ trackId: trackRef.current.track_id, posSec: audio.currentTime });
      }
    };
    const onEnded = () => {
      if (repeatRef.current === "one" && trackRef.current) {
        audio.currentTime = 0;
        play();
        return;
      }
      next();
    };
    const onError = () => {
      if (audio.src) setError(true);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden" && trackRef.current) {
        writeSavedPlayer({ trackId: trackRef.current.track_id, posSec: audio.currentTime });
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [audio, next, play]);

  // Apply the module-resolved session resume exactly once.
  useEffect(() => {
    if (!bootRestore) return;
    const t = bootRestore.track;
    const abs = new URL(t.stream_audio, window.location.href).href;
    if (audio.src !== abs) {
      const target = bootRestore.posSec;
      audio.addEventListener(
        "loadedmetadata",
        () => {
          const end = Math.max(0, (audio.duration || 0) - 1);
          audio.currentTime = Math.min(target, end);
        },
        { once: true },
      );
      audio.src = t.stream_audio;
    }
    bootRestore = null;
  }, [audio]);

  // Lock-screen / media-key controls.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (track) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: "Scape Music — BeatScape Originals",
        artwork: [{ src: new URL(track.og, window.location.href).href }],
      });
    }
    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => audio.pause());
    navigator.mediaSession.setActionHandler("previoustrack", () => prev());
    navigator.mediaSession.setActionHandler("nexttrack", () => next());
    return () => {
      navigator.mediaSession.metadata = null;
    };
  }, [audio, track, next, prev, play]);

  const actions = useMemo<PlayerActions>(
    () => ({
      playContext,
      playContextIfIdle,
      toggle,
      next,
      prev,
      seekTo,
      setShuffle,
      toggleShuffle,
      cycleRepeat,
      setExpanded: setExpandedAction,
    }),
    [
      playContext,
      playContextIfIdle,
      toggle,
      next,
      prev,
      seekTo,
      setShuffle,
      toggleShuffle,
      cycleRepeat,
      setExpandedAction,
    ],
  );

  const state = useMemo<PlayerState>(
    () => ({
      track,
      playing,
      pos,
      dur,
      shuffle,
      repeat,
      contextLabel,
      expanded,
      awaitingGesture,
      error,
    }),
    [track, playing, pos, dur, shuffle, repeat, contextLabel, expanded, awaitingGesture, error],
  );

  return (
    <PlayerActionsContext.Provider value={actions}>
      <PlayerStateContext.Provider value={state}>{children}</PlayerStateContext.Provider>
    </PlayerActionsContext.Provider>
  );
}

// Re-exported so UI hearts and the player share one favorites store.
export { subscribeFavorites, toggleFavorite };
