import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { LibraryPage } from "./pages/Library";
import { TrackPage } from "./pages/Track";
import { PlayPage } from "./pages/Play";
import { ResultsPage } from "./pages/Results";
import { CalibrationPage } from "./pages/Calibration";
import { SettingsPage } from "./pages/Settings";
import { LeaderboardPage } from "./pages/Leaderboard";
import { LegalPage } from "./pages/Legal";
import { Router } from "./router";

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "") || "/beatscape";
  return (
    <Layout>
      <Router
        base={base}
        routes={[
          { path: "/", element: <HomePage /> },
          { path: "/library", element: <LibraryPage /> },
          { path: "/track/:id", element: <TrackPage /> },
          { path: "/play/:id", element: <PlayPage /> },
          { path: "/results", element: <ResultsPage /> },
          { path: "/calibrate", element: <CalibrationPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/leaderboard", element: <LeaderboardPage /> },
          { path: "/privacy", element: <LegalPage kind="privacy" /> },
          { path: "/terms", element: <LegalPage kind="terms" /> },
        ]}
      />
    </Layout>
  );
}
