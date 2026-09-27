import type { ReactNode } from "react";
import { NetworkStatusNotice } from "../components/NetworkStatusNotice";
import { Link, useRouter } from "../router";
import "./shell.css";
import "./v2-shell.css";

const LAB_HOME = "/lab/duohertz/v2/home";
const LAB_LIBRARY = "/lab/duohertz/v2/library";
const LAB_RADIO = "/lab/duohertz/v2/radio";
const LAB_CHARACTERS = "/lab/duohertz/v2/characters";
const LAB_PLAY = "/lab/duohertz/v2/play";

function V2NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return <Link to={to} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>{label}</Link>;
}

/** Separate catalog source, with BeatScape's familiar page and navigation hierarchy. */
export function DuohertzV2Shell({ children, homeHref = LAB_HOME, libraryHref = LAB_LIBRARY,
  radioHref = LAB_RADIO, charactersHref = LAB_CHARACTERS, playPath = LAB_PLAY, preview = true }: {
  children: ReactNode;
  homeHref?: string;
  libraryHref?: string;
  radioHref?: string;
  charactersHref?: string;
  playPath?: string;
  preview?: boolean;
}) {
  const { path } = useRouter();
  const home = path === homeHref;
  const radio = path === radioHref;
  const characters = path === charactersHref;
  const library = path === libraryHref;
  const play = path.startsWith(`${playPath}/`);
  return <div className="app-shell dh-app-shell dh-v2-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <div className="bg-fx" aria-hidden="true" />
    <header className="site-header">
      <Link to={homeHref} className="logo" aria-label="duohertz home">
        <span className="logo-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3 12h4l2-4 4 8 2-4h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg></span>
        duohertz <span className="dh-logo-tag">electronic rhythm game</span>
      </Link>
      {preview && <div className="dh-v2-preview-note" role="note" aria-label="Preview status">
        <strong>Internal preview</strong><span>not released</span>
      </div>}
      <nav className="site-nav" aria-label="duohertz navigation">
        <V2NavLink to={libraryHref} label="Library" active={library} />
        <V2NavLink to={charactersHref} label="Characters" active={characters} />
        <V2NavLink to={radioHref} label="Radio" active={radio} />
      </nav>
    </header>
    <NetworkStatusNotice />
    <main id="main-content" className={play ? "site-main route-plain" : "site-main"}
      key={path} tabIndex={-1}>{children}</main>
    <footer className="site-footer">duohertz · electronic rhythm game{preview && " · Internal v2 route preview"}</footer>
    <nav className="mobile-tabbar" aria-label="duohertz mobile navigation">
      <Link to={homeHref} className={home ? "tab-item active" : "tab-item"} aria-current={home ? "page" : undefined}>Home</Link>
      <Link to={libraryHref} className={library ? "tab-item active" : "tab-item"} aria-current={library ? "page" : undefined}>Library</Link>
      <Link to={`${playPath}/dh-001-first-frequency`} className={play ? "tab-item tab-play active" : "tab-item tab-play"}
        aria-current={play ? "page" : undefined}>Play</Link>
      <Link to={radioHref} className={radio ? "tab-item active" : "tab-item"} aria-current={radio ? "page" : undefined}>Station</Link>
      <Link to={charactersHref} className={characters ? "tab-item active" : "tab-item"} aria-current={characters ? "page" : undefined}>People</Link>
    </nav>
  </div>;
}
