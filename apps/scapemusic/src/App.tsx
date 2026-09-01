import { useMemo, type ReactNode } from "react";
import { MiniPlayer } from "./components/MiniPlayer";
import { NowPlaying } from "./components/NowPlaying";
import { TabBar } from "./components/TabBar";
import { navigate, useRoute } from "./router";
import { usePlayerState } from "./player/playerContext";
import { Feed } from "./pages/Feed";
import { Favorites } from "./pages/Favorites";
import { Library } from "./pages/Library";
import { PlaylistDetail } from "./pages/PlaylistDetail";
import { Playlists } from "./pages/Playlists";
import { TrackPage } from "./pages/TrackPage";

function TopNav() {
  const route = useRoute();
  const links = useMemo(
    () =>
      [
        { hash: "#/", label: "Discover", on: route.name === "feed" },
        { hash: "#/library", label: "Library", on: route.name === "library" },
        {
          hash: "#/playlists",
          label: "Shows",
          on: route.name === "playlists" || route.name === "playlist",
        },
        { hash: "#/favorites", label: "Saved", on: route.name === "favorites" },
      ] as const,
    [route],
  );
  return (
    <nav className="topnav" aria-label="Primary">
      {links.map((l) => (
        <button
          key={l.hash}
          className={`topnav-link ${l.on ? "is-on" : ""}`}
          onClick={() => navigate(l.hash)}
          aria-current={l.on ? "page" : undefined}
        >
          {l.label}
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const route = useRoute();
  const st = usePlayerState();

  let page: ReactNode;
  switch (route.name) {
    case "feed":
      page = <Feed />;
      break;
    case "library":
      page = <Library />;
      break;
    case "playlists":
      page = <Playlists />;
      break;
    case "playlist":
      page = <PlaylistDetail id={route.id} />;
      break;
    case "track":
      page = <TrackPage id={route.id} />;
      break;
    case "favorites":
      page = <Favorites />;
      break;
    default:
      page = (
        <div className="page">
          <h1 className="page-title">Dead air</h1>
          <p className="empty">
            That frequency doesn't exist.{" "}
            <button className="ghost-btn" onClick={() => navigate("#/")}>
              Back to Discover
            </button>
          </p>
        </div>
      );
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("#/")} aria-label="Scape Music home">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">SCAPE MUSIC</span>
        </button>
        <span className="topbar-tag">The Late Static · streaming full length</span>
        <TopNav />
      </header>
      <main className="main">{page}</main>
      <MiniPlayer />
      <TabBar />
      {st.expanded && <NowPlaying />}
      <footer className="foot">
        AI Original · Owned Rights · BeatScape — 85 generated tracks, zero licensed inventory.
      </footer>
    </div>
  );
}
