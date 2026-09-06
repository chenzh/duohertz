import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "../router";
import { writeItem, writeJSON } from "../storage/safeStorage";
import { assetUrl, getTrack, loadChart } from "../catalog/loadCatalog";
import { PlayField } from "../components/PlayField";
import type { ChartJSON, ChartTier, PlayMode, PlayResult } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
import { writeLastRun } from "../storage/session";
import { districtColor } from "../constants/scape";
import { isOnboarded, loadSettings, setOnboarded } from "../storage/settings";
import { recordRun } from "../lib/progress";
import { isCoarsePointer } from "../input/touchInput";
import { buildPlayPageMeta, usePageMeta } from "../seo/pageMeta";
import { trackEvent } from "../lib/analytics";
import { useRef } from "react";
import { makeLiveStats, type LiveStats } from "../components/playfield/liveStats";
import { shiftStep } from "../data/firstShift";
import { recordShiftRun } from "../lib/firstShift";
import { getAudioContext } from "../audio/context";
import { decodedAudioCache } from "../audio/decodedAudioCache";

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
  // B-1 · Live stats bridge for the comic-panel HUD. Created here (stable
  // across renders) and handed to both PlayField (writer) and PlayHud (reader)
  // via the same ref — never crosses the 60fps canvas loop as React state.
  const statsRef = useRef<LiveStats>(makeLiveStats());
  const finishedRunRef = useRef(false);
  // loadSettings() 要读一次 localStorage 再 JSON.parse —— 每次渲染都做一遍太浪费。
  const settings = useMemo(loadSettings, []);
  usePageMeta(track ? buildPlayPageMeta(track, tier, mode) : null);

  useEffect(() => {
    if (!id) return;
    finishedRunRef.current = false;
    let cancelled = false;
    let warmAudio: ReturnType<typeof decodedAudioCache.acquire> | null = null;
    void (async () => {
      setLoadError("");
      setTrack(null);
      setChart(null);
      // getTrack() 必须也在 try 里：它以前在外面，catalog.json 一旦 404，reject
      // 会直接逃出这个 async IIFE，loadError 永远不会被赋值 —— 页面就永久卡在
      // "Loading chart…"，用户看不到任何错误。
      try {
        const t = await getTrack(id);
        if (!t) {
          if (!cancelled) setLoadError(`Track not found: ${id}`);
          return;
        }
        if (cancelled) return;
        // Download/decode only the selected song while its chart loads. The
        // field acquires the same buffer; keep this lease until route cleanup.
        warmAudio = decodedAudioCache.acquire(getAudioContext(), assetUrl(t.audio));
        void warmAudio.promise.catch(() => {}); // PlayField owns retry/error UI.
        const c = await loadChart(t, tier);
        if (!cancelled) {
          setTrack(t);
          setChart(c);
        }
      } catch (e) {
        warmAudio?.release();
        warmAudio = null;
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Chart load failed");
      }
    })();
    return () => {
      cancelled = true;
      warmAudio?.release();
    };
  }, [id, tier, nav]);

  const finish = (result: PlayResult) => {
    if (!track || finishedRunRef.current) return;
    finishedRunRef.current = true;
    trackEvent("play_finish", { track: track.track_id, grade: result.grade, accuracy: result.accuracy });
    const isDaily = params.get("daily") === "1";
    const durationMs = performance.now() - startedAt;
    const scene = shiftStep(params.get("shift"));
    const run = writeLastRun(track, tier, mode, result, durationMs, {
      daily: isDaily,
      shiftStep: scene?.trackId === track.track_id ? scene.id : undefined,
    });
    recordShiftRun(run);
    // Honor progress (PRD §17): run history + achievements + rank-up for the Profile page.
    const prog = recordRun(track, tier, mode, result, durationMs);
    writeJSON("bs_new_achievements", prog.newAchievements, "session");
    writeItem("bs_rank_up", prog.rankUp ? prog.rank : "", "session");
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
        <div className="tuning-dial" aria-hidden="true">
          <div className="tuning-scan" />
        </div>
        <p className="tuning-callsign">THE LATE STATIC · 88.6 FM</p>
        <p className="tuning-status">Tuning into the Scape…</p>
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
      <div
        className="neon-layer"
        aria-hidden
        style={track ? ({ "--district-color": districtColor(track.district) } as React.CSSProperties) : undefined}
      >
        <i className="tube" />
        <i className="tube" />
        <i className="tube" />
        <i className="tube" />
        <i className="sign" />
        <i className="sign" />
        <i className="sign" />
        <i className="sign" />
        <i className="breathe" />
      </div>
      <div className="play-meta">
        {/* X 坐最左：全屏下它是唯一够得着的关闭方式（手机没有 Esc），
            位置也跟别的全屏 App 一致。误触有 exitPlay 的 confirm 兜底。 */}
        <button type="button" className="play-exit" onClick={exitPlay} aria-label="Exit the Scape">
          ✕
        </button>
        <strong>{track.title}</strong>
        <span className="play-meta-tier">
          {tier} · {mode}
        </span>
        {touchUi && (
          <button type="button" className="btn compact" onClick={() => void enterFullscreen()}>
            Fullscreen
          </button>
        )}
      </div>
      <PlayField
        key={`${track.track_id}-${tier}-${mode}`}
        district={track.district}
        chart={chart}
        audioUrl={assetUrl(track.audio)}
        mode={mode}
        casualSpeed={settings.casualSpeed}
        statsRef={statsRef}
        trackTitle={track.title}
        tierLabel={tier}
        onStart={() => trackEvent("play_start", { track: track.track_id, tier, mode })}
        onFinish={finish}
      />
    </section>
  );
}
