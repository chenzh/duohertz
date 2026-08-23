import { useCallback, useEffect, useState } from "react";
import type { Job } from "../api";
import { getJob } from "../api";

const MAX_POLL_MS = 10 * 60 * 1000;
const INTERVAL_MS = 2000;

export function useJobPoll(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const poll = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await getJob(jobId);
      setJob(data);
      setError(data.status === "failed" ? data.error?.message ?? "failed" : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "poll error");
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
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

  return { job, error, timedOut, refresh: poll };
}
