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

const GUIDE_TRACK = "bs-s1-02";

export function PlayPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const tier = (params.get("tier") as ChartTier) || "standard";
  const mode = (params.get("mode") as PlayMode) || "arcade";
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [chart, setChart] = useState<ChartJSON | null>(null);
  const [loadError, setLoadError] = useState("");
  const [startedAt] = useState(() => performance.now());
  const [touchUi] = useState(() => isCoarsePointer());
  const settings = loadSettings();
  usePageMeta(track ? buildPlayPageMeta(track, tier, mode) : null);

  useEffect(() => {
    document.body.classList.add("play-immersive");
    return () => document.body.classList.remove("play-immersive");
  }, []);

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

  useEffect(() => {
    if (!isOnboarded()) {
      if (id !== GUIDE_TRACK) {
        nav(`/play/${GUIDE_TRACK}?tier=easy&mode=casual`, { replace: true });
        return;
      }
    } else if (!id) {
      return;
    }
    if (!id) return;
    void (async () => {
      setLoadError("");
      setTrack(null);
      setChart(null);
      const t = await getTrack(id);
      if (!t) {
        setLoadError(`Track not found: ${id}`);
        return;
      }
      setTrack(t);
      try {
        setChart(await loadChart(t, tier));
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Chart load failed");
      }
    })();
  }, [id, tier, nav]);

  const finish = (result: PlayResult) => {
    if (!track) return;
    writeLastRun(track, tier, mode, result, performance.now() - startedAt);
    if (!isOnboarded() && track.track_id === GUIDE_TRACK) {
      setOnboarded();
      nav("/");
      return;
    }
    nav("/results?run=local");
  };

  const exitPlay = () => {
    if (!window.confirm("Leave the Scape? This run will be discarded.")) return;
    nav(track ? `/track/${track.track_id}` : "/library");
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

  if (!track || !chart) return <p className="loading">Loading chart…</p>;

  return (
    <section className="play-page">
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
        <button type="button" className="btn linkish" onClick={exitPlay}>
          Exit
        </button>
      </div>
      <PlayField
        chart={chart}
        audioUrl={assetUrl(track.audio)}
        mode={mode}
        casualSpeed={settings.casualSpeed}
        onFinish={finish}
        onFail={finish}
      />
    </section>
  );
}
