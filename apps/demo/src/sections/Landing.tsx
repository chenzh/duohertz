import { useEffect, useState } from "react";
import type { LandingContent } from "../content/landing";
import type { Locale } from "../i18n";
import { fetchShowcase, type ShowcaseItem } from "../lib/showcase";
import { Badge } from "../components/ui";

function ShowcaseCard({
  item,
  locale,
  onPlay,
}: {
  item: ShowcaseItem;
  locale: Locale;
  onPlay: () => void;
}) {
  const title = locale === "zh" ? item.titleZh : item.titleEn;
  return (
    <button type="button" className="showcase-card" onClick={onPlay}>
      <div
        className="showcase-cover"
        style={{ background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }}
      />
      <div className="showcase-meta">
        <Badge tone={item.scene === "game" ? "game" : "vocal"}>{item.engine}</Badge>
        <strong>{title}</strong>
      </div>
      <audio src={item.url} preload="none" controls className="showcase-audio" />
    </button>
  );
}

export function ShowcaseSection({ content, locale }: { content: LandingContent; locale: Locale }) {
  const [items, setItems] = useState<ShowcaseItem[]>([]);

  useEffect(() => {
    void fetchShowcase().then((d) => setItems(d.items.filter((i) => !i.compare)));
  }, []);

  return (
    <section id="showcase" className="section showcase-section" data-testid="showcase-section">
      <h2>{content.showcaseTitle}</h2>
      <p className="section-lead">{content.showcaseLead}</p>
      <div className="showcase-grid">
        {items.map((item) => (
          <ShowcaseCard
            key={item.id}
            item={item}
            locale={locale}
            onPlay={() => {
              console.info("demo_play_showcase", item.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}

export function HeroPreview({
  content,
  locale,
}: {
  content: LandingContent;
  locale: Locale;
}) {
  const [heroUrl, setHeroUrl] = useState("/demo/showcase/hero-loop.wav");

  useEffect(() => {
    void fetchShowcase().then((d) => setHeroUrl(d.hero.url));
  }, []);

  return (
    <div className="hero-preview" data-testid="hero-preview">
      <span className="hero-preview-label">{content.heroListen}</span>
      <audio controls loop src={heroUrl} preload="metadata" className="hero-audio" />
      <span className="hint">{locale === "zh" ? "无需生成即可试听" : "No generation required"}</span>
    </div>
  );
}

export function LandingSection({
  content,
  locale,
}: {
  content: LandingContent;
  locale: Locale;
}) {
  return (
    <section id="product" className="section landing-section" data-testid="landing-section">
      <div className="landing-grid">
        <div className="landing-copy fade-up">
          <h1>{content.heroTitle}</h1>
          <p className="hero-sub">{content.heroSubtitle}</p>
          <div className="pillar-grid">
            {content.pillars.map((p) => (
              <article key={p.title} className="pillar-card glass">
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
          <div className="stat-row">
            {content.stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <HeroPreview content={content} locale={locale} />
      </div>
    </section>
  );
}
