import { useEffect, useState } from "react";
import { fetchDemoMeta, type DemoMeta } from "./api";
import { OnboardingCoach } from "./components/OnboardingCoach";
import { SiteNav } from "./components/SiteNav";
import { useLandingContent } from "./content/landing";
import { useInferenceHealth } from "./hooks/useInferenceHealth";
import { scrollToSection, useUrlModes } from "./hooks/useUrlModes";
import { type Locale, useMessages } from "./i18n";
import { LandingSection, ShowcaseSection } from "./sections/Landing";
import { PlaygroundSection } from "./sections/Playground";
import { PresentMode } from "./sections/PresentMode";
import { ConvertSection, TrustSection } from "./sections/Trust";
import { readStoredLocale, writeStorage } from "./lib/storage";
import { publicAsset } from "./lib/assets";

export function App() {
  const modes = useUrlModes();
  const [locale, setLocale] = useState<Locale>(
    () => readStoredLocale(),
  );
  const t = useMessages(locale);
  const content = useLandingContent(locale);
  const health = useInferenceHealth();

  const [demoUrl, setDemoUrl] = useState(() => window.location.origin + publicAsset(""));
  const [apiDocsUrl, setApiDocsUrl] = useState(
    "https://github.com/chenzh/MusicSaas/blob/main/docs/DATA_API.md",
  );
  const [meta, setMeta] = useState<DemoMeta | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    writeStorage("demo_locale", locale);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  useEffect(() => {
    void fetchDemoMeta()
      .then((m) => {
        setMeta(m);
        setDemoUrl(m.demo_url);
        if (m.api_docs_url) setApiDocsUrl(m.api_docs_url);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (modes.playgroundOnly) {
      scrollToSection("playground");
    }
  }, [modes.playgroundOnly]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "?") setHelpOpen((v) => !v);
      if (e.key === "g" || e.key === "G") scrollToSection("playground");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (modes.presentMode) {
    return (
      <PresentMode
        locale={locale}
        t={t}
        content={content}
        apiDocsUrl={apiDocsUrl}
        deepLinkJobId={modes.deepLinkJobId}
        onExit={() => {
          const u = new URL(window.location.href);
          u.searchParams.delete("present");
          window.location.href = u.toString();
        }}
      />
    );
  }

  return (
    <div className="app-v3">
      <SiteNav
        content={content}
        locale={locale}
        setLocale={setLocale}
        health={health}
        apiDocsUrl={apiDocsUrl}
        minimal={modes.playgroundOnly}
      />

      <OnboardingCoach content={content} locale={locale} />

      {!modes.playgroundOnly && (
        <>
          <LandingSection content={content} locale={locale} />
          <ShowcaseSection content={content} locale={locale} />
          <TrustSection content={content} />
        </>
      )}

      <PlaygroundSection
        locale={locale}
        t={t}
        demoMode={modes.demoMode}
        devMode={modes.devMode}
        presentMode={false}
        deepLinkJobId={modes.deepLinkJobId}
        apiDocsUrl={apiDocsUrl}
      />

      {!modes.playgroundOnly && (
        <ConvertSection content={content} apiDocsUrl={apiDocsUrl} benchmark={meta?.benchmark} />
      )}

      {helpOpen && (
        <div className="help-overlay glass" role="dialog">
          <p>{t.keyboardHelp}</p>
          <button type="button" className="btn-secondary" onClick={() => setHelpOpen(false)}>
            OK
          </button>
        </div>
      )}

      <footer className="site-footer">
        <p>{t.footerCompliance}</p>
        <p>
          {t.footerAce} · {t.footerSa3}
        </p>
        <p>
          {t.demoUrl}: <a href={demoUrl}>{demoUrl}</a>
        </p>
        <p className="hint">v{meta?.version ?? "0.3.0"} · ? {t.keyboardHelp}</p>
      </footer>
    </div>
  );
}
