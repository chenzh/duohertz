import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useParams, useSearchParams } from "../router";
import { getMessages } from "../i18n";
import { assetUrl, getTrack, loadChart } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import type { ChartSection, ChartTier, PlayMode } from "../types/chart";
import {
  loadFavorites,
  loadSettings,
  saveSettings,
} from "../storage/settings";
import { TrackAudioPreview } from "../components/TrackAudioPreview";
import { DistrictBadge } from "../components/DistrictBadge";
import { VibeBadge } from "../components/VibeBadge";
import { resolveTrackVibe } from "../catalog/trackVibe";
import { trackRequest } from "../catalog/trackRequests";
import { SCAPE_COPY, artistBio, CHARACTER_LIST } from "../constants/scape";
import {
  chartProfile,
  MODE_GUIDANCE,
  TIER_GUIDANCE,
  type ChartProfile,
} from "../lib/runSetup";
import {
  formatNoteSpeed,
  NOTE_SPEED_MAX,
  NOTE_SPEED_MIN,
  noteSpeedFromScrollBias,
  nudgeNoteSpeed,
  scrollBiasFromNoteSpeed,
} from "../lib/noteSpeed";
import { buildTrackPageMeta, usePageMeta } from "../seo/pageMeta";
import { safeLibraryReturn, withLibraryReturn } from "../lib/libraryReturn";
import {
  chartSectionClock,
  chartSectionLabel,
  selectableChartSections,
} from "../lib/chartSections";
import { chartTierFromParam, playModeFromParam } from "../lib/playHref";

const TIERS: ChartTier[] = ["easy", "standard", "hard"];
const MODES: PlayMode[] = ["casual", "arcade", "practice"];
const TIER_LEVEL: Record<ChartTier, number> = { easy: 4, standard: 7, hard: 10 };

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  values: readonly T[];
  labelFor: (value: T) => string;
  onChange: (value: T) => void;
};

function SegmentedControl<T extends string>({
  label,
  value,
  values,
  labelFor,
  onChange,
}: SegmentedControlProps<T>) {
  const moveSelection = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % values.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + values.length) % values.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = values.length - 1;
    }
    if (nextIndex === null) return;

    event.preventDefault();
    const nextValue = values[nextIndex];
    if (!nextValue) return;
    onChange(nextValue);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      .item(nextIndex)
      .focus();
  };

  return (
    <fieldset className="run-control">
      <legend>{label}</legend>
      <div className="run-segments" role="radiogroup" aria-label={label}>
        {values.map((option, index) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              data-gamepad-default={label === "Difficulty" && selected ? "true" : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option)}
              onKeyDown={(event) => moveSelection(event, index)}
            >
              {labelFor(option)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

type PracticeSectionControlProps = {
  sections: ChartSection[];
  selectedIndex: number | null;
  onChange: (index: number | null) => void;
};

function PracticeSectionControl({
  sections,
  selectedIndex,
  onChange,
}: PracticeSectionControlProps) {
  const options = [
    { key: "full", index: null, label: "Full track", range: "All sections" },
    ...sections.map((section, index) => ({
      key: `${section.id}-${section.t0}-${section.t1}-${index}`,
      index,
      label: chartSectionLabel(section.id),
      range: `${chartSectionClock(section.t0)}–${chartSectionClock(section.t1)}`,
    })),
  ];
  const normalizedIndex = selectedIndex !== null && sections[selectedIndex] ? selectedIndex : null;

  const moveSelection = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % options.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    }
    if (nextIndex === null) return;

    event.preventDefault();
    const nextOption = options[nextIndex];
    if (!nextOption) return;
    onChange(nextOption.index);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      .item(nextIndex)
      .focus();
  };

  return (
    <fieldset className="run-control practice-section-control">
      <legend>Practice section</legend>
      <div className="practice-section-options" role="radiogroup" aria-label="Practice section">
        {options.map((option, optionIndex) => {
          const selected = normalizedIndex === option.index;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-label={option.index === null ? option.label : `${option.label} ${option.range}`}
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.index)}
              onKeyDown={(event) => moveSelection(event, optionIndex)}
            >
              <strong>{option.label}</strong>
              <small>{option.range}</small>
            </button>
          );
        })}
      </div>
      <p className="practice-section-note">Repeat one section with a fresh lead-in. Practice runs stay unranked.</p>
    </fieldset>
  );
}

type ProfileState =
  | { status: "loading" }
  | { status: "ready"; profile: ChartProfile; sections: ChartSection[] }
  | { status: "error" };

function practiceSecondFromParam(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

export function TrackPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const t = getMessages();
  const libraryReturnHref = safeLibraryReturn(params.get("returnTo"));
  const requestedTier = chartTierFromParam(params.get("tier"));
  const requestedMode = playModeFromParam(params.get("mode"));
  const requestedPracticeStart = practiceSecondFromParam(params.get("seek"));
  const requestedPracticeEnd = practiceSecondFromParam(params.get("until"));
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [tier, setTier] = useState<ChartTier>("standard");
  const [mode, setMode] = useState<PlayMode>("arcade");
  const [, setFav] = useState(false);
  const [loadFailure, setLoadFailure] = useState<"not-found" | "network" | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [profileState, setProfileState] = useState<ProfileState>({ status: "loading" });
  const [profileAttempt] = useState(0);
  const [runSettings, setRunSettings] = useState(loadSettings);
  const [, setRunDetailsOpen] = useState(false);
  const [practiceSectionIndex, setPracticeSectionIndex] = useState<number | null>(null);
  const runConfiguratorRef = useRef<HTMLDivElement>(null);

  usePageMeta(track ? buildTrackPageMeta(track) : null);

  useEffect(() => {
    let cancelled = false;
    setTrack(null);
    setLoadFailure(null);
    if (!id) {
      setLoadFailure("not-found");
      return () => { cancelled = true; };
    }

    void getTrack(id)
      .then((nextTrack) => {
        if (cancelled) return;
        if (!nextTrack) {
          setLoadFailure("not-found");
          return;
        }
        setTrack(nextTrack);
        setTier(requestedTier ?? nextTrack.default_tier);
        setMode(requestedMode ?? nextTrack.default_mode);
        setPracticeSectionIndex(null);
        setProfileState({ status: "loading" });
        setFav(loadFavorites().includes(nextTrack.track_id));
      })
      .catch(() => {
        if (!cancelled) setLoadFailure("network");
      });

    return () => { cancelled = true; };
  }, [id, loadAttempt]);

  useEffect(() => {
    if (!track) return;
    setPracticeSectionIndex(null);
    setTier(requestedTier ?? track.default_tier);
    setMode(requestedMode ?? track.default_mode);
  }, [requestedMode, requestedTier, track]);

  useEffect(() => {
    if (!track) return;
    let cancelled = false;
    setProfileState({ status: "loading" });
    void loadChart(track, tier)
      .then((chart) => {
        if (!cancelled) {
          setProfileState({
            status: "ready",
            profile: chartProfile(chart, track.duration_sec),
            sections: selectableChartSections(chart.sections),
          });
        }
      })
      .catch(() => {
        if (!cancelled) setProfileState({ status: "error" });
      });
    return () => { cancelled = true; };
  }, [track, tier, profileAttempt]);

  useEffect(() => {
    // A compact layout must never hide a chart-load failure or its recovery action.
    if (profileState.status === "error") setRunDetailsOpen(true);
  }, [profileState.status]);

  useEffect(() => {
    if (
      mode !== "practice"
      || profileState.status !== "ready"
      || requestedPracticeStart === null
      || requestedPracticeEnd === null
      || requestedPracticeEnd <= requestedPracticeStart
    ) {
      setPracticeSectionIndex(null);
      return;
    }
    const index = profileState.sections.findIndex((section) => (
      Math.abs(section.t0 - requestedPracticeStart) < 0.001
      && Math.abs(section.t1 - requestedPracticeEnd) < 0.001
    ));
    setPracticeSectionIndex(index >= 0 ? index : null);
  }, [mode, profileState, requestedPracticeEnd, requestedPracticeStart]);

  if (loadFailure) {
    const missing = loadFailure === "not-found";
    return (
      <section className="track-load-fallback" role={missing ? undefined : "alert"}>
        <span className="track-load-mark" aria-hidden>◇</span>
        <p className="eyebrow">The Late Static</p>
        <h1>{missing ? "Track not found" : "Signal interrupted"}</h1>
        <p className="tagline">
          {missing
            ? "This track may have moved or left the current set."
            : "We couldn’t load this track. Check your connection and try again."}
        </p>
        <div className="cta-row">
          {!missing && (
            <button type="button" className="btn primary" onClick={() => setLoadAttempt((value) => value + 1)}>
              Try again
            </button>
          )}
          <Link className={missing ? "btn primary" : "btn"} to={libraryReturnHref}>
            Browse Library
          </Link>
        </div>
      </section>
    );
  }

  if (!track) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" aria-hidden />
        <p>{SCAPE_COPY.weakNetwork}</p>
      </div>
    );
  }

  const bio = track.artist_bio ?? artistBio(track.artist);
  const request = trackRequest(track.track_id);
  const tierGuide = TIER_GUIDANCE[tier];
  const modeGuide = MODE_GUIDANCE[mode];
  const noteSpeed = noteSpeedFromScrollBias(runSettings.scrollBias);
  const practiceSections = profileState.status === "ready" ? profileState.sections : [];
  const selectedPracticeSection = mode === "practice" && practiceSectionIndex !== null
    ? practiceSections[practiceSectionIndex]
    : undefined;
  const selectedPracticeSectionLabel = selectedPracticeSection
    ? chartSectionLabel(selectedPracticeSection.id)
    : null;
  const selectedRunPath = `/play/${track.track_id}?tier=${tier}&mode=${mode}${selectedPracticeSection
    ? `&seek=${selectedPracticeSection.t0}&until=${selectedPracticeSection.t1}`
    : ""}`;
  const selectedRunLabel = selectedPracticeSectionLabel
    ? `Practice ${selectedPracticeSectionLabel} · ${tierGuide.label}`
    : `Play ${tierGuide.label} · ${modeGuide.label}`;
  const updateSetupParams = (
    nextTier: ChartTier,
    nextMode: PlayMode,
    nextPracticeSection?: ChartSection,
  ) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("tier", nextTier);
    nextParams.set("mode", nextMode);
    if (nextMode === "practice" && nextPracticeSection) {
      nextParams.set("seek", String(nextPracticeSection.t0));
      nextParams.set("until", String(nextPracticeSection.t1));
    } else {
      nextParams.delete("seek");
      nextParams.delete("until");
    }
    setParams(nextParams);
  };
  const selectTier = (nextTier: ChartTier) => {
    setPracticeSectionIndex(null);
    setProfileState({ status: "loading" });
    setTier(nextTier);
    updateSetupParams(nextTier, mode);
  };
  const selectMode = (nextMode: PlayMode) => {
    const keepSection = nextMode === mode ? selectedPracticeSection : undefined;
    if (nextMode !== mode) setPracticeSectionIndex(null);
    setMode(nextMode);
    updateSetupParams(tier, nextMode, keepSection);
  };
  const selectPracticeSection = (index: number | null) => {
    const nextSection = index === null ? undefined : practiceSections[index];
    setPracticeSectionIndex(nextSection ? index : null);
    updateSetupParams(tier, mode, nextSection);
  };
  const changeNoteSpeed = (direction: -1 | 1) => {
    const nextSpeed = nudgeNoteSpeed(noteSpeed, direction);
    const nextSettings = {
      ...runSettings,
      scrollBias: scrollBiasFromNoteSpeed(nextSpeed),
    };
    setRunSettings(nextSettings);
    saveSettings(nextSettings);
  };
  const revealRunConfigurator = () => {
    const configurator = runConfiguratorRef.current;
    if (!configurator) return;

    configurator.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    configurator
      .querySelector<HTMLButtonElement>(
        '[role="radiogroup"][aria-label="Difficulty"] [role="radio"][aria-checked="true"]',
      )
      ?.focus({ preventScroll: true });
  };

  return (
    <section className="dh-track-page">
      <header className="dh-track-head">
        <Link to={libraryReturnHref} className="dh-btn dh-btn--ghost" style={{ textDecoration: "none", padding: "6px 12px", fontSize: "0.82rem" }}>
          ← 返回曲库
        </Link>
        <div>
          <h1>准备开始</h1>
          <p>确认配置并校准你的设备</p>
        </div>
      </header>

      <div className="dh-track-layout">
        <div className="dh-track-hero-card">
          <div className="dh-track-cover-wrap">
            <div className="dh-track-cover">
              <img
                src={assetUrl(track.cover)}
                alt=""
                width={512}
                height={512}
                decoding="async"
                fetchPriority="high"
              />
              <button type="button" className="dh-track-cover-play" aria-label="试听" onClick={revealRunConfigurator}>
                <span>▶</span>
              </button>
            </div>
            <div className="dh-track-meta">
              <span className="dh-track-original-chip">ORIGINAL SOUNDTRACK</span>
              <h2>{track.title}</h2>
              <span className="dh-track-artist">{track.artist}</span>
              <div className="dh-track-stats">
                <div className="dh-track-stat"><strong>{track.bpm}</strong>BPM</div>
                <div className="dh-track-stat"><strong>{TIER_LEVEL[tier]}</strong>难度指数 Lv.</div>
              </div>
            </div>
          </div>

          <div className="dh-diff-chips">
            {TIERS.map((option) => {
              const selected = tier === option;
              const guide = TIER_GUIDANCE[option];
              return (
                <button
                  key={option}
                  type="button"
                  className={`dh-diff-pill ${selected ? "is-active" : ""}`}
                  onClick={() => selectTier(option)}
                  aria-pressed={selected}
                >
                  {guide.label}
                </button>
              );
            })}
            <button
              type="button"
              className={`dh-diff-pill ${mode === "arcade" ? "is-active" : ""}`}
              onClick={() => selectMode("arcade")}
              aria-pressed={mode === "arcade"}
            >
              Extreme
            </button>
          </div>

          <div ref={runConfiguratorRef} className="run-configurator" style={{ display: "none" }}>
            <SegmentedControl label="Difficulty" value={tier} values={TIERS} labelFor={(value) => TIER_GUIDANCE[value].label} onChange={selectTier} />
            <SegmentedControl label="Mode" value={mode} values={MODES} labelFor={(value) => MODE_GUIDANCE[value].label} onChange={selectMode} />
            <fieldset className="run-control run-note-speed">
              <legend>Note speed · visual only</legend>
              <div className="run-speed-stepper">
                <button type="button" aria-label="Decrease note speed" onClick={() => changeNoteSpeed(-1)} disabled={noteSpeed <= NOTE_SPEED_MIN}>−</button>
                <output aria-live="polite">
                  <strong>{formatNoteSpeed(noteSpeed)}</strong>
                  <span>All modes · saves now</span>
                </output>
                <button type="button" aria-label="Increase note speed" onClick={() => changeNoteSpeed(1)} disabled={noteSpeed >= NOTE_SPEED_MAX}>+</button>
              </div>
            </fieldset>
            {mode === "practice" && profileState.status === "ready" && (
              <PracticeSectionControl sections={practiceSections} selectedIndex={practiceSectionIndex} onChange={selectPracticeSection} />
            )}
            {mode === "practice" && profileState.status === "loading" && (
              <div className="practice-section-status" role="status">
                <span className="run-chart-pulse" aria-hidden />
                Reading practice sections…
              </div>
            )}
            {mode === "practice" && profileState.status === "error" && (
              <p className="practice-section-status practice-section-status-error">Section picker unavailable · Full track selected</p>
            )}
          </div>
        </div>

        {/* Character picker (duohertz) */}
        <div className="dh-character-pick">
          <h3>
            <span aria-hidden>♂</span>
            选择角色
            <span className="dh-character-pick-aside">当前加成: 节奏精准度 +5%</span>
          </h3>
          <div className="dh-character-grid">
            <button type="button" className="dh-character-pick-card is-active" aria-pressed="true">
              <div className="dh-character-pick-art"><span aria-hidden style={{ fontSize: "2.5rem", color: "var(--dh-primary)" }}>♪</span></div>
              <div className="dh-character-pick-name">{CHARACTER_LIST[0]!.name}</div>
              <div className="dh-character-pick-role">{CHARACTER_LIST[0]!.role.split("·")[0]?.trim() ?? "Vocal"}</div>
            </button>
            <button type="button" className="dh-character-pick-card" aria-pressed="false">
              <div className="dh-character-pick-art"><span aria-hidden style={{ fontSize: "2.5rem", color: "var(--dh-violet-2)" }}>♫</span></div>
              <div className="dh-character-pick-name">{CHARACTER_LIST[1]?.name ?? "ATLAS"}</div>
              <div className="dh-character-pick-role">{CHARACTER_LIST[1]?.role.split("·")[0]?.trim() ?? "Production"}</div>
            </button>
            <button type="button" className="dh-character-pick-card" aria-pressed="false">
              <div className="dh-character-pick-art"><span aria-hidden style={{ fontSize: "2.5rem", color: "var(--dh-magenta-2)" }}>♬</span></div>
              <div className="dh-character-pick-name">{CHARACTER_LIST[2]?.name ?? "TORQUE"}</div>
              <div className="dh-character-pick-role">{CHARACTER_LIST[2]?.role.split("·")[0]?.trim() ?? "Drums"}</div>
            </button>
          </div>
        </div>

        {/* Settings panel */}
        <div className="dh-track-settings">
          <div className="dh-flex-between">
            <h3 style={{ margin: 0, color: "var(--dh-text-strong)", fontSize: "1rem" }}>游戏设置</h3>
            <span className="dh-eyebrow">SETTINGS</span>
          </div>
          <div className="dh-track-settings-tabs">
            <button className="dh-track-settings-tab is-active" type="button">校准</button>
            <button className="dh-track-settings-tab" type="button">键位</button>
            <button className="dh-track-settings-tab" type="button">音频</button>
          </div>
          <div className="dh-track-spectrum" aria-hidden>
            <span style={{ position: "absolute", top: 8, right: 12, color: "var(--dh-primary)", fontFamily: "IBM Plex Mono, monospace", fontSize: "0.72rem", letterSpacing: "0.14em" }}>Real-time Spectrum Analysis</span>
          </div>
          <div className="dh-track-slider">
            <div className="dh-track-slider-head">
              <span>音频偏移 (LATENCY)</span>
              <span>0ms</span>
            </div>
            <div className="dh-track-slider-bar"><div className="dh-track-slider-fill" style={{ ["--dh-value" as string]: "12%" }} /></div>
          </div>
          <div className="dh-track-slider">
            <div className="dh-track-slider-head">
              <span>音符下落速度 (SPEED)</span>
              <span>{formatNoteSpeed(noteSpeed)}</span>
            </div>
            <div className="dh-track-slider-bar"><div className="dh-track-slider-fill" style={{ ["--dh-value" as string]: "55%" }} /></div>
          </div>
          <div className="dh-track-actions">
            <Link to={withLibraryReturn("/calibrate", libraryReturnHref)} className="dh-btn dh-btn--ghost" style={{ textDecoration: "none", justifyContent: "center" }}>
              进入精调校准模式
            </Link>
            <Link
              to={withLibraryReturn(selectedRunPath, libraryReturnHref)}
              className="dh-cta"
              style={{
                textDecoration: "none",
                background: "var(--dh-grad-cta)",
                color: "#04132a",
                borderRadius: 999,
                padding: "12px 18px",
                fontWeight: 700,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 0 22px rgba(34,211,238,0.35)",
              }}
            >
              ⚡ 进入律动领域
            </Link>
            <Link
              to={`/duo/${track.track_id}`}
              className="dh-btn"
              style={{ textDecoration: "none", justifyContent: "center", border: "1px solid var(--dh-line-strong)" }}
            >
              Duo 模式
            </Link>
          </div>
          <p className="dh-track-tip">
            提示：建议戴耳机并校准以获得最佳延迟体验。当前网络延迟 <strong style={{ color: "var(--dh-mint)" }}>12ms (稳定)</strong>。
          </p>
        </div>
      </div>

      {/* Bottom mini player */}
      <div className="dh-row-center" style={{
        marginTop: 22,
        padding: "10px 16px",
        borderRadius: 999,
        background: "rgba(13,18,40,0.6)",
        border: "1px solid var(--dh-line)",
        gap: 14,
      }}>
        <div className="dh-row-center" style={{ gap: 10, minWidth: 0 }}>
          <span aria-hidden style={{ color: "var(--dh-primary)", fontSize: "1rem" }}>♪</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{track.title}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--dh-text-muted)" }}>试听中</div>
          </div>
        </div>
        <div style={{ flex: 1, height: 4, borderRadius: 999, background: "rgba(28,35,71,0.8)", overflow: "hidden" }}>
          <div style={{ width: "38%", height: "100%", background: "var(--dh-grad-progress)" }} />
        </div>
        <span className="dh-chip dh-chip--cyan">SPATIAL AUDIO ON</span>
      </div>

      {/* Hidden: legacy detail bits we keep available for accessibility */}
      <div className="dh-hidden">
        <Link to={libraryReturnHref} className="back-link">{t.ui.library}</Link>
        <div className="track-hero">
          <div className="track-hero-cover">
            <img src={assetUrl(track.cover)} alt="" width={512} height={512} decoding="async" fetchPriority="high" />
          </div>
          <div className="track-hero-body">
            <div className="track-hero-badges">
              <VibeBadge vibe={resolveTrackVibe(track)} />
              <DistrictBadge district={track.district} />
            </div>
            <h1>{track.title}</h1>
            <p className="artist">{track.artist}</p>
            {bio && <p className="artist-bio">{bio}</p>}
            {request && (
              <p className="artist-bio radio-request">"{request}" — <strong>The Late Static</strong><br /><small>A fictional call-in from Scape City</small></p>
            )}
            <p className="meta">{track.genre} · {track.bpm} BPM · {track.duration_sec}s clip</p>
            <p className="rights">{SCAPE_COPY.rights}</p>
            <TrackAudioPreview trackId={track.track_id} audioPath={track.preview ?? track.audio} title={track.title} />
          </div>
        </div>
      </div>

      {/* Legacy primary actions preserved for non-duohertz fallback paths */}
      <div className="cta-row track-primary-actions dh-hidden">
        <Link className="btn primary track-play-btn" to={withLibraryReturn(selectedRunPath, libraryReturnHref)}>
          {selectedRunLabel}
        </Link>
        <Link className="btn" to={withLibraryReturn(`/duo/${track.track_id}`, libraryReturnHref)}>
          Duo 模式
        </Link>
        <Link className="btn ghost" to={withLibraryReturn("/calibrate", libraryReturnHref)}>
          {t.ui.calibrate}
        </Link>
      </div>
    </section>
  );
}
