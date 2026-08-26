import type { ReactNode } from "react";
import { Link } from "../router";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="logo">
          BeatScape
        </Link>
        <nav>
          <Link to="/library">Library</Link>
          <Link to="/leaderboard">Local Board</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <span>AI Original · Owned Rights · Generated with MusicSaas</span>
        <span className="site-footer-legal">
          <Link to="/privacy">Privacy</Link>
          <span aria-hidden="true"> · </span>
          <Link to="/terms">Terms</Link>
        </span>
      </footer>
    </div>
  );
}
