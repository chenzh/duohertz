import type { ReactNode } from "react";
import { Link, useRouter } from "../router";
import { SCAPE_COPY } from "../constants/scape";
import { firstPlayHref } from "../lib/firstPlay";

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

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <div className="bg-fx" aria-hidden />
      <header className="site-header">
        <Link to="/" className="logo">
          BeatScape
        </Link>
        <nav className="site-nav">
          <NavLink to="/library">Library</NavLink>
          <NavLink to="/leaderboard">Local Board</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="header-avatar" title="Guest player" aria-hidden>
          BS
        </div>
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
          Profile
        </NavLink>
      </nav>
    </div>
  );
}
