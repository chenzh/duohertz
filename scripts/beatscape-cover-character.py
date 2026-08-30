#!/usr/bin/env python3
"""BeatScape character cover — RESONANCE pop-art trial (PRD §7.5 / VISUAL-PLAN §3).

Renders a stylised hooded-listener figure behind the BeatScape resonance-diamond
motif. Pure flat colour + thick ink outlines + halftone + speed lines; no gradients,
no neon, no text. Signature matches beatscape-cover.py:render_cover_svg so it can be
swapped into the ingest pipeline.

Usage:
  python3 scripts/beatscape-cover-character.py --track bs-s4-06
  python3 scripts/beatscape-cover-character.py --track bs-s4-06 --png
  python3 scripts/beatscape-cover-character.py --all --png

Legal: the figure is a generic late-night listener (hood + headphones). No mask, no
uniform, no emblem, no tarot, no series-specific motif — see RESONANCE-VISUAL-PLAN §1.1.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_JSON = ROOT / "apps" / "beatscape" / "public" / "catalog.json"
OUT = ROOT / "apps" / "beatscape" / "public" / "catalog"
TRIAL_DIR = ROOT / "data" / "beatscape-cover-trial"

SIZE = 512  # logical canvas, matches beatscape-cover.py

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
INK_HEX = "#0A0908"      # hood cavity / deepest shadow
BLACK_HEX = "#000000"    # comic outline
BONE_HEX = "#F2E4C9"
AMBER_HEX = "#FFB020"


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))  # type: ignore[return-value]


# --------------------------------------------------------------------------- shapes


def cubic(p0, p1, p2, p3, n: int = 28):
    """Sample a cubic bezier into a point list."""
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]
        pts.append((x, y))
    return pts


def diamond(cx: float, cy: float, r: float, stretch: float = 1.25):
    return [(cx, cy - r * stretch), (cx + r, cy), (cx, cy + r * stretch), (cx - r, cy)]


def build_shapes(accent: tuple[int, int, int]) -> list[dict]:
    """Ordered draw list — later ops paint over earlier ones (flat comic look)."""
    bg = hex_rgb(BG_HEX)
    ink = hex_rgb(INK_HEX)
    black = hex_rgb(BLACK_HEX)
    bone = hex_rgb(BONE_HEX)
    amber = hex_rgb(AMBER_HEX)
    dim = mix(bg, accent, 0.45)

    cx, head_y = 256.0, 196.0
    ops: list[dict] = [{"op": "rect", "x": 0, "y": 0, "w": SIZE, "h": SIZE, "c": bg}]

    # 1 · halftone field (accent, faded)
    step = 15
    for gy in range(0, SIZE + step, step):
        for gx in range(0, SIZE + step, step):
            d = math.hypot(gx - cx, gy - head_y)
            if d > 300:
                continue
            r = 3.4 * (1 - d / 460)
            ops.append({"op": "circle", "cx": gx + (step // 2 if gy % 2 else 0),
                        "cy": gy, "r": r, "c": accent, "a": 0.20})

    # 2 · radial speed lines from behind the head
    for i in range(56):
        ang = (i / 56) * math.tau
        wide = 1.6 + (i % 3) * 0.9
        r0, r1 = 78, 430
        dx, dy = math.cos(ang), math.sin(ang)
        nx, ny = -dy, dx
        ops.append({
            "op": "poly",
            "pts": [
                (cx + dx * r0 + nx * wide, head_y + dy * r0 + ny * wide),
                (cx + dx * r1 + nx * wide * 3.2, head_y + dy * r1 + ny * wide * 3.2),
                (cx + dx * r1 - nx * wide * 3.2, head_y + dy * r1 - ny * wide * 3.2),
                (cx + dx * r0 - nx * wide, head_y + dy * r0 - ny * wide),
            ],
            "c": bone if i % 2 else accent,
            "a": 0.30,
        })

    # 3 · resonance diamonds (BeatScape motif, behind the figure)
    for r, w, col in ((182, 7, accent), (142, 6, bone), (104, 5, accent), (68, 5, bone)):
        pts = diamond(cx, head_y, r)
        for i in range(4):
            x1, y1 = pts[i]
            x2, y2 = pts[(i + 1) % 4]
            ops.append({"op": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                        "w": w, "c": black, "a": 1.0})
            ops.append({"op": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                        "w": w - 2.5, "c": col, "a": 1.0})
    core = diamond(cx, head_y, 26)
    ops.append({"op": "poly", "pts": core, "c": amber})

    # 4 · torso (flat accent silhouette)
    torso = [(88, SIZE), (136, 396), (198, 362), (256, 354), (314, 362), (376, 396), (424, SIZE)]
    ops.append({"op": "poly", "pts": torso, "c": black})
    ops.append({"op": "poly", "pts": _shrink(torso, (256, 430), 6), "c": accent})
    # collar shadow
    ops.append({"op": "poly", "pts": [(214, 372), (256, 356), (300, 372), (292, 404), (222, 404)],
                "c": dim, "a": 1.0})
    # shoulder rim light
    ops.append({"op": "line", "x1": 322, "y1": 368, "x2": 372, "y2": 404, "w": 7, "c": bone})

    # 5 · hood dome
    dome = (
        cubic((150, 386), (148, 262), (176, 148), (258, 136))
        + cubic((258, 136), (340, 148), (366, 262), (364, 386))
    )
    ops.append({"op": "poly", "pts": dome + [(364, 386), (150, 386)], "c": black})
    ops.append({"op": "poly", "pts": _shrink(dome + [(364, 386), (150, 386)], (258, 250), 6),
                "c": accent})
    # hood top highlight
    ops.append({"op": "poly", "pts": cubic((196, 196), (206, 158), (240, 146), (270, 150))
                + cubic((270, 150), (306, 154), (330, 176), (338, 208))
                + [(300, 190), (232, 196)], "c": mix(accent, bone, 0.28), "a": 1.0})

    # 6 · face cavity: bone crescent then ink shadow (three-quarter view)
    ops.append({"op": "ellipse", "cx": 274, "cy": 228, "rx": 56, "ry": 70, "rot": 0, "c": bone})
    ops.append({"op": "ellipse", "cx": 256, "cy": 228, "rx": 55, "ry": 69, "rot": 0, "c": ink})
    # brow shadow so the face stays unreadable
    ops.append({"op": "ellipse", "cx": 246, "cy": 202, "rx": 58, "ry": 34, "rot": -8,
                "c": black, "a": 1.0})
    # jaw rim light
    ops.append({"op": "line", "x1": 288, "y1": 262, "x2": 300, "y2": 288, "w": 6, "c": bone})

    # 7 · headphones (bone cups + ink band, drawn over the hood)
    for side in (-1, 1):
        ex = 256 + side * 104
        ops.append({"op": "ellipse", "cx": ex, "cy": 244, "rx": 33, "ry": 42, "rot": 0, "c": black})
        ops.append({"op": "ellipse", "cx": ex, "cy": 244, "rx": 26, "ry": 34, "rot": 0, "c": bone})
        ops.append({"op": "ellipse", "cx": ex, "cy": 244, "rx": 13, "ry": 18, "rot": 0, "c": dim})
    band = cubic((150, 250), (154, 150), (358, 150), (362, 250))
    for w, c in ((15, black), (9, bone)):
        for i in range(len(band) - 1):
            ops.append({"op": "line", "x1": band[i][0], "y1": band[i][1],
                        "x2": band[i + 1][0], "y2": band[i + 1][1], "w": w, "c": c})

    # 8 · foreground diagonal bars (slanted comic framing)
    ops.append({"op": "poly", "pts": [(-20, 96), (150, -20), (190, -20), (-20, 150),
                                      (-20, 96)], "c": amber})
    ops.append({"op": "poly", "pts": [(532, 424), (362, 532), (322, 532), (532, 366)],
                "c": amber})
    for pts in ([(150, -20), (190, -20)], [(322, 532), (362, 532)]):
        ops.append({"op": "line", "x1": pts[0][0], "y1": pts[0][1], "x2": pts[1][0],
                    "y2": pts[1][1], "w": 5, "c": black})

    return ops


def _shrink(pts, pivot, amount):
    """Move every point `amount` px toward pivot (poor-man's inset for flat outlines)."""
    px, py = pivot
    out = []
    for x, y in pts:
        d = math.hypot(x - px, y - py) or 1.0
        k = min(amount / d, 0.9)
        out.append((x + (px - x) * k, y + (py - y) * k))
    return out


# --------------------------------------------------------------------------- SVG out


def _fmt(v: float) -> str:
    return f"{v:.1f}".rstrip("0").rstrip(".")


def render_cover_svg(track_id: str, title: str, artist: str = "", district: str = "Pulse Core",
                     genre: str = "", bpm: int | None = None) -> str:
    accent = hex_rgb(DISTRICT_COLORS.get(district, DISTRICT_COLORS["Pulse Core"]))
    ops = build_shapes(accent)
    body: list[str] = []
    for o in ops:
        c = "#%02X%02X%02X" % o["c"]
        a = o.get("a", 1.0)
        op = "" if a >= 1 else f' fill-opacity="{_fmt(a)}"'
        if o["op"] == "rect":
            body.append(f'<rect x="0" y="0" width="{SIZE}" height="{SIZE}" fill="{c}"{op}/>')
        elif o["op"] == "circle":
            body.append(f'<circle cx="{_fmt(o["cx"])}" cy="{_fmt(o["cy"])}" r="{_fmt(o["r"])}" '
                        f'fill="{c}"{op}/>')
        elif o["op"] == "poly":
            pts = " ".join(f"{_fmt(x)},{_fmt(y)}" for x, y in o["pts"])
            body.append(f'<polygon points="{pts}" fill="{c}"{op}/>')
        elif o["op"] == "ellipse":
            rot = f' transform="rotate({_fmt(o["rot"])} {_fmt(o["cx"])} {_fmt(o["cy"])})"' if o["rot"] else ""
            body.append(f'<ellipse cx="{_fmt(o["cx"])}" cy="{_fmt(o["cy"])}" rx="{_fmt(o["rx"])}" '
                        f'ry="{_fmt(o["ry"])}"{rot} fill="{c}"{op}/>')
        elif o["op"] == "line":
            body.append(f'<line x1="{_fmt(o["x1"])}" y1="{_fmt(o["y1"])}" x2="{_fmt(o["x2"])}" '
                        f'y2="{_fmt(o["y2"])}" stroke="{c}" stroke-width="{_fmt(o["w"])}" '
                        f'stroke-linecap="round"{op}/>')
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" width="{SIZE}" '
        f'height="{SIZE}" role="img" aria-label="{title} cover">\n'
        + "\n".join("  " + b for b in body)
        + "\n</svg>\n"
    )


# --------------------------------------------------------------------------- PNG out


def _rasterize(ops: list[dict], ss: int = 3) -> "tuple[list[list[tuple[int,int,int]]], int]":
    import numpy as np

    n = SIZE * ss
    canvas = np.zeros((n, n, 3), np.float32)
    bg = hex_rgb(BG_HEX)
    canvas[:, :] = bg

    yy, xx = np.mgrid[0:n, 0:n]
    xs = (xx + 0.5) / ss
    ys = (yy + 0.5) / ss

    def paint(mask, col, alpha):
        if alpha >= 1:
            canvas[mask] = col
        else:
            canvas[mask] = canvas[mask] * (1 - alpha) + np.array(col, np.float32) * alpha

    for o in ops:
        col = tuple(float(v) for v in o["c"])
        a = float(o.get("a", 1.0))
        if o["op"] == "rect":
            paint(np.ones((n, n), bool), col, a)
        elif o["op"] == "circle":
            m = (xs - o["cx"]) ** 2 + (ys - o["cy"]) ** 2 <= o["r"] ** 2
            paint(m, col, a)
        elif o["op"] == "ellipse":
            rot = math.radians(o["rot"])
            dx, dy = xs - o["cx"], ys - o["cy"]
            u = dx * math.cos(rot) + dy * math.sin(rot)
            v = -dx * math.sin(rot) + dy * math.cos(rot)
            m = (u / o["rx"]) ** 2 + (v / o["ry"]) ** 2 <= 1.0
            paint(m, col, a)
        elif o["op"] == "poly":
            m = _poly_mask(o["pts"], xs, ys)
            paint(m, col, a)
        elif o["op"] == "line":
            m = _capsule(o["x1"], o["y1"], o["x2"], o["y2"], o["w"] / 2.0, xs, ys)
            paint(m, col, a)

    # box-downsample for anti-aliasing
    small = canvas.reshape(SIZE, ss, SIZE, ss, 3).mean(axis=(1, 3))
    px = np.clip(small, 0, 255).astype(np.uint8)
    return [[tuple(int(v) for v in px[r, c]) for c in range(SIZE)] for r in range(SIZE)], SIZE


def _poly_mask(pts, xs, ys) -> "object":
    """Even-odd scanline fill on a supersampled grid."""
    import numpy as np

    m = np.zeros(xs.shape, bool)
    cnt = len(pts)
    for i in range(cnt):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % cnt]
        if y1 == y2:
            continue
        intersect = ((y1 <= ys) & (ys < y2)) | ((y2 <= ys) & (ys < y1))
        if not intersect.any():
            continue
        t = (ys - y1) / (y2 - y1)
        xcross = x1 + t * (x2 - x1)
        m ^= intersect & (xs >= xcross)
    return m


def _capsule(x1, y1, x2, y2, r, xs, ys) -> "object":
    import numpy as np

    dx, dy = x2 - x1, y2 - y1
    seg2 = dx * dx + dy * dy
    t = ((xs - x1) * dx + (ys - y1) * dy) / seg2 if seg2 else np.zeros_like(xs)
    t = np.clip(t, 0.0, 1.0)
    px, py = x1 + t * dx, y1 + t * dy
    return (xs - px) ** 2 + (ys - py) ** 2 <= r * r


def write_png(path: Path, pixels) -> None:
    height = len(pixels)
    width = len(pixels[0])
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


# --------------------------------------------------------------------------- cli


def main() -> int:
    ap = argparse.ArgumentParser(description="BeatScape character cover trial")
    ap.add_argument("--track")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--png", action="store_true", help="Also rasterise a PNG preview")
    ap.add_argument("--out-dir", type=Path, default=TRIAL_DIR, help="PNG/ trial output dir")
    ap.add_argument("--write-catalog", action="store_true",
                    help="Write into public/catalog/{id}/cover-character.svg")
    args = ap.parse_args()

    catalog = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
    tracks = catalog["tracks"]
    if args.track:
        tracks = [t for t in tracks if t["track_id"] == args.track]
    elif not args.all:
        ap.error("specify --track or --all")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    for t in tracks:
        tid = t["track_id"]
        svg = render_cover_svg(tid, t.get("title", tid), t.get("artist", ""),
                               t.get("district", "Pulse Core"), t.get("genre", ""), t.get("bpm"))
        if args.write_catalog:
            dest = OUT / tid
            dest.mkdir(parents=True, exist_ok=True)
            (dest / "cover-character.svg").write_text(svg, encoding="utf-8")
        else:
            (args.out_dir / f"{tid}-character.svg").write_text(svg, encoding="utf-8")
        print(f"OK {tid} svg ({len(svg)} bytes)")
        if args.png:
            accent = hex_rgb(DISTRICT_COLORS.get(t.get("district", "Pulse Core"), "#E23D3D"))
            px, _ = _rasterize(build_shapes(accent))
            png = args.out_dir / f"{tid}-character.png"
            write_png(png, px)
            print(f"   png -> {png}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
