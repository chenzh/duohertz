import { Suspense, lazy, useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomePage } from "./pages/Home";
import { LibraryPage } from "./pages/Library";
import { PlayPage } from "./pages/Play";
import { ResultsPage } from "./pages/Results";
import { Router } from "./router";
import { lazyRouteLoaders } from "./routePreload";

/**
 * 路由级代码分割。
 *
 * 改造前所有页面都是静态 import，13 个路由全塞进一个 chunk：玩家只想打一局，
 * 却要先把 Calibration / Legal / Radio 的代码一起下下来。
 *
 * 保留 eager 的是核心链路（首页 → 曲库 → 对局 → 结算）：这些页面之间的跳转必须
 * 是瞬时的，尤其结算页 —— 打完一局还要等一个 chunk 下载，体验上是不可接受的。
 * 其余页面按需加载，首屏 JS 因此少掉大半。
 */
const DuoPage = lazy(lazyRouteLoaders.duo);
const CharactersPage = lazy(lazyRouteLoaders.characters);
const RadioPage = lazy(lazyRouteLoaders.radio);
const FirstShiftPage = lazy(lazyRouteLoaders.shift);
const TrackPage = lazy(lazyRouteLoaders.track);
const CalibrationPage = lazy(lazyRouteLoaders.calibrate);
const SettingsPage = lazy(lazyRouteLoaders.settings);
const LeaderboardPage = lazy(lazyRouteLoaders.leaderboard);
const ProfilePage = lazy(lazyRouteLoaders.profile);
const LegalPage = lazy(lazyRouteLoaders.legal);
const NotFoundPage = lazy(lazyRouteLoaders.notFound);
const DuohertzLabPage = import.meta.env.DEV
  ? lazy(() => import("./duohertz/Lab").then((module) => ({ default: module.DuohertzLabPage })))
  : null;
const DuohertzHubPage = import.meta.env.DEV
  ? lazy(() => import("./duohertz/Hub").then((module) => ({ default: module.DuohertzHubPage })))
  : null;
const DuohertzRadioLabPage = import.meta.env.DEV
  ? lazy(() => import("./duohertz/RadioLab").then((module) => ({ default: module.DuohertzRadioLabPage })))
  : null;
const DuohertzCandidateLibraryPage = import.meta.env.DEV
  ? lazy(() => import("./duohertz/CandidateLibrary").then((module) => ({ default: module.DuohertzCandidateLibrary })))
  : null;
const DuohertzCandidateCharactersPage = import.meta.env.DEV
  ? lazy(() => import("./duohertz/CandidateCharacters").then((module) => ({ default: module.DuohertzCandidateCharacters })))
  : null;
const DuohertzApprovedLibraryPage = import.meta.env.DEV
  ? lazy(() => import("./duohertz/ApprovedLibrary").then((module) => ({ default: module.DuohertzApprovedLibrary })))
  : null;
const DuohertzApprovedPlayPage = import.meta.env.DEV
  ? lazy(() => import("./duohertz/ApprovedPlay").then((module) => ({ default: module.DuohertzApprovedPlay })))
  : null;
const DuohertzApprovedRadioPage = import.meta.env.DEV
  ? lazy(() => import("./duohertz/ApprovedRadio").then((module) => ({ default: module.DuohertzApprovedRadio })))
  : null;
const DuohertzApprovedCharactersPage = import.meta.env.DEV
  ? lazy(() => import("./duohertz/ApprovedCharacters").then((module) => ({ default: module.DuohertzApprovedCharacters })))
  : null;
const DuohertzApprovedHomePage = import.meta.env.DEV
  ? lazy(() => import("./duohertz/ApprovedHome").then((module) => ({ default: module.DuohertzApprovedHome })))
  : null;
const DuohertzV2Shell = import.meta.env.DEV
  ? lazy(() => import("./duohertz/V2Shell").then((module) => ({ default: module.DuohertzV2Shell })))
  : null;
// v2 DEV routes use their own shell and artifact URL; the old Layout and
// public/catalog.json remain for BeatScape and the candidate-only lab.
const DUOHERTZ_APPROVED_CATALOG_URL = `${import.meta.env.BASE_URL}duohertz-v2/catalog.json`;
const DUOHERTZ_APPROVED_CHARACTERS_URL = `${import.meta.env.BASE_URL}duohertz-v2/characters.json`;
const DUOHERTZ_V2_HOME_HREF = "/lab/duohertz/v2/home";
const DUOHERTZ_V2_LIBRARY_HREF = "/lab/duohertz/v2/library";
const DUOHERTZ_V2_RADIO_HREF = "/lab/duohertz/v2/radio";
const duohertzV2PlayHref = (id: string) => `/lab/duohertz/v2/play/${encodeURIComponent(id)}`;

const SLOW_ROUTE_NOTICE_MS = 3_000;

/** Suspense fallback — 快速加载保持安静；慢连接提供可退出但不打断的恢复路径。 */
function RouteFallback({ duohertz = false }: { duohertz?: boolean }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_ROUTE_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (slow) {
    return (
      <section className="dh-state-screen error-screen route-wait-screen" role="status" aria-live="polite" aria-busy="true">
        <div className="dh-state-orb" aria-hidden />
        <span className="dh-eyebrow">{duohertz ? "duohertz" : "The Late Static"}</span>
        <h1>Still connecting</h1>
        <p>
          This screen is taking longer than expected. {duohertz ? "duohertz" : "BeatScape"} is still trying to connect.
        </p>
        <div className="dh-row-center" style={{ gap: 12, marginTop: 8 }}>
          <button type="button" className="dh-btn dh-btn--primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <a className="dh-btn dh-btn--ghost" href={duohertz ? `${import.meta.env.BASE_URL}lab/duohertz/v2/home` : import.meta.env.BASE_URL}>
            Back to home
          </a>
        </div>
      </section>
    );
  }

  return (
    <div className="dh-state-screen loading-state route-loading-state" role="status" aria-live="polite" aria-busy="true">
      <span className="dh-eyebrow">{duohertz ? "duohertz · SYSTEM LOGS" : "The Late Static"}</span>
      <div className="dh-state-orb" aria-hidden />
      <h1>{duohertz ? "duohertz" : "BeatScape"}</h1>
      <p style={{ margin: 0 }}>正在同步核心频率…</p>
      <div className="dh-loading-progress" aria-hidden>
        <div className="dh-loading-progress-track">
          <div className="dh-loading-progress-fill" style={{ ["--dh-load-pct" as string]: "13%" }} />
        </div>
        <div className="dh-loading-progress-meta">
          <span>频率 44.1KHZ</span>
          <span>13%</span>
        </div>
      </div>
      <div className="dh-loading-dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router
        layout={(child, path) => DuohertzV2Shell && path.startsWith("/lab/duohertz/v2/")
          ? <Suspense fallback={<RouteFallback duohertz />}><DuohertzV2Shell>{child}</DuohertzV2Shell></Suspense>
          : <Layout><Suspense fallback={<RouteFallback />}>{child}</Suspense></Layout>}
        fallback={<NotFoundPage />}
        routes={[
          { path: "/", element: <HomePage /> },
          { path: "/library", element: <LibraryPage /> },
          { path: "/characters", element: <CharactersPage /> },
          { path: "/radio", element: <RadioPage /> },
          { path: "/shift", element: <FirstShiftPage /> },
          { path: "/track/:id", element: <TrackPage /> },
          { path: "/play/:id", element: <PlayPage /> },
          { path: "/duo/:id", element: <DuoPage /> },
          { path: "/results", element: <ResultsPage /> },
          { path: "/calibrate", element: <CalibrationPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/leaderboard", element: <LeaderboardPage /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "/privacy", element: <LegalPage kind="privacy" /> },
          { path: "/terms", element: <LegalPage kind="terms" /> },
          ...(DuohertzLabPage ? [{ path: "/lab/duohertz", element: <DuohertzLabPage /> }] : []),
          ...(DuohertzHubPage ? [{ path: "/lab/duohertz/home", element: <DuohertzHubPage /> }] : []),
          ...(DuohertzCandidateLibraryPage ? [{ path: "/lab/duohertz/library", element: <DuohertzCandidateLibraryPage /> }] : []),
          ...(DuohertzCandidateCharactersPage ? [{ path: "/lab/duohertz/characters", element: <DuohertzCandidateCharactersPage /> }] : []),
          ...(DuohertzRadioLabPage ? [{ path: "/lab/duohertz/radio", element: <DuohertzRadioLabPage /> }] : []),
          ...(DuohertzApprovedHomePage ? [{ path: DUOHERTZ_V2_HOME_HREF,
            element: <DuohertzApprovedHomePage catalogUrl={DUOHERTZ_APPROVED_CATALOG_URL}
              libraryHref={DUOHERTZ_V2_LIBRARY_HREF} radioHref={DUOHERTZ_V2_RADIO_HREF}
              charactersHref="/lab/duohertz/v2/characters" playHref={duohertzV2PlayHref} /> }] : []),
          ...(DuohertzApprovedLibraryPage ? [{ path: DUOHERTZ_V2_LIBRARY_HREF,
            element: <DuohertzApprovedLibraryPage catalogUrl={DUOHERTZ_APPROVED_CATALOG_URL}
              playHref={duohertzV2PlayHref} radioHref={DUOHERTZ_V2_RADIO_HREF} /> }] : []),
          ...(DuohertzApprovedPlayPage ? [{ path: "/lab/duohertz/v2/play/:id",
            element: <DuohertzApprovedPlayPage catalogUrl={DUOHERTZ_APPROVED_CATALOG_URL}
              libraryHref={DUOHERTZ_V2_LIBRARY_HREF} radioHref={DUOHERTZ_V2_RADIO_HREF} /> }] : []),
          ...(DuohertzApprovedRadioPage ? [{ path: "/lab/duohertz/v2/radio",
            element: <DuohertzApprovedRadioPage catalogUrl={DUOHERTZ_APPROVED_CATALOG_URL}
              gameHref={DUOHERTZ_V2_LIBRARY_HREF} playHref={duohertzV2PlayHref} /> }] : []),
          ...(DuohertzApprovedCharactersPage ? [{ path: "/lab/duohertz/v2/characters",
            element: <DuohertzApprovedCharactersPage catalogUrl={DUOHERTZ_APPROVED_CATALOG_URL}
              charactersUrl={DUOHERTZ_APPROVED_CHARACTERS_URL} /> }] : []),
        ]}
      />
    </ErrorBoundary>
  );
}
