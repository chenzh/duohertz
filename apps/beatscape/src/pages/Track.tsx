import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useParams, useSearchParams } from "../router";
import { getMessages } from "../i18n";
import { assetUrl, getTrack, loadChart } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import type { ChartSection, ChartTier, PlayMode } from "../types/chart";
import {
  loadFavorites,
  loadScores,
  loadSettings,
  personalBestFor,
  saveSettings,
  toggleFavorite,
  type ScoreEntry,
} from "../storage/settings";
import { StreamFullCTA } from "../components/StreamFullCTA";
import { TrackAudioPreview } from "../components/TrackAudioPreview";
import { DistrictBadge } from "../components/DistrictBadge";
import { VibeBadge } from "../components/VibeBadge";
import { resolveTrackVibe } from "../catalog/trackVibe";
import { trackRequest } from "../catalog/trackRequests";
import { SCAPE_COPY, artistBio } from "../constants/scape";
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

function compactScore(score: number): string {
  if (score >= 1_000_000) {
    const millions = score / 1_000_000;
    return `${millions.toLocaleString("en-US", { maximumFractionDigits: millions < 10 ? 1 : 0 })}M`;
  }
  if (score >= 1_000) return `${Math.round(score / 1_000)}K`;
  return score.toLocaleString("en-US");
}

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
  const [fav, setFav] = useState(false);
  const [loadFailure, setLoadFailure] = useState<"not-found" | "network" | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [profileState, setProfileState] = useState<ProfileState>({ status: "loading" });
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [runSettings, setRunSettings] = useState(loadSettings);
  const [personalBests] = useState<ScoreEntry[]>(loadScores);
  const [runDetailsOpen, setRunDetailsOpen] = useState(false);
  const [practiceSectionIndex, setPracticeSectionIndex] = useState<number | null>(null);
  const runConfiguratorRef = useRef<HTMLDivElement>(null);

  const personalBest = useMemo(() => {
    if (!track || mode !== "arcade") return null;
    return personalBestFor(personalBests, track.track_id, tier, mode);
  }, [mode, personalBests, tier, track]);

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
  const personalBestTitle = personalBest
    ? `${personalBest.score.toLocaleString("en-US")} PTS`
    : mode === "arcade"
      ? "No score yet"
      : mode === "practice"
        ? "Practice is unranked"
        : "Arcade scores only";
  const personalBestDetail = personalBest
    ? `${personalBest.accuracy.toLocaleString("en-US", { maximumFractionDigits: 2 })}% ACC · ${tierGuide.label} Arcade record`
    : mode === "arcade"
      ? "Clear this chart to set your first Personal Best."
      : mode === "practice"
        ? "Practice runs never change your Personal Best."
        : "Switch to Arcade to chase your Personal Best.";
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
  const selectedRunSummary = `${tierGuide.label} · ${modeGuide.label}${selectedPracticeSectionLabel
    ? ` · ${selectedPracticeSectionLabel}`
    : ""}`;
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
    <section className="track-detail">
      <Link to={libraryReturnHref} className="back-link">
        {t.ui.library}
      </Link>

      <div className="track-hero">
        <div className="track-hero-cover">
          <img
            src={assetUrl(track.cover)}
            alt=""
            width={512}
            height={512}
            decoding="async"
            fetchPriority="high"
          />
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
            <p className="artist-bio radio-request">
              “{request}” — <strong>The Late Static</strong><br />
              <small>A fictional call-in from Scape City</small>
            </p>
          )}
          <p className="meta">
            {track.genre} · {track.bpm} BPM · {track.duration_sec}s clip
          </p>
          <p className="rights">{SCAPE_COPY.rights}</p>
          <TrackAudioPreview trackId={track.track_id} audioPath={track.preview ?? track.audio} title={track.title} />

          <div ref={runConfiguratorRef} className="run-configurator">
            <SegmentedControl
              label="Difficulty"
              value={tier}
              values={TIERS}
              labelFor={(value) => TIER_GUIDANCE[value].label}
              onChange={selectTier}
            />

            <SegmentedControl
              label="Mode"
              value={mode}
              values={MODES}
              labelFor={(value) => MODE_GUIDANCE[value].label}
              onChange={selectMode}
            />

            <fieldset className="run-control run-note-speed">
              <legend>Note speed · visual only</legend>
              <div className="run-speed-stepper">
                <button
                  type="button"
                  aria-label="Decrease note speed"
                  onClick={() => changeNoteSpeed(-1)}
                  disabled={noteSpeed <= NOTE_SPEED_MIN}
                >
                  −
                </button>
                <output aria-live="polite">
                  <strong>{formatNoteSpeed(noteSpeed)}</strong>
                  <span>All modes · saves now</span>
                </output>
                <button
                  type="button"
                  aria-label="Increase note speed"
                  onClick={() => changeNoteSpeed(1)}
                  disabled={noteSpeed >= NOTE_SPEED_MAX}
                >
                  +
                </button>
              </div>
            </fieldset>

            {mode === "practice" && profileState.status === "ready" && (
              <PracticeSectionControl
                sections={practiceSections}
                selectedIndex={practiceSectionIndex}
                onChange={selectPracticeSection}
              />
            )}

            {mode === "practice" && profileState.status === "loading" && (
              <div className="practice-section-status" role="status">
                <span className="run-chart-pulse" aria-hidden />
                Reading practice sections…
              </div>
            )}

            {mode === "practice" && profileState.status === "error" && (
              <p className="practice-section-status practice-section-status-error">
                Section picker unavailable · Full track selected
              </p>
            )}
          </div>

          <div className="cta-row track-primary-actions">
            <Link
              className="btn primary track-play-btn"
              to={withLibraryReturn(selectedRunPath, libraryReturnHref)}
            >
              {selectedRunLabel}
            </Link>
          </div>

          <section
            className="run-setup"
            aria-label="Selected run setup"
            data-details-open={runDetailsOpen}
          >
            <header className="run-setup-header">
              <span>Run setup</span>
              <strong>{selectedRunSummary}</strong>
              <button
                type="button"
                className="run-setup-toggle"
                aria-label={`${runDetailsOpen ? "Hide" : "Show"} run details`}
                aria-expanded={runDetailsOpen}
                aria-controls="run-guidance run-chart-profile"
                onClick={() => setRunDetailsOpen((open) => !open)}
              >
                {runDetailsOpen ? "Less" : "Details"}
              </button>
            </header>
            <div id="run-guidance" className="run-guidance" hidden={!runDetailsOpen}>
              <div>
                <span className="run-guidance-index" aria-hidden>01</span>
                <p>Chart</p>
                <strong>{tierGuide.title}</strong>
                <small>{tierGuide.detail}</small>
              </div>
              <div>
                <span className="run-guidance-index" aria-hidden>02</span>
                <p>Rules</p>
                <strong>{modeGuide.title}</strong>
                <small>{modeGuide.detail}</small>
                <small>{modeGuide.record}</small>
              </div>
            </div>

            <div
              className="run-personal-best"
              data-state={personalBest ? "ranked" : mode}
              role="status"
              aria-label="Personal best target"
              aria-atomic="true"
            >
              <div className="run-personal-best-lede">
                <span>Personal best</span>
                <strong>{personalBestTitle}</strong>
              </div>
              <small>{personalBestDetail}</small>
            </div>

            <div
              id="run-chart-profile"
              className="run-chart-profile"
              aria-live="polite"
              aria-busy={profileState.status === "loading"}
              hidden={!runDetailsOpen}
            >
              {profileState.status === "ready" ? (
                <dl>
                  <div>
                    <dt>Judgments</dt>
                    <dd>{profileState.profile.judgments}</dd>
                  </div>
                  <div>
                    <dt>Average pace</dt>
                    <dd>{profileState.profile.pace}/sec</dd>
                  </div>
                  <div>
                    <dt>Sections</dt>
                    <dd>{profileState.profile.sections || "—"}</dd>
                  </div>
                  <div className="run-chart-patterns">
                    <dt>Patterns</dt>
                    <dd>{profileState.profile.patterns}</dd>
                  </div>
                </dl>
              ) : profileState.status === "error" ? (
                <div className="run-chart-message">
                  <span><strong>Chart details unavailable.</strong> Retry before starting.</span>
                  <button type="button" className="btn compact" onClick={() => setProfileAttempt((value) => value + 1)}>
                    Retry details
                  </button>
                </div>
              ) : (
                <div className="run-chart-message run-chart-loading">
                  <span className="run-chart-pulse" aria-hidden />
                  <span>Reading selected chart…</span>
                </div>
              )}
            </div>
          </section>

          <div className="cta-row track-secondary-actions">
            {/* DUO · 同屏分屏对战。键盘：P1 用存档键位、P2 用不冲突的另一套；
                触屏：两个 field 各自按 x 坐标分 lane，两人各摸自己那半边。 */}
            {modeGuide.duoAvailable ? (
              <Link
                className="btn ghost"
                to={withLibraryReturn(`/duo/${track.track_id}?tier=${tier}&mode=${mode}`, libraryReturnHref)}
              >
                Duo
              </Link>
            ) : (
              <button type="button" className="btn ghost" disabled title="Practice changes speed per player and is solo only">
                Duo · Solo only
              </button>
            )}
            <button
              type="button"
              className={`btn ${fav ? "primary" : "ghost"}`}
              aria-pressed={fav}
              onClick={() => setFav(toggleFavorite(track.track_id).includes(track.track_id))}
            >
              {fav ? t.ui.favorited : t.ui.favorite}
            </button>
          </div>
          <StreamFullCTA track={track} />
        </div>
      </div>
      <aside className="track-mobile-action" aria-label="Selected run action">
        <button
          type="button"
          className="track-mobile-action-copy"
          aria-label="Change run setup"
          aria-describedby="track-mobile-selected-track track-mobile-selected-run"
          onClick={revealRunConfigurator}
        >
          <span className="track-mobile-action-title">
            <strong id="track-mobile-selected-track">{track.title}</strong>
            <span className="track-mobile-action-edit" aria-hidden>Change ↑</span>
          </span>
          <small id="track-mobile-selected-run" aria-live="polite" aria-atomic="true">
            {selectedRunSummary}
            {personalBest && <b> · PB {compactScore(personalBest.score)}</b>}
          </small>
        </button>
        <Link
          className="btn primary"
          to={withLibraryReturn(selectedRunPath, libraryReturnHref)}
          aria-label={selectedRunLabel}
        >
          {mode === "practice" ? "Practice now" : "Play now"}
        </Link>
      </aside>
    </section>
  );
}
