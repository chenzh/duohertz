import { useId, useLayoutEffect, useRef, useState } from "react";
import { useGamepadDialogNavigation } from "../input/useGamepadDialogNavigation";
import { GamepadDialogHint } from "./GamepadDialogHint";
import "../styles/exit-game-dialog.css";

type Props = {
  trackTitle: string;
  duo?: boolean;
  gamepadIndexes?: readonly number[];
  onKeepPlaying: () => void | Promise<void>;
  onLeave: () => void;
};

/** A styled top-layer dialog remains visible above the fullscreen stage. */
export function ExitGameDialog({
  trackTitle,
  duo = false,
  gamepadIndexes = [],
  onKeepPlaying,
  onLeave,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const leaveRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [leaving, setLeaving] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const busy = leaving || resuming;
  const busyRef = useRef(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    keepRef.current?.focus();
    return () => { dialog.close(); };
  }, []);

  const leave = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLeaving(true);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // Navigation still works if the browser has already left fullscreen.
    }
    onLeave();
  };

  const keepPlaying = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setResuming(true);
    setResumeError("");
    try {
      await onKeepPlaying();
      // Success unmounts this dialog; no post-resolution state write needed.
    } catch {
      busyRef.current = false;
      setResuming(false);
      setResumeError("Audio could not resume. Check browser sound permission, then try again.");
      keepRef.current?.focus();
    }
  };

  useGamepadDialogNavigation({
    containerRef: dialogRef,
    enabled: true,
    gamepadIndexes,
    onBack: () => {
      if (!busyRef.current) void keepPlaying();
    },
  });

  return (
    <dialog
      ref={dialogRef}
      className="exit-game-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busyRef.current) void keepPlaying();
      }}
      onKeyDown={(event) => {
        // Window-level lane / pause / retry shortcuts must not receive these.
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          if (!busyRef.current) void keepPlaying();
        }
        if (event.key === "Tab") {
          event.preventDefault();
          if (!busy) {
            const next = document.activeElement === keepRef.current ? leaveRef : keepRef;
            next.current?.focus();
          }
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
        <button ref={keepRef} type="button" className="btn exit-game-keep" data-gamepad-default disabled={busy} aria-busy={resuming} onClick={() => void keepPlaying()}>
          {resuming ? "Resuming…" : "Keep playing"} <span aria-hidden="true">↗</span>
        </button>
        <button ref={leaveRef} type="button" className="btn exit-game-leave" disabled={busy} onClick={() => void leave()}>
          {leaving ? "Leaving…" : "Leave"}
        </button>
      </div>
      {gamepadIndexes.length > 0 && <GamepadDialogHint backLabel="Keep playing" />}
      {resumeError && <p className="exit-game-resume-error" role="alert">{resumeError}</p>}
    </dialog>
  );
}
