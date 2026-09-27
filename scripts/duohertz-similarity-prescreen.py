#!/usr/bin/env python3
"""Rank local duohertz previews for human similarity listening; never approve music."""

from __future__ import annotations

import argparse
import html
import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "apps/beatscape/candidates/duohertz"
SAMPLE_RATE = 11025
FRAME_SIZE = 4096
HOP_SIZE = 2048
ALGORITHM = "48s-chroma-1s-profile-and-alignment-v1"


def candidate_rows(root: Path) -> list[dict]:
    source = ROOT / "scripts/duohertz-review-worksheet.py"
    spec = importlib.util.spec_from_file_location("duohertz_worksheet_for_similarity", source)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load the candidate asset checker")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module.candidates(root)


def decode_preview(path: Path) -> np.ndarray:
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg is required for local preview decoding")
    result = subprocess.run([
        "ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-t", "48",
        "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "f32le", "pipe:1",
    ], capture_output=True, check=True)
    samples = np.frombuffer(result.stdout, dtype="<f4")
    if samples.size < SAMPLE_RATE * 20 or not np.isfinite(samples).all():
        raise ValueError(f"Invalid or too-short preview: {path}")
    return samples


def chroma_seconds(samples: np.ndarray) -> np.ndarray:
    """Twelve pitch-class energies per second; a coarse triage feature only."""
    if samples.size < FRAME_SIZE:
        raise ValueError("Audio is shorter than one analysis frame")
    frames = np.lib.stride_tricks.sliding_window_view(samples, FRAME_SIZE)[::HOP_SIZE]
    spectrum = np.sqrt(np.abs(np.fft.rfft(frames * np.hanning(FRAME_SIZE), axis=1)))
    frequencies = np.fft.rfftfreq(FRAME_SIZE, 1 / SAMPLE_RATE)
    useful = (frequencies >= 80) & (frequencies <= 3500)
    pitch_class = np.rint(69 + 12 * np.log2(frequencies[useful] / 440)).astype(int) % 12
    chroma = np.stack([
        spectrum[:, useful][:, pitch_class == note].sum(axis=1)
        for note in range(12)
    ], axis=1)
    seconds = np.floor((np.arange(len(chroma)) * HOP_SIZE + FRAME_SIZE / 2) / SAMPLE_RATE).astype(int)
    result = np.zeros((int(seconds[-1]) + 1, 12), dtype=np.float64)
    counts = np.bincount(seconds, minlength=len(result))
    np.add.at(result, seconds, chroma)
    result /= np.maximum(counts[:, None], 1)
    result = np.log1p(result)
    norms = np.linalg.norm(result, axis=1, keepdims=True)
    return result / np.maximum(norms, 1e-12)


def profile(chroma: np.ndarray) -> np.ndarray:
    average = chroma.mean(axis=0)
    return average / max(float(np.linalg.norm(average)), 1e-12)


def profile_similarity(first: np.ndarray, second: np.ndarray) -> float:
    return max(float(np.dot(first, np.roll(second, shift))) for shift in range(12))


def aligned_similarity(first: np.ndarray, second: np.ndarray) -> dict:
    """Find a short time/pitch shift, then rank; scores are not verdicts."""
    first_profile = profile(first)
    second_profile = profile(second)
    first_centered = first - first.mean(axis=0)
    second_centered = second - second.mean(axis=0)
    best = {"score": -1.0, "profile_score": 0.0, "temporal_score": 0.0,
            "time_shift_sec": 0, "pitch_shift_semitones": 0}
    for pitch_shift in range(12):
        rolled = np.roll(second_centered, pitch_shift, axis=1)
        global_score = float(np.dot(first_profile, np.roll(second_profile, pitch_shift)))
        for time_shift in range(-5, 6):
            left = first_centered[max(time_shift, 0):]
            right = rolled[max(-time_shift, 0):]
            length = min(len(left), len(right))
            if length < 12:
                continue
            left, right = left[:length], right[:length]
            denominator = float(np.linalg.norm(left) * np.linalg.norm(right))
            temporal = max(0.0, float(np.sum(left * right) / denominator)) if denominator > 1e-12 else 0.0
            score = 0.7 * temporal + 0.3 * global_score
            if score > best["score"]:
                best = {"score": score, "profile_score": global_score, "temporal_score": temporal,
                        "time_shift_sec": time_shift, "pitch_shift_semitones": pitch_shift}
    return best


def rank_pairs(rows: list[dict], features: list[np.ndarray], shortlist: int, top: int) -> tuple[list[dict], int]:
    profiles = [profile(feature) for feature in features]
    candidates = sorted((
        (profile_similarity(profiles[i], profiles[j]), i, j)
        for i in range(len(rows)) for j in range(i + 1, len(rows))
    ), reverse=True)
    refined = []
    for _, i, j in candidates[:shortlist]:
        scores = aligned_similarity(features[i], features[j])
        refined.append({"a": rows[i]["track_id"], "b": rows[j]["track_id"], **scores})
    refined.sort(key=lambda pair: pair["score"], reverse=True)
    selected: list[dict] = []
    appearances: dict[str, int] = {}
    for pair in refined:
        if appearances.get(pair["a"], 0) >= 3 or appearances.get(pair["b"], 0) >= 3:
            continue
        selected.append({"rank": len(selected) + 1, **pair})
        appearances[pair["a"]] = appearances.get(pair["a"], 0) + 1
        appearances[pair["b"]] = appearances.get(pair["b"], 0) + 1
        if len(selected) >= top:
            break
    return selected, len(candidates)


def html_report(rows: list[dict], pairs: list[dict], considered: int, refined: int) -> str:
    by_id = {row["track_id"]: row for row in rows}
    cards: list[str] = []
    for pair in pairs:
        players = []
        identities = []
        for label, track_id in (("A", pair["a"]), ("B", pair["b"])):
            track = by_id[track_id]
            slug = quote(track_id, safe="")
            players.append(f'<label>Preview {label}<audio controls preload="none" src="{slug}/preview_48s.m4a"></audio></label>')
            identities.append(f'<p>{label}: <a href="review-worksheet.html#{slug}">{html.escape(track["title"])} · {html.escape(track_id)}</a> · {html.escape(track["subgenre"])}<br>Preview SHA-256: <code>{track["assets_sha256"]["preview_48s.m4a"]}</code></p>')
        cards.append(f'''<article><h2>Comparison {pair["rank"]:02d}</h2>
  <div class="players">{"".join(players)}</div>
  <details><summary>Reveal identities and technical rank</summary>
    {"".join(identities)}
    <p>Relative rank score {pair["score"]:.3f} · pitch-class shift {pair["pitch_shift_semitones"]} · time shift {pair["time_shift_sec"]}s</p>
  </details></article>''')
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>duohertz · local music similarity queue</title><style>
  :root {{ color-scheme: dark; font: 15px/1.5 system-ui, sans-serif; }}
  body {{ max-width: 940px; margin: auto; padding: 20px; background: #111421; color: #fff9ef; }}
  h1 {{ margin-bottom: 8px; }} p {{ color: #d2d5e1; }}
  article {{ margin: 18px 0; padding: 18px; border: 2px solid #fff9ef; background: #1b2031; }}
  h2 {{ margin: 0 0 10px; color: #67eee0; }}
  .players {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }}
  .players label {{ min-width: 0; font-weight: 700; }} audio {{ display: block; width: 100%; margin-top: 6px; }}
  details {{ margin-top: 12px; }} summary {{ cursor: pointer; color: #67eee0; font-weight: 700; }}
  code {{ font-size: 11px; overflow-wrap: anywhere; }} a {{ color: #67eee0; }}
  @media (max-width: 620px) {{ body {{ padding: 12px; }} .players {{ grid-template-columns: 1fr; }} }}
</style></head><body>
<h1>duohertz · local music similarity queue</h1>
<p>{len(rows)} hash-checked technical candidates, {considered} possible pairs, {refined} refined by 48-second pitch-class/time patterns. These are relative listening leads, not duplicate findings, originality clearance, human blind-test results or release approval. Listen to A and B before revealing the identities; the local file paths remain inspectable, so this is a masked UI, not a controlled blind study. Record any real findings in the linked hash-bound worksheet.</p>
{"".join(cards)}
<script>document.querySelectorAll("audio").forEach(player => player.addEventListener("play", () => document.querySelectorAll("audio").forEach(other => {{ if (other !== player) other.pause(); }})));</script>
</body></html>
'''


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=CANDIDATES)
    parser.add_argument("--shortlist", type=int, default=400)
    parser.add_argument("--top", type=int, default=24)
    args = parser.parse_args()
    if args.shortlist < 1 or args.top < 1:
        parser.error("--shortlist and --top must be positive")
    root = args.root.resolve()
    rows = candidate_rows(root)
    features = [chroma_seconds(decode_preview(root / row["track_id"] / "preview_48s.m4a")) for row in rows]
    pairs, considered = rank_pairs(rows, features, args.shortlist, args.top)
    report = {
        "schema": 1, "scope": "duohertz_similarity_prescreen", "algorithm": ALGORITHM,
        "releaseApproval": False, "distinctnessApproved": False,
        "source": "preview_48s.m4a", "tracks": [{
            "track_id": row["track_id"], "title": row["title"], "subgenre": row["subgenre"],
            "manifest_sha256": row["manifest_sha256"],
            "preview_sha256": row["assets_sha256"]["preview_48s.m4a"],
        } for row in rows],
        "pairs_considered": considered, "pairs_refined": min(args.shortlist, considered), "pairs": pairs,
    }
    (root / "similarity-prescreen.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (root / "similarity-listening.html").write_text(html_report(rows, pairs, considered, min(args.shortlist, considered)), encoding="utf-8")
    print(f"Wrote {len(pairs)} local comparison leads from {len(rows)} candidates; no approval granted")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
