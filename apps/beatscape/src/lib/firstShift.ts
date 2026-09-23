import { FIRST_SHIFT, shiftStep, type CrewLine, type ShiftStepId } from "../data/firstShift";
import type { LastRun } from "../types/chart";
import { readItem, writeJSON } from "../storage/safeStorage";

export const SHIFT_STORAGE_KEY = "bs_first_shift_v1";
export interface ShiftReceipt { id: ShiftStepId; runId: string }
export interface ShiftProgress { v: 1; completed: ShiftReceipt[] }
export type ShiftInputSurface = "touch" | "keys" | "gamepad";
export function shiftInputSurface(touchUi: boolean, keyboardSeen: boolean, gamepadConnected: boolean): ShiftInputSurface {
  if (gamepadConnected) return "gamepad";
  return touchUi && !keyboardSeen ? "touch" : "keys";
}

export function shiftLaneAction(inputSurface: ShiftInputSurface): string {
  return inputSurface === "touch" ? "tap a lane"
    : inputSurface === "gamepad" ? "press a lane button" : "press a lane key";
}
const empty = (): ShiftProgress => ({ v: 1, completed: [] });
// Keep the current visit playable when browser storage is unavailable.
let visitProgress: ShiftProgress | null = null;
let volatile = false;

export function parseShiftProgress(raw: string | null): ShiftProgress {
  try {
    const data: unknown = JSON.parse(raw ?? "null");
    if (!data || typeof data !== "object" || !("v" in data) || data.v !== 1 ||
      !("completed" in data) || !Array.isArray(data.completed)) return empty();
    const completed: ShiftReceipt[] = [];
    // Only accept a valid ordered prefix: malformed saves cannot skip a scene.
    for (const item of data.completed.slice(0, FIRST_SHIFT.length)) {
      if (!item || item.id !== FIRST_SHIFT[completed.length]?.id || typeof item.runId !== "string" ||
        item.runId.length === 0 || item.runId.length > 200 || completed.some((r) => r.runId === item.runId)) break;
      completed.push({ id: item.id, runId: item.runId });
    }
    return { v: 1, completed };
  } catch { return empty(); }
}

export function loadShiftProgress(): ShiftProgress {
  return volatile && visitProgress ? visitProgress : parseShiftProgress(readItem(SHIFT_STORAGE_KEY));
}

export function shiftIsVolatile(): boolean { return volatile; }

export function shiftStorageNotice(): string {
  if (volatile) return "Your browser couldn't save this shift. Progress lasts for this visit.";
  const raw = readItem(SHIFT_STORAGE_KEY);
  if (raw !== null) {
    const kept = parseShiftProgress(raw).completed.length;
    try {
      const data = JSON.parse(raw);
      if (data?.v !== 1 || !Array.isArray(data.completed) || data.completed.length !== kept) throw new Error("invalid save");
    } catch {
      return `We couldn't read all of your saved shift. Kept ${kept} of 3 connections. You can continue from here.`;
    }
  }
  return "Progress stays on this device. No deadline — the crew will wait.";
}

export function shiftRunId(run: LastRun): string { return `${run.track_id}:${run.endedAt}`; }

export function canCarrySignal(run: LastRun): boolean {
  const hits = run.counts.perfect + run.counts.great + run.counts.good;
  return run.failed === false && run.mode !== "practice" && hits > 0 && Number.isFinite(hits) &&
    run.totalNotes > 0 && Number.isFinite(run.totalNotes) && hits <= run.totalNotes &&
    typeof run.endedAt === "string" && Number.isFinite(Date.parse(run.endedAt));
}

export function advanceShift(progress: ShiftProgress, run: LastRun): ShiftProgress {
  const next = FIRST_SHIFT[progress.completed.length];
  if (!next || run.shiftStep !== next.id || run.track_id !== next.trackId || !canCarrySignal(run) ||
    progress.completed.some((r) => r.runId === shiftRunId(run))) return progress;
  return { v: 1, completed: [...progress.completed, { id: next.id, runId: shiftRunId(run) }] };
}

/** Called once from the actual finish path; reading Results never awards progress. */
export function recordShiftRun(run: LastRun): void {
  const previous = loadShiftProgress();
  const next = advanceShift(previous, run);
  if (next === previous) return;
  visitProgress = next;
  const saved = writeJSON(SHIFT_STORAGE_KEY, next);
  volatile = !saved || readItem(SHIFT_STORAGE_KEY) !== JSON.stringify(next);
}

export function shiftReceiptFor(run: LastRun, progress = loadShiftProgress()): ShiftReceipt | undefined {
  return progress.completed.find((receipt) => receipt.id === run.shiftStep && receipt.runId === shiftRunId(run));
}

/** Honest feedback for free play as well as story runs, including failed attempts. */
export function crewResponse(
  run: LastRun,
  district?: string,
  inputSurface: ShiftInputSurface = "keys",
): CrewLine {
  const owner = shiftStep(run.shiftStep)?.speaker ??
    (district === "Chrome Yard" ? "TORQUE" : district === "Skyline Hook" ? "ATLAS" : "JUNO");
  if (run.failed) return { speaker: "TORQUE", text: "Rough take. No one's packing up. Try it slower, or pick another song — I'm still here." };
  if (run.mode === "practice") return { speaker: "ATLAS", text: "That's what rehearsal is for. When you're ready, we'll try a full set." };
  if (run.counts.perfect + run.counts.great + run.counts.good === 0) {
    const action = shiftLaneAction(inputSurface);
    return { speaker: "TORQUE", text: `Just listening? That's fine too. When you want to join in, ${action} as the notes reach the line.` };
  }
  if (run.fc) return { speaker: owner, text: owner === "ATLAS" ? "Not a single gap. I checked. Twice." : owner === "TORQUE" ? "Didn't drop a beat. All right, now you're showing off." : "A whole take, start to finish. I'm keeping that one." };
  return { speaker: owner, text: owner === "ATLAS" ? "I heard the rough spots. I heard you come back in, too. Keep that part." : owner === "TORQUE" ? "You stayed with it. That's someone I can play a set with." : "Heard you on the line. Thanks for sticking around for the whole song." };
}
