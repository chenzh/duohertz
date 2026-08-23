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

export function useJobPoll(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [pollLog, setPollLog] = useState<PollEntry[]>([]);

  const poll = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await getJob(jobId);
      setJob(data);
      setPollLog((prev) =>
        [
          {
            at: new Date().toISOString().slice(11, 19),
            status: data.status,
            summary: `latency_ms=${data.latency_ms ?? "—"}`,
          },
          ...prev,
        ].slice(0, POLL_LOG_MAX),
      );
      if (data.status === "failed") {
        const err = data.error;
        setError(err ? `${err.code}: ${err.message}` : "failed");
      } else {
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "poll error");
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setPollLog([]);
      return;
    }
    const start = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - start > MAX_POLL_MS) {
        setTimedOut(true);
        clearInterval(timer);
        return;
      }
      await poll();
    }, INTERVAL_MS);
    void poll();
    return () => clearInterval(timer);
  }, [jobId, poll]);

  useEffect(() => {
    if (job?.status === "completed" || job?.status === "failed") {
      // stop visual spinner via parent reading status
    }
  }, [job?.status]);

  return { job, error, timedOut, pollLog, refresh: poll };
}
