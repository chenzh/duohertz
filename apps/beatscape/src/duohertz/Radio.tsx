import { useEffect, useRef, useState } from "react";
import { Link } from "../router";
import { loadSettings, saveSettings, SETTINGS_CHANGE_EVENT, SETTINGS_STORAGE_KEY } from "../storage/settings";
import "./radio-lab.css";
import "./shell.css";

const ALL_STYLES = "All sounds";

export type DuohertzRadioEntry = [id: string, track: {
  title: string;
  artist: string;
  subgenre: string;
  bpm: number;
  streamUrl: string;
  coverUrl: string;
  coverAlt: string;
  streamDurationMs: number;
}];

function clock(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Shared station transport. The caller owns source approval and track selection. */
export function DuohertzRadio({ entries, preview, gameHref, playHref, selectedTrackId, onSelectTrack }: {
  entries: DuohertzRadioEntry[];
  preview: boolean;
  gameHref: string;
  playHref?: (id: string) => string;
  selectedTrackId?: string;
  onSelectTrack?: (id: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wantsPlaybackRef = useRef(false);
  const [style, setStyle] = useState(ALL_STYLES);
  const [query, setQuery] = useState("");
  const [localSelectedId, setLocalSelectedId] = useState(entries[0]?.[0] ?? "");
  const [playing, setPlaying] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [musicVolume, setMusicVolume] = useState(() => loadSettings().musicVolume);
  const styles = [ALL_STYLES, ...new Set(entries.map(([, track]) => track.subgenre))];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchesQuery = (track: DuohertzRadioEntry[1]) => !normalizedQuery
    || `${track.title} ${track.artist}`.toLocaleLowerCase().includes(normalizedQuery);
  const playlist = entries.filter(([, track]) => (style === ALL_STYLES || track.subgenre === style) && matchesQuery(track));
  const selectedId = selectedTrackId ?? localSelectedId;
  const selected = entries.find(([id]) => id === selectedId)?.[1];
  const selectedOutsideResults = Boolean(selected) && playlist.length > 0
    && !playlist.some(([id]) => id === selectedId);

  useEffect(() => {
    const refresh = () => setMusicVolume(loadSettings().musicVolume);
    const storage = (event: StorageEvent) => {
      if (event.key === SETTINGS_STORAGE_KEY) refresh();
    };
    window.addEventListener(SETTINGS_CHANGE_EVENT, refresh);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", storage);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (wantsPlaybackRef.current) {
      audio.load();
      void audio.play().catch(() => {
        wantsPlaybackRef.current = false;
        setPlaying(false);
        setError("This track could not play. Choose another track or try again.");
      });
    }
  }, [selectedId]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) {
        wantsPlaybackRef.current = false;
        audioRef.current?.pause();
      }
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      audioRef.current?.pause();
    };
  }, []);

  function choose(id: string, continuePlaying = wantsPlaybackRef.current) {
    if (id === selectedId) return;
    wantsPlaybackRef.current = continuePlaying;
    audioRef.current?.pause();
    if (onSelectTrack) onSelectTrack(id);
    else setLocalSelectedId(id);
    setElapsedMs(0);
    setPlaying(false);
    setError("");
    setShareStatus("");
  }

  async function copyTrackLink() {
    if (!selected || !onSelectTrack) return;
    onSelectTrack(selectedId);
    const url = new URL(window.location.href);
    url.searchParams.set("track", selectedId);
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareStatus("Track link copied.");
    } catch {
      setShareStatus("Copy unavailable. The selected track is now in the address bar.");
    }
  }

  function filter(nextStyle: string) {
    if (nextStyle === style) return;
    setStyle(nextStyle);
  }

  function move(direction: -1 | 1) {
    const index = playlist.findIndex(([id]) => id === selectedId);
    if (playlist.length === 0) return;
    if (index < 0) {
      choose(playlist[direction < 0 ? playlist.length - 1 : 0]![0]);
      return;
    }
    const next = playlist[(index + direction + playlist.length) % playlist.length];
    if (!next) return;
    if (next[0] === selectedId) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setElapsedMs(0);
      if (wantsPlaybackRef.current) void audioRef.current?.play();
    } else choose(next[0]);
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !selected) return;
    if (playing) {
      wantsPlaybackRef.current = false;
      audio.pause();
      return;
    }
    wantsPlaybackRef.current = true;
    setError("");
    try {
      await audio.play();
    } catch {
      wantsPlaybackRef.current = false;
      setPlaying(false);
      setError("This track could not play. Choose another track or try again.");
    }
  }

  return (
    <section className="dh-radio-lab">
      <header className="dh-radio-lab__header">
        <p className="dh-radio-lab__eyebrow">duohertz · music station{preview ? " lab" : ""}</p>
        <h1>Find your frequency.</h1>
        <p>Electronic sounds for one-key starts, two-key replies, and every listener in between.</p>
        {preview && <small>Internal stream-master candidates only. Listening here does not approve a track or publish a station.</small>}
        <Link to={!preview && selected && playHref ? playHref(selectedId) : gameHref}>
          {!preview && selected && playHref ? `Play ${selected.title} in the rhythm game` : "Try the rhythm game"} ↗
        </Link>
      </header>

      <div className="dh-radio-lab__styles" role="group" aria-label={preview ? "Filter candidate subgenre" : "Filter music style"}>
        {styles.map((option) => (
          <button key={option} type="button" aria-pressed={style === option} onClick={() => filter(option)}>{option}</button>
        ))}
      </div>

      {selected && <div className="dh-radio-lab__player">
        <img src={selected.coverUrl} alt={selected.coverAlt} width="240" height="240" />
        <div className="dh-radio-lab__player-copy">
          <p className="dh-radio-lab__eyebrow">Now tuned{preview ? " · unreviewed" : ""}</p>
          <h2>{selected.title}</h2>
          <p>{selected.artist} · {selected.subgenre} · {Math.round(selected.bpm)} BPM</p>
          <div className="dh-radio-lab__transport" role="group" aria-label="Station playback">
            <button type="button" onClick={() => move(-1)} aria-label={preview ? "Previous candidate" : "Previous track"}>← Previous</button>
            <button type="button" className="dh-radio-lab__play" onClick={() => void togglePlayback()}>{playing ? "Pause" : "Play"}</button>
            <button type="button" onClick={() => move(1)} aria-label={preview ? "Next candidate" : "Next track"}>Next →</button>
          </div>
          {!preview && onSelectTrack && <div className="dh-radio-lab__share">
            <button type="button" onClick={() => void copyTrackLink()}>Copy track link</button>
            {shareStatus && <span role="status">{shareStatus}</span>}
          </div>}
          <label className="dh-radio-lab__seek">
            <span>Position · {clock(elapsedMs)} / {clock(selected.streamDurationMs)}</span>
            <input type="range" min="0" max={selected.streamDurationMs} step="1000" value={Math.min(elapsedMs, selected.streamDurationMs)}
              aria-label={preview ? "Seek in candidate stream" : "Seek in station track"} onChange={(event) => {
                if (audioRef.current) audioRef.current.currentTime = Number(event.target.value) / 1000;
                setElapsedMs(Number(event.target.value));
              }} />
          </label>
          <label className="dh-radio-lab__volume">
            <span>Music volume · {Math.round(musicVolume * 100)}%</span>
            <input type="range" min="0" max="100" step="5" value={Math.round(musicVolume * 100)}
              onChange={(event) => saveSettings({ musicVolume: Number(event.target.value) / 100 })} />
          </label>
          {error && <p role="alert">{error}</p>}
        </div>
      </div>}

      <audio ref={audioRef} src={selected?.streamUrl} preload="none" aria-hidden="true"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setElapsedMs(event.currentTarget.currentTime * 1000)}
        onEnded={() => move(1)} onError={() => {
          wantsPlaybackRef.current = false;
          setPlaying(false);
          setError("This track could not play. Choose another track or try again.");
        }} />

      <div className="dh-radio-lab__playlist" aria-label={preview ? "Candidate stream playlist" : "Music station playlist"}>
        <div className="dh-radio-lab__playlist-heading"><h2>{preview ? "Candidate queue" : "Music queue"}</h2><span>{playlist.length} {preview ? "masters" : "tracks"}</span></div>
        <label className="dh-radio-lab__search">
          <span>Find a track</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or artist" autoComplete="off" />
        </label>
        {playlist.length === 0 && <p className="dh-radio-lab__empty" role="status">No tracks match. Try another search or music style.</p>}
        {selectedOutsideResults && <p className="dh-radio-lab__empty" role="status">
          Now tuned to {selected?.title} outside these results. Select a track below to switch.
        </p>}
        <ol>
          {playlist.map(([id, candidate]) => (
            <li key={id}>
              <button type="button" aria-current={selectedId === id ? "true" : undefined} onClick={() => choose(id)}>
                <img src={candidate.coverUrl} alt="" width="64" height="64" loading="lazy" />
                <span><strong>{candidate.title}</strong><small>{candidate.subgenre} · {Math.round(candidate.bpm)} BPM</small></span>
                <time>{clock(candidate.streamDurationMs)}</time>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
