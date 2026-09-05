import { useCallback, useEffect, useState } from "react";
import type { Job } from "../api";
import { getJob } from "../api";

const MAX_POLL_MS = 10 * 60 * 1000;
const INTERVAL_MS = 2000;
const POLL_LOG_MAX = 5;

export type PollEntry = {
  at: string;
  status: string;
  summary: string;
};

type PollState = {
  jobId: string | null;
  job: Job | null;
  error: string | null;
  timedOut: boolean;
  pollLog: PollEntry[];
};

function emptyState(jobId: string | null): PollState {
  return { jobId, job: null, error: null, timedOut: false, pollLog: [] };
}

export function useJobPoll(jobId: string | null) {
  const [state, setState] = useState<PollState>(() => emptyState(jobId));
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    setState(emptyState(jobId));
    if (!jobId) return;

    let stopped = false;
    let nextPoll: ReturnType<typeof setTimeout> | undefined;
    const deadline = setTimeout(() => {
      stopped = true;
      clearTimeout(nextPoll);
      setState((current) => ({ ...current, timedOut: true }));
    }, MAX_POLL_MS);

    async function poll() {
      try {
        const data = await getJob(jobId!);
        if (stopped) return;
        if (!data || data.job_id !== jobId) throw new Error("Unexpected job response");
        const terminal = data.status === "completed" || data.status === "failed";
        setState((current) => ({
          jobId,
          job: data,
          error: data.status === "failed"
            ? data.error ? `${data.error.code}: ${data.error.message}` : "failed"
            : null,
          timedOut: false,
          pollLog: [{
            at: new Date().toISOString().slice(11, 19),
            status: data.status,
            summary: `latency_ms=${data.latency_ms ?? "—"}`,
          }, ...current.pollLog].slice(0, POLL_LOG_MAX),
        }));
        if (terminal) {
          stopped = true;
          clearTimeout(deadline);
          return;
        }
      } catch (error) {
        if (stopped) return;
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : "poll error",
        }));
      }
      if (!stopped) nextPoll = setTimeout(() => void poll(), INTERVAL_MS);
    }

    void poll();
    return () => {
      stopped = true;
      clearTimeout(nextPoll);
      clearTimeout(deadline);
    };
  }, [jobId, revision]);

  // Do not expose the previous task while the new task's effect is starting.
  const current = state.jobId === jobId ? state : emptyState(jobId);
  return { job: current.job, error: current.error, timedOut: current.timedOut, pollLog: current.pollLog, refresh };
}
