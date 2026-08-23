import type { Mode } from "../api";

export type FormSnapshot = {
  mode: Mode;
  duration_sec: number;
  prompt?: string;
  style_tags?: string;
  lyrics?: string;
};

export function buildJobPayload(form: FormSnapshot): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    mode: form.mode,
    duration_sec: form.duration_sec,
  };
  if (form.prompt) payload.prompt = form.prompt;
  if (form.style_tags) payload.style_tags = form.style_tags;
  if (form.lyrics) payload.lyrics = form.lyrics;
  return payload;
}

export function buildPythonSnippet(form: FormSnapshot, jobId: string | null): string {
  const payload = buildJobPayload(form);
  const payloadLiteral = JSON.stringify(JSON.stringify(payload));
  const pollBlock = jobId
    ? `job = request("GET", "/v1/jobs/${jobId}")`
    : `job = request("GET", f"/v1/jobs/{job_id}")`;
  return `#!/usr/bin/env python3
import json, os, time, urllib.request

API_BASE = os.getenv("API_BASE", "http://127.0.0.1:8080")
API_KEY = os.getenv("API_KEY", "your-api-key")

def request(method, path, body=None):
    headers = {"X-API-Key": API_KEY}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode())

body = json.loads(${payloadLiteral})
created = request("POST", "/v1/jobs", body)
job_id = created["data"]["job_id"]
print("job_id", job_id)

while True:
    ${pollBlock}
    status = job["data"]["status"]
    print(status)
    if status in ("completed", "failed"):
        break
    time.sleep(2)
`;
}
