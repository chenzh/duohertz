import { useMemo, useState } from "react";
import type { Mode } from "../api";
import type { Messages } from "../i18n";

type FormSnapshot = {
  mode: Mode;
  duration_sec: number;
  prompt?: string;
  style_tags?: string;
  lyrics?: string;
};

export function IntegrationPanel({
  form,
  jobId,
  t,
}: {
  form: FormSnapshot;
  jobId: string | null;
  t: Messages;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const body = useMemo(() => {
    const payload: Record<string, unknown> = {
      mode: form.mode,
      duration_sec: form.duration_sec,
    };
    if (form.prompt) payload.prompt = form.prompt;
    if (form.style_tags) payload.style_tags = form.style_tags;
    if (form.lyrics) payload.lyrics = form.lyrics;
    return JSON.stringify(payload, null, 2);
  }, [form]);

  const curl = useMemo(() => {
    const lines = [
      `curl -sS -X POST "$API_BASE/v1/jobs" \\`,
      `  -H "X-API-Key: $API_KEY" \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '${body.replace(/'/g, "'\\''")}'`,
    ];
    if (jobId) {
      lines.push("", `# poll: curl -H "X-API-Key: $API_KEY" $API_BASE/v1/jobs/${jobId}`);
      lines.push(`# audio: curl -H "X-API-Key: $API_KEY" $API_BASE/v1/jobs/${jobId}/audio -o out.wav`);
    }
    return lines.join("\n");
  }, [body, jobId]);

  async function copyCurl() {
    await navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="integration-panel">
      <button type="button" className="integration-toggle" onClick={() => setOpen((v) => !v)}>
        {t.integration} {open ? "▾" : "▸"}
      </button>
      {open && (
        <div className="integration-body">
          <pre className="code-block">{curl}</pre>
          <button type="button" className="btn-secondary" onClick={() => void copyCurl()}>
            {copied ? t.copied : t.copyCurl}
          </button>
          <p className="hint">
            Python: <code>examples/python/minimal_client.py</code>
          </p>
        </div>
      )}
    </div>
  );
}
