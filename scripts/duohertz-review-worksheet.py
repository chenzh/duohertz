#!/usr/bin/env python3
"""Build a repo-local listening worksheet for staged duohertz candidates.

The worksheet exports reviewer observations bound to exact candidate hashes.
It never changes candidate manifests or grants rights/release approval.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "apps/beatscape/candidates/duohertz"
OUT = CANDIDATES / "review-worksheet.html"
REQUIRED_FILES = {
    "audio.m4a", "stream.m4a", "preview_48s.m4a",
    "easy.json", "standard.json", "hard.json",
    "cover-art.png", "cover.svg", "og.png",
}

ROW = """
<article class="candidate" id="{track_id}" data-track-id="{track_id}">
  <div class="identity">
    <img src="{cover}" width="190" height="190" loading="lazy" alt="{title} cover candidate">
    <div>
      <p class="index">Candidate {index:02d} · {subgenre}</p>
      <h2>{title}</h2>
      <p>{bpm} BPM · {duration}s · {track_id}</p>
      <p class="pending">Internal candidate · no human approval recorded</p>
      <a href="{og}" target="_blank" rel="noopener">Inspect 1200×630 sharing art</a>
    </div>
  </div>
  <div class="players">
    <label>Full station audio <audio controls preload="none" src="{full}"></audio></label>
    <label>Game mix <audio controls preload="none" src="{game}"></audio></label>
    <label>48-second preview <audio controls preload="none" src="{preview}"></audio></label>
  </div>
  <details><summary>Exact asset fingerprints</summary>
    <dl><dt>Full station audio SHA-256</dt><dd>{audio_sha}</dd>
        <dt>Game mix SHA-256</dt><dd>{game_audio_sha}</dd>
        <dt>Preview SHA-256</dt><dd>{preview_audio_sha}</dd>
        <dt>Cover PNG SHA-256</dt><dd>{cover_sha}</dd>
        <dt>OG PNG SHA-256</dt><dd>{og_sha}</dd>
        <dt>All-asset fingerprint</dt><dd>{fingerprint}</dd></dl>
  </details>
  <fieldset><legend>Human observations for this exact asset set</legend>
    <div class="questions" data-questions></div>
    <label class="notes">Reviewer notes <textarea rows="3" placeholder="Specific timestamp, comparison, issue, or reason for your verdict"></textarea></label>
  </fieldset>
</article>
"""

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>duohertz · candidate review worksheet</title>
<style>
  :root { color-scheme: dark; font: 15px/1.5 system-ui, sans-serif; }
  body { max-width: 1100px; margin: auto; padding: 24px; color: #f3f8ff; background: #0c1829; }
  h1 { margin: 0; font-size: clamp(28px, 5vw, 42px); }
  h2 { margin: 4px 0; font-size: 25px; }
  p { margin: 6px 0; }
  .intro { max-width: 85ch; color: #c0d0e6; }
  .toolbar { position: sticky; z-index: 3; top: 0; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 12px 0; background: #0c1829; border-bottom: 1px solid #46617b; }
  .toolbar input, .toolbar select { min-height: 42px; padding: 0 10px; color: inherit; background: #152940; border: 1px solid #6084a0; border-radius: 8px; }
  .toolbar input[type="file"] { max-width: 230px; padding: 8px; }
  .candidate[hidden] { display: none; }
  button { min-height: 44px; padding: 9px 14px; color: #062633; background: #8cebdc; border: 0; border-radius: 8px; font-weight: 700; cursor: pointer; }
  .candidate { margin: 20px 0; padding: 18px; background: #14273c; border: 1px solid #456480; border-radius: 16px; scroll-margin-top: 150px; }
  .identity { display: flex; gap: 18px; align-items: center; }
  .identity img { width: 190px; height: 190px; object-fit: cover; border-radius: 12px; }
  .index { color: #8cebdc; font-weight: 700; }
  .pending { color: #ffd59a; }
  a { color: #a7f0e7; }
  .players { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 18px 0; }
  .players label { color: #cbd9e8; font-weight: 600; }
  audio { display: block; width: 100%; margin-top: 6px; }
  details { overflow-wrap: anywhere; color: #b9c9dc; }
  details dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 4px 12px; font: 11px/1.4 ui-monospace, monospace; }
  details dd { margin: 0; }
  fieldset { margin: 18px 0 0; padding: 12px; border: 1px solid #56738d; border-radius: 10px; }
  legend { padding: 0 6px; font-weight: 700; }
  .questions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .question { padding: 8px; background: #1a344e; border-radius: 8px; }
  .question strong { display: block; margin-bottom: 6px; }
  .question label { display: inline-flex; gap: 4px; align-items: center; margin-right: 10px; cursor: pointer; }
  .notes { display: block; margin-top: 14px; }
  textarea { display: block; box-sizing: border-box; width: 100%; min-height: 76px; margin-top: 6px; padding: 8px; color: inherit; background: #0d2034; border: 1px solid #6084a0; border-radius: 8px; font: inherit; }
  @media (max-width: 700px) { body { padding: 14px; } .identity { align-items: flex-start; } .identity img { width: 96px; height: 96px; } .players, .questions { grid-template-columns: 1fr; } details dl { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<h1>duohertz · candidate review worksheet</h1>
<p class="intro">Listen to the full station audio, game mix and preview, inspect the exact cover PNG and sharing art, and play each chart in the local development Lab before judging chart feel. These are technical candidates, not released tracks. Revise or Reject requires a specific note before the review counts as complete. The worksheet records observations only: rights clearance, formal art approval and release signoff require separate evidence.</p>
<div class="toolbar">
  <strong id="progress" role="status">Reviewed: 0 / __COUNT__</strong>
  <label>Reviewer <input id="reviewer" autocomplete="name" placeholder="Your name"></label>
  <label>Find track <input id="search" type="search" placeholder="Title or ID"></label>
  <label>Show <select id="filter"><option value="all">All</option><option value="pending">Pending</option><option value="revise">Needs revision</option><option value="complete">Complete</option></select></label>
  <label>Import saved observations (replaces local draft) <input id="import" type="file" accept="application/json,.json" aria-label="Import saved observations"></label>
  <button type="button" id="export">Export hash-bound JSON</button>
  <span id="message" role="status"></span>
</div>
__ROWS__
<script>
const TRACKS = __TRACKS__;
const QUESTIONS = [
  ["audioQuality", "Music quality and clean ending"],
  ["distinctness", "No specific existing song recalled"],
  ["allAges", "Suitable for children and families"],
  ["subgenreFit", "Named electronic style is convincing"],
  ["chartFeel", "One/two-key chart feel after playing"],
  ["visual", "Cover and sharing art fit the music"],
];
const STORE_KEY = "duohertz_candidate_reviews_v1";
let state = {};
try { state = JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch {}
if (!state || typeof state !== "object" || Array.isArray(state)) state = {};
const byId = new Map(TRACKS.map((track) => [track.track_id, track]));
const VERDICTS = new Set(["pass", "revise", "reject"]);
const validTimestamp = (value) => typeof value === "string"
  && /(?:Z|[+-]\\d{2}:\\d{2})$/.test(value) && Number.isFinite(Date.parse(value));

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch { document.getElementById("message").textContent = "Browser storage unavailable; export before closing."; }
}
function current(track) {
  const item = state[track.track_id];
  return item?.fingerprint === track.fingerprint ? item : { fingerprint: track.fingerprint, verdicts: {}, notes: "" };
}
function status(track) {
  const item = current(track);
  if (!item.reviewedAt || !QUESTIONS.every(([key]) => VERDICTS.has(item.verdicts?.[key]))) return "pending";
  if (Object.values(item.verdicts).some((value) => value !== "pass")) {
    return typeof item.notes === "string" && item.notes.trim() ? "revise" : "pending";
  }
  return "complete";
}
function updateProgress() {
  const done = TRACKS.filter((track) => status(track) !== "pending").length;
  document.getElementById("progress").textContent = `Reviewed: ${done} / ${TRACKS.length}`;
  const query = document.getElementById("search").value.trim().toLowerCase();
  const filter = document.getElementById("filter").value;
  for (const article of document.querySelectorAll(".candidate")) {
    const track = byId.get(article.dataset.trackId);
    article.hidden = (filter !== "all" && status(track) !== filter)
      || !`${track.title} ${track.track_id} ${track.subgenre}`.toLowerCase().includes(query);
  }
}
function renderDraft() {
  for (const article of document.querySelectorAll(".candidate")) {
    const track = byId.get(article.dataset.trackId);
    const item = current(track);
    for (const input of article.querySelectorAll('input[type="radio"]')) {
      input.checked = item.verdicts?.[input.dataset.question] === input.value;
    }
    article.querySelector("textarea").value = item.notes;
  }
  updateProgress();
}
for (const article of document.querySelectorAll(".candidate")) {
  const track = byId.get(article.dataset.trackId);
  const questions = article.querySelector("[data-questions]");
  for (const [key, label] of QUESTIONS) {
    const box = document.createElement("div");
    box.className = "question";
    const heading = document.createElement("strong");
    heading.textContent = label;
    box.append(heading);
    for (const [value, caption] of [["pass", "Pass"], ["revise", "Revise"], ["reject", "Reject"]]) {
      const option = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `${track.track_id}-${key}`;
      input.dataset.question = key;
      input.value = value;
      input.checked = current(track).verdicts[key] === value;
      input.addEventListener("change", () => {
        const item = current(track);
        item.verdicts[key] = value;
        item.reviewedAt = new Date().toISOString();
        state[track.track_id] = item;
        save(); updateProgress();
      });
      option.append(input, caption);
      box.append(option);
    }
    questions.append(box);
  }
  const notes = article.querySelector("textarea");
  notes.value = current(track).notes;
  notes.addEventListener("input", () => {
    const item = current(track);
    item.notes = notes.value;
    state[track.track_id] = item;
    save(); updateProgress();
  });
}
document.getElementById("search").addEventListener("input", updateProgress);
document.getElementById("filter").addEventListener("change", updateProgress);
document.getElementById("import").addEventListener("change", async (event) => {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const report = JSON.parse(await file.text());
    if (report.schema !== 1 || report.scope !== "duohertz_candidate_observations"
        || report.releaseApproval !== false || !Array.isArray(report.tracks)
        || report.tracks.length !== TRACKS.length || typeof report.reviewer !== "string"
        || !report.reviewer.trim() || !validTimestamp(report.exportedAt)) {
      throw new Error("Wrong worksheet export or candidate count");
    }
    const imported = {};
    for (const row of report.tracks) {
      const track = byId.get(row.track_id);
      if (!track || Object.hasOwn(imported, row.track_id)
          || row.title !== track.title || row.subgenre !== track.subgenre
          || row.fingerprint !== track.fingerprint || row.manifest_sha256 !== track.manifest_sha256
          || row.rights_status !== track.rights_status
          || !row.assets_sha256 || Object.keys(row.assets_sha256).length !== Object.keys(track.assets_sha256).length
          || Object.entries(track.assets_sha256).some(([name, hash]) => row.assets_sha256[name] !== hash)
          || !row.verdicts || typeof row.verdicts !== "object" || Array.isArray(row.verdicts)
          || Object.entries(row.verdicts).some(([key, value]) => !QUESTIONS.some(([question]) => question === key) || !VERDICTS.has(value))
          || typeof row.notes !== "string"
          || (row.reviewedAt !== null && (!validTimestamp(row.reviewedAt)
            || Date.parse(row.reviewedAt) > Date.parse(report.exportedAt)))) {
        throw new Error(`Stale or invalid observation: ${row.track_id || "unknown"}`);
      }
      imported[row.track_id] = { fingerprint: row.fingerprint, verdicts: row.verdicts,
        notes: row.notes, reviewedAt: row.reviewedAt };
    }
    state = imported;
    document.getElementById("reviewer").value = report.reviewer;
    save(); renderDraft();
    document.getElementById("message").textContent = "Imported matching local observations; release approval remains separate.";
  } catch (error) {
    document.getElementById("message").textContent = `Import rejected: ${error.message}. Existing draft kept.`;
  } finally {
    input.value = "";
  }
});
document.querySelectorAll("audio").forEach((player) => player.addEventListener("play", () => {
  document.querySelectorAll("audio").forEach((other) => { if (other !== player) other.pause(); });
}));
document.getElementById("export").addEventListener("click", () => {
  const reviewer = document.getElementById("reviewer").value.trim();
  if (!reviewer) { document.getElementById("message").textContent = "Enter reviewer name before export."; return; }
  const report = {
    schema: 1, scope: "duohertz_candidate_observations", reviewer,
    exportedAt: new Date().toISOString(), releaseApproval: false,
    tracks: TRACKS.map((track) => ({
      track_id: track.track_id, title: track.title, subgenre: track.subgenre,
      fingerprint: track.fingerprint, manifest_sha256: track.manifest_sha256,
      assets_sha256: track.assets_sha256, rights_status: track.rights_status,
      verdicts: current(track).verdicts, notes: current(track).notes,
      reviewedAt: current(track).reviewedAt || null,
    })),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `duohertz-candidate-review-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.getElementById("message").textContent = "Exported observations; no release approval granted.";
});
updateProgress();
</script>
</body>
</html>
"""


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def candidates(root: Path | None = None) -> list[dict]:
    root = CANDIDATES if root is None else root
    tracks: list[dict] = []
    for directory in sorted(root.glob("dh-*")):
        manifest_path = directory / "manifest.json"
        if directory.is_symlink() or not directory.is_dir() or not manifest_path.is_file() or manifest_path.is_symlink():
            raise ValueError(f"Incomplete staged candidate: {directory}")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        track_id = manifest.get("track_id")
        if not isinstance(track_id, str) or not re.fullmatch(r"dh-[a-z0-9-]+", track_id) or directory.name != track_id:
            raise ValueError(f"Candidate identity mismatch: {manifest_path}")
        assets = manifest.get("files_sha256")
        if not isinstance(assets, dict) or set(assets) != REQUIRED_FILES:
            raise ValueError(f"Incomplete asset list: {track_id}")
        for name, expected in assets.items():
            path = directory / name
            if not isinstance(expected, str) or not path.is_file() or path.is_symlink() or sha(path) != expected:
                raise ValueError(f"Missing or changed asset: {track_id}/{name}")
        if manifest.get("rights_status") != "internal_candidate_unreviewed":
            raise ValueError(f"Unexpected rights status in candidate: {track_id}")
        fingerprint = hashlib.sha256(json.dumps(assets, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        tracks.append({
            "track_id": track_id,
            "title": manifest["title"],
            "subgenre": manifest["subgenre"],
            "bpm": manifest["bpm"],
            "duration_sec": manifest["duration_sec"],
            "rights_status": manifest["rights_status"],
            "manifest_sha256": sha(manifest_path),
            "assets_sha256": assets,
            "fingerprint": fingerprint,
        })
    if not tracks:
        raise ValueError("No staged duohertz candidates found")
    ids = [track["track_id"] for track in tracks]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate staged track ID")
    return tracks


def build() -> tuple[str, int]:
    tracks = candidates()
    rows = []
    for index, track in enumerate(tracks, 1):
        slug = quote(track["track_id"], safe="")
        assets = track["assets_sha256"]
        rows.append(ROW.format(
            track_id=html.escape(track["track_id"], quote=True),
            index=index,
            title=html.escape(str(track["title"])),
            subgenre=html.escape(str(track["subgenre"])),
            bpm=html.escape(str(track["bpm"])),
            duration=html.escape(str(track["duration_sec"])),
            cover=f"{slug}/cover-art.png", og=f"{slug}/og.png",
            full=f"{slug}/stream.m4a", game=f"{slug}/audio.m4a", preview=f"{slug}/preview_48s.m4a",
            audio_sha=assets["stream.m4a"], game_audio_sha=assets["audio.m4a"],
            preview_audio_sha=assets["preview_48s.m4a"], cover_sha=assets["cover-art.png"],
            og_sha=assets["og.png"], fingerprint=track["fingerprint"],
        ))
    data = json.dumps(tracks, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    page = TEMPLATE.replace("__COUNT__", str(len(tracks))).replace("__ROWS__", "\n".join(rows)).replace("__TRACKS__", data)
    return page, len(tracks)


def main() -> int:
    page, count = build()
    OUT.write_text(page, encoding="utf-8")
    print(f"Wrote {OUT} ({count} hash-bound candidates; review pending)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
