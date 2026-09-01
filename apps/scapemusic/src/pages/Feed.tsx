// Discover — the vertical snap stream (类汽水音乐 signature: swipe up = next
// track). Deterministic per day: every Listener gets the same station daily.

import { useEffect, useMemo, useRef, useState } from "react";
import { trackById, vibeMeta, type Track } from "../lib/catalog";
import { buildDailyStream } from "../lib/playlists";
import { TRACKS } from "../lib/catalog";
import { useFavorites } from "../lib/storage";
import { usePlayerActions, usePlayerState } from "../player/playerContext";
import { navigate, trackHref } from "../router";
import { HeartIcon, PauseIcon, PlayIcon } from "../components/icons";

export function Feed() {
  const actions = usePlayerActions();
  const st = usePlayerState();
  const { favorites, toggleFavorite } = useFavorites();

  const streamIds = useMemo(
    () => buildDailyStream(TRACKS, new Date().toISOString().slice(0, 10)),
    [],
  );
  const stream = useMemo(
    () => streamIds.map((id) => trackById(id)).filter((t): t is Track => Boolean(t)),
    [streamIds],
  );

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const idx = Number((e.target as HTMLElement).dataset.idx);
          if (!Number.isNaN(idx)) setActive(idx);
        }
      },
      { root, threshold: 0.6 },
    );
    for (const el of cardRefs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [stream]);

  useEffect(() => {
    actions.playContextIfIdle(streamIds, active, "Daily Mix");
  }, [actions, active, streamIds]);

  return (
    <div className="feed" ref={scrollerRef}>
      {stream.map((t, i) => {
        const vm = vibeMeta(t.vibe);
        const isCurrent = st.track?.track_id === t.track_id;
        const fav = favorites.includes(t.track_id);
        return (
          <section
            key={t.track_id}
            data-idx={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={`feed-card ${i === active ? "is-active" : ""}`}
          >
            <img className="feed-bg" src={t.cover} alt="" aria-hidden />
            <div className="feed-shade" aria-hidden />
            <div className="feed-card-inner">
              <span className="feed-tag" style={{ color: vm.color, borderColor: vm.color }}>
                {vm.column}
              </span>
              <h2 className="feed-title">{t.title}</h2>
              <p className="feed-artist">{t.artist}</p>
              {t.quote && <p className="feed-quote">“{t.quote}”</p>}
              <p className="feed-meta">
                {t.district} · {t.bpm} BPM · {t.genre} · full length {Math.round(t.stream_duration_sec / 60)} min
              </p>
              <div className="feed-actions">
                <button
                  className="np-play"
                  onClick={() =>
                    isCurrent ? actions.toggle() : actions.playContext(streamIds, i, "Daily Mix")
                  }
                  aria-label={isCurrent && st.playing ? "Pause" : "Play"}
                >
                  {isCurrent && st.playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
                </button>
                <button
                  className={`icon-btn ${fav ? "is-fav" : ""}`}
                  onClick={() => toggleFavorite(t.track_id)}
                  aria-pressed={fav}
                  aria-label={fav ? "Remove from saved" : "Save track"}
                >
                  <HeartIcon filled={fav} size={20} />
                </button>
                <button className="ghost-btn" onClick={() => navigate(trackHref(t.track_id))}>
                  Details
                </button>
              </div>
            </div>
            {i === active && st.awaitingGesture && (
              <button
                className="feed-gate"
                onClick={() => actions.playContext(streamIds, i, "Daily Mix")}
              >
                <PlayIcon size={22} /> Tap to tune in
              </button>
            )}
            {i === active && st.playing && (
              <div className="feed-eq" aria-hidden>
                <i />
                <i />
                <i />
              </div>
            )}
          </section>
        );
      })}
      <div className="feed-hint" aria-hidden>swipe up for the next frequency</div>
    </div>
  );
}
