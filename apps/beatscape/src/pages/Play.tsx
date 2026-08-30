import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "../router";
import { assetUrl, getTrack, loadChart } from "../catalog/loadCatalog";
import { PlayField } from "../components/PlayField";
import type { ChartJSON, ChartTier, PlayMode, PlayResult } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
import { writeLastRun } from "../storage/session";
import { isOnboarded, loadSettings, setOnboarded } from "../storage/settings";
import { isCoarsePointer } from "../input/touchInput";
import { buildPlayPageMeta, usePageMeta } from "../seo/pageMeta";
import { trackEvent } from "../lib/analytics";

export function PlayPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const tier = (params.get("tier") as ChartTier) || "easy";
  const mode = (params.get("mode") as PlayMode) || "casual";
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [chart, setChart] = useState<ChartJSON | null>(null);
  const [loadError, setLoadError] = useState("");
  const [startedAt] = useState(() => performance.now());
  const [touchUi] = useState(() => isCoarsePointer());
  const settings = loadSettings();
  usePageMeta(track ? buildPlayPageMeta(track, tier, mode) : null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoadError("");
      setTrack(null);
      setChart(null);
      const t = await getTrack(id);
      if (!t) {
        if (!cancelled) setLoadError(`Track not found: ${id}`);
        return;
      }
      try {
        const c = await loadChart(t, tier);
        if (!cancelled) {
          setTrack(t);
          setChart(c);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Chart load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, tier, nav]);

  const finish = (result: PlayResult) => {
    if (!track) return;
    trackEvent("play_finish", { track: track.track_id, grade: result.grade, accuracy: result.accuracy });
    const isDaily = params.get("daily") === "1";
    writeLastRun(track, tier, mode, result, performance.now() - startedAt, { daily: isDaily });
    if (!isOnboarded()) setOnboarded();
    nav("/results");
  };

  const exitPlay = () => {
    if (!window.confirm("Leave the Scape? This run won't be saved.")) return;
    nav(track ? `/track/${track.track_id}` : "/library");
  };

  const enterFullscreen = async () => {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ("webkitRequestFullscreen" in el) {
        await (el as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      }
    } catch {
      /* user dismissed or unsupported */
    }
  };

  if (loadError) {
    return (
      <section className="play-page">
        <p className="error">{loadError}</p>
        <button type="button" className="btn" onClick={() => nav("/library")}>
          Back to Library
        </button>
      </section>
    );
  }

  if (!track || !chart) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" aria-hidden />
        <p>Loading chart…</p>
      </div>
    );
  }

  return (
    <section className="play-page">
      <div
        className="play-bg"
        aria-hidden
        style={{ backgroundImage: `url(${assetUrl(track.cover)})` }}
      />
      <div className="play-meta">
        <strong>{track.title}</strong>
        <span className="play-meta-tier">
          {tier} · {mode}
        </span>
        {touchUi && (
          <button type="button" className="btn compact" onClick={() => void enterFullscreen()}>
            Fullscreen
          </button>
        )}
        <button type="button" className="btn compact" onClick={exitPlay}>
          Exit
        </button>
      </div>
      <PlayField
        key={`${track.track_id}-${tier}-${mode}`}
        district={track.district}
        chart={chart}
        audioUrl={assetUrl(track.audio)}
        mode={mode}
        casualSpeed={settings.casualSpeed}
        onStart={() => trackEvent("play_start", { track: track.track_id, tier, mode })}
        onFinish={finish}
      />
    </section>
  );
}
