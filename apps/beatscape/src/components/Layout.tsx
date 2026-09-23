import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouter } from "../router";
import { SCAPE_COPY } from "../constants/scape";
import { homeEntry, homeMobileAction } from "../lib/homeEntry";
import { challengeReplayHref } from "../lib/challenge";
import { dailyReplayHref } from "../lib/dailyChallenge";
import { shiftReceiptFor } from "../lib/firstShift";
import { safeLibraryReturn, withLibraryReturn } from "../lib/libraryReturn";
import { loadRuns } from "../lib/progress";
import { resultReplayHref } from "../lib/resultReplay";
import { buildRunCoach } from "../lib/runCoach";
import { readLastRun } from "../storage/session";
import {
  DISPLAY_NAME_CHANGE_EVENT,
  DISPLAY_NAME_STORAGE_KEY,
  loadDisplayName,
} from "../storage/settings";
import { NetworkStatusNotice } from "./NetworkStatusNotice";
import { useCatalog } from "../catalog/useCatalog";
import { SiteGamepadNavigation } from "./SiteGamepadNavigation";

const APP_VERSION = "0.1.0";

type MobileNavIconName = "home" | "library" | "play" | "replay" | "coach" | "board" | "settings";

/** Deterministic icon set: system text glyphs vary too much across mobile OSes. */
function MobileNavIcon({ name }: { name: MobileNavIconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg
      className="tab-icon-svg"
      data-icon={name}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {name === "home" && (
        <>
          <path d="M3.5 10.5 12 3l8.5 7.5" {...common} />
          <path d="M5.5 9.2V21h13V9.2M9.5 21v-6h5v6" {...common} />
        </>
      )}
      {name === "library" && (
        <>
          <path d="M9 17V5l10-2v12" {...common} />
          <path d="M9 8l10-2" {...common} />
          <circle cx="6" cy="17" r="3" {...common} />
          <circle cx="16" cy="15" r="3" {...common} />
        </>
      )}
      {name === "play" && <path d="M8 5.5 19 12 8 18.5Z" fill="currentColor" />}
      {name === "replay" && (
        <>
          <path d="M4 4v6h6" {...common} />
          <path d="M5 9a8 8 0 1 1 1.7 8.3" {...common} />
        </>
      )}
      {name === "coach" && (
        <>
          <circle cx="12" cy="12" r="7" {...common} />
          <circle cx="12" cy="12" r="2" {...common} />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" {...common} />
        </>
      )}
      {name === "board" && (
        <>
          <path d="M3 21h18" {...common} />
          <path d="M4.5 21v-6h5v6M9.5 21V8h5v13M14.5 21v-9h5v9" {...common} />
        </>
      )}
      {name === "settings" && (
        <>
          <path d="M4 6h16M4 12h16M4 18h16" {...common} />
          <circle cx="9" cy="6" r="2" {...common} fill="var(--bg)" />
          <circle cx="15" cy="12" r="2" {...common} fill="var(--bg)" />
          <circle cx="7" cy="18" r="2" {...common} fill="var(--bg)" />
        </>
      )}
    </svg>
  );
}

function NavLink({
  to,
  children,
  className = "",
  ariaLabel,
  activeOn = [],
}: {
  to: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** Related subflows that should preserve this primary navigation location. */
  activeOn?: string[];
}) {
  const { path } = useRouter();
  const matchesPath = (candidate: string) => (
    candidate === "/" ? path === "/" : path === candidate || path.startsWith(`${candidate}/`)
  );
  const active = matchesPath(to) || activeOn.some(matchesPath);
  return (
    <Link
      to={to}
      className={`${className}${active ? " active" : ""}`.trim()}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

function playerInitials(displayName: string): string {
  const name = displayName.trim();
  if (!name) return "BS";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function titleCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function compactCoachActionLabel(label: string): string {
  if (label === "Review missed sections") return "Review";
  if (label === "Calibrate timing") return "Calibrate";
  if (label.startsWith("Play ") && label.endsWith(" Arcade")) return "Arcade";
  if (label.startsWith("Try ")) return label.slice(4);
  return label;
}

export function Layout({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState(loadDisplayName);
  useEffect(() => {
    const syncDisplayName = () => setDisplayName(loadDisplayName());
    const syncStoredDisplayName = (event: StorageEvent) => {
      if (event.key === DISPLAY_NAME_STORAGE_KEY || event.key === null) syncDisplayName();
    };

    window.addEventListener(DISPLAY_NAME_CHANGE_EVENT, syncDisplayName);
    window.addEventListener("storage", syncStoredDisplayName);
    return () => {
      window.removeEventListener(DISPLAY_NAME_CHANGE_EVENT, syncDisplayName);
      window.removeEventListener("storage", syncStoredDisplayName);
    };
  }, []);
  const initials = playerInitials(displayName);
  const { path, search } = useRouter();
  const { tracks } = useCatalog();
  const resultsParams = new URLSearchParams(search);
  const resultsRun = path === "/results"
    ? readLastRun(resultsParams.get("run") === "local")
    : null;
  const resultsLibraryReturnHref = safeLibraryReturn(resultsParams.get("returnTo"));
  const dailyRetryHref = resultsRun ? dailyReplayHref(resultsRun) : null;
  const challengeRetryHref = !dailyRetryHref && resultsRun?.challenge ? challengeReplayHref(resultsRun) : null;
  const shiftNeedsRetry = Boolean(resultsRun?.shiftStep && !shiftReceiptFor(resultsRun));
  const exactResultsReplayHref = resultsRun && (!resultsRun.shiftStep || shiftNeedsRetry)
    ? resultReplayHref(resultsRun, resultsLibraryReturnHref)
    : null;
  const resultsReplayLabel = resultsRun?.seekedFrom !== undefined
    ? resultsRun.practiceRepetitions ? "Drill again" : "Practice again"
    : resultsRun?.failed
      ? "Retry Arcade"
      : "Replay";
  // Daily, shared challenges and First Shift own their explicit mobile action.
  // For an ordinary result, reuse the same pure coaching decision as the page
  // instead of letting the easiest thumb target contradict its Next move card.
  const resultsCoach = resultsRun && exactResultsReplayHref && !dailyRetryHref &&
      !challengeRetryHref && !resultsRun.shiftStep
    ? buildRunCoach(resultsRun, {
        recentRuns: loadRuns(),
        replayHref: exactResultsReplayHref,
        replayLabel: resultsReplayLabel,
      })
    : null;
  const resultsCoachHref = resultsCoach?.action.kind === "link"
    ? resultsCoach.action.href.startsWith("/play/")
      ? withLibraryReturn(resultsCoach.action.href, resultsLibraryReturnHref)
      : resultsCoach.action.href
    : null;
  const resultsCoachOverridesReplay = Boolean(resultsCoach && (
    resultsCoach.action.kind === "review" ||
    resultsCoachHref !== exactResultsReplayHref ||
    resultsCoach.action.label !== resultsReplayLabel
  ));
  const resultsCoachVisibleLabel = !resultsCoachOverridesReplay || !resultsCoach
    ? null
    : compactCoachActionLabel(resultsCoach.action.label);
  const resultsCoachAriaLabel = resultsCoachOverridesReplay && resultsCoach && resultsRun
    ? `${resultsCoach.action.label} for ${resultsRun.title}`
    : null;
  const resultsCoachIcon: MobileNavIconName = resultsCoach?.action.kind === "review" ||
      resultsCoach?.action.label === "Calibrate timing"
    ? "coach"
    : "play";
  const mobileReviewAction = resultsCoachOverridesReplay && resultsCoach?.action.kind === "review";
  const resolvedHomeEntry = homeEntry(tracks);
  const resolvedHomeAction = homeMobileAction(resolvedHomeEntry);
  const primaryPlayHref = resultsCoachOverridesReplay && resultsCoachHref
    ? resultsCoachHref
    : exactResultsReplayHref ?? resolvedHomeEntry.href;
  const primaryPlayLabel = dailyRetryHref
    ? resultsRun?.failed ? "Retry" : "Improve"
    : challengeRetryHref
      ? "Retry"
      : resultsCoachVisibleLabel
        ? resultsCoachVisibleLabel
        : exactResultsReplayHref
          ? shiftNeedsRetry
            ? "Retry"
            : resultsRun?.seekedFrom !== undefined
              ? resultsRun.practiceRepetitions ? "Drill" : "Practice"
              : resultsRun?.failed
                ? "Retry"
                : "Replay"
          : resolvedHomeAction.label;
  const primaryPlayAriaLabel = dailyRetryHref
    ? resultsRun?.failed ? "Retry today's Daily challenge" : "Improve today's Daily score"
    : challengeRetryHref
      ? `Retry challenge target ${resultsRun!.challenge!.score.toLocaleString("en-US")}`
      : resultsCoachAriaLabel
        ? resultsCoachAriaLabel
        : exactResultsReplayHref && resultsRun
          ? shiftNeedsRetry
            ? `Retry ${resultsRun.title} · First Shift`
            : resultsRun.seekedFrom !== undefined
              ? `${resultsRun.practiceRepetitions ? "Drill" : "Practice"} ${resultsRun.title} again`
              : `${resultsRun.failed ? "Retry" : "Replay"} ${resultsRun.title} on ${titleCase(resultsRun.tier)} ${titleCase(resultsRun.mode)}`
          : resolvedHomeAction.ariaLabel;
  const primaryPlayIcon: MobileNavIconName = resultsCoachOverridesReplay
    ? resultsCoachIcon
    : dailyRetryHref || challengeRetryHref || exactResultsReplayHref
      ? "replay"
      : resolvedHomeAction.replayIcon
        ? "replay"
        : "play";
  const routeTrack = path === "/track" || path.startsWith("/track/");
  // 路由切换时重挂载 <main>，重放 .site-main 的进场动画（D 档）。
  // 对局页跳过：canvas 游戏要的是即时，0.26s 淡入会被读成卡顿。
  // DUO（/duo/:id）同样是对局页，一并跳过。
  const routePlain =
    path === "/play" ||
    path.startsWith("/play/") ||
    path === "/duo" ||
    path.startsWith("/duo/");
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" data-gamepad-ignore>
        Skip to main content
      </a>
      <div className="bg-fx" aria-hidden />
      <header className="site-header">
        <Link to="/" className="logo">
          <span className="logo-mark" aria-hidden>
            {/* Resonance motif: concentric diamonds, outlined outer + solid core (PRD §7.6). */}
            <svg viewBox="0 0 24 24" width="17" height="17" focusable="false">
              <polygon
                points="12,2 22,12 12,22 2,12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              />
              <polygon points="12,8.5 15.5,12 12,15.5 8.5,12" fill="currentColor" />
            </svg>
          </span>
          BeatScape
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <NavLink to="/library" activeOn={["/track"]}>Library</NavLink>
          <NavLink to="/characters">Characters</NavLink>
          <NavLink to="/radio">Radio</NavLink>
          <NavLink to="/leaderboard">Local Board</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <NavLink to="/settings" activeOn={["/calibrate"]}>Settings</NavLink>
        </nav>
        <Link
          to="/profile"
          className="header-avatar"
          title={`${displayName} profile`}
          aria-label={`${displayName} profile`}
        >
          <span className="header-avatar-visual" aria-hidden>{initials}</span>
        </Link>
      </header>
      <NetworkStatusNotice />
      <SiteGamepadNavigation />
      <main
        id="main-content"
        className={routePlain ? "site-main route-plain" : "site-main"}
        key={path}
        tabIndex={-1}
      >
        {children}
      </main>
      <footer className="site-footer">
        BeatScape · {SCAPE_COPY.rightsShort} · v{APP_VERSION}
      </footer>

      <nav className={`mobile-tabbar${routeTrack ? " mobile-tabbar-track" : ""}`} aria-label="Primary">
        <NavLink to="/" className="tab-item">
          <span className="tab-icon" aria-hidden>
            <MobileNavIcon name="home" />
          </span>
          Home
        </NavLink>
        <NavLink to="/library" className="tab-item">
          <span className="tab-icon" aria-hidden>
            <MobileNavIcon name="library" />
          </span>
          Library
        </NavLink>
        {mobileReviewAction ? (
          <button
            type="button"
            className="tab-item tab-play"
            aria-label={primaryPlayAriaLabel}
            onClick={() => document.getElementById("result-coach-action")?.click()}
          >
            <span className="tab-icon tab-icon-play" aria-hidden>
              <MobileNavIcon name={primaryPlayIcon} />
            </span>
            {primaryPlayLabel}
          </button>
        ) : (
          <NavLink
            to={primaryPlayHref}
            className="tab-item tab-play"
            ariaLabel={primaryPlayAriaLabel}
          >
            <span className="tab-icon tab-icon-play" aria-hidden>
              <MobileNavIcon name={primaryPlayIcon} />
            </span>
            {primaryPlayLabel}
          </NavLink>
        )}
        <NavLink to="/leaderboard" className="tab-item">
          <span className="tab-icon" aria-hidden>
            <MobileNavIcon name="board" />
          </span>
          Board
        </NavLink>
        <NavLink to="/settings" className="tab-item" activeOn={["/calibrate"]}>
          <span className="tab-icon" aria-hidden>
            <MobileNavIcon name="settings" />
          </span>
          Settings
        </NavLink>
      </nav>
    </div>
  );
}
