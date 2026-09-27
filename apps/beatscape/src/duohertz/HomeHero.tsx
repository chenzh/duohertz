import { useState } from "react";
import { Link } from "../router";
import {
  DUOHERTZ_SEASON,
  DUOHERTZ_HERO_KICKER,
  DUOHERTZ_HOME_TITLE,
  DUOHERTZ_HOME_SUBTITLE,
  DUOHERTZ_CTA_PLAY,
  DUOHERTZ_CTA_LIBRARY,
  DUOHERTZ_HERO_HINT,
  DUOHERTZ_BRAND_LINE,
} from "./brand";

/** A small, silent input preview in the same right-hand slot as BeatScape's hero game. */
export function DuohertzHomeHero({ playHref, libraryHref, preview = false, artUrl, artAlt = "" }: {
  playHref: string;
  libraryHref: string;
  preview?: boolean;
  artUrl?: string;
  artAlt?: string;
}) {
  const [pulse, setPulse] = useState<"first" | "reply" | null>(null);
  const [taps, setTaps] = useState(0);
  const tap = (key: "first" | "reply") => {
    setPulse(key);
    setTaps((count) => count + 1);
  };
  return <header className="dh-hero">
    <div className="dh-hero__copy">
      <p className="dh-hero__kicker">{DUOHERTZ_HERO_KICKER}</p>
      <p className="dh-hero__season">{DUOHERTZ_SEASON}</p>
      <h1 className="dh-hero__title">{DUOHERTZ_HOME_TITLE}</h1>
      <p className="dh-hero__slogan">{DUOHERTZ_HOME_SUBTITLE}</p>
      <div className="dh-hero__entry">
        <Link to={playHref} className="dh-btn dh-btn--primary">{DUOHERTZ_CTA_PLAY} <span aria-hidden="true">↗</span></Link>
        <Link to={libraryHref} className="dh-btn dh-btn--ghost">{DUOHERTZ_CTA_LIBRARY} <span aria-hidden="true">↗</span></Link>
      </div>
      <p className="dh-hero__hint">{DUOHERTZ_HERO_HINT}</p>
      <div className="dh-hero__keys"><span>1 · Pulse</span><span>2 · Reply</span></div>
      <small className="dh-hero__brand-en">{DUOHERTZ_BRAND_LINE}</small>
      {preview && <p className="dh-hero__status">Internal preview · music and visual concepts are unreviewed.</p>}
    </div>
    <div className="dh-hero__visual" aria-label="Try the pulse and reply controls">
      {artUrl && <img className="dh-hero__character" src={artUrl} alt={artAlt} />}
      <div className="dh-hero__visual-head"><span>THE SOUNDFIELD / INPUT PREVIEW</span><span>01—02</span></div>
      <div className={`dh-hero__waves${pulse ? ` dh-hero__waves--${pulse}` : ""}`} key={taps} aria-hidden="true">
        <i /><i /><i /><b>〰</b>
      </div>
      <div className="dh-hero__pads">
        <button type="button" onClick={() => tap("first")}>01 <span>Pulse</span></button>
        <button type="button" onClick={() => tap("reply")}>02 <span>Reply</span></button>
      </div>
      <p role="status" aria-live="polite">{pulse ? `${pulse === "first" ? "Pulse" : "Reply"} wave · ${taps} ${taps === 1 ? "tap" : "taps"}` : "Tap either key to see a wave"}</p>
      <Link to={playHref}>Play the full track ↗</Link>
      <div className="dh-hero__spectrum" aria-hidden="true">
        {Array.from({ length: 16 }).map((_, i) => <i key={i} style={{ animationDelay: `${(i % 8) * 0.09}s` }} />)}
      </div>
    </div>
  </header>;
}
