import { useEffect, useState } from "react";
import type { LandingContent } from "../content/landing";
import { PlaygroundSection } from "./Playground";
import type { Locale } from "../i18n";
import type { Messages } from "../i18n";
import { publicAsset } from "../lib/assets";

const NOTES = [
  "开场：本地双引擎 API，数据不出内网",
  "橱窗：无需生成即可试听",
  "现场：选预设 → 生成 → 播放",
  "收尾：集成面板复制 cURL",
];

export function PresentMode({
  locale,
  t,
  content,
  apiDocsUrl,
  deepLinkJobId,
  onExit,
}: {
  locale: Locale;
  t: Messages;
  content: LandingContent;
  apiDocsUrl: string;
  deepLinkJobId: string | null;
  onExit: () => void;
}) {
  const [slide, setSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest("input,textarea,select,[contenteditable=true]")) return;
      if (e.key === "ArrowRight") setSlide((s) => Math.min(s + 1, 3));
      if (e.key === "ArrowLeft") setSlide((s) => Math.max(s - 1, 0));
      if (e.key === "p" || e.key === "P") setShowNotes((v) => !v);
      if (e.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  return (
    <div className="present-mode" data-testid="present-mode">
      <header className="present-header">
        <img src={publicAsset("brand/logo.svg")} alt="" width={40} height={40} />
        <div className="present-dots">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={slide === i ? "active" : ""} />
          ))}
        </div>
        <p className="present-hint">{content.presentHint}</p>
      </header>
      {showNotes && <div className="present-notes glass">{NOTES[slide]}</div>}
      <PlaygroundSection
        locale={locale}
        t={t}
        demoMode
        devMode={false}
        presentMode
        deepLinkJobId={deepLinkJobId}
        apiDocsUrl={apiDocsUrl}
      />
    </div>
  );
}
