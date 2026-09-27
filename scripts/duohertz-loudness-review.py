#!/usr/bin/env python3
"""Build a hash-bound, local listening order from decoded duohertz AAC levels.

Level differences are review cues only; this report never approves mastering.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import html
import importlib.util
import json
from pathlib import Path
import statistics
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ROOT = ROOT / "apps/beatscape/candidates/duohertz"
AUDIO_NAMES = ("audio.m4a", "stream.m4a", "preview_48s.m4a")


def module(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {filename}")
    loaded = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = loaded
    spec.loader.exec_module(loaded)
    return loaded


def build_report(tracks: list[dict], measurements: dict[tuple[str, str], tuple[float, float]]) -> dict:
    if not tracks:
        raise ValueError("No candidates to review")
    game_levels = [measurements[(track["track_id"], "audio.m4a")][0] for track in tracks]
    median = statistics.median(game_levels)
    rows = []
    for track in tracks:
        track_id = track["track_id"]
        audio = {}
        for name in AUDIO_NAMES:
            loudness, true_peak = measurements[(track_id, name)]
            audio[name] = {
                "lufs": round(loudness, 2), "true_peak_dbtp": round(true_peak, 2),
                "sha256": track["assets_sha256"][name],
            }
        game = audio["audio.m4a"]["lufs"]
        stream = audio["stream.m4a"]["lufs"]
        row = {
            "track_id": track_id, "title": track["title"], "subgenre": track["subgenre"],
            "manifest_sha256": track["manifest_sha256"], "audio": audio,
            "game_from_median_lu": round(game - median, 2),
            "stream_from_game_lu": round(stream - game, 2),
        }
        row["review_priority_lu"] = round(max(abs(row["game_from_median_lu"]),
                                              abs(row["stream_from_game_lu"])), 2)
        rows.append(row)
    rows.sort(key=lambda row: (-row["review_priority_lu"], row["track_id"]))
    return {
        "schema": 1, "scope": "duohertz_loudness_review", "releaseApproval": False,
        "method": "ffmpeg loudnorm input_i/input_tp on decoded AAC; priority=max(|game-median|, |stream-game|)",
        "summary": {
            "tracks": len(rows), "game_median_lufs": round(median, 2),
            "game_min_lufs": round(min(game_levels), 2), "game_max_lufs": round(max(game_levels), 2),
        },
        "tracks": rows,
    }


def render(report: dict) -> str:
    summary = report["summary"]
    rows = []
    for index, track in enumerate(report["tracks"], 1):
        track_id = html.escape(track["track_id"], quote=True)
        title = html.escape(str(track["title"]))
        genre = html.escape(str(track["subgenre"]))
        audio = track["audio"]
        rows.append(
            f'<tr><td>{index}</td><td><a href="review-worksheet.html#{track_id}">{title}</a>'
            f'<small>{track_id} · {genre}</small></td>'
            f'<td>{audio["audio.m4a"]["lufs"]:+.2f}</td>'
            f'<td>{audio["stream.m4a"]["lufs"]:+.2f}</td>'
            f'<td>{audio["preview_48s.m4a"]["lufs"]:+.2f}</td>'
            f'<td>{track["game_from_median_lu"]:+.2f}</td>'
            f'<td>{track["stream_from_game_lu"]:+.2f}</td>'
            f'<td>{max(item["true_peak_dbtp"] for item in audio.values()):+.2f}</td>'
            f'<td><details><summary>Hashes</summary><code>manifest {track["manifest_sha256"]}<br>'
            f'game {audio["audio.m4a"]["sha256"]}<br>station {audio["stream.m4a"]["sha256"]}'
            f'<br>preview {audio["preview_48s.m4a"]["sha256"]}</code></details></td></tr>'
        )
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>duohertz · loudness listening order</title>
<style>
body{{font:16px/1.5 system-ui,sans-serif;background:#10192a;color:#f7fafc;max-width:1400px;margin:auto;padding:24px}}
a{{color:#8cebdc}}p{{max-width:80ch}}table{{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}}
th,td{{padding:10px 8px;border-bottom:1px solid #435876;text-align:right;vertical-align:top}}
th:nth-child(2),td:nth-child(2){{text-align:left}}small{{display:block;color:#b5c6dc}}
thead{{position:sticky;top:0;background:#172843}}code{{font-size:11px;overflow-wrap:anywhere}}
.scroll{{overflow-x:auto}}@media(max-width:650px){{body{{padding:12px}}table{{min-width:950px}}}}
</style></head><body>
<h1>duohertz · loudness listening order</h1>
<p>{summary["tracks"]} current hash-bound candidates · game median {summary["game_median_lufs"]:+.2f} LUFS · game range {summary["game_min_lufs"]:+.2f} to {summary["game_max_lufs"]:+.2f} LUFS.</p>
<p>Sorted by the larger of distance from the game median and station-versus-game difference. All values come from decoded AAC. Listen to each full track, transitions and neighboring tracks before deciding whether to adjust anything. This is a review queue, not a loudness pass, mastering approval, rights check or release approval.</p>
<div class="scroll"><table><thead><tr><th>#</th><th>Candidate</th><th>Game LUFS</th><th>Station LUFS</th><th>Preview LUFS</th><th>Game vs median LU</th><th>Station vs game LU</th><th>Highest true peak dBTP</th><th>Source</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table></div></body></html>
'''


def measure(root: Path) -> dict:
    worksheet = module("duohertz_worksheet_for_loudness_review", "duohertz-review-worksheet.py")
    audio_gate = module("duohertz_audio_gate_for_loudness_review", "duohertz-audio-gate.py")
    tracks = worksheet.candidates(root)
    paths = [root / track["track_id"] / name for track in tracks for name in AUDIO_NAMES]
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(audio_gate.measure, paths))
    for track in tracks:
        track_id = track["track_id"]
        if worksheet.sha(root / track_id / "manifest.json") != track["manifest_sha256"]:
            raise ValueError(f"Manifest changed during measurement: {track_id}")
        for name in AUDIO_NAMES:
            if worksheet.sha(root / track_id / name) != track["assets_sha256"][name]:
                raise ValueError(f"Audio changed during measurement: {track_id}/{name}")
    measurements = {(path.parent.name, path.name): (lufs, peak) for path, lufs, peak in results}
    return build_report(tracks, measurements)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--out", type=Path, help="HTML output; JSON is written beside it")
    args = parser.parse_args()
    root = args.root.resolve()
    output = args.out or root / "loudness-review.html"
    if output.suffix != ".html" or output.parent.resolve() != root:
        parser.error("--out must be an HTML file directly inside the candidate root")
    if output.is_symlink() or output.with_suffix(".json").is_symlink():
        parser.error("Report outputs cannot be symlinks")
    try:
        report = measure(root)
        output.with_suffix(".json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        output.write_text(render(report), encoding="utf-8")
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        print(f"FAIL {error}", file=sys.stderr)
        return 1
    print(f"Wrote {output} and {output.with_suffix('.json')} ({report['summary']['tracks']} candidates; no approval)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
