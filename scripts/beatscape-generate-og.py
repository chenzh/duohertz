#!/usr/bin/env python3
"""Generate BeatScape OG images (1200×630) under public/catalog/{id}/og.png.

Uses Pillow when available; otherwise falls back to a minimal stdlib PNG writer
(geometry only, no text). Prefer: python3 -m venv .venv && .venv/bin/pip install pillow
"""

from __future__ import annotations

import json
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_JSON = ROOT / "apps" / "beatscape" / "public" / "catalog.json"
OUT = ROOT / "apps" / "beatscape" / "public" / "catalog"

# PRD §7.5 district accents
DISTRICT_COLORS = {
    "Pulse Core": "#3DDCFF",
    "Glass Rim": "#A8C0D8",
    "Night Grid": "#6B5B95",
    "Afterhours Lane": "#C4A484",
    "Chrome Yard": "#9AA3AD",
    "Slide District": "#7CFFB2",
    "Skyline Hook": "#F5C542",
}

W, H = 1200, 630


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def seed_angle(track_id: str) -> int:
    return sum(ord(c) for c in track_id) % 360


def write_png_raw(path: Path, pixels: list[list[tuple[int, int, int]]]) -> None:
    """Write RGB PNG without Pillow."""
    height = len(pixels)
    width = len(pixels[0]) if height else 0
    raw = bytearray()
    for row in pixels:
        raw.append(0)  # filter none
        for r, g, b in row:
            raw.extend((r, g, b))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def diamond_points(cx: float, cy: float, r: float, deg: float) -> list[tuple[float, float]]:
    rad = math.radians(deg)
    base = [(0, -r), (r * 0.75, 0), (0, r), (-r * 0.75, 0)]
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    out = []
    for x, y in base:
        out.append((cx + x * cos_a - y * sin_a, cy + x * sin_a + y * cos_a))
    return out


def render_with_pillow(path: Path, title: str, artist: str, district: str, track_id: str) -> None:
    from PIL import Image, ImageDraw, ImageFont

    bg = hex_rgb("#0B0F14")
    accent = hex_rgb(DISTRICT_COLORS.get(district, "#3DDCFF"))
    muted = hex_rgb("#8B9BB0")
    text = hex_rgb("#E8EEF7")
    line = hex_rgb("#1E2A3A")

    img = Image.new("RGB", (W, H), bg)
    draw = ImageDraw.Draw(img)

    # subtle grid
    for x in range(0, W, 48):
        draw.line([(x, 0), (x, H)], fill=line, width=1)
    for y in range(0, H, 48):
        draw.line([(0, y), (W, y)], fill=line, width=1)

    # geometric diamond (≈60% visual weight)
    pts = diamond_points(W * 0.72, H * 0.48, 210, seed_angle(track_id))
    draw.polygon(pts, outline=accent, width=6)
    inner = diamond_points(W * 0.72, H * 0.48, 120, seed_angle(track_id) + 18)
    draw.polygon(inner, outline=accent, width=3)

    # left copy block
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 64)
        font_sub = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 32)
        font_small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 24)
    except OSError:
        font_title = ImageFont.load_default()
        font_sub = font_title
        font_small = font_title

    draw.text((72, 160), title, fill=text, font=font_title)
    draw.text((72, 250), artist, fill=muted, font=font_sub)
    draw.text((72, 310), f"{district} · BeatScape", fill=accent, font=font_small)
    draw.rectangle([72, H - 88, W - 72, H - 40], fill=hex_rgb("#121A24"))
    draw.text((88, H - 78), "AI Original · Owned Rights · Feel the Beat, Own the Scape.", fill=muted, font=font_small)

    img.save(path, format="PNG", optimize=True)


def render_stdlib(path: Path, district: str, track_id: str) -> None:
    bg = hex_rgb("#0B0F14")
    accent = hex_rgb(DISTRICT_COLORS.get(district, "#3DDCFF"))
    line = hex_rgb("#1E2A3A")
    pixels = [[bg for _ in range(W)] for _ in range(H)]

    def set_px(x: int, y: int, c: tuple[int, int, int]) -> None:
        if 0 <= x < W and 0 <= y < H:
            pixels[y][x] = c

    for x in range(0, W, 48):
        for y in range(H):
            set_px(x, y, line)
    for y in range(0, H, 48):
        for x in range(W):
            set_px(x, y, line)

    # outline diamond via segment raster
    pts = diamond_points(W * 0.72, H * 0.48, 210, seed_angle(track_id))
    closed = pts + [pts[0]]
    for i in range(len(closed) - 1):
        x0, y0 = closed[i]
        x1, y1 = closed[i + 1]
        steps = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for s in range(steps):
            t = s / steps
            set_px(int(x0 + (x1 - x0) * t), int(y0 + (y1 - y0) * t), accent)

    write_png_raw(path, pixels)


def load_tracks() -> list[dict]:
    if CATALOG_JSON.is_file():
        data = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
        return list(data.get("tracks", []))
    return []


def main() -> None:
    try:
        import PIL  # noqa: F401

        use_pillow = True
    except ImportError:
        use_pillow = False
        print("Pillow not installed — writing geometry-only OG PNGs")

    tracks = load_tracks()
    if not tracks:
        raise SystemExit(f"No tracks in {CATALOG_JSON}")

    for tr in tracks:
        tid = tr["track_id"]
        dest = OUT / tid
        dest.mkdir(parents=True, exist_ok=True)
        path = dest / "og.png"
        if use_pillow:
            render_with_pillow(path, tr["title"], tr["artist"], tr.get("district", ""), tid)
        else:
            render_stdlib(path, tr.get("district", ""), tid)
        print(f"OK {tid} -> {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
