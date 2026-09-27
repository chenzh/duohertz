import { useEffect, useState } from "react";
import { Link } from "../router";
import { RADIO_EPISODES, RADIO_SEASONS, type RadioLine } from "../data/radioEpisodes";
import { episodeIndexAt } from "../lib/radio";
import { trackEvent } from "../lib/analytics";
import { RADIO_PAGE_META, usePageMeta } from "../seo/pageMeta";

interface Station {
  id: string;
  name: string;
  genre: string;
  stat: string;
  icon: string;
  accent: string;
}

const STATIONS: Station[] = [
  { id: "cyan-pulse",     name: "青色脉冲 · Cyan Pulse",     genre: "Techno / Electro", stat: "1.2k 在听", icon: "(•)", accent: "var(--dh-primary)" },
  { id: "violet-echo",    name: "紫罗兰回响 · Violet Echo",  genre: "Lo-Fi / Chill",     stat: "850 在听",  icon: "(•)", accent: "var(--dh-violet-2)" },
  { id: "neon-drive",     name: "霓虹驱动 · Neon Drive",     genre: "Synthwave",         stat: "2.4k 在听", icon: "(•)", accent: "var(--dh-magenta-2)" },
  { id: "bass-realm",     name: "重音领域 · Bass Realm",     genre: "Dubstep",           stat: "1.5k 在听", icon: "(•)", accent: "var(--dh-blue-2)" },
  { id: "virtual-voice",  name: "虚拟之声 · Virtual Voice",  genre: "J-Pop",             stat: "3.1k 在听", icon: "(•)", accent: "var(--dh-mint)" },
];

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 32 vertical bars whose heights approximate the Visily waveform screenshot.
const WAVEFORM_HEIGHTS = [
  22, 36, 28, 44, 30, 18, 26, 38, 50, 28, 22, 36, 40, 26, 18, 30, 44, 52, 40, 26, 22, 36, 28, 18, 32, 44, 30, 22, 38, 50, 36, 24,
];

export function RadioDialogue({ lines }: { lines: readonly RadioLine[] }) {
  return (
    <ol className="dh-radio-dialogue" aria-label="Broadcast transcript" style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {lines.map((line, i) => (
        <li key={i} style={{
          padding: "10px 0",
          borderTop: i === 0 ? "0" : "1px solid var(--dh-line)",
          fontSize: "0.92rem",
          color: "var(--dh-text)",
        }}>
          <strong style={{ color: "var(--dh-primary)", fontFamily: "IBM Plex Mono, monospace", fontSize: "0.78rem", letterSpacing: "0.14em", marginRight: 10 }}>
            {line.speaker.toUpperCase()}
          </strong>
          <span style={{ color: "var(--dh-text-muted)" }}>{line.text}</span>
        </li>
      ))}
    </ol>
  );
}

export function RadioPage() {
  usePageMeta(RADIO_PAGE_META);
  useEffect(() => { trackEvent("radio_view"); }, []);
  const now = Date.now();
  const current = RADIO_EPISODES[episodeIndexAt(now)];
  const currentSeason = RADIO_SEASONS.find((s) => s.number === current?.season);

  const [activeStationId, setActiveStationId] = useState(STATIONS[0]!.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressPct] = useState(20);

  return (
    <section className="dh-radio-page">
      {/* Header */}
      <header className="dh-radio-head">
        <div>
          <span className="dh-eyebrow">DUOHERTZ · BROADCAST</span>
          <h1 style={{ margin: "6px 0 4px", fontSize: "2.2rem", color: "var(--dh-text-strong)" }}>
            赫兹电台 <span style={{ color: "var(--dh-text-muted)", fontWeight: 500, fontSize: "0.55em", letterSpacing: "0.18em", marginLeft: 10 }}>Radio</span>
          </h1>
          <p style={{ margin: 0, color: "var(--dh-text-muted)" }}>
            探索无限的旋律频率，沉浸在深邃的音乐宇宙中。
          </p>
        </div>
        <span className="dh-radio-live-pill">
          <span className="dh-radio-live-dot" /> LIVE TRANSMISSION ON
        </span>
      </header>

      <div className="dh-radio-layout">
        {/* Player */}
        <div className="dh-radio-player">
          <div className="dh-radio-cover-wrap">
            <span className="dh-orbit-tag dh-orbit-tag--tl">BITRATE: 320KBPS</span>
            <div className="dh-radio-cover" aria-hidden>
              <span className="dh-radio-cover-core" />
            </div>
            <span className="dh-orbit-tag dh-orbit-tag--br">FREQ · 44.1KHZ</span>
          </div>
          <div className="dh-radio-track-info">
            <h2>{current?.title ?? "Frequency Shift"} <span style={{ color: "var(--dh-text-muted)", fontWeight: 500 }}>(频彩位移)</span></h2>
            <p className="dh-radio-track-meta">
              <span className="dh-radio-track-artist">DuoHertz Core</span>
              <span style={{ margin: "0 6px" }}>·</span>
              <span>{currentSeason?.name ?? "Midnight Sessions"}</span>
            </p>
          </div>

          <div className="dh-waveform" aria-hidden>
            {WAVEFORM_HEIGHTS.map((h, i) => (
              <span key={i} style={{ height: `${h}px` }} />
            ))}
          </div>

          <div className="dh-radio-progress" style={{ ["--dh-progress" as string]: `${progressPct}%` } as React.CSSProperties}>
            <div className="dh-radio-progress-bar">
              <div className="dh-radio-progress-fill" />
              <div className="dh-radio-progress-handle" />
            </div>
            <div className="dh-radio-progress-meta">
              <span>{formatTime((progressPct / 100) * 225)}</span>
              <span>03:45</span>
            </div>
          </div>

          <div className="dh-radio-controls">
            <div className="dh-radio-ctrl-left">
              <button type="button" aria-label="喜欢">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
                </svg>
              </button>
              <button type="button" aria-label="队列">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h13M3 12h13M3 18h13" />
                </svg>
              </button>
            </div>
            <div className="dh-row-center" style={{ gap: 14 }}>
              <button type="button" aria-label="上一首">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M6 5v14M20 5l-12 7 12 7z" />
                </svg>
              </button>
              <button type="button" className="dh-radio-play" aria-label={isPlaying ? "暂停" : "播放"} onClick={() => setIsPlaying((p) => !p)}>
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <button type="button" aria-label="下一首">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M18 5v14M4 5l12 7-12 7z" />
                </svg>
              </button>
            </div>
            <div className="dh-radio-ctrl-right">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4z" />
                <path d="M16 9a4 4 0 0 1 0 6" />
              </svg>
              <div className="dh-radio-vol">
                <div className="dh-radio-vol-fill" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="dh-radio-sidebar">
          <div className="dh-station-list">
            <div className="dh-station-list-head">
              <h3>推荐频道</h3>
              <span className="dh-chip dh-chip--cyan">5 在线</span>
            </div>
            {STATIONS.map((station) => (
              <button
                key={station.id}
                type="button"
                className={`dh-station-row ${station.id === activeStationId ? "is-active" : ""}`}
                onClick={() => setActiveStationId(station.id)}
              >
                <span className="dh-station-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5 6 9H2v6h4l5 4z" />
                    <path d="M16 9a4 4 0 0 1 0 6" />
                  </svg>
                </span>
                <div>
                  <div className="dh-station-name">{station.name}</div>
                  <div className="dh-station-meta">{station.genre}</div>
                </div>
                <span className="dh-station-stat">{station.stat}</span>
              </button>
            ))}
          </div>

          <div className="dh-stat-pills">
            <div className="dh-stat-pill">
              <span className="dh-stat-pill-icon" aria-hidden>⏱</span>
              <span className="dh-stat-pill-label">累计收听</span>
              <span className="dh-stat-pill-value">128h</span>
            </div>
            <div className="dh-stat-pill">
              <span className="dh-stat-pill-icon" aria-hidden>♪</span>
              <span className="dh-stat-pill-label">最近单曲</span>
              <span className="dh-stat-pill-value">42 首</span>
            </div>
          </div>

          <div className="dh-quick-access">
            <span className="dh-eyebrow">QUICK ACCESS</span>
            <h3>开始游戏模式</h3>
            <p>体验赫兹频率与节奏同步的律动，挑战隐藏曲目。</p>
            <Link to="/library" className="dh-btn dh-btn--primary" style={{ textDecoration: "none" }}>
              进入游戏 →
            </Link>
          </div>
        </aside>
      </div>

      {/* Broadcast transcripts (kept, gently restyled) */}
      <div>
        <div className="dh-flex-between" style={{ marginBottom: 12 }}>
          <div>
            <span className="dh-eyebrow">BROADCAST TRANSCRIPTS</span>
            <h2 style={{ margin: "6px 0 0", color: "var(--dh-text-strong)" }}>
              {currentSeason ? `Season ${currentSeason.number} · ${currentSeason.name}` : "Broadcast transcripts"}
            </h2>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {RADIO_SEASONS.map((season) => {
            const episodes = RADIO_EPISODES.filter((e) => e.season === season.number).slice(0, 2);
            if (episodes.length === 0) return null;
            return (
              <details
                key={season.number}
                className="dh-card dh-card--inset"
                style={{ padding: 0, overflow: "hidden" }}
              >
                <summary style={{
                  padding: "16px 20px",
                  cursor: "pointer",
                  fontWeight: 600,
                  color: "var(--dh-text)",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span>Season {season.number} · {season.name}</span>
                  <span className="dh-chip dh-chip--violet">{episodes.length} eps</span>
                </summary>
                <div style={{ padding: "0 20px 18px" }}>
                  {episodes.map((ep) => (
                    <article key={ep.ep} style={{ padding: "12px 0", borderTop: "1px solid var(--dh-line)" }}>
                      <h3 style={{ margin: "0 0 6px", color: "var(--dh-text-strong)", fontSize: "0.98rem" }}>
                        EP {ep.ep} · {ep.title}
                      </h3>
                      <RadioDialogue lines={ep.lines} />
                      <p style={{ margin: "10px 0 0", color: "var(--dh-text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                        {ep.signoff}
                      </p>
                    </article>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <footer className="dh-radio-footer">
        <span>◇ DUOHERTZ SYSTEM // BROADCAST v4.2</span>
        <nav className="dh-radio-footer-links" aria-label="Legal">
          <a href="#">服务协议</a>
          <a href="#">隐私政策</a>
          <a href="#">版权声明</a>
        </nav>
      </footer>
    </section>
  );
}