#!/usr/bin/env python3
"""Generate the human ear-check worksheet (HTML) for BeatScape masters.

Produces apps/beatscape/earcheck-worksheet.html — a repo-local listening sheet
(NOT shipped: lives outside public/) with one row per track: inline audio
player + verdict radios. Verdicts persist in localStorage so the check can be
spread across sittings.

Usage:
  python3 scripts/beatscape-earcheck-worksheet.py               # new 50 (stage6)
  python3 scripts/beatscape-earcheck-worksheet.py --all         # full catalog
"""

from __future__ import annotations

import argparse
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "scripts" / "beatscape-stage6-manifest.json"
CATALOG_JSON = ROOT / "apps" / "beatscape" / "public" / "catalog.json"
OUT = ROOT / "apps" / "beatscape" / "earcheck-worksheet.html"

ROWS = """
  <tr data-tid="{tid}">
    <td class="idx">{i}</td>
    <td class="meta"><strong>{title}</strong><span>{artist} · {vibe} · {bpm} BPM</span></td>
    <td class="player"><audio controls preload="none" src="{src}"></audio></td>
    <td class="verdict">
      <label><input type="radio" name="v-{tid}" value="clear">Clear</label>
      <label><input type="radio" name="v-{tid}" value="derivative">Derivative</label>
      <input type="text" class="note" name="n-{tid}" placeholder="which song?">
    </td>
  </tr>
"""

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>BeatScape — Human Ear-Check Worksheet</title>
<style>
  :root { color-scheme: dark; }
  body { background: #101014; color: #e8e4da; font: 14px/1.5 -apple-system, sans-serif; margin: 0; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #9a958a; margin: 0 0 16px; }
  .progress { position: sticky; top: 0; background: #101014; padding: 10px 0; border-bottom: 1px solid #2a2a30; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; margin-top: 12px; }
  td { padding: 10px 8px; border-bottom: 1px solid #232329; vertical-align: middle; }
  tr.done { opacity: 0.55; }
  .idx { color: #6d6a62; width: 32px; }
  .meta strong { display: block; }
  .meta span { color: #9a958a; font-size: 12px; }
  audio { width: 340px; max-width: 100%; height: 32px; }
  .verdict label { margin-right: 12px; cursor: pointer; }
  .verdict input[type="text"] { width: 180px; background: #1a1a20; color: inherit; border: 1px solid #33333b; border-radius: 6px; padding: 4px 8px; margin-left: 4px; }
  tr[data-verdict="derivative"] { background: rgba(226, 61, 61, 0.12); }
</style>
</head>
<body>
<h1>Human Ear-Check Worksheet — __SCOPE__</h1>
<p class="sub">For each track: play the full stream master. Ask exactly one question — <em>&ldquo;does this remind me of a specific existing song?&rdquo;</em> If yes, mark Derivative and name the song. Verdicts save to this browser automatically.</p>
<p class="progress" id="progress">Checked: 0 / __COUNT__</p>
<table>
__ROWS__
</table>
<script>
  const KEY = "bs_earcheck___SCOPE_KEY__";
  const state = JSON.parse(localStorage.getItem(KEY) || "{}");
  const rows = [...document.querySelectorAll("tr[data-tid]")];
  function apply() {
    let done = 0;
    for (const tr of rows) {
      const tid = tr.dataset.tid;
      const v = state[tid]?.v || "";
      const note = state[tid]?.note || "";
      tr.querySelector(`input[value="clear"]`).checked = v === "clear";
      tr.querySelector(`input[value="derivative"]`).checked = v === "derivative";
      tr.querySelector(".note").value = note;
      tr.dataset.verdict = v;
      tr.classList.toggle("done", !!v);
      if (v) done++;
    }
    document.getElementById("progress").textContent = "Checked: " + done + " / " + rows.length;
  }
  rows.forEach((tr) => {
    const tid = tr.dataset.tid;
    tr.addEventListener("change", (e) => {
      if (e.target.type === "radio") {
        state[tid] = { ...(state[tid] || {}), v: e.target.value };
      } else if (e.target.classList.contains("note")) {
        state[tid] = { ...(state[tid] || {}), note: e.target.value };
      }
      localStorage.setItem(KEY, JSON.stringify(state));
      apply();
    });
  });
  apply();
</script>
</body>
</html>
"""


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate human ear-check worksheet HTML")
    ap.add_argument("--all", action="store_true", help="full catalog instead of stage6 new tracks")
    args = ap.parse_args()

    catalog = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
    entries = catalog["tracks"] if isinstance(catalog, dict) else catalog
    by_id = {e["track_id"]: e for e in entries}

    if args.all:
        ids = [e["track_id"] for e in entries]
        scope = "full catalog"
        scope_key = "all"
    else:
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        ids = [t["track_id"] for t in manifest["tracks"]]
        scope = "new 50 (Stage6)"
        scope_key = "new50"

    rows: list[str] = []
    for i, tid in enumerate(ids, 1):
        e = by_id.get(tid)
        if not e:
            raise SystemExit(f"track {tid} in manifest but missing from catalog.json")
        stream = str(e["stream_audio"]).lstrip("/")
        rows.append(
            ROWS.format(
                tid=html.escape(tid),
                i=i,
                title=html.escape(e["title"]),
                artist=html.escape(e["artist"]),
                vibe=html.escape(str(e.get("vibe", "?"))),
                bpm=e.get("bpm", "?"),
                src=html.escape(f"public/{stream}"),
            )
        )

    html_out = (
        TEMPLATE.replace("__SCOPE__", scope)
        .replace("__SCOPE_KEY__", scope_key)
        .replace("__COUNT__", str(len(ids)))
        .replace("__ROWS__", "\n".join(rows))
    )
    OUT.write_text(html_out, encoding="utf-8")
    print(f"Wrote {OUT} ({len(ids)} tracks, {scope})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
