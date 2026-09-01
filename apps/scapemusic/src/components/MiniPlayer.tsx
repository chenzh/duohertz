import { usePlayerActions, usePlayerState } from "../player/playerContext";
import { NextIcon, PauseIcon, PlayIcon } from "./icons";

export function MiniPlayer() {
  const st = usePlayerState();
  const actions = usePlayerActions();
  if (!st.track || st.expanded) return null;
  const pct = st.dur > 0 ? (st.pos / st.dur) * 100 : 0;
  return (
    <div className="miniplayer">
      <div className="mini-progress" style={{ width: `${pct}%` }} aria-hidden />
      <button
        className="mini-main"
        onClick={() => actions.setExpanded(true)}
        aria-label="Open full player"
      >
        <img src={st.track.cover} alt="" className="mini-cover" />
        <span className="mini-meta">
          <span className="mini-title">{st.track.title}</span>
          <span className="mini-artist">
            {st.track.artist}
            {st.contextLabel ? ` · ${st.contextLabel}` : ""}
          </span>
        </span>
      </button>
      <button
        className="icon-btn"
        onClick={actions.toggle}
        aria-label={st.playing ? "Pause" : "Play"}
      >
        {st.playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button className="icon-btn" onClick={actions.next} aria-label="Next track">
        <NextIcon />
      </button>
    </div>
  );
}
