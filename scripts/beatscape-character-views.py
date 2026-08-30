#!/usr/bin/env python3
"""BeatScape District character 三视图 (front / side / back model sheets).

Standard character-design deliverable: three orthographic views at a **common
scale**, aligned on a shared ground line with a centre line per panel — the
reference a modeller or a print vendor needs before anything gets built.

  * front — 3/4-neutral, face in shadow, rim light upper right
  * side  — profile facing right, face in shadow
  * back  — no face at all; back-of-head/hood + rear view of the prop

All views keep the IP constraints from docs/BEATSCAPE-IP-STRATEGY.md §3:
no readable face, tools not weapons, resonance diamonds at the sound source.

**No text is baked in** (font licensing — see docs/licenses/README.md §1).
View order is always front | side | back, documented in the strategy doc.

Usage:
  python3 scripts/beatscape-character-views.py --character volta
  python3 scripts/beatscape-character-views.py --all
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "beatscape-characters"

BG_HEX = "#12100F"
PANEL_HEX = "#1C1717"
INK_HEX = "#0A0908"
BLACK_HEX = "#000000"
BONE_HEX = "#F2E4C9"
AMBER_HEX = "#FFB020"

ART = 512                 # logical art space per view
VIEWS = ("front", "side", "back")

SHEET_W, SHEET_H = 1800, 1080
PANEL_W = SHEET_W // 3    # 600
FIG_H = 760                # figure panel height
BASELINE_Y = 640           # ground line (feet sit at art y=512 * 1.17 ≈ 600)
STRIP_H = SHEET_H - FIG_H

# Character specs mirror scripts/beatscape-character-sheet.py — keep in sync.
CHARACTERS = [
    dict(key="volta", district="Pulse Core", codename="VOLTA",
         genre="EDM", vibe="battle", bpm="158-172", accent="#E23D3D",
         build="broad", headwear="static", rig="core_chest"),
    dict(key="static", district="Night Grid", codename="STATIC",
         genre="Hip-hop", vibe="night-drive", bpm="92-102", accent="#6E2426",
         build="compact", headwear="hood", rig="headphones"),
    dict(key="prism", district="Glass Rim", codename="PRISM",
         genre="Pop", vibe="groove", bpm="118-126", accent="#E4D8C4",
         build="lean", headwear="goggles", rig="squeegee"),
    dict(key="ember", district="Afterhours Lane", codename="EMBER",
         genre="R&B", vibe="chill", bpm="86-94", accent="#B0765A",
         build="seated", headwear="bare", rig="cup"),
    dict(key="rivet", district="Chrome Yard", codename="RIVET",
         genre="Rock", vibe="battle", bpm="132-146", accent="#8C8079",
         build="broad", headwear="cap", rig="toolbelt"),
    dict(key="glide", district="Slide District", codename="GLIDE",
         genre="EDM", vibe="battle", bpm="134-148", accent="#FFB020",
         build="lean", headwear="hood", rig="scarf"),
    dict(key="halo", district="Skyline Hook", codename="HALO",
         genre="Pop", vibe="groove", bpm="124-133", accent="#5B8DEF",
         build="tall", headwear="bare", rig="bird"),
]

TORSO = {
    "broad":   [(52, 512), (108, 372), (188, 332), (256, 324), (324, 332), (404, 372), (460, 512)],
    "lean":    [(136, 512), (166, 384), (212, 348), (256, 340), (300, 348), (346, 384), (376, 512)],
    "tall":    [(146, 512), (174, 396), (214, 354), (256, 346), (298, 354), (338, 396), (366, 512)],
    "compact": [(96, 512), (122, 400), (190, 362), (256, 354), (322, 362), (390, 400), (416, 512)],
    "seated":  [(70, 512), (104, 404), (176, 372), (256, 364), (336, 372), (408, 404), (442, 512)],
}


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def mix(a, b, t: float):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


# ---------------------------------------------------------------- geometry


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


def _scale_x(pts, cx, k):
    return [(cx + (x - cx) * k, y) for x, y in pts]


def _shift(pts, dx, dy):
    return [(x + dx, y + dy) for x, y in pts]


# ---------------------------------------------------------------- figure


def build_character(accent_hex: str, build: str, headwear: str, rig: str,
                    view: str = "front") -> list[dict]:
    bg = hex_rgb(BG_HEX)
    ink = hex_rgb(INK_HEX)
    black = hex_rgb(BLACK_HEX)
    bone = hex_rgb(BONE_HEX)
    amber = hex_rgb(AMBER_HEX)
    accent = hex_rgb(accent_hex)
    dim = mix(bg, accent, 0.42)
    lit = mix(accent, bone, 0.30)

    side = view == "side"
    back = view == "back"

    ops: list[dict] = [{"op": "rect", "x": 0, "y": 0, "w": ART, "h": ART, "c": bg}]

    cx, hy = 256.0, 188.0
    for gy in range(0, ART + 22, 22):
        for gx in range(0, ART + 22, 22):
            d = math.hypot(gx - cx, gy - hy)
            if d > 300:
                continue
            ops.append({"op": "circle", "cx": gx + (11 if (gy // 22) % 2 else 0), "cy": gy,
                        "r": 4.6 * (1 - d / 470), "c": accent, "a": 0.16})

    for i in range(52):
        a = (i / 52) * math.tau
        dx, dy = math.cos(a), math.sin(a)
        nx, ny = -dy, dx
        w = 1.5 + (i % 3) * 0.9
        # speed lines stop at the baseline (art y=512) so the ground line stays clean
        r1 = min(280, (510 - hy) / max(dy, 1e-3)) if dy > 0.1 else 280
        ops.append({"op": "poly", "pts": [
            (cx + dx * 82 + nx * w, hy + dy * 82 + ny * w),
            (cx + dx * r1 + nx * w * 3.2, hy + dy * r1 + ny * w * 3.2),
            (cx + dx * r1 - nx * w * 3.2, hy + dy * r1 - ny * w * 3.2),
            (cx + dx * 82 - nx * w, hy + dy * 82 - ny * w),
        ], "c": bone if i % 2 else accent, "a": 0.24})

    # --- torso -------------------------------------------------------
    torso = list(TORSO[build])
    if side:
        torso = _scale_x(torso, 256, 0.60)
        torso = _shift(torso, 10, 0)
    ops.append({"op": "poly", "pts": torso, "c": black})
    inner = _shrink(torso, (256, 430), 6)
    ops.append({"op": "poly", "pts": inner, "c": accent})

    if back:
        # spine shadow + shoulder seam keep the back from reading as a flat slab
        ops.append({"op": "poly", "pts": [(240, 356), (272, 356), (276, 512), (236, 512)],
                    "c": dim})
        ops.append({"op": "line", "x1": 256, "y1": 366, "x2": 256, "y2": 506, "w": 4, "c": black})
    else:
        ops.append({"op": "poly", "pts": _scale_x([(206, 372), (256, 352), (306, 372),
                                                   (296, 420), (216, 420)], 256,
                                                  0.6 if side else 1.0),
                    "c": dim})
    # rim light — key light stays upper-right in every view
    ops.append({"op": "line", "x1": inner[4][0], "y1": inner[4][1],
                "x2": inner[5][0], "y2": inner[5][1], "w": 7, "c": bone})

    # --- neck --------------------------------------------------------
    neck = _scale_x([(228, 316), (284, 316), (292, 372), (220, 372)], 256, 0.7 if side else 1.0)
    ops.append({"op": "poly", "pts": neck, "c": black})
    ops.append({"op": "poly", "pts": _shrink(neck, (256, 344), 5), "c": dim})

    # --- head ---------------------------------------------------------
    head_cy = 214 if build != "tall" else 202
    if side:
        hx, hrx, hry = 258.0, 46.0, 76.0
    else:
        hx, hrx, hry = 256.0, 63.0, 75.0
    ops.append({"op": "ellipse", "cx": hx, "cy": head_cy, "rx": hrx + 7, "ry": hry + 7,
                "rot": 0, "c": black})
    ops.append({"op": "ellipse", "cx": hx, "cy": head_cy, "rx": hrx, "ry": hry, "rot": 0,
                "c": ink})
    if not back:
        # brow shadow keeps the face unreadable from front and profile alike
        ops.append({"op": "ellipse", "cx": hx - (8 if side else 8), "cy": head_cy - 22,
                    "rx": (hrx + 8) if side else 66, "ry": 46 if side else 46,
                    "rot": -7 if side else -7, "c": black})
        ops.append({"op": "line", "x1": hx + (34 if side else 36),
                    "y1": head_cy + 30, "x2": hx + (44 if side else 50),
                    "y2": head_cy + 58, "w": 6, "c": bone})
    else:
        # back of the head: hair mass, no features at all
        ops.append({"op": "ellipse", "cx": hx, "cy": head_cy - 6, "rx": hrx - 4, "ry": hry - 8,
                    "rot": 0, "c": mix(ink, black, 0.45)})

    # --- headwear ----------------------------------------------------
    if headwear == "hood":
        if side:
            dome = cubic((196, 368), (196, 250), (232, 140), (300, 132)) \
                + cubic((300, 132), (330, 168), (326, 260), (318, 368))
            shape = dome + [(318, 368), (196, 368)]
        else:
            dome = cubic((150, 372), (146, 250), (176, 138), (258, 126)) \
                + cubic((258, 126), (340, 138), (368, 250), (364, 372))
            shape = dome + [(364, 372), (150, 372)]
        ops.append({"op": "poly", "pts": shape, "c": black})
        ops.append({"op": "poly", "pts": _shrink(shape, (258, 240), 6), "c": accent})
        if not back:
            hl = cubic((206, 190), (216, 152), (248, 140), (276, 144)) \
                + cubic((276, 144), (310, 148), (332, 170), (340, 202))
            ops.append({"op": "poly", "pts": hl + [(302, 184), (238, 190)], "c": lit})
        else:
            ops.append({"op": "line", "x1": 258, "y1": 140, "x2": 258, "y2": 330,
                        "w": 5, "c": black})
    elif headwear == "static":
        if side:
            spikes = [(214, 176)]
            x, up = 214, True
            while x < 300:
                spikes.append((x, 128 if up else 164))
                x += 16
                up = not up
            shape = spikes + [(286, 196), (232, 196)]
        else:
            spikes = [(186, 168)]
            x, up = 186, True
            while x < 326:
                spikes.append((x, 118 if up else 158))
                x += 18
                up = not up
            shape = spikes + [(300, 196), (212, 196)]
        ops.append({"op": "poly", "pts": shape, "c": black})
        ops.append({"op": "poly", "pts": _shrink(shape, (256, 180), 6), "c": lit})
    elif headwear == "goggles":
        if side:
            ops.append({"op": "poly", "pts": [(258, head_cy - 30), (306, head_cy - 30),
                                              (306, head_cy + 4), (258, head_cy + 4)], "c": black})
            ops.append({"op": "poly", "pts": [(262, head_cy - 24), (302, head_cy - 24),
                                              (302, head_cy - 2), (262, head_cy - 2)], "c": ink})
            ops.append({"op": "line", "x1": 262, "y1": head_cy - 20, "x2": 298,
                        "y2": head_cy - 20, "w": 4, "c": bone})
            ops.append({"op": "line", "x1": 258, "y1": head_cy - 14, "x2": 216,
                        "y2": head_cy - 8, "w": 7, "c": black})
        elif back:
            ops.append({"op": "line", "x1": 190, "y1": head_cy - 10, "x2": 322,
                        "y2": head_cy - 10, "w": 8, "c": black})
        else:
            ops.append({"op": "poly", "pts": [(176, head_cy - 34), (338, head_cy - 34),
                                              (338, head_cy + 6), (176, head_cy + 6)], "c": black})
            ops.append({"op": "poly", "pts": [(182, head_cy - 28), (332, head_cy - 28),
                                              (332, head_cy), (182, head_cy)], "c": ink})
            ops.append({"op": "line", "x1": 190, "y1": head_cy - 22, "x2": 246,
                        "y2": head_cy - 22, "w": 5, "c": bone})
    elif headwear == "cap":
        crown = cubic((184, 176), (196, 118), (318, 118), (330, 176))
        if side:
            crown = cubic((212, 176), (222, 124), (306, 124), (312, 176))
        ops.append({"op": "poly", "pts": crown, "c": black})
        ops.append({"op": "poly", "pts": _shrink(crown, (256, 160), 6), "c": dim})
        if side:
            ops.append({"op": "poly", "pts": [(306, 168), (368, 180), (366, 194), (304, 186)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(308, 174), (360, 183), (359, 191), (306, 184)],
                        "c": dim})
        elif back:
            ops.append({"op": "poly", "pts": [(240, 168), (272, 168), (272, 184), (240, 184)],
                        "c": amber})
        else:
            ops.append({"op": "poly", "pts": [(322, 170), (380, 186), (378, 200), (318, 190)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(324, 176), (372, 188), (370, 196), (322, 188)],
                        "c": dim})

    # --- signature prop (tool of the trade) ---------------------------
    if rig == "core_chest":
        if side:
            pts = diamond(288, 452, 42)
        elif back:
            pts = diamond(256, 430, 44)
        else:
            pts = diamond(256, 452, 46)
        for r, w, col in ((1.0, 8, black), (1.0, 5, amber), (0.63, 5, black), (0.63, 3, bone)):
            d = diamond(pts[1][0] - r * 0 + (256 if back else pts[1][0]) * 0, 0, 0)  # placeholder
            sub = diamond(pts[1][0] - r * (46 if not side else 42) + (0 if not side else 0), 0, 0)
            rr = (46 if not side else 42) * r
            ccx = 288 if side else 256
            ccy = 452 if not back else 430
            sub = diamond(ccx, ccy, rr)
            for i in range(4):
                x1, y1 = sub[i]
                x2, y2 = sub[(i + 1) % 4]
                ops.append({"op": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2, "w": w, "c": col})
    elif rig == "headphones":
        if side:
            for ex in (272,):
                ops.append({"op": "ellipse", "cx": ex, "cy": 252, "rx": 30, "ry": 40,
                            "rot": 0, "c": black})
                ops.append({"op": "ellipse", "cx": ex, "cy": 252, "rx": 23, "ry": 32,
                            "rot": 0, "c": bone})
            band = cubic((256, 258), (262, 150), (300, 150), (300, 250))
            for w, c in ((15, black), (9, bone)):
                for i in range(len(band) - 1):
                    ops.append({"op": "line", "x1": band[i][0], "y1": band[i][1],
                                "x2": band[i + 1][0], "y2": band[i + 1][1], "w": w, "c": c})
        else:
            spread = 100 if not back else 86
            for ex in (256 - spread, 256 + spread):
                ops.append({"op": "ellipse", "cx": ex, "cy": 252, "rx": 36, "ry": 45,
                            "rot": 0, "c": black})
                ops.append({"op": "ellipse", "cx": ex, "cy": 252, "rx": 28, "ry": 36,
                            "rot": 0, "c": bone})
                if not back:
                    ops.append({"op": "ellipse", "cx": ex, "cy": 252, "rx": 14, "ry": 19,
                                "rot": 0, "c": dim})
            band = cubic((256 - spread + 4, 258), (256 - spread, 152),
                         (256 + spread, 152), (256 + spread - 4, 258))
            for w, c in ((16, black), (10, bone)):
                for i in range(len(band) - 1):
                    ops.append({"op": "line", "x1": band[i][0], "y1": band[i][1],
                                "x2": band[i + 1][0], "y2": band[i + 1][1], "w": w, "c": c})
        # messenger bag reads from every angle
        if side:
            ops.append({"op": "poly", "pts": [(300, 396), (368, 436), (352, 512), (286, 470)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(306, 404), (358, 438), (346, 500), (294, 470)],
                        "c": dim})
        elif back:
            ops.append({"op": "poly", "pts": [(196, 400), (318, 400), (312, 512), (202, 512)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(204, 408), (310, 408), (306, 504), (208, 504)],
                        "c": dim})
            ops.append({"op": "line", "x1": 208, "y1": 392, "x2": 306, "y2": 392,
                        "w": 9, "c": amber})
        else:
            ops.append({"op": "poly", "pts": [(300, 400), (430, 470), (414, 512), (286, 448)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(306, 408), (420, 470), (408, 500), (298, 444)],
                        "c": dim})
    elif rig == "squeegee":
        if side:
            ops.append({"op": "poly", "pts": [(296, 300), (318, 300), (352, 500), (326, 504)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(302, 306), (314, 306), (344, 496), (328, 498)],
                        "c": bone})
            ops.append({"op": "poly", "pts": [(288, 292), (330, 292), (330, 334), (288, 334)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(294, 298), (324, 298), (324, 328), (294, 328)],
                        "c": amber})
        elif back:
            ops.append({"op": "poly", "pts": [(300, 320), (326, 320), (312, 512), (286, 512)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(306, 328), (320, 328), (308, 504), (294, 504)],
                        "c": bone})
        else:
            ops.append({"op": "poly", "pts": [(372, 348), (452, 300), (462, 320), (382, 368)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(376, 354), (448, 312), (454, 326), (384, 366)],
                        "c": bone})
            ops.append({"op": "poly", "pts": [(352, 380), (404, 350), (414, 372), (362, 402)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(358, 382), (400, 360), (406, 374), (364, 396)],
                        "c": amber})
    elif rig == "cup":
        if side:
            ops.append({"op": "poly", "pts": [(296, 452), (352, 452), (346, 512), (302, 512)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(302, 458), (346, 458), (342, 506), (306, 506)],
                        "c": bone})
            ops.append({"op": "ellipse", "cx": 324, "cy": 456, "rx": 22, "ry": 6, "rot": 0,
                        "c": ink})
        elif back:
            # keyboard lid seen from behind — the R&B anchor without showing the front
            ops.append({"op": "poly", "pts": [(150, 470), (362, 470), (362, 500), (150, 500)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(156, 476), (356, 476), (356, 494), (156, 494)],
                        "c": dim})
        else:
            ops.append({"op": "poly", "pts": [(336, 456), (398, 456), (390, 512), (344, 512)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(342, 462), (392, 462), (386, 506), (348, 506)],
                        "c": bone})
            ops.append({"op": "ellipse", "cx": 367, "cy": 460, "rx": 25, "ry": 7, "rot": 0,
                        "c": ink})
    elif rig == "toolbelt":
        if side:
            ops.append({"op": "poly", "pts": [(196, 452), (300, 452), (300, 492), (196, 492)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(202, 458), (294, 458), (294, 486), (202, 486)],
                        "c": ink})
            ops.append({"op": "poly", "pts": [(208, 486), (248, 486), (244, 512), (212, 512)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(213, 490), (243, 490), (240, 508), (216, 508)],
                        "c": amber})
        else:
            ops.append({"op": "poly", "pts": [(96, 452), (416, 452), (416, 492), (96, 492)],
                        "c": black})
            ops.append({"op": "poly", "pts": [(102, 458), (410, 458), (410, 486), (102, 486)],
                        "c": ink})
            for x in ((150, 232, 314, 386) if not back else (188, 256, 324)):
                ops.append({"op": "poly", "pts": [(x - 16, 486), (x + 16, 486), (x + 12, 512),
                                                  (x - 12, 512)], "c": black})
                ops.append({"op": "poly", "pts": [(x - 11, 490), (x + 11, 490), (x + 8, 508),
                                                  (x - 8, 508)], "c": amber})
    elif rig == "scarf":
        if side:
            ops.append({"op": "poly", "pts": cubic((244, 344), (200, 380), (150, 400), (96, 452))
                        + cubic((96, 452), (128, 462), (170, 430), (214, 400)), "c": black})
            ops.append({"op": "poly", "pts": cubic((250, 352), (208, 386), (160, 406), (108, 454))
                        + cubic((108, 454), (136, 462), (176, 432), (218, 404)), "c": amber})
        elif back:
            ops.append({"op": "poly", "pts": cubic((216, 340), (196, 400), (240, 452), (300, 470))
                        + cubic((300, 470), (316, 424), (286, 392), (262, 352)), "c": black})
            ops.append({"op": "poly", "pts": cubic((224, 348), (206, 400), (246, 446), (296, 462))
                        + cubic((296, 462), (308, 424), (282, 396), (258, 358)), "c": amber})
        else:
            ops.append({"op": "poly", "pts": cubic((246, 344), (300, 372), (392, 366), (470, 410))
                        + cubic((470, 410), (446, 434), (392, 424), (330, 402)), "c": black})
            ops.append({"op": "poly", "pts": cubic((250, 352), (302, 380), (388, 374), (458, 412))
                        + cubic((458, 412), (436, 432), (388, 418), (330, 396)), "c": amber})
    elif rig == "bird":
        if side:
            bx, by = 300, 330
        elif back:
            bx, by = 300, 330
        else:
            bx, by = 150, 330
        ops.append({"op": "poly", "pts": [(bx - 26, by - 8), (bx + 20, by - 16),
                                          (bx + 32, by + 28), (bx - 24, by + 34)], "c": black})
        ops.append({"op": "poly", "pts": [(bx - 20, by - 2), (bx + 16, by - 10),
                                          (bx + 24, by + 24), (bx - 18, by + 28)], "c": bone})
        ops.append({"op": "poly", "pts": [(bx + 20, by - 14), (bx + 56, by - 6),
                                          (bx + 22, by + 2)], "c": black})
        ops.append({"op": "poly", "pts": [(bx + 24, by - 11), (bx + 50, by - 5),
                                          (bx + 24, by - 1)], "c": amber})
        ops.append({"op": "line", "x1": bx - 8, "y1": by + 28, "x2": bx - 12, "y2": by + 50,
                    "w": 5, "c": amber})

    # --- resonance halo (brand anchor, visible from every angle) -------
    for r, w, col in ((196, 7, accent), (154, 6, bone), (114, 5, accent), (76, 5, bone)):
        pts = diamond(256, head_cy, r, 1.05 if side else 1.25)
        if side:
            pts = _scale_x(pts, 256, 0.8)
        for i in range(4):
            x1, y1 = pts[i]
            x2, y2 = pts[(i + 1) % 4]
            ops.append({"op": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2, "w": w, "c": black})
            ops.append({"op": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                        "w": w - 2.5, "c": col})
    return ops


# ---------------------------------------------------------------- rasterizer


def _raster(ops, w, h, ss, ox=0.0, oy=0.0, scale=1.0):
    import numpy as np

    n_y, n_x = h * ss, w * ss
    yy, xx = np.mgrid[0:n_y, 0:n_x]
    xs = ((xx + 0.5) / ss - ox) / scale
    ys = ((yy + 0.5) / ss - oy) / scale
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
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
                     + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b""))


# ---------------------------------------------------------------- sheet


def render_views_sheet(spec: dict, ss: int = 2):
    import numpy as np

    accent = hex_rgb(spec["accent"])
    bg = hex_rgb(BG_HEX)
    panel = hex_rgb(PANEL_HEX)
    bone = hex_rgb(BONE_HEX)
    bone_dim = mix(hex_rgb(PANEL_HEX), hex_rgb(BONE_HEX), 0.35)
    black = hex_rgb(BLACK_HEX)

    sheet = np.zeros((SHEET_H, SHEET_W, 3), np.uint8)
    sheet[:, :] = bg
    sheet[FIG_H:, :] = panel

    scale = PANEL_W / ART
    for i, view in enumerate(VIEWS):
        x0 = i * PANEL_W
        # _raster treats the output canvas as if it starts at its own output_x=0;
        # the panel's position in the sheet is applied by the assignment to
        # `sheet[:, x0:x0+PANEL_W]`, not by ox.
        ox = (PANEL_W / 2 - 256 * scale)
        ops = build_character(spec["accent"], spec["build"], spec["headwear"],
                               spec["rig"], view)
        art = _raster(ops, PANEL_W, FIG_H, ss, ox=ox, oy=0.0, scale=scale)
        sheet[0:FIG_H, x0:x0 + PANEL_W] = art

        # centre line (dashed) — model-sheet convention
        ccx = x0 + PANEL_W // 2
        for y in range(20, BASELINE_Y - 20, 26):
            sheet[y:y + 14, ccx - 1:ccx + 1] = bone_dim
        # panel separator
        if i:
            sheet[0:FIG_H, x0 - 2:x0 + 2] = black

    # ground line across all three views (common baseline)
    sheet[BASELINE_Y - 3:BASELINE_Y + 3, :] = bone

    # bottom strip: palette + silhouette tests
    sw, gap = 96, 20
    palette = [hex_rgb(spec["accent"]), hex_rgb(BONE_HEX), hex_rgb(AMBER_HEX), hex_rgb(INK_HEX)]
    for i, col in enumerate(palette):
        px_x = 60 + i * (sw + gap)
        px_y = FIG_H + 80
        sheet[px_y:px_y + sw, px_x:px_x + sw] = col
        sheet[px_y - 4:px_y, px_x - 4:px_x + sw + 4] = black
        sheet[px_y + sw:px_y + sw + 4, px_x - 4:px_x + sw + 4] = black
        sheet[px_y - 4:px_y + sw + 4, px_x - 4:px_x] = black
        sheet[px_y - 4:px_y + sw + 4, px_x + sw:px_x + sw + 4] = black

    # silhouette test per view (front | side | back) at 128px
    fig_cx, fig_cy, fig_h = 260.0, 300.0, 420.0
    for i, view in enumerate(VIEWS):
        size = 160
        sil = [{"op": "rect", "x": 0, "y": 0, "w": ART, "h": ART, "c": bone}]
        for o in build_character(spec["accent"], spec["build"], spec["headwear"],
                                 spec["rig"], view):
            if o["op"] == "rect":
                continue
            sil.append({**o, "c": black, "a": 1.0})
        sc = (size * 0.90) / fig_h
        arr = _raster(sil, size, size, 3,
                      ox=(size / 2) - fig_cx * sc, oy=(size / 2) - fig_cy * sc, scale=sc)
        x0 = 620 + i * (size + 48)
        y0 = FIG_H + 44
        sheet[y0:y0 + size, x0:x0 + size] = arr
        sheet[y0 - 4:y0, x0 - 4:x0 + size + 4] = black
        sheet[y0 + size:y0 + size + 4, x0 - 4:x0 + size + 4] = black
        sheet[y0 - 4:y0 + size + 4, x0 - 4:x0] = black
        sheet[y0 - 4:y0 + size + 4, x0 + size:x0 + size + 4] = black

    return sheet


def main() -> int:
    ap = argparse.ArgumentParser(description="BeatScape character 三视图 sheets")
    ap.add_argument("--character")
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
        arr = render_views_sheet(spec)
        path = args.out_dir / f"{spec['key']}-views.png"
        write_png(path, arr)
        print(f"OK {spec['key']:8s} {spec['codename']:7s} {spec['district']:16s} -> {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
