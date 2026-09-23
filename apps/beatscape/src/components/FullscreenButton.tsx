import { useEffect, useState } from "react";
import {
  canRequestGameFullscreen,
  exitGameFullscreen,
  FULLSCREEN_CHANGE_EVENTS,
  gameFullscreenElement,
  requestGameFullscreen,
} from "../lib/fullscreen";

/** Touch fallback for browsers that decline the automatic start-gesture request. */
export function FullscreenButton({ enabled }: { enabled: boolean }) {
  const [supported] = useState(() => canRequestGameFullscreen());
  const [active, setActive] = useState(() => gameFullscreenElement() !== null);

  useEffect(() => {
    if (!supported) return;
    const update = () => setActive(gameFullscreenElement() !== null);
    for (const event of FULLSCREEN_CHANGE_EVENTS) document.addEventListener(event, update);
    return () => {
      for (const event of FULLSCREEN_CHANGE_EVENTS) document.removeEventListener(event, update);
    };
  }, [supported]);

  if (!enabled || !supported) return null;
  const label = active ? "Exit fullscreen" : "Fullscreen";
  return (
    <button
      type="button"
      className="btn compact play-fullscreen"
      data-active={active ? "true" : "false"}
      onClick={() => void (active ? exitGameFullscreen() : requestGameFullscreen())}
      aria-label={label}
      title={label}
    >
      <span className="play-fullscreen-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d={active
            ? "M3 9h6V3M21 9h-6V3M3 15h6v6M21 15h-6v6"
            : "M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"}
          />
        </svg>
      </span>
      <span className="play-fullscreen-label">{active ? "Exit fullscreen" : "Fullscreen"}</span>
    </button>
  );
}
