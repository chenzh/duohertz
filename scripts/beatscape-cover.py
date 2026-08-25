#!/usr/bin/env python3
"""Procedural BeatScape track covers — PRD §7.5 (seed=track_id, district motif, no faces)."""

from __future__ import annotations

import argparse
import html
import json
import math
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_JSON = ROOT / "apps" / "beatscape" / "public" / "catalog.json"
CATALOG_DIR = ROOT / "apps" / "beatscape" / "public" / "catalog"

# PRD §7.5 district + lane accents
DISTRICT_COLORS: dict[str, str] = {
    "Pulse Core": "#3DDCFF",
    "Glass Rim": "#A8C0D8",
    "Night Grid": "#6B5B95",
    "Afterhours Lane": "#C4A484",
    "Chrome Yard": "#9AA3AD",
    "Slide District": "#7CFFB2",
    "Skyline Hook": "#F5C542",
}

LANE_COLORS = ("#3DDCFF", "#7CFFB2", "#F5C542", "#FF5C7A")
BG = "#0B0F14"
BG2 = "#121A24"
LINE = "#1E2A3A"
TEXT = "#E8EEF7"
MUTED = "#8B9BB0"
SIZE = 512


def _rng(track_id: str) -> random.Random:
    return random.Random(sum(ord(c) * (i + 1) for i, c in enumerate(track_id)))


def _hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _mix(c1: str, c2: str, t: float) -> str:
    r1, g1, b1 = _hex_rgb(c1)
    r2, g2, b2 = _hex_rgb(c2)
    return "#{:02x}{:02x}{:02x}".format(
        int(r1 + (r2 - r1) * t),
        int(g1 + (g2 - g1) * t),
        int(b1 + (b2 - b1) * t),
    )


def _diamond(cx: float, cy: float, r: float, rot_deg: float) -> str:
    pts: list[tuple[float, float]] = []
    for i in range(4):
        a = math.radians(rot_deg + i * 90)
        pts.append((cx + math.sin(a) * r, cy - math.cos(a) * r))
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)


def _grid_lines(rng: random.Random) -> str:
    parts: list[str] = []
    step = 32
    for x in range(0, SIZE + 1, step):
        op = 0.12 + (x % 64 == 0) * 0.08
        parts.append(
            f'<line x1="{x}" y1="0" x2="{x}" y2="{SIZE}" stroke="{LINE}" stroke-opacity="{op:.2f}" stroke-width="1"/>'
        )
    for y in range(0, SIZE + 1, step):
        op = 0.12 + (y % 64 == 0) * 0.08
        parts.append(
            f'<line x1="0" y1="{y}" x2="{SIZE}" y2="{y}" stroke="{LINE}" stroke-opacity="{op:.2f}" stroke-width="1"/>'
        )
    return "\n    ".join(parts)


def _sparkles(rng: random.Random, accent: str) -> str:
    parts: list[str] = []
    for i in range(rng.randint(6, 11)):
        x = rng.randint(24, SIZE - 24)
        y = rng.randint(24, SIZE - 96)
        col = LANE_COLORS[i % len(LANE_COLORS)]
        r = rng.uniform(1.5, 3.5)
        op = rng.uniform(0.25, 0.65)
        parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{col}" opacity="{op:.2f}"/>')
    return "\n    ".join(parts)


def _motif_pulse_core(rng: random.Random, accent: str) -> str:
    cx, cy = 256, 220
    rot = rng.randint(0, 359)
    rings = rng.randint(4, 6)
    parts: list[str] = []
    for i in range(rings):
        r = 42 + i * 34
        sw = 2.5 if i % 2 == 0 else 1.5
        dash = "12 10" if i % 2 else "none"
        op = 0.92 - i * 0.1
        parts.append(
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{accent}" '
            f'stroke-width="{sw}" stroke-dasharray="{dash}" opacity="{op:.2f}"/>'
        )
    parts.append(
        f'<polygon points="{_diamond(cx, cy, 56, rot)}" fill="none" stroke="{accent}" '
        f'stroke-width="3" opacity="0.95"/>'
    )
    parts.append(
        f'<polygon points="{_diamond(cx, cy, 28, rot + 45)}" fill="{accent}" opacity="0.18"/>'
    )
    return "\n    ".join(parts)


def _motif_glass_rim(rng: random.Random, accent: str) -> str:
    parts: list[str] = []
    horizon = 248
    for i in range(9):
        y = horizon + i * 14
        op = 0.55 - i * 0.05
        parts.append(
            f'<line x1="32" y1="{y}" x2="480" y2="{y}" stroke="{accent}" stroke-width="1.5" opacity="{op:.2f}"/>'
        )
    parts.append(
        f'<polygon points="256,96 420,{horizon} 92,{horizon}" fill="{accent}" opacity="0.08"/>'
    )
    parts.append(
        f'<line x1="256" y1="96" x2="256" y2="{horizon}" stroke="{TEXT}" stroke-width="2" opacity="0.35"/>'
    )
    for i in range(5):
        x = 120 + i * 70
        h = rng.randint(40, 120)
        parts.append(
            f'<rect x="{x}" y="{horizon - h}" width="28" height="{h}" fill="{accent}" opacity="0.22" rx="2"/>'
        )
    return "\n    ".join(parts)


def _motif_night_grid(rng: random.Random, accent: str) -> str:
    parts: list[str] = []
    vx, vy = 256, 180
    for i in range(-8, 9):
        x0 = vx + i * 38
        parts.append(
            f'<line x1="{x0}" y1="360" x2="{vx}" y2="{vy}" stroke="{accent}" stroke-width="1.2" opacity="0.45"/>'
        )
    for j in range(7):
        y = 200 + j * 28
        w = 60 + j * 36
        parts.append(
            f'<line x1="{vx - w}" y1="{y}" x2="{vx + w}" y2="{y}" stroke="{accent}" stroke-width="1.5" opacity="{0.7 - j * 0.08:.2f}"/>'
        )
    parts.append(f'<circle cx="{vx}" cy="{vy}" r="6" fill="{accent}" opacity="0.9"/>')
    return "\n    ".join(parts)


def _motif_afterhours(rng: random.Random, accent: str) -> str:
    parts: list[str] = []
    for i in range(3):
        cx = 140 + i * 110
        cy = 200 + rng.randint(-20, 30)
        rx = rng.randint(70, 110)
        ry = rng.randint(40, 70)
        parts.append(
            f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{accent}" opacity="{0.12 + i * 0.04:.2f}"/>'
        )
    for i in range(4):
        y = 160 + i * 36
        parts.append(
            f'<path d="M 48 {y} Q 256 {y - 40 - i * 8} 464 {y}" fill="none" stroke="{accent}" '
            f'stroke-width="2" opacity="{0.55 - i * 0.1:.2f}"/>'
        )
    return "\n    ".join(parts)


def _motif_chrome_yard(rng: random.Random, accent: str) -> str:
    parts: list[str] = []
    cx, cy = 256, 220
    for i in range(6):
        rot = rng.randint(0, 59) + i * 60
        r = 90 + (i % 2) * 24
        parts.append(
            f'<polygon points="{_diamond(cx, cy, r, rot)}" fill="none" stroke="{accent}" '
            f'stroke-width="2" opacity="{0.85 - i * 0.1:.2f}"/>'
        )
    parts.append(
        f'<rect x="168" y="168" width="176" height="176" fill="none" stroke="{TEXT}" '
        f'stroke-width="2" opacity="0.2" transform="rotate({rng.randint(8, 22)} 256 256)"/>'
    )
    return "\n    ".join(parts)


def _motif_slide_district(rng: random.Random, accent: str) -> str:
    parts: list[str] = []
    for i in range(-4, 5):
        offset = i * 22
        parts.append(
            f'<line x1="{48 + offset}" y1="400" x2="{200 + offset}" y2="120" stroke="{accent}" '
            f'stroke-width="3" opacity="0.35"/>'
        )
    for i in range(5):
        x = 100 + i * 70
        parts.append(
            f'<rect x="{x}" y="{140 + i * 18}" width="48" height="8" fill="{accent}" '
            f'opacity="0.5" transform="rotate(-32 {x + 24} {144 + i * 18})"/>'
        )
    return "\n    ".join(parts)


def _motif_skyline_hook(rng: random.Random, accent: str) -> str:
    parts: list[str] = []
    base = 340
    widths = [rng.randint(22, 48) for _ in range(11)]
    x = 56
    for w in widths:
        h = rng.randint(50, 170)
        parts.append(f'<rect x="{x}" y="{base - h}" width="{w}" height="{h}" fill="{accent}" opacity="0.35" rx="2"/>')
        x += w + rng.randint(6, 14)
    parts.append(
        f'<circle cx="400" cy="110" r="48" fill="{accent}" opacity="0.12"/>'
    )
    parts.append(
        f'<circle cx="400" cy="110" r="32" fill="none" stroke="{accent}" stroke-width="2" opacity="0.55"/>'
    )
    return "\n    ".join(parts)


MOTIFS = {
    "Pulse Core": _motif_pulse_core,
    "Glass Rim": _motif_glass_rim,
    "Night Grid": _motif_night_grid,
    "Afterhours Lane": _motif_afterhours,
    "Chrome Yard": _motif_chrome_yard,
    "Slide District": _motif_slide_district,
    "Skyline Hook": _motif_skyline_hook,
}


def render_cover_svg(
    track_id: str,
    title: str,
    artist: str = "",
    district: str = "Pulse Core",
    genre: str = "",
    bpm: int | None = None,
) -> str:
    rng = _rng(track_id)
    accent = DISTRICT_COLORS.get(district, "#3DDCFF")
    accent2 = _mix(accent, LANE_COLORS[rng.randint(0, 3)], 0.35)
    motif_fn = MOTIFS.get(district, _motif_pulse_core)
    safe_title = html.escape(title)
    safe_artist = html.escape(artist)
    safe_district = html.escape(district)
    bpm_chip = f'<text x="432" y="44" text-anchor="end" fill="{MUTED}" font-family="IBM Plex Sans, system-ui, sans-serif" font-size="13" font-weight="600">{bpm} BPM</text>' if bpm else ""

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE}" height="{SIZE}" viewBox="0 0 {SIZE} {SIZE}">
  <defs>
    <radialGradient id="bgGlow" cx="72%" cy="28%" r="65%">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0.22"/>
      <stop offset="55%" stop-color="{accent2}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="{BG}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
      <stop offset="55%" stop-color="{BG}" stop-opacity="0"/>
      <stop offset="100%" stop-color="{BG}" stop-opacity="0.92"/>
    </radialGradient>
    <linearGradient id="titleFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{BG2}" stop-opacity="0"/>
      <stop offset="100%" stop-color="{BG2}" stop-opacity="0.94"/>
    </linearGradient>
    <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="{SIZE}" height="{SIZE}" fill="{BG}"/>
  <rect width="{SIZE}" height="{SIZE}" fill="url(#bgGlow)"/>
  <g opacity="0.9">
    {_grid_lines(rng)}
  </g>
  <g filter="url(#softGlow)">
    {motif_fn(rng, accent)}
  </g>
  <g>
    {_sparkles(rng, accent)}
  </g>
  <rect x="0" y="360" width="{SIZE}" height="152" fill="url(#titleFade)"/>
  <rect width="{SIZE}" height="{SIZE}" fill="url(#vignette)"/>
  <text x="40" y="438" fill="{TEXT}" font-family="Sora, IBM Plex Sans, system-ui, sans-serif" font-size="26" font-weight="700" letter-spacing="-0.02em">{safe_title}</text>
  <text x="40" y="468" fill="{MUTED}" font-family="IBM Plex Sans, system-ui, sans-serif" font-size="15" font-weight="500">{safe_artist}</text>
  <text x="40" y="492" fill="{accent}" font-family="IBM Plex Sans, system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="0.12em">{safe_district.upper()}</text>
  {bpm_chip}
  <rect x="40" y="404" width="48" height="3" fill="{accent}" opacity="0.85" rx="1.5"/>
</svg>
"""


def write_cover(
    dest_dir: Path,
    track_id: str,
    title: str,
    artist: str = "",
    district: str = "Pulse Core",
    genre: str = "",
    bpm: int | None = None,
    filename: str = "cover.svg",
) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    path = dest_dir / filename
    path.write_text(
        render_cover_svg(track_id, title, artist, district, genre, bpm),
        encoding="utf-8",
    )
    return path


def load_catalog() -> list[dict]:
    if not CATALOG_JSON.is_file():
        return []
    data = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
    return list(data.get("tracks", []))


def stage_from_id(track_id: str) -> int | None:
    m = re.match(r"bs-s(\d+)-", track_id)
    return int(m.group(1)) if m else None


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate BeatScape procedural covers")
    parser.add_argument("--track", action="append", help="track_id (repeatable)")
    parser.add_argument("--stage", type=int, help="Regenerate all tracks in stage N")
    parser.add_argument("--all", action="store_true", help="Regenerate every catalog track")
    args = parser.parse_args()

    tracks = load_catalog()
    if not tracks:
        print(f"No tracks in {CATALOG_JSON}")
        return 2

    selected: list[dict] = []
    if args.all:
        selected = tracks
    elif args.stage is not None:
        selected = [t for t in tracks if stage_from_id(t["track_id"]) == args.stage]
    elif args.track:
        want = set(args.track)
        selected = [t for t in tracks if t["track_id"] in want]
    else:
        parser.error("Specify --track, --stage, or --all")

    if not selected:
        print("No matching tracks")
        return 2

    for tr in selected:
        tid = tr["track_id"]
        dest = CATALOG_DIR / tid
        cover_name = Path(tr.get("cover", "cover.svg")).name
        path = write_cover(
            dest,
            tid,
            tr["title"],
            tr.get("artist", ""),
            tr.get("district", "Pulse Core"),
            tr.get("genre", ""),
            tr.get("bpm"),
            filename=cover_name,
        )
        print(f"OK {tid} -> {path.relative_to(ROOT)} ({path.stat().st_size} bytes)")

    print(f"Done — {len(selected)} cover(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
