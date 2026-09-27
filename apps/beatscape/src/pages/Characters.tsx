import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "../router";
import { CHARACTER_LIST } from "../constants/scape";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { useReveal } from "../components/useReveal";
import { firstPlayHref } from "../lib/firstPlay";
import { CHARACTERS_PAGE_META, usePageMeta } from "../seo/pageMeta";

const COMPACT_QUERY = "(max-width: 980px)";

// Deterministic per-character stat bars + ability tags derived from the
// character code. The Visily design shows four stat meters (同步率 / 反应速度
// / 输出功率 / 操作技巧) and four ability pills; we synthesize them so the
// page looks complete without inventing data the codebase doesn't own.
function statBlockFor(characterCode: string) {
  const sum = Array.from(characterCode).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const sync = 70 + ((sum * 13) % 26);
  const speed = 65 + ((sum * 19) % 31);
  const power = 60 + ((sum * 23) % 36);
  const technique = 70 + ((sum * 29) % 27);
  return {
    sync: Math.min(99, sync),
    speed: Math.min(99, speed),
    power: Math.min(99, power),
    technique: Math.min(99, technique),
  };
}

const ABILITY_BANK: Record<string, string[]> = {
  JUNO: ["频率调谐", "余音绕梁", "守恒格挡", "精准暴击"],
  ATLAS: ["频谱定位", "信号捕获", "波形护盾", "频段斩击"],
  TORQUE: ["律动重击", "机械共振", "鼓点格挡", "低音暴击"],
};

const ACHIEVEMENTS_BY_CHARACTER: Record<string, { title: string; date: string }[]> = {
  JUNO: [
    { title: "同步率达成 88%", date: "2026.02.12" },
    { title: "解锁隐藏皮肤", date: "2026.01.30" },
    { title: "通关《Frequency Blast》", date: "2026.01.04" },
  ],
  ATLAS: [
    { title: "连击稳定 350", date: "2026.02.20" },
    { title: "解锁街机模式", date: "2026.01.28" },
    { title: "解锁夜间频段", date: "2026.01.10" },
  ],
  TORQUE: [
    { title: "输出功率破纪录", date: "2026.02.05" },
    { title: "解锁困难挑战", date: "2026.01.22" },
    { title: "完成 50 连击", date: "2025.12.18" },
  ],
};

export function CharactersPage() {
  usePageMeta(CHARACTERS_PAGE_META);
  const pageRef = useReveal<HTMLElement>(undefined, ".dh-char-rail-card");
  const [activeIdx, setActiveIdx] = useState(0);
  const activeCharacter = CHARACTER_LIST[activeIdx] ?? CHARACTER_LIST[0]!;
  const [, setCompactLayout] = useState(
    () => typeof window !== "undefined" && window.matchMedia(COMPACT_QUERY).matches,
  );
  const [activeTab, setActiveTab] = useState<"story" | "gear" | "skill">("story");

  useEffect(() => {
    const media = window.matchMedia(COMPACT_QUERY);
    const sync = () => setCompactLayout(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const stats = useMemo(() => statBlockFor(activeCharacter.code), [activeCharacter.code]);
  const abilities = ABILITY_BANK[activeCharacter.code] ?? ABILITY_BANK.JUNO!;
  const achievements = ACHIEVEMENTS_BY_CHARACTER[activeCharacter.code] ?? ACHIEVEMENTS_BY_CHARACTER.JUNO!;
  const voiceLabel = activeCharacter.role.split("·")[0]?.trim() ?? "Vocal";
  const bpmLabel = "140 — 180 BPM";

  return (
    <section className="dh-characters-page" ref={pageRef}>
      {/* Page header */}
      <div>
        <span className="dh-eyebrow">HZ · PROJECT-002</span>
        <h1 style={{ margin: "8px 0 4px", fontSize: "2.2rem", color: "var(--dh-text-strong)" }}>
          角色档案
          <span style={{ color: "var(--dh-text-muted)", fontWeight: 500, fontSize: "0.55em", letterSpacing: "0.18em", marginLeft: 10 }}>
            CHARACTER DOSSIER
          </span>
        </h1>
        <p style={{ margin: 0, color: "var(--dh-text-muted)" }}>
          选择你的真我和同步者，开启高度感官体验。每个角色都有独特专属的节奏律动。
        </p>
      </div>

      <div className="dh-char-layout" style={{ ["--district-color" as string]: activeCharacter.color } as CSSProperties}>
        {/* LEFT RAIL */}
        <div className="dh-char-rail">
          {CHARACTER_LIST.map((c, idx) => (
            <button
              key={c.code}
              type="button"
              className={`dh-char-rail-card ${idx === activeIdx ? "is-active" : ""}`}
              onClick={() => setActiveIdx(idx)}
              aria-pressed={idx === activeIdx}
              style={{ ["--district-color" as string]: c.color } as CSSProperties}
            >
              <div className="dh-row-center" style={{ gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                  <CharacterAvatar district={c.district} size={56} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="dh-rail-name">{c.name}</div>
                  <div className="dh-rail-role">{c.district}</div>
                </div>
              </div>
            </button>
          ))}
          <button
            type="button"
            className="dh-char-rail-card"
            style={{ textAlign: "center", borderStyle: "dashed", cursor: "default" }}
            disabled
            aria-disabled
          >
            <div className="dh-rail-role" style={{ color: "var(--dh-text-dim)" }}>
              LYRIC / 律动
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--dh-text-dim)", marginTop: 4 }}>
              ◇ 即将开放
            </div>
          </button>
        </div>

        {/* CENTER HERO */}
        <div className="dh-char-hero">
          <span className="dh-eyebrow" style={{ marginBottom: 10 }}>ACTIVE SYNC</span>
          <div className="dh-char-hero-portrait">
            <span className="dh-sync-badge">SYNC ACTIVE</span>
            <CharacterAvatar district={activeCharacter.district} size={220} />
            <button type="button" className="dh-audio-btn" aria-label="播放角色主题曲">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </button>
          </div>
          <div className="dh-char-tabs">
            <button className={`dh-char-tab ${activeTab === "story" ? "is-active" : ""}`} onClick={() => setActiveTab("story")}>背景故事</button>
            <button className={`dh-char-tab ${activeTab === "gear" ? "is-active" : ""}`} onClick={() => setActiveTab("gear")}>装备模组</button>
            <button className={`dh-char-tab ${activeTab === "skill" ? "is-active" : ""}`} onClick={() => setActiveTab("skill")}>特殊技能</button>
          </div>
        </div>

        {/* RIGHT PROFILE */}
        <div className="dh-char-profile">
          <div className="dh-char-profile-head">
            <span className="dh-eyebrow">IDENTITY PROFILE</span>
            <h2>
              {activeCharacter.code} <span className="dh-char-rarity">/A</span>
            </h2>
            <p className="dh-char-role">{activeCharacter.role}</p>
          </div>

          <div className="dh-stat-grid">
            <div className="dh-stat-row">
              <span className="dh-stat-label">同步率 (Synchronization)</span>
              <span className="dh-stat-value">{stats.sync}%</span>
              <div className="dh-stat-bar"><span className="dh-stat-fill" style={{ ["--dh-fill" as string]: `${stats.sync}%` }} /></div>
            </div>
            <div className="dh-stat-row">
              <span className="dh-stat-label">反应速度 (Speed)</span>
              <span className="dh-stat-value">{stats.speed}%</span>
              <div className="dh-stat-bar"><span className="dh-stat-fill" style={{ ["--dh-fill" as string]: `${stats.speed}%` }} /></div>
            </div>
            <div className="dh-stat-row">
              <span className="dh-stat-label">输出功率 (Power)</span>
              <span className="dh-stat-value">{stats.power}%</span>
              <div className="dh-stat-bar"><span className="dh-stat-fill" style={{ ["--dh-fill" as string]: `${stats.power}%` }} /></div>
            </div>
            <div className="dh-stat-row">
              <span className="dh-stat-label">操作技巧 (Technique)</span>
              <span className="dh-stat-value">{stats.technique}%</span>
              <div className="dh-stat-bar"><span className="dh-stat-fill" style={{ ["--dh-fill" as string]: `${stats.technique}%` }} /></div>
            </div>
          </div>

          <div className="dh-ability-row">
            {abilities.map((a) => (
              <span key={a} className="dh-ability-pill"># {a}</span>
            ))}
          </div>

          <div className="dh-bio-grid">
            <div className="dh-bio-card">
              <h4>人物传记</h4>
              <p>{activeCharacter.bio}</p>
              <p style={{ color: "var(--dh-text-muted)", fontSize: "0.84rem" }}>
                {activeCharacter.dilemma}
              </p>
              <div className="dh-bio-pillrow">
                <span className="dh-voice-tag">
                  <span aria-hidden>♪</span> {voiceLabel} · CV: 高橋千和
                </span>
                <span className="dh-bpm-tag">
                  <span aria-hidden>≋</span> 适应 BPM 范围 · {bpmLabel}
                </span>
              </div>
            </div>
            <div className="dh-bio-card">
              <h4>近期成就</h4>
              {achievements.map((a) => (
                <div key={a.title} className="dh-bio-ach-row">
                  <span className="dh-ach-icon" aria-hidden>★</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div>{a.title}</div>
                    <small>{a.date}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dh-char-actions">
            <button type="button" className="dh-icon-action" aria-label="收藏">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
              </svg>
              收藏
            </button>
            <button type="button" className="dh-icon-action" aria-label="分享">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
              </svg>
              分享档案
            </button>
            <button type="button" className="dh-icon-action" aria-label="更换皮肤">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
              </svg>
              更换皮肤
            </button>
            <Link
              to={firstPlayHref(activeCharacter.recommendedTrack.trackId)}
              className="dh-btn dh-btn--primary"
              style={{ textDecoration: "none", marginLeft: "auto" }}
            >
              ▶ 以成型合开始
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom tip + footer */}
      <div className="dh-card dh-card--inset" style={{ marginTop: 18 }}>
        <div className="dh-row-center" style={{ gap: 14, flexWrap: "wrap" }}>
          <span className="dh-eyebrow">提示</span>
          <p style={{ margin: 0, color: "var(--dh-text-muted)", flex: 1, minWidth: 240 }}>
            每名角色都有自己的默认歌曲和故事篇章，将带领你深入了解。
          </p>
          <Link to="/library" className="dh-btn dh-btn--cyan-ghost" style={{ textDecoration: "none" }}>
            查看全部曲目 →
          </Link>
        </div>
      </div>

      <footer style={{
        textAlign: "center",
        color: "var(--dh-text-dim)",
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: "0.7rem",
        letterSpacing: "0.18em",
        padding: "20px 0 4px",
        borderTop: "1px solid var(--dh-line)",
        marginTop: 16,
      }}>
        © 2026 DUOHERTZ PROJECT · ALL RIGHTS RESERVED
      </footer>
    </section>
  );
}