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

# PRD §7.5 v2.0 · RESONANCE district + lane accents
DISTRICT_COLORS: dict[str, str] = {
    "Pulse Core": "#E23D3D",
    "Glass Rim": "#E4D8C4",
    "Night Grid": "#6E2426",
    "Afterhours Lane": "#B0765A",
    "Chrome Yard": "#8C8079",
    "Slide District": "#FFB020",
    "Skyline Hook": "#5B8DEF",
}

LANE_COLORS = ("#E23D3D", "#F2E4C9", "#FFB020", "#5B8DEF")
BG = "#12100F"
BG2 = "#1C1717"
LINE = "#000000"
TEXT = "#F5EFE6"
MUTED = "#A8928B"
INK = "#000000"
SIZE = 512

# SVG covers are loaded as <img>/background-image, so they cannot reach the page's
# webfonts. Impact is the closest widely-installed stand-in for Anton — do not
# reference "Anton" here, it would silently fall back to a system serif.
DISPLAY_FONT = "Anton, Impact, Haettenschweiler, 'Arial Narrow', sans-serif"
BODY_FONT = "IBM Plex Sans, system-ui, -apple-system, sans-serif"


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
    """Square debris shards, not round sparks — comic impact, per §7.6."""
    parts: list[str] = []
    for i in range(rng.randint(6, 11)):
        x = rng.randint(24, SIZE - 24)
        y = rng.randint(24, SIZE - 96)
        col = LANE_COLORS[i % len(LANE_COLORS)]
        s = rng.uniform(3.0, 6.5)
        op = rng.uniform(0.35, 0.8)
        rot = rng.randint(0, 45)
        parts.append(
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{s:.1f}" height="{s:.1f}" fill="{col}" '
            f'opacity="{op:.2f}" transform="rotate({rot} {x:.1f} {y:.1f})"/>'
        )
    return "\n    ".join(parts)


def _speed_lines(accent: str, count: int = 15) -> str:
    """Radiating speed lines fanning down from above the frame. Public-domain comic device."""
    parts: list[str] = []
    cx, cy = 256.0, -70.0
    reach = 760.0
    for i in range(count):
        a0 = math.radians((i / count) * 180 + 0.5)
        a1 = math.radians(((i + 1) / count) * 180 - 0.5)
        x0 = cx + math.cos(a0) * reach
        y0 = cy + math.sin(a0) * reach
        x1 = cx + math.cos(a1) * reach
        y1 = cy + math.sin(a1) * reach
        parts.append(
            f'<polygon points="{cx},{cy} {x0:.1f},{y0:.1f} {x1:.1f},{y1:.1f}" '
            f'fill="{accent}" opacity="0.09"/>'
        )
    return "\n    ".join(parts)


def _resonance_mark(cx: float, cy: float, r: float, accent: str, core: str) -> str:
    """The RESONANCE motif: concentric diamonds, inked outline, solid core (PRD §7.6)."""
    outer = _diamond(cx, cy, r, 0)
    mid = _diamond(cx, cy, r * 0.72, 0)
    inner = _diamond(cx, cy, r * 0.44, 0)
    return "\n    ".join(
        [
            f'<polygon points="{outer}" fill="none" stroke="{INK}" stroke-width="{r * 0.14:.1f}"/>',
            f'<polygon points="{mid}" fill="none" stroke="{accent}" stroke-width="{r * 0.07:.1f}"/>',
            f'<polygon points="{inner}" fill="{core}"/>',
        ]
    )


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
    accent = DISTRICT_COLORS.get(district, "#E23D3D")
    motif_fn = MOTIFS.get(district, _motif_pulse_core)
    safe_title = html.escape(title)
    safe_artist = html.escape(artist)
    safe_district = html.escape(district)
    bpm_chip = (
        f'<text x="462" y="46" text-anchor="end" fill="{TEXT}" font-family="{BODY_FONT}" '
        f'font-size="14" font-weight="700" paint-order="stroke" stroke="{INK}" '
        f'stroke-width="4">{bpm} BPM</text>'
        if bpm
        else ""
    )

    # RESONANCE cover: flat ink ground, halftone dots, radiating speed lines,
    # the district motif under a hard-edged title slab. No gradients, no glow.
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE}" height="{SIZE}" viewBox="0 0 {SIZE} {SIZE}">
  <defs>
    <pattern id="halftone" width="10" height="10" patternUnits="userSpaceOnUse">
      <circle cx="2.5" cy="2.5" r="1.5" fill="{accent}" opacity="0.20"/>
    </pattern>
  </defs>
  <rect width="{SIZE}" height="{SIZE}" fill="{BG}"/>
  <rect width="{SIZE}" height="{SIZE}" fill="url(#halftone)"/>
  <g>
    {_speed_lines(accent)}
  </g>
  <g opacity="0.9">
    {_grid_lines(rng)}
  </g>
  <g>
    {motif_fn(rng, accent)}
  </g>
  <g>
    {_sparkles(rng, accent)}
  </g>
  <g>
    {_resonance_mark(432, 96, 46, accent, TEXT)}
  </g>
  <polygon points="0,372 512,344 512,512 0,512" fill="{BG2}" stroke="{INK}" stroke-width="4"/>
  <polygon points="0,372 512,344 512,352 0,380" fill="{accent}"/>
  <text x="40" y="432" fill="{TEXT}" font-family="{DISPLAY_FONT}" font-size="34" letter-spacing="0.01em" paint-order="stroke" stroke="{INK}" stroke-width="5">{safe_title}</text>
  <text x="40" y="464" fill="{MUTED}" font-family="{BODY_FONT}" font-size="16" font-weight="500">{safe_artist}</text>
  <text x="40" y="492" fill="{accent}" font-family="{BODY_FONT}" font-size="12" font-weight="700" letter-spacing="0.14em">{safe_district.upper()}</text>
  {bpm_chip}
  <rect x="6" y="6" width="500" height="500" fill="none" stroke="{INK}" stroke-width="12"/>
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
