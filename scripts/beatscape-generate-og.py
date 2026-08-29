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


def _safe_fonts() -> tuple[str | None, str | None]:
    """Locate an OFL/permissive font for OG text, or None.

    PRD §7.5: text rendering may only use SIL OFL / Apache fonts. Arial and other
    system fonts are commercially licensed and must never be baked into shipped
    assets. If no safe font is present we emit geometry only — which is exactly
    what the stdlib branch produces — so output stays identical across machines.
    """
    from PIL import ImageFont

    display_candidates = [
        "/Library/Fonts/Anton-Regular.ttf",
        str(Path.home() / "Library/Fonts/Anton-Regular.ttf"),
        "/Library/Fonts/Oswald-Regular.ttf",
        "/usr/share/fonts/truetype/anton/Anton-Regular.ttf",
    ]
    body_candidates = [
        "/Library/Fonts/IBMPlexSans-Regular.ttf",
        "/Library/Fonts/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    # Pillow bundles DejaVu (Bitstream Vera licence, permissive) in some builds.
    try:  # pragma: no cover - depends on Pillow build
        import PIL

        body_candidates.insert(1, str(Path(PIL.__file__).parent / "DejaVuSans.ttf"))
    except Exception:
        pass

    def first(candidates: list[str]) -> str | None:
        for c in candidates:
            if Path(c).is_file():
                return c
        return None

    return first(display_candidates), first(body_candidates)


def render_with_pillow(path: Path, title: str, artist: str, district: str, track_id: str) -> None:
    from PIL import Image, ImageDraw, ImageFont

    bg = hex_rgb(BG_HEX)
    accent = hex_rgb(DISTRICT_COLORS.get(district, "#E23D3D"))
    ink = hex_rgb(INK_HEX)
    bone = hex_rgb(BONE_HEX)
    muted = hex_rgb("#A8928B")
    text = hex_rgb("#F5EFE6")

    img = Image.new("RGB", (W, H), bg)
    draw = ImageDraw.Draw(img)

    # Halftone dots, staggered every other row (matches render_stdlib).
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

    # Copy block — only when an OFL/permissive font is available.
    display_ttf, body_ttf = _safe_fonts()
    if display_ttf and body_ttf:
        font_title = ImageFont.truetype(display_ttf, 64)
        font_sub = ImageFont.truetype(body_ttf, 32)
        font_small = ImageFont.truetype(body_ttf, 24)
        draw.text((72, 160), title, fill=text, font=font_title, stroke_width=5, stroke_fill=ink)
        draw.text((72, 250), artist, fill=muted, font=font_sub)
        draw.text((72, 310), f"{district} · BeatScape", fill=accent, font=font_small)
        draw.rectangle([72, H - 88, W - 72, H - 40], fill=ink)
        draw.text((88, H - 78), "AI Original · Owned Rights · Feel the Beat, Own the Scape.", fill=muted, font=font_small)

    img.save(path, format="PNG", optimize=True)


def render_stdlib(path: Path, district: str, track_id: str) -> None:
    bg = hex_rgb(BG_HEX)
    accent = hex_rgb(DISTRICT_COLORS.get(district, "#E23D3D"))
    ink = hex_rgb(INK_HEX)
    bone = hex_rgb(BONE_HEX)
    pixels = [[bg for _ in range(W)] for _ in range(H)]

    def set_px(x: int, y: int, c: tuple[int, int, int]) -> None:
        if 0 <= x < W and 0 <= y < H:
            pixels[y][x] = c

    # Halftone dot grid, staggered every other row.
    for y in range(0, H, 7):
        for x in range(0, W, 7):
            xx = x + (3 if (y // 7) % 2 else 0)
            set_px(xx, y, accent)
            set_px(xx + 1, y, accent)
            set_px(xx, y + 1, accent)
            set_px(xx + 1, y + 1, accent)

    # Ink rules.
    for x in range(0, W, 48):
        for y in range(H):
            set_px(x, y, ink)
            set_px(x + 1, y, ink)
    for y in range(0, H, 48):
        for x in range(W):
            set_px(x, y, ink)
            set_px(x, y + 1, ink)

    cx, cy, rot = W * 0.72, H * 0.46, seed_angle(track_id)

    def stroke_diamond(r: float, c: tuple[int, int, int], width: int) -> None:
        pts = diamond_points(cx, cy, r, rot) + [diamond_points(cx, cy, r, rot)[0]]
        for i in range(len(pts) - 1):
            x0, y0 = pts[i]
            x1, y1 = pts[i + 1]
            steps = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
            for s in range(steps):
                t = s / steps
                bx = int(x0 + (x1 - x0) * t)
                by = int(y0 + (y1 - y0) * t)
                for ox in range(width):
                    for oy in range(width):
                        set_px(bx + ox, by + oy, c)

    # Solid core: stack shrinking outlines (cheap convex fill).
    r = 92.0
    while r > 0:
        stroke_diamond(r, accent, 1)
        r -= 2.0
    stroke_diamond(150, bone, 4)
    stroke_diamond(212, ink, 11)
    stroke_diamond(212, accent, 6)

    # Heavy comic frame.
    for x in range(W):
        for t in range(14):
            set_px(x, t, ink)
            set_px(x, H - 1 - t, ink)
    for y in range(H):
        for t in range(14):
            set_px(t, y, ink)
            set_px(W - 1 - t, y, ink)

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
