import { useId, useLayoutEffect, useRef, useState } from "react";
import "../styles/exit-game-dialog.css";

type Props = {
  trackTitle: string;
  duo?: boolean;
  onKeepPlaying: () => void;
  onLeave: () => void;
};

/** A styled top-layer dialog remains visible above the fullscreen stage. */
export function ExitGameDialog({ trackTitle, duo = false, onKeepPlaying, onLeave }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const leaveRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [leaving, setLeaving] = useState(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    keepRef.current?.focus();
    return () => { dialog.close(); };
  }, []);

  const leave = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // Navigation still works if the browser has already left fullscreen.
    }
    onLeave();
  };

  return (
    <dialog
      ref={dialogRef}
      className="exit-game-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!leaving) onKeepPlaying();
      }}
      onKeyDown={(event) => {
        // Window-level lane / pause / retry shortcuts must not receive these.
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          if (!leaving) onKeepPlaying();
        }
        if (event.key === "Tab") {
          event.preventDefault();
          const next = document.activeElement === keepRef.current ? leaveRef : keepRef;
          next.current?.focus();
        }
      }}
    >
      <div className="exit-game-heading">
        <span className="exit-game-mark" aria-hidden="true">Ⅱ</span>
        <p className="exit-game-kicker">The Late Static <span>/ Exit game</span></p>
      </div>
      <h2 id={titleId}>Leave the Scape?</h2>
      <p id={descriptionId} className="exit-game-description">
        This run won’t be saved. Your next beat can wait.
      </p>
      <p className="exit-game-track">
        <span>{duo ? "Duo" : "Now playing"}</span>
        <strong>{trackTitle}</strong>
      </p>
      <div className="exit-game-actions">
        <button ref={keepRef} type="button" className="btn exit-game-keep" disabled={leaving} onClick={onKeepPlaying}>
          Keep playing <span aria-hidden="true">↗</span>
        </button>
        <button ref={leaveRef} type="button" className="btn exit-game-leave" disabled={leaving} onClick={() => void leave()}>
          {leaving ? "Leaving…" : "Leave"}
        </button>
      </div>
    </dialog>
  );
}
