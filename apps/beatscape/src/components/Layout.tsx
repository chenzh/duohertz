import type { ReactNode } from "react";
import { Link, useRouter } from "../router";
import { SCAPE_COPY } from "../constants/scape";
import { firstPlayHref } from "../lib/firstPlay";
import { loadDisplayName } from "../storage/settings";

const APP_VERSION = "0.1.0";

function NavLink({ to, children, className = "" }: { to: string; children: ReactNode; className?: string }) {
  const { path } = useRouter();
  const active = to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`);
  return (
    <Link to={to} className={`${className}${active ? " active" : ""}`.trim()}>
      {children}
    </Link>
  );
}

function playerInitials(): string {
  const name = loadDisplayName().trim();
  if (!name) return "BS";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Layout({ children }: { children: ReactNode }) {
  const initials = playerInitials();
  return (
    <div className="app-shell">
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
        <nav className="site-nav">
          <NavLink to="/library">Library</NavLink>
          <NavLink to="/characters">Characters</NavLink>
          <NavLink to="/radio">Radio</NavLink>
          <NavLink to="/leaderboard">Local Board</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <Link
          to="/profile"
          className="header-avatar"
          title={loadDisplayName()}
          aria-label={`Player ${loadDisplayName()} — Profile`}
        >
          {initials}
        </Link>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        BeatScape · {SCAPE_COPY.rightsShort} · v{APP_VERSION}
      </footer>

      <nav className="mobile-tabbar" aria-label="Primary">
        <NavLink to="/" className="tab-item">
          <span className="tab-icon" aria-hidden>
            ⌂
          </span>
          Home
        </NavLink>
        <NavLink to="/library" className="tab-item">
          <span className="tab-icon" aria-hidden>
            ♫
          </span>
          Library
        </NavLink>
        <NavLink to={firstPlayHref()} className="tab-item tab-play">
          <span className="tab-icon tab-icon-play" aria-hidden>
            ▶
          </span>
          Play
        </NavLink>
        <NavLink to="/leaderboard" className="tab-item">
          <span className="tab-icon" aria-hidden>
            ★
          </span>
          Board
        </NavLink>
        <NavLink to="/settings" className="tab-item">
          <span className="tab-icon" aria-hidden>
            ⚙
          </span>
          Settings
        </NavLink>
      </nav>
    </div>
  );
}
