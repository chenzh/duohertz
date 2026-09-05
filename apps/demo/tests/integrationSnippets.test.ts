import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { buildJobPayload, buildPythonSnippet, type FormSnapshot } from "../src/lib/integrationSnippets.ts";

const form: FormSnapshot = {
  mode: "game_bgm",
  duration_sec: 30,
  prompt: "A quiet forest",
  style_tags: "j-pop",
  lyrics: "[Verse]\nLyrics from the previous preset",
};

test("BGM and description requests omit stale vocal fields", () => {
  assert.deepEqual(buildJobPayload(form), { mode: "game_bgm", duration_sec: 30, prompt: "A quiet forest" });
  assert.deepEqual(buildJobPayload({ ...form, mode: "vocal_desc" }), {
    mode: "vocal_desc", duration_sec: 30, prompt: "A quiet forest",
  });
});

test("lyric requests omit stale prompts and theme songs retain both inputs", () => {
  assert.deepEqual(buildJobPayload({ ...form, mode: "vocal_lyrics" }), {
    mode: "vocal_lyrics", duration_sec: 30, style_tags: form.style_tags, lyrics: form.lyrics,
  });
  assert.deepEqual(buildJobPayload({ ...form, mode: "game_theme_vocal" }), {
    mode: "game_theme_vocal", duration_sec: 30, prompt: form.prompt, lyrics: form.lyrics,
  });
});

test("copied Python submits once and polls the job it just created", () => {
  const escapedForm = { ...form, mode: "vocal_lyrics" as const, lyrics: '[Verse]\n星の夜 "sing" \\ repeat\nIt\'s fine' };
  const script = buildPythonSnippet(escapedForm, "previous-page-job");
  const prelude = `
import json, urllib.request
calls = []
class Response:
    def __init__(self, data): self.data = data
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def read(self): return json.dumps({"data": self.data}).encode()
def fake_urlopen(req, timeout):
    calls.append((req.method, req.full_url, json.loads(req.data) if req.data else None))
    if req.method == "POST": return Response({"job_id": "newly-created-job"})
    return Response({"status": "completed"})
urllib.request.urlopen = fake_urlopen
`;
  const checks = `
assert len(calls) == 2, calls
assert calls[0][0] == "POST", calls
assert calls[1][0] == "GET" and calls[1][1].endswith("/v1/jobs/newly-created-job"), calls
assert calls[0][2] == json.loads(${JSON.stringify(JSON.stringify(buildJobPayload(escapedForm)))}), calls
`;
  const result = spawnSync("python3", ["-"], { input: prelude + script + checks, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || String(result.error));
});
