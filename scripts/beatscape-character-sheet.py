#!/usr/bin/env python3
"""BeatScape District character design sheets (IP bible artwork).

Renders one 1200x1400 sheet per District character:
  * large flat-colour figure (RESONANCE grammar: hard edge + thick ink outline)
  * silhouette legibility test at 256 / 128 / 64 px
  * District palette swatches

**No text is baked into the images.** Font embedding is a licensing surface
(see docs/licenses/README.md §1 — the Arial incident), so names live in
docs/BEATSCAPE-IP-STRATEGY.md only.

Usage:
  python3 scripts/beatscape-character-sheet.py --character volta
  python3 scripts/beatscape-character-sheet.py --all
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "beatscape-characters"

# --- RESONANCE palette (PRD §7.5 v2.0 / VISUAL-PLAN §4) --------------------
BG_HEX = "#12100F"
PANEL_HEX = "#1C1717"
INK_HEX = "#0A0908"
BLACK_HEX = "#000000"
BONE_HEX = "#F2E4C9"
AMBER_HEX = "#FFB020"

SHEET_W, SHEET_H = 1200, 1400
FIG_TOP, FIG_H = 0, 1000          # figure panel
ART = 512                          # logical art space for the figure


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def mix(a, b, t: float):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


# ---------------------------------------------------------------- characters
# build   : torso silhouette archetype (silhouette is the IP's primary asset)
# rig     : signature prop — always a tool of the trade, never a weapon/emblem
# headwear: hood / static hair / goggles / cap / bare
CHARACTERS = [
    dict(
        key="volta", district="Pulse Core", codename="VOLTA",
        genre="EDM", vibe="battle", bpm="158-172", accent="#E23D3D",
        build="broad", headwear="static", rig="core_chest",
    ),
    dict(
        key="static", district="Night Grid", codename="STATIC",
        genre="Hip-hop", vibe="night-drive", bpm="92-102", accent="#6E2426",
        build="compact", headwear="hood", rig="headphones",
    ),
    dict(
        key="prism", district="Glass Rim", codename="PRISM",
        genre="Pop", vibe="groove", bpm="118-126", accent="#E4D8C4",
        build="lean", headwear="goggles", rig="squeegee",
    ),
    dict(
        key="ember", district="Afterhours Lane", codename="EMBER",
        genre="R&B", vibe="chill", bpm="86-94", accent="#B0765A",
        build="seated", headwear="bare", rig="cup",
    ),
    dict(
        key="rivet", district="Chrome Yard", codename="RIVET",
        genre="Rock", vibe="battle", bpm="132-146", accent="#8C8079",
        build="broad", headwear="cap", rig="toolbelt",
    ),
    dict(
        key="glide", district="Slide District", codename="GLIDE",
        genre="EDM", vibe="battle", bpm="134-148", accent="#FFB020",
        build="lean", headwear="hood", rig="scarf",
    ),
    dict(
        key="halo", district="Skyline Hook", codename="HALO",
        genre="Pop", vibe="groove", bpm="124-133", accent="#5B8DEF",
        build="tall", headwear="bare", rig="bird",
    ),
]

TORSO = {
    "broad":   [(52, 512), (108, 372), (188, 332), (256, 324), (324, 332), (404, 372), (460, 512)],
    "lean":    [(136, 512), (166, 384), (212, 348), (256, 340), (300, 348), (346, 384), (376, 512)],
    "tall":    [(146, 512), (174, 396), (214, 354), (256, 346), (298, 354), (338, 396), (366, 512)],
    "compact": [(96, 512), (122, 400), (190, 362), (256, 354), (322, 362), (390, 400), (416, 512)],
    "seated":  [(70, 512), (104, 404), (176, 372), (256, 364), (336, 372), (408, 404), (442, 512)],
}


# ---------------------------------------------------------------- primitives


def cubic(p0, p1, p2, p3, n=24):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append((
            u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
        ))
    return pts


def diamond(cx, cy, r, stretch=1.25):
    return [(cx, cy - r * stretch), (cx + r, cy), (cx, cy + r * stretch), (cx - r, cy)]


def _shrink(pts, pivot, amount):
    px, py = pivot
    out = []
    for x, y in pts:
        d = math.hypot(x - px, y - py) or 1.0
        k = min(amount / d, 0.9)
        out.append((x + (px - x) * k, y + (py - y) * k))
    return out


def ellipse_pts(cx, cy, rx, ry, n=40, rot=0.0):
    pts = []
    for i in range(n):
        a = (i / n) * math.tau
        x, y = rx * math.cos(a), ry * math.sin(a)
        if rot:
            c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
            x, y = x * c - y * s, x * s + y * c
        pts.append((cx + x, cy + y))
    return pts


# ---------------------------------------------------------------- figure ops


def build_character(accent_hex: str, build: str, headwear: str, rig: str) -> list[dict]:
    """Flat-colour draw ops in a 512x512 logical space."""
    bg = hex_rgb(BG_HEX)
    ink = hex_rgb(INK_HEX)
    black = hex_rgb(BLACK_HEX)
    bone = hex_rgb(BONE_HEX)
    amber = hex_rgb(AMBER_HEX)
    accent = hex_rgb(accent_hex)
    dim = mix(bg, accent, 0.42)
    lit = mix(accent, bone, 0.30)

    ops: list[dict] = [{"op": "rect", "x": 0, "y": 0, "w": ART, "h": ART, "c": bg}]

    # halftone field
    cx, hy = 256.0, 188.0
    for gy in range(0, ART + 22, 22):
        for gx in range(0, ART + 22, 22):
            d = math.hypot(gx - cx, gy - hy)
            if d > 300:
                continue
            ops.append({"op": "circle", "cx": gx + (11 if (gy // 22) % 2 else 0), "cy": gy,
                        "r": 4.6 * (1 - d / 470), "c": accent, "a": 0.18})

    # radial speed lines
    for i in range(52):
        a = (i / 52) * math.tau
        dx, dy = math.cos(a), math.sin(a)
        nx, ny = -dy, dx
        w = 1.5 + (i % 3) * 0.9
        ops.append({"op": "poly", "pts": [
            (cx + dx * 82 + nx * w, hy + dy * 82 + ny * w),
            (cx + dx * 440 + nx * w * 3.4, hy + dy * 440 + ny * w * 3.4),
            (cx + dx * 440 - nx * w * 3.4, hy + dy * 440 - ny * w * 3.4),
            (cx + dx * 82 - nx * w, hy + dy * 82 - ny * w),
        ], "c": bone if i % 2 else accent, "a": 0.26})

    # torso
    torso = TORSO[build]
    ops.append({"op": "poly", "pts": torso, "c": black})
    ops.append({"op": "poly", "pts": _shrink(torso, (256, 430), 6), "c": accent})
    # chest shadow keeps the figure from reading as a flat blob
    ops.append({"op": "poly", "pts": [(206, 372), (256, 352), (306, 372), (296, 420), (216, 420)],
                "c": dim})
    # shoulder rim light (bone) — single consistent key light, upper right
    tp = _shrink(torso, (256, 430), 6)
    ops.append({"op": "line", "x1": tp[4][0], "y1": tp[4][1], "x2": tp[5][0], "y2": tp[5][1],
                "w": 7, "c": bone})

    # neck
    ops.append({"op": "poly", "pts": [(228, 316), (284, 316), (292, 372), (220, 372)], "c": black})
    ops.append({"op": "poly", "pts": [(234, 320), (278, 320), (284, 370), (226, 370)], "c": dim})

    # head — face stays in deep shadow so the silhouette is ambiguous (IP-safety)
    head_cy = 214 if build != "tall" else 202
    ops.append({"op": "ellipse", "cx": 256, "cy": head_cy, "rx": 70, "ry": 82, "rot": 0, "c": black})
    ops.append({"op": "ellipse", "cx": 256, "cy": head_cy, "rx": 63, "ry": 75, "rot": 0, "c": ink})
    # upper-face shadow + a single bone rim (jaw right side)
    ops.append({"op": "ellipse", "cx": 248, "cy": head_cy - 22, "rx": 66, "ry": 46, "rot": -7,
                "c": black})
    ops.append({"op": "line", "x1": 292, "y1": head_cy + 30, "x2": 306, "y2": head_cy + 58,
                "w": 6, "c": bone})

    # headwear
    if headwear == "hood":
        dome = (cubic((150, 372), (146, 250), (176, 138), (258, 126))
                + cubic((258, 126), (340, 138), (368, 250), (364, 372)))
        ops.append({"op": "poly", "pts": dome + [(364, 372), (150, 372)], "c": black})
        ops.append({"op": "poly", "pts": _shrink(dome + [(364, 372), (150, 372)], (258, 240), 6),
                    "c": accent})
        ops.append({"op": "poly", "pts": cubic((196, 190), (206, 152), (240, 140), (270, 144))
                    + cubic((270, 144), (306, 148), (330, 170), (338, 202))
                    + [(300, 184), (232, 190)], "c": lit})
    elif headwear == "static":
        # electro-static hair: hard zig-zag spikes, no soft edges
        spikes = [(186, 168)]
        x = 186
        up = True
        while x < 326:
            spikes.append((x, 118 if up else 158))
            x += 18
            up = not up
        spikes.append((326, 168))
        ops.append({"op": "poly", "pts": spikes + [(300, 196), (212, 196)], "c": black})
        ops.append({"op": "poly", "pts": _shrink(spikes + [(300, 196), (212, 196)], (256, 180), 6),
                    "c": lit})
    elif headwear == "goggles":
        ops.append({"op": "poly", "pts": [(176, head_cy - 34), (338, head_cy - 34),
                                          (338, head_cy + 6), (176, head_cy + 6)], "c": black})
        ops.append({"op": "poly", "pts": [(182, head_cy - 28), (332, head_cy - 28),
                                          (332, head_cy), (182, head_cy)], "c": ink})
        ops.append({"op": "line", "x1": 190, "y1": head_cy - 22, "x2": 246, "y2": head_cy - 22,
                    "w": 5, "c": bone})
    elif headwear == "cap":
        ops.append({"op": "poly", "pts": cubic((184, 176), (196, 118), (318, 118), (330, 176)),
                    "c": black})
        ops.append({"op": "poly", "pts": _shrink(
            cubic((184, 176), (196, 118), (318, 118), (330, 176)), (256, 160), 6), "c": dim})
        ops.append({"op": "poly", "pts": [(322, 170), (380, 186), (378, 200), (318, 190)],
                    "c": black})
        ops.append({"op": "poly", "pts": [(324, 176), (372, 188), (370, 196), (322, 188)],
                    "c": dim})

    # signature prop — a tool of the trade
    if rig == "core_chest":
        for r, w, col in ((46, 8, black), (46, 5, amber), (30, 5, black), (30, 3, bone)):
            pts = diamond(256, 452, r)
            for i in range(4):
                x1, y1 = pts[i]
                x2, y2 = pts[(i + 1) % 4]
                ops.append({"op": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2, "w": w, "c": col})
    elif rig == "headphones":
        for side in (-1, 1):
            ex = 256 + side * 100
            ops.append({"op": "ellipse", "cx": ex, "cy": 252, "rx": 36, "ry": 45, "rot": 0, "c": black})
            ops.append({"op": "ellipse", "cx": ex, "cy": 252, "rx": 28, "ry": 36, "rot": 0, "c": bone})
            ops.append({"op": "ellipse", "cx": ex, "cy": 252, "rx": 14, "ry": 19, "rot": 0, "c": dim})
        band = cubic((152, 258), (156, 152), (356, 152), (360, 258))
        for w, c in ((16, black), (10, bone)):
            for i in range(len(band) - 1):
                ops.append({"op": "line", "x1": band[i][0], "y1": band[i][1],
                            "x2": band[i + 1][0], "y2": band[i + 1][1], "w": w, "c": c})
        ops.append({"op": "poly", "pts": [(300, 400), (430, 470), (414, 512), (286, 448)], "c": black})
        ops.append({"op": "poly", "pts": [(306, 408), (420, 470), (408, 500), (298, 444)], "c": dim})
    elif rig == "squeegee":
        ops.append({"op": "poly", "pts": [(372, 348), (452, 300), (462, 320), (382, 368)], "c": black})
        ops.append({"op": "poly", "pts": [(376, 354), (448, 312), (454, 326), (384, 366)], "c": bone})
        ops.append({"op": "poly", "pts": [(352, 380), (404, 350), (414, 372), (362, 402)], "c": black})
        ops.append({"op": "poly", "pts": [(358, 382), (400, 360), (406, 374), (364, 396)], "c": amber})
    elif rig == "cup":
        ops.append({"op": "poly", "pts": [(336, 456), (398, 456), (390, 512), (344, 512)], "c": black})
        ops.append({"op": "poly", "pts": [(342, 462), (392, 462), (386, 506), (348, 506)], "c": bone})
        ops.append({"op": "ellipse", "cx": 367, "cy": 460, "rx": 25, "ry": 7, "rot": 0, "c": ink})
    elif rig == "toolbelt":
        ops.append({"op": "poly", "pts": [(96, 452), (416, 452), (416, 492), (96, 492)], "c": black})
        ops.append({"op": "poly", "pts": [(102, 458), (410, 458), (410, 486), (102, 486)], "c": ink})
        for x in (150, 232, 314, 386):
            ops.append({"op": "poly", "pts": [(x - 16, 486), (x + 16, 486), (x + 12, 512),
                                              (x - 12, 512)], "c": black})
            ops.append({"op": "poly", "pts": [(x - 11, 490), (x + 11, 490), (x + 8, 508),
                                              (x - 8, 508)], "c": amber})
    elif rig == "scarf":
        ops.append({"op": "poly", "pts": cubic((246, 344), (300, 372), (392, 366), (470, 410))
                    + cubic((470, 410), (446, 434), (392, 424), (330, 402)), "c": black})
        ops.append({"op": "poly", "pts": cubic((250, 352), (302, 380), (388, 374), (458, 412))
                    + cubic((458, 412), (436, 432), (388, 418), (330, 396)), "c": amber})
    elif rig == "bird":
        ops.append({"op": "poly", "pts": [(150, 330), (196, 322), (208, 366), (156, 372)], "c": black})
        ops.append({"op": "poly", "pts": [(156, 336), (192, 330), (200, 362), (160, 366)], "c": bone})
        ops.append({"op": "poly", "pts": [(196, 336), (232, 344), (198, 352)], "c": black})
        ops.append({"op": "poly", "pts": [(200, 339), (226, 345), (200, 350)], "c": amber})
        ops.append({"op": "line", "x1": 168, "y1": 366, "x2": 164, "y2": 388, "w": 5, "c": amber})

    # resonance diamonds behind the head — the brand anchor, always at the sound source
    for r, w, col in ((196, 7, accent), (154, 6, bone), (114, 5, accent), (76, 5, bone)):
        pts = diamond(256, head_cy, r)
        for i in range(4):
            x1, y1 = pts[i]
            x2, y2 = pts[(i + 1) % 4]
            ops.append({"op": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2, "w": w, "c": black})
            ops.append({"op": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2, "w": w - 2.5, "c": col})
    return ops


# ---------------------------------------------------------------- rasterizer


def _masks(ops, w, h, ss, ox=0.0, oy=0.0, scale=1.0):
    import numpy as np

    n_y, n_x = h * ss, w * ss
    yy, xx = np.mgrid[0:n_y, 0:n_x]
    xs = (xx + 0.5) / ss
    ys = (yy + 0.5) / ss
    xs = (xs - ox) / scale
    ys = (ys - oy) / scale
    canvas = np.zeros((n_y, n_x, 3), np.float32)

    def paint(m, col, a):
        if a >= 1:
            canvas[m] = col
        else:
            canvas[m] = canvas[m] * (1 - a) + np.array(col, np.float32) * a

    for o in ops:
        col = tuple(float(v) for v in o["c"])
        a = float(o.get("a", 1.0))
        if o["op"] == "rect":
            paint(np.ones((n_y, n_x), bool), col, a)
        elif o["op"] == "circle":
            paint((xs - o["cx"]) ** 2 + (ys - o["cy"]) ** 2 <= o["r"] ** 2, col, a)
        elif o["op"] == "ellipse":
            rot = math.radians(o["rot"])
            dx, dy = xs - o["cx"], ys - o["cy"]
            u = dx * math.cos(rot) + dy * math.sin(rot)
            v = -dx * math.sin(rot) + dy * math.cos(rot)
            paint((u / o["rx"]) ** 2 + (v / o["ry"]) ** 2 <= 1.0, col, a)
        elif o["op"] == "poly":
            paint(_poly_mask(o["pts"], xs, ys), col, a)
        elif o["op"] == "line":
            paint(_capsule(o["x1"], o["y1"], o["x2"], o["y2"], o["w"] / 2.0, xs, ys), col, a)

    small = canvas.reshape(h, ss, w, ss, 3).mean(axis=(1, 3))
    return np.clip(small, 0, 255).astype(np.uint8)


def _poly_mask(pts, xs, ys):
    import numpy as np

    m = np.zeros(xs.shape, bool)
    cnt = len(pts)
    for i in range(cnt):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % cnt]
        if y1 == y2:
            continue
        hit = ((y1 <= ys) & (ys < y2)) | ((y2 <= ys) & (ys < y1))
        if not hit.any():
            continue
        m ^= hit & (xs >= x1 + (ys - y1) / (y2 - y1) * (x2 - x1))
    return m


def _capsule(x1, y1, x2, y2, r, xs, ys):
    import numpy as np

    dx, dy = x2 - x1, y2 - y1
    seg2 = dx * dx + dy * dy
    t = np.clip(((xs - x1) * dx + (ys - y1) * dy) / seg2 if seg2 else np.zeros_like(xs), 0, 1)
    px, py = x1 + t * dx, y1 + t * dy
    return (xs - px) ** 2 + (ys - py) ** 2 <= r * r


def write_png(path: Path, arr) -> None:
    import struct
    import zlib

    h, w = arr.shape[0], arr.shape[1]
    raw = bytearray()
    for r in range(h):
        raw.append(0)
        raw.extend(arr[r].tobytes())

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n"
                     + chunk(b"IHDR", ihdr)
                     + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
                     + chunk(b"IEND", b""))


# ---------------------------------------------------------------- sheet


def render_sheet(spec: dict, ss: int = 2) -> "object":
    import numpy as np

    accent = spec["accent"]
    bg = hex_rgb(BG_HEX)
    panel = hex_rgb(PANEL_HEX)
    bone = hex_rgb(BONE_HEX)
    black = hex_rgb(BLACK_HEX)

    sheet = np.zeros((SHEET_H, SHEET_W, 3), np.uint8)
    sheet[:, :] = bg
    sheet[FIG_H:, :] = panel

    # figure panel
    fig_scale = FIG_H / ART
    fig = _masks(build_character(accent, spec["build"], spec["headwear"], spec["rig"]),
                 SHEET_W, FIG_H, ss, ox=(SHEET_W - ART * fig_scale) / 2 / fig_scale * fig_scale,
                 oy=0.0, scale=fig_scale)
    sheet[0:FIG_H, 0:SHEET_W] = fig

    # silhouette legibility test 256 / 128 / 64 on a bone field
    # render the figure as a single solid-black silhouette: drop the bg and force black
    figure_ops = build_character(accent, spec["build"], spec["headwear"], spec["rig"])
    sil = [{"op": "rect", "x": 0, "y": 0, "w": ART, "h": ART, "c": bone}]
    for o in figure_ops:
        if o["op"] == "rect":
            continue
        sil.append({**o, "c": black, "a": 1.0})
    # crop to the figure's actual bounding box so it fills the small test frames
    fig_cx, fig_cy = 260.0, 300.0     # approximate center of mass (in art space)
    fig_h = 420.0                     # approximate height of the figure
    base_y = FIG_H + 320
    for size, x0 in ((256, 80), (128, 400), (64, 560)):
        scale = (size * 0.90) / fig_h
        ox = (size / 2) - fig_cx * scale
        oy = (size / 2) - fig_cy * scale
        arr = _masks(sil, size, size, 3, ox=ox, oy=oy, scale=scale)
        y0 = base_y - size
        sheet[y0:y0 + size, x0:x0 + size] = arr
        # ink frame
        sheet[y0 - 4:y0, x0 - 4:x0 + size + 4] = black
        sheet[y0 + size:y0 + size + 4, x0 - 4:x0 + size + 4] = black
        sheet[y0 - 4:y0 + size + 4, x0 - 4:x0] = black
        sheet[y0 - 4:y0 + size + 4, x0 + size:x0 + size + 4] = black

    # palette swatches (2x2): accent / bone / amber / ink
    sw, gap = 120, 24
    palette = [hex_rgb(accent), hex_rgb(BONE_HEX), hex_rgb(AMBER_HEX), hex_rgb(INK_HEX)]
    for i, col in enumerate(palette):
        px_x = 760 + (i % 2) * (sw + gap)
        px_y = FIG_H + 60 + (i // 2) * (sw + gap)
        sheet[px_y:px_y + sw, px_x:px_x + sw] = col
        sheet[px_y - 4:px_y, px_x - 4:px_x + sw + 4] = black
        sheet[px_y + sw:px_y + sw + 4, px_x - 4:px_x + sw + 4] = black
        sheet[px_y - 4:px_y + sw + 4, px_x - 4:px_x] = black
        sheet[px_y - 4:px_y + sw + 4, px_x + sw:px_x + sw + 4] = black

    return sheet


def main() -> int:
    ap = argparse.ArgumentParser(description="BeatScape District character design sheets")
    ap.add_argument("--character", help="character key, e.g. volta")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--out-dir", type=Path, default=OUT_DIR)
    args = ap.parse_args()

    specs = CHARACTERS
    if args.character:
        specs = [c for c in CHARACTERS if c["key"] == args.character]
        if not specs:
            raise SystemExit(f"unknown character: {args.character}")
    elif not args.all:
        ap.error("specify --character or --all")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    for spec in specs:
        arr = render_sheet(spec)
        path = args.out_dir / f"{spec['key']}-{spec['district'].replace(' ', '-').lower()}-sheet.png"
        write_png(path, arr)
        print(f"OK {spec['key']:8s} {spec['codename']:7s} {spec['district']:16s} -> {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
