import { useMemo, useState } from "react";
import type { PollEntry } from "../hooks/useJobPoll";
import { buildJobPayload, buildPythonSnippet, type FormSnapshot } from "../lib/integrationSnippets";
import type { Messages } from "../i18n";

export function IntegrationPanel({
  form,
  jobId,
  t,
  devMode = false,
  pollLog = [],
  apiDocsUrl,
}: {
  form: FormSnapshot;
  jobId: string | null;
  t: Messages;
  devMode?: boolean;
  pollLog?: PollEntry[];
  apiDocsUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"curl" | "json" | "python">("json");
  const [copied, setCopied] = useState<string | null>(null);

  const payload = useMemo(() => buildJobPayload(form), [form]);
  const body = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

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

  const python = useMemo(() => buildPythonSnippet(form, jobId), [form, jobId]);

  const activeSnippet = tab === "curl" ? curl : tab === "python" ? python : body;

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="integration-panel">
      <button type="button" className="integration-toggle" onClick={() => setOpen((v) => !v)}>
        {t.integration} {open ? "▾" : "▸"}
      </button>
      {open && (
        <div className="integration-body">
          <p className="hint integration-lead">{t.apiExplorerHint}</p>

          <div className="integration-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={tab === "json" ? "active" : ""}
              onClick={() => setTab("json")}
            >
              {t.apiExplorerJson}
            </button>
            <button
              type="button"
              role="tab"
              className={tab === "curl" ? "active" : ""}
              onClick={() => setTab("curl")}
            >
              cURL
            </button>
            <button
              type="button"
              role="tab"
              className={tab === "python" ? "active" : ""}
              onClick={() => setTab("python")}
            >
              Python
            </button>
          </div>

          <p className="hint">
            <code>POST /v1/jobs</code>
          </p>
          <pre className="code-block">{activeSnippet}</pre>
          <button type="button" className="btn-secondary" onClick={() => void copy(activeSnippet, tab)}>
            {copied === tab ? t.copied : t.copySnippet}
          </button>

          {devMode && pollLog.length > 0 && (
            <div className="poll-debug">
              <h3>{t.pollDebugTitle}</h3>
              <ul>
                {pollLog.map((entry, i) => (
                  <li key={`${entry.at}-${i}`}>
                    <code>{entry.at}</code> · <strong>{entry.status}</strong> — {entry.summary}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="integration-footer">
            {apiDocsUrl && (
              <a href={apiDocsUrl} target="_blank" rel="noreferrer">
                {t.apiDocsLink}
              </a>
            )}
            <span className="webhook-placeholder" title={t.webhookHint}>
              {t.webhookPlaceholder}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
