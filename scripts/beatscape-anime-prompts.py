#!/usr/bin/env python3
"""BeatScape character prompts in Animagine XL 4.0 (Danbooru tag) syntax.

Animagine XL 4.0 is tag-based — natural-language sentences perform poorly.
Official prompt order (huggingface.co/cagliostrolab/animagine-xl-4.0):

    1girl/1boy/1other, character name, from which series, rating,
    everything else in any order, [quality tags at the end]

Our characters are **original**, so we emit no character name and no series
tag. Leaving those slots empty is deliberate: naming a series would steer the
model toward existing IP, which is exactly what we must avoid.

Optimal settings (official): Euler a, 28 steps, CFG 5, SDXL-native 1024x1024.

Usage:
  python3 scripts/beatscape-anime-prompts.py --list
  python3 scripts/beatscape-anime-prompts.py --character volta
  python3 scripts/beatscape-anime-prompts.py --character volta --view side
"""

from __future__ import annotations

import argparse
import json

# --- shared ---------------------------------------------------------------

QUALITY_TAGS = "masterpiece, high score, great score, absurdres"

# Standard SDXL negatives + BeatScape IP red lines.
# The red-line tags are the useful part: they push the model away from the
# expression layer we are not allowed to touch (see BEATSCAPE-CHARACTER-ART-BRIEF §2).
NEGATIVE = (
    # quality
    "lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, "
    "fewer digits, cropped, worst quality, low quality, low score, bad score, "
    "average score, signature, watermark, username, blurry, jpeg artifacts, "
    # content rating (brand IP must stay clean)
    "rating:sensitive, rating:nsfw, rating:explicit, "
    # --- BeatScape IP red lines ---
    "mask, domino mask, face mask, gas mask, visor, eyepatch, helmet, "
    "school uniform, uniform, military uniform, cape, cloak, robe, "
    "bodysuit, skinsuit, gloves and boots outfit, "
    "tarot card, arcana, tarot spread, playing cards, "
    "weapon, sword, knife, gun, pistol, rifle, blade, "
    "japanese text, furigana, speech bubble, "
    "cigarette, alcohol"
)

SETTINGS = {
    "base_model": "cagliostrolab/animagine-xl-4.0",
    "sampler": "euler_a",
    "steps": 28,
    "cfg": 5.0,
    "width": 832,
    "height": 1216,
    "clip_skip": 2,
}

# BeatScape brand motif — must appear in every character, at the sound source.
MOTIF = "diamond-shaped halo, four concentric diamonds behind head, glowing amber diamond core"

VIEW_TAGS = {
    "front": "standing, facing viewer, symmetric pose",
    "side": "from side, profile, looking away",
    "back": "from behind, back view",
}

# --- characters -----------------------------------------------------------
# subject / appearance / clothing / prop / background — mirrors
# docs/BEATSCAPE-CHARACTER-ART-BRIEF.md §4.

CHARACTERS: dict[str, dict[str, str]] = {
    "volta": {
        "codename": "VOLTA",
        "district": "Pulse Core",
        "accent": "#E23D3D",
        "subject": "1boy, solo, young adult male",
        "appearance": (
            "short black hair, spiky hair, asymmetric bangs, hair sticking up, "
            "static electricity, dark eyes, confident, slight smile, tired eyes"
        ),
        "clothing": (
            "vermilion red work jacket, popped collar, red cargo pants, "
            "insulated work gloves, work boots"
        ),
        "prop": "diamond emblem on chest, chest insignia",
        "background": "night city street, neon signs, bokeh, wet asphalt reflection",
    },
    "static": {
        "codename": "STATIC",
        "district": "Night Grid",
        "accent": "#6E2426",
        "subject": "1boy, solo, young adult male",
        "appearance": (
            "medium hair, messy hair, hood down, dark eyes, "
            "calm, composed, looking at viewer"
        ),
        "clothing": (
            "dark wine red hoodie, hood, loose fit, dark cargo pants, sneakers, "
            "crossbody messenger bag"
        ),
        "prop": "over-ear headphones around neck, headphones",
        "background": "empty night street, streetlights, rain, alley",
    },
    "prism": {
        "codename": "PRISM",
        "district": "Glass Rim",
        "accent": "#E4D8C4",
        "subject": "1girl, solo, young adult female",
        "appearance": (
            "medium hair, side-swept bangs, glossy hair, light eyes, "
            "focused, gentle expression"
        ),
        "clothing": (
            "bone white light jacket, slim fit, off-white trousers, "
            "safety goggles on forehead, work gloves"
        ),
        "prop": "holding window squeegee, cleaning tool",
        "background": "glass skyscraper facade, reflections, sunset, city skyline",
    },
    "ember": {
        "codename": "EMBER",
        "district": "Afterhours Lane",
        "accent": "#B0765A",
        "subject": "1girl, solo, young adult female",
        "appearance": (
            "long wavy hair, tousled hair, warm eyes, "
            "relaxed, drowsy, soft smile"
        ),
        "clothing": "terracotta loose shirt, sleeveless vest, rolled-up sleeves",
        "prop": "mug of coffee, upright piano keyboard lid",
        "background": "empty bar interior, dim warm light, jazz club, night",
    },
    "rivet": {
        "codename": "RIVET",
        "district": "Chrome Yard",
        "accent": "#8C8079",
        "subject": "1boy, solo, young adult male",
        "appearance": (
            "short hair, undercut, backward cap, "
            "strong build, broad shoulders, wide grin"
        ),
        "clothing": (
            "grey utility vest, work shirt, rolled sleeves, "
            "tool belt, heavy work boots"
        ),
        "prop": "utility belt with tools, chipped guitar pick necklace, electric guitar",
        "background": "scrap yard workshop, metal shelves, sparks, industrial light",
    },
    "glide": {
        "codename": "GLIDE",
        "district": "Slide District",
        "accent": "#FFB020",
        "subject": "1girl, solo, young adult female",
        "appearance": (
            "short hair, wind-blown hair, athletic build, bright eyes, "
            "excited, determined expression"
        ),
        "clothing": (
            "amber lightweight jacket, athletic wear, shorts, "
            "long flowing scarf, gloves"
        ),
        "prop": "long trailing scarf, zipline glove",
        "background": "city rooftops, night sky, motion blur, speed lines",
    },
    "halo": {
        "codename": "HALO",
        "district": "Skyline Hook",
        "accent": "#5B8DEF",
        "subject": "1boy, solo, young adult male",
        "appearance": (
            "medium straight hair, neat hair, tall, slim build, "
            "calm, distant gaze"
        ),
        "clothing": "steel blue long coat, scarf, trousers, boots",
        "prop": "mechanical bird on shoulder, rangefinder device",
        "background": "city skyline at dusk, observation deck, clouds",
    },
}


def _cap_77(prompt: str, limit: int = 75) -> str:
    """CLIP text encoders cap at 77 tokens; overshoot silently drops the tail —
    which is exactly where our IP motif (diamond halo) and quality tags live.

    Trim the *middle* (redundant appearance/background filler) so the head
    (subject + rating + motif) and tail (view/bg + quality) always survive.
    Token count uses comma-separated Danbooru tags as a budget proxy.
    """
    toks = [t.strip() for t in prompt.split(",") if t.strip()]
    if len(toks) <= limit:
        return ", ".join(toks)
    head_n, tail_n = 14, 4  # head: identity+motif | tail: quality tags
    head = toks[:head_n]
    tail = toks[-tail_n:]
    mid = [t for t in toks[head_n:-tail_n] if t not in head and t not in tail]
    mid = mid[: max(0, limit - head_n - tail_n)]
    return ", ".join(head + mid + tail)


def build_prompt(key: str, view: str = "front", extra: str = "") -> str:
    """Compose an Animagine-ordered prompt for one character and view.

    Order matters: the resonance-diamond MOTIF sits right after `rating:safe`
    so CLIP never truncates it. Quality tags stay last.
    """
    c = CHARACTERS[key]
    parts = [
        c["subject"],
        "rating:safe",
        MOTIF,
        c["appearance"],
        c["clothing"],
        c["prop"],
        VIEW_TAGS[view],
        c["background"],
    ]
    if extra:
        parts.insert(-1, extra)
    parts.append(QUALITY_TAGS)
    return _cap_77(", ".join(p for p in parts if p))


def main() -> int:
    ap = argparse.ArgumentParser(description="BeatScape Animagine prompt library")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--character", help="character key, e.g. volta")
    ap.add_argument("--view", default="front", choices=sorted(VIEW_TAGS))
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    if args.list:
        for key, c in CHARACTERS.items():
            print(f"{key:8s} {c['codename']:7s} {c['district']:16s} {c['accent']}")
        return 0

    if not args.character:
        ap.error("specify --list or --character")

    if args.character not in CHARACTERS:
        raise SystemExit(f"unknown character: {args.character}")

    if args.json:
        print(json.dumps({
            "character": args.character,
            "view": args.view,
            "prompt": build_prompt(args.character, args.view),
            "negative": NEGATIVE,
            "settings": SETTINGS,
        }, indent=2))
        return 0

    print(f"# {CHARACTERS[args.character]['codename']} · {args.view}")
    print()
    print("PROMPT:")
    print(build_prompt(args.character, args.view))
    print()
    print("NEGATIVE:")
    print(NEGATIVE)
    print()
    print("SETTINGS:")
    print(f"  base    {SETTINGS['base_model']}")
    print(f"  sampler {SETTINGS['sampler']}  steps {SETTINGS['steps']}  cfg {SETTINGS['cfg']}")
    print(f"  size    {SETTINGS['width']}x{SETTINGS['height']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
