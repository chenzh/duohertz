import { useEffect, useRef, useState } from "react";
import type { LandingContent } from "../content/landing";
import type { Locale } from "../i18n";
import { fetchShowcase, pauseOtherAudio, type ShowcaseData, type ShowcaseItem } from "../lib/showcase";
import { Badge } from "../components/ui";

function audioMessages(locale: Locale) {
  return locale === "zh"
    ? { loading: "正在加载试听…", loadFailed: "试听内容加载失败，请重试。", playbackFailed: "暂时无法播放，请重试或选择另一首。", empty: "暂无试听曲目。", retry: "重试", play: "播放", pause: "暂停" }
    : { loading: "Loading previews…", loadFailed: "Previews could not load. Please retry.", playbackFailed: "Unable to play this preview. Retry or choose another track.", empty: "No previews are available.", retry: "Retry", play: "Play", pause: "Pause" };
}

function useShowcase() {
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    void fetchShowcase().then((next) => {
      if (!cancelled) setData(next);
    }).catch(() => {
      if (!cancelled) setError(true);
    });
    return () => { cancelled = true; };
  }, [attempt]);

  return { data, error, retry: () => setAttempt((value) => value + 1) };
}

function ShowcaseCard({ item, locale }: { item: ShowcaseItem; locale: Locale }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const messages = audioMessages(locale);
  const title = locale === "zh" ? item.titleZh : item.titleEn;

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setFailed(false);
    if (audio.error) audio.load();
    pauseOtherAudio(audio);
    try {
      await audio.play();
    } catch {
      setFailed(true);
    }
  }

  return (
    <article className="showcase-card">
      <button type="button" className="showcase-select" onClick={() => void togglePlay()} aria-label={`${playing ? messages.pause : messages.play} ${title}`} aria-pressed={playing}>
        <div className="showcase-cover" style={{ background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }} />
        <div className="showcase-meta">
          <Badge tone={item.scene === "game" ? "game" : "vocal"}>{item.engine}</Badge>
          <strong>{title}</strong>
        </div>
      </button>
      <audio ref={audioRef} src={item.url} preload="none" controls className="showcase-audio"
        onPlay={(event) => {
          pauseOtherAudio(event.currentTarget);
          setPlaying(true);
          setFailed(false);
          console.info("demo_play_showcase", item.id);
        }}
        onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setFailed(true)} />
      {failed && <p role="alert" className="hint">{messages.playbackFailed}</p>}
    </article>
  );
}

export function ShowcaseSection({ content, locale }: { content: LandingContent; locale: Locale }) {
  const { data, error, retry } = useShowcase();
  const items = data?.items.filter((item) => !item.compare) ?? [];
  const messages = audioMessages(locale);

  return (
    <section id="showcase" className="section showcase-section" data-testid="showcase-section">
      <h2>{content.showcaseTitle}</h2>
      <p className="section-lead">{content.showcaseLead}</p>
      {error ? (
        <div role="alert">
          <p>{messages.loadFailed}</p>
          <button type="button" className="btn-secondary" onClick={retry}>{messages.retry}</button>
        </div>
      ) : !data ? <p role="status">{messages.loading}</p> : items.length === 0 ? <p role="status">{messages.empty}</p> : null}
      <div className="showcase-grid">
        {items.map((item) => (
          <ShowcaseCard
            key={item.id}
            item={item}
            locale={locale}
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
  const { data, error, retry } = useShowcase();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const messages = audioMessages(locale);

  async function retryPlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    setPlaybackFailed(false);
    audio.load();
    pauseOtherAudio(audio);
    try {
      await audio.play();
    } catch {
      setPlaybackFailed(true);
    }
  }

  return (
    <div className="hero-preview" data-testid="hero-preview">
      <span className="hero-preview-label">{content.heroListen}</span>
      {data && <audio ref={audioRef} controls loop src={data.hero.url} preload="metadata" className="hero-audio"
        onPlay={(event) => { pauseOtherAudio(event.currentTarget); setPlaybackFailed(false); }}
        onError={() => setPlaybackFailed(true)} />}
      {error ? (
        <div role="alert">
          <p>{messages.loadFailed}</p>
          <button type="button" className="btn-secondary" onClick={retry}>{messages.retry}</button>
        </div>
      ) : !data && <p role="status">{messages.loading}</p>}
      {playbackFailed && (
        <div role="alert">
          <p>{messages.playbackFailed}</p>
          <button type="button" className="btn-secondary" onClick={() => void retryPlayback()}>{messages.retry}</button>
        </div>
      )}
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
