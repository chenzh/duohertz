import { useState } from "react";
import { Link } from "../router";
import { FIRST_SHIFT, shiftPlayHref, shiftStep, type CrewLine } from "../data/firstShift";
import { crewResponse, loadShiftProgress, shiftInputSurface, shiftStorageNotice, shiftReceiptFor } from "../lib/firstShift";
import { isCoarsePointer } from "../input/touchInput";
import { useGamepadAssignments } from "../input/useGamepadAssignments";
import { usePhysicalKeyboardInput } from "../input/usePhysicalKeyboardInput";
import type { LastRun } from "../types/chart";
import "../styles/first-shift.css";

export function CrewDialogue({ lines }: { lines: readonly CrewLine[] }) {
  return <div className="shift-dialogue">{lines.map((line, i) => (
    <p key={i} className={`shift-line voice-${line.speaker.toLowerCase()}`}>
      <strong>{line.speaker}</strong><span>{line.text}</span>
    </p>
  ))}</div>;
}

export function ShiftCircuit({ completed }: { completed: number }) {
  return <ol className="shift-circuit" aria-label="First shift broadcast circuit">{FIRST_SHIFT.map((step, i) => (
    <li key={step.id} className={i < completed ? "restored" : i === completed ? "current" : "waiting"} aria-current={i === completed ? "step" : undefined}>
      <span className="shift-node-number" aria-hidden="true">{i < completed ? "✓" : `0${i + 1}`}</span>
      <span><strong>{step.node}</strong><small>{step.district}</small></span>
      <span className="shift-node-state">{i < completed ? "On air" : i === completed ? "Next stop" : "Waiting"}</span>
    </li>
  ))}</ol>;
}

export function ShiftSignalPath({
  from,
  to,
  className = "",
  compact = false,
}: {
  from: string;
  to: string;
  className?: string;
  compact?: boolean;
}) {
  const visibleState = (value: string) => {
    if (!compact) return value;
    const separator = " · ";
    const stateStart = value.indexOf(separator);
    return stateStart >= 0 ? value.slice(stateStart + separator.length) : value;
  };
  return (
    <p
      className={`shift-signal-path${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={`Signal path: ${from} becomes ${to}`}
    >
      <span className="shift-link-from" aria-hidden="true">
        <small>From</small>
        <strong>{visibleState(from)}</strong>
      </span>
      <span className="shift-link-arrow" aria-hidden="true">→</span>
      <span className="shift-link-to" aria-hidden="true">
        <small>To</small>
        <strong>{visibleState(to)}</strong>
      </span>
    </p>
  );
}

export function ShiftHomeCard() {
  const progress = loadShiftProgress();
  const count = progress.completed.length;
  const next = FIRST_SHIFT[count];
  return <section className="shift-home-card" aria-labelledby="first-shift-title">
    <div>
      <p className="eyebrow">The Late Static · Your story</p>
      <h2 id="first-shift-title">{next ? count ? "They saved you a seat." : "There's someone on the line." : "Four chairs. One crew."}</h2>
      <p>{next ? count ? `${next.speaker} is waiting in ${next.district}. Your next stop: ${next.node.toLowerCase()}.` : "Three musicians, a broken radio, and you. Meet NIGHTSHIFT through three short sets — starting whenever you're ready." : "You got the station back on air. Revisit your first night, or catch up with the crew's weekly broadcasts."}</p>
      <Link className="btn primary" to="/shift">{count === 0 ? "Take the call" : next ? "Continue your shift" : "Visit the station"}</Link>
    </div>
    <div className="shift-home-circuit"><ShiftCircuit completed={count} /><p className="shift-storage-note">{count}/3 connections restored. {shiftStorageNotice()}</p></div>
  </section>;
}

export function ShiftResult({ run, district }: { run: LastRun; district?: string }) {
  const [touchUi] = useState(isCoarsePointer);
  const physicalKeyboardSeen = usePhysicalKeyboardInput();
  const [gamepadIndex] = useGamepadAssignments(1);
  const progress = loadShiftProgress();
  const receipt = shiftReceiptFor(run, progress);
  const step = shiftStep(receipt?.id);
  const attempted = shiftStep(run.shiftStep);
  const next = FIRST_SHIFT[progress.completed.length];
  const done = progress.completed.length;
  // 下一关只用一句台词介绍人，不重复讲一遍城市设定。
  const nextLine = next ? next.opening?.[0] ?? next.before[0] : undefined;
  return <section className="shift-result" aria-labelledby="shift-response-title">
    <p className="eyebrow">The Late Static · Connection update</p>
    <h2 id="shift-response-title">{step ? `${step.node} restored` : "Still on the line."}</h2>
    {!step && <CrewDialogue lines={[crewResponse(
      run,
      district,
      shiftInputSurface(touchUi, physicalKeyboardSeen, gamepadIndex !== null),
    )]} />}
    {/* The headline confirms this connection; make the next run reachable
        before the longer receipt on short phones. */}
    {step && next && nextLine && <div className="shift-next">
      <p className="eyebrow">Next · Connection {done + 1} of {FIRST_SHIFT.length} · {next.district}</p>
      <Link className="btn primary" to={shiftPlayHref(next)}>Play {next.trackTitle} · {done + 1}/{FIRST_SHIFT.length}</Link>
      <CrewDialogue lines={[nextLine]} />
    </div>}
    {step && !next && <div className="shift-next shift-next-complete">
      <p className="eyebrow">First Shift complete</p>
      <p>The station is live. Your seat and the weekly broadcasts are ready whenever you return.</p>
      <Link className="btn primary" to="/shift">Your seat at the station</Link>
    </div>}
    {/* Keep the concrete before/after state visible without making the player
        scroll past it to continue. */}
    {step && (
      <ShiftSignalPath compact className="shift-link-change" from={step.link.from} to={step.link.to} />
    )}
    {step && <p className="shift-change">{step.restored}</p>}
    {step && <details className="shift-result-details">
      <summary>
        <span>Read the crew reply &amp; circuit</span>
        <small>{done}/{FIRST_SHIFT.length} connections restored</small>
      </summary>
      <CrewDialogue lines={step.after} />
      <ShiftCircuit completed={done} />
    </details>}
    <div className="cta-row">
      {!step && attempted && next?.id === attempted.id && <Link className="btn primary" to={shiftPlayHref(attempted)}>Try this connection again</Link>}
      {!step && <Link className="btn ghost" to="/shift">{done ? "Back to the station" : "Meet the crew · First shift"}</Link>}
      {step && next && <Link className="btn ghost" to="/shift">Back to the station</Link>}
      {step && !next && <Link className="btn ghost" to="/radio">Read the broadcasts</Link>}
    </div>
    {step && <p className="shift-storage-note" role="status">{shiftStorageNotice()}</p>}
  </section>;
}
