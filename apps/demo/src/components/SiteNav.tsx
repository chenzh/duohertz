import type { Locale } from "../i18n";
import type { LandingContent } from "../content/landing";
import { scrollToSection } from "../hooks/useUrlModes";
import { publicAsset } from "../lib/assets";

type Health = { gateway: string; ace: string; sa3: string };

export function SiteNav({
  content,
  locale,
  setLocale,
  health,
  apiDocsUrl,
  minimal,
}: {
  content: LandingContent;
  locale: Locale;
  setLocale: (l: Locale) => void;
  health: Health;
  apiDocsUrl: string;
  minimal?: boolean;
}) {
  if (minimal) return null;

  return (
    <nav className="site-nav" data-testid="site-nav">
      <a href={publicAsset("")} className="nav-brand">
        <img src={publicAsset("brand/logo.svg")} alt="MusicSaas" width={36} height={36} />
        <span>MusicSaas</span>
      </a>
      <div className="nav-links">
        <button type="button" onClick={() => scrollToSection("product")}>
          {content.navProduct}
        </button>
        <button type="button" onClick={() => scrollToSection("showcase")}>
          {content.navShowcase}
        </button>
        <button type="button" onClick={() => scrollToSection("playground")}>
          {content.navPlayground}
        </button>
        <button type="button" onClick={() => scrollToSection("pricing")}>
          {content.navPricing}
        </button>
        <a href={apiDocsUrl} target="_blank" rel="noreferrer">
          {content.navDocs}
        </a>
      </div>
      <div className="nav-actions">
        <div className="health health-compact">
          <span className={health.gateway === "ok" ? "dot-ok" : "dot-down"}>●</span>
          <span className={health.ace === "ok" ? "dot-ok" : "dot-down"}>●</span>
          <span className={health.sa3 === "ok" ? "dot-ok" : "dot-down"}>●</span>
        </div>
        <select
          className="locale-select"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          aria-label="language"
        >
          <option value="zh">中文</option>
          <option value="en">EN</option>
        </select>
        <button type="button" className="btn-primary nav-cta" onClick={() => scrollToSection("playground")}>
          {content.ctaTry}
        </button>
      </div>
    </nav>
  );
}
