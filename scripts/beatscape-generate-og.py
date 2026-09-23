#!/usr/bin/env python3
"""Generate BeatScape OG images (1200×630) under public/catalog/{id}/og.png.

Uses Pillow plus BeatScape's bundled OFL fonts so every committed card contains
its track identity. Install with: python3 -m pip install pillow
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_JSON = ROOT / "apps" / "beatscape" / "public" / "catalog.json"
OUT = ROOT / "apps" / "beatscape" / "public" / "catalog"

# PRD §7.5 v2.0 · RESONANCE district accents
DISTRICT_COLORS = {
    "Pulse Core": "#E23D3D",
    "Glass Rim": "#E4D8C4",
    "Night Grid": "#6E2426",
    "Afterhours Lane": "#B0765A",
    "Chrome Yard": "#8C8079",
    "Slide District": "#FFB020",
    "Skyline Hook": "#5B8DEF",
}
BG_HEX = "#12100F"
INK_HEX = "#000000"
BONE_HEX = "#F2E4C9"

W, H = 1200, 630


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def seed_angle(track_id: str) -> int:
    return sum(ord(c) for c in track_id) % 360


def diamond_points(cx: float, cy: float, r: float, deg: float) -> list[tuple[float, float]]:
    rad = math.radians(deg)
    base = [(0, -r), (r * 0.75, 0), (0, r), (-r * 0.75, 0)]
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    out = []
    for x, y in base:
        out.append((cx + x * cos_a - y * sin_a, cy + x * sin_a + y * cos_a))
    return out


def bundled_fonts() -> tuple[str, str]:
    """Return only the archived OFL fonts so generation is machine-independent."""
    root = ROOT / "apps" / "beatscape" / "src" / "assets" / "fonts"
    display = root / "anton-latin.woff2"
    body = root / "ibm-plex-sans-latin.woff2"
    if not display.is_file() or not body.is_file():
        raise FileNotFoundError("BeatScape's bundled OFL fonts are required to generate track OG cards")
    return str(display), str(body)


def render_with_pillow(
    path: Path,
    title: str,
    artist: str,
    district: str,
    track_id: str,
    bpm: float,
    genre: str,
) -> None:
    from PIL import Image, ImageDraw, ImageFont

    bg = hex_rgb(BG_HEX)
    accent = hex_rgb(DISTRICT_COLORS.get(district, "#E23D3D"))
    ink = hex_rgb(INK_HEX)
    bone = hex_rgb(BONE_HEX)
    muted = hex_rgb("#A8928B")
    text = hex_rgb("#F5EFE6")

    img = Image.new("RGB", (W, H), bg)
    draw = ImageDraw.Draw(img)

    # Halftone dots, staggered every other row.
    for y in range(0, H, 7):
        for x in range(0, W, 7):
            xx = x + (3 if (y // 7) % 2 else 0)
            draw.rectangle([xx, y, xx + 1, y + 1], fill=accent)

    # Ink rules.
    for x in range(0, W, 48):
        draw.rectangle([x, 0, x + 1, H], fill=ink)
    for y in range(0, H, 48):
        draw.rectangle([0, y, W, y + 1], fill=ink)

    # Resonance diamond: solid core, bone ring, then ink + accent outlines.
    cx, cy, rot = W * 0.72, H * 0.46, seed_angle(track_id)
    radii = [(r, accent, 1) for r in range(92, 0, -2)]
    for r, c, wdt in radii:
        draw.polygon(diamond_points(cx, cy, float(r), rot), outline=c, width=wdt)
    draw.polygon(diamond_points(cx, cy, 150.0, rot), outline=bone, width=4)
    draw.polygon(diamond_points(cx, cy, 212.0, rot), outline=ink, width=11)
    draw.polygon(diamond_points(cx, cy, 212.0, rot), outline=accent, width=6)

    # Heavy comic frame.
    draw.rectangle([0, 0, W - 1, 13], fill=ink)
    draw.rectangle([0, H - 14, W - 1, H - 1], fill=ink)
    draw.rectangle([0, 0, 13, H - 1], fill=ink)
    draw.rectangle([W - 14, 0, W - 1, H - 1], fill=ink)

    # Copy block — bundled OFL fonts make the card deterministic and legible.
    display_font, body_font = bundled_fonts()
    font_title = ImageFont.truetype(display_font, 64)
    font_sub = ImageFont.truetype(body_font, 32)
    font_small = ImageFont.truetype(body_font, 24)
    font_footer = ImageFont.truetype(body_font, 20)
    draw.text((72, 88), "BEATSCAPE // ORIGINAL TRACK", fill=bone, font=font_small)
    draw.text((72, 160), title, fill=text, font=font_title, stroke_width=5, stroke_fill=ink)
    draw.text((72, 250), artist, fill=muted, font=font_sub)
    draw.text((72, 310), f"{round(bpm)} BPM  ·  {genre.upper()}  ·  {district.upper()}", fill=bone, font=font_small)
    draw.rectangle([72, H - 88, W - 72, H - 40], fill=ink)
    draw.text((88, H - 78), "PLAY FREE IN YOUR BROWSER", fill=bone, font=font_small)
    rights = "AI ORIGINAL · OWNED RIGHTS"
    rights_width = draw.textlength(rights, font=font_footer)
    draw.text((W - 88 - rights_width, H - 74), rights, fill=muted, font=font_footer)

    img.save(path, format="PNG", optimize=True)


def load_tracks() -> list[dict]:
    if CATALOG_JSON.is_file():
        data = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
        return list(data.get("tracks", []))
    return []


def main() -> None:
    try:
        import PIL  # noqa: F401
    except ImportError:
        raise SystemExit("Pillow is required: python3 -m pip install pillow")

    tracks = load_tracks()
    if not tracks:
        raise SystemExit(f"No tracks in {CATALOG_JSON}")

    for tr in tracks:
        tid = tr["track_id"]
        dest = OUT / tid
        dest.mkdir(parents=True, exist_ok=True)
        path = dest / "og.png"
        render_with_pillow(
            path,
            tr["title"],
            tr["artist"],
            tr.get("district", ""),
            tid,
            tr["bpm"],
            tr["genre"],
        )
        print(f"OK {tid} -> {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
