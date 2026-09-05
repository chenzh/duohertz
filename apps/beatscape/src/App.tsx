import { Suspense, lazy } from "react";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomePage } from "./pages/Home";
import { LibraryPage } from "./pages/Library";
import { PlayPage } from "./pages/Play";
import { ResultsPage } from "./pages/Results";
import { Router } from "./router";

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
const DuoPage = lazy(() => import("./pages/Duo").then((m) => ({ default: m.DuoPage })));
const CharactersPage = lazy(() => import("./pages/Characters").then((m) => ({ default: m.CharactersPage })));
const RadioPage = lazy(() => import("./pages/Radio").then((m) => ({ default: m.RadioPage })));
const FirstShiftPage = lazy(() => import("./pages/FirstShift").then((m) => ({ default: m.FirstShiftPage })));
const TrackPage = lazy(() => import("./pages/Track").then((m) => ({ default: m.TrackPage })));
const CalibrationPage = lazy(() => import("./pages/Calibration").then((m) => ({ default: m.CalibrationPage })));
const SettingsPage = lazy(() => import("./pages/Settings").then((m) => ({ default: m.SettingsPage })));
const LeaderboardPage = lazy(() => import("./pages/Leaderboard").then((m) => ({ default: m.LeaderboardPage })));
const ProfilePage = lazy(() => import("./pages/Profile").then((m) => ({ default: m.ProfilePage })));
const LegalPage = lazy(() => import("./pages/Legal").then((m) => ({ default: m.LegalPage })));
const NotFoundPage = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFoundPage })));

/** Suspense fallback — 与 Play 页的加载态保持同一套视觉语言。 */
function RouteFallback() {
  return (
    <div className="loading-state">
      <div className="loading-spinner" aria-hidden />
      <p>Loading…</p>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Router
          layout={(child) => <Layout>{child}</Layout>}
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
          ]}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
