import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { LibraryPage } from "./pages/Library";
import { TrackPage } from "./pages/Track";
import { PlayPage } from "./pages/Play";
import { ResultsPage } from "./pages/Results";
import { CalibrationPage } from "./pages/Calibration";
import { SettingsPage } from "./pages/Settings";
import { LeaderboardPage } from "./pages/Leaderboard";
import { Router } from "./router";

export default function App() {
  return (
    <Layout>
      <Router
        routes={[
          { path: "/", element: <HomePage /> },
          { path: "/library", element: <LibraryPage /> },
          { path: "/track/:id", element: <TrackPage /> },
          { path: "/play/:id", element: <PlayPage /> },
          { path: "/results", element: <ResultsPage /> },
          { path: "/calibrate", element: <CalibrationPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/leaderboard", element: <LeaderboardPage /> },
        ]}
      />
    </Layout>
  );
}
