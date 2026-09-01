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
  python3 scripts/beatscape-anime-prompts.py --character juno
  python3 scripts/beatscape-anime-prompts.py --character juno --view side
  python3 scripts/beatscape-anime-prompts.py --character juno --lora   # prepend <char>bs trigger

Identity rules (BEATSCAPE-WORLDBIBLE.md §7 / ART-BRIEF §1):
  - `anchors` = the character's Bible visual anchors. They sit right after
    STYLE + MOTIF so they get identity-level CLIP weight — a portrait that
    misses its anchors is a failed portrait even if it is pretty.
  - STYLE forces the shared set look: cel shading + muted colors; night-city
    mood comes from the backgrounds. The negatives ban daylight / blue sky
    (the city only lives at night) and soft painterly shading.
  - Budget is 77 CLIP BPE subwords (not comma count). NIGHTSHIFT entries are
    measured ≤77 with the real tokenizer (trigger included); downstream
    fit_clip() is the enforcement gate. Never add tags without re-measuring.
"""

from __future__ import annotations

import argparse
import json

# --- shared ---------------------------------------------------------------

# Animagine quality boost. Kept to two tags: the 77-token CLIP budget is
# measured in BPE subwords (not commas) and every BPE spent here is stolen
# from identity anchors. Two tags is the verified minimum that still lifts.
QUALITY_TAGS = "masterpiece, absurdres"

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
    "cigarette, alcohol, "
    # --- unified art direction: night city only (Bible §3.1), cel style only (BRIEF §1) ---
    "daytime, blue sky, sunlight, sunset, dawn, "
    "backlighting, rim lighting, lens flare, bloom, "
    "soft shading, gradient shading, painterly, watercolor, sketch, "
    "full body, oversaturated, "
    # workwear, not warwear — TORQUE must read mechanic, never soldier
    "tactical vest, chest rig, shoulder armor, mecha, robot"
)

# Art Brief §1 technique layer, shared by every character. Deliberately two
# tags: hard edges arrive via "cel shading", the matte/night grade via the
# night backgrounds plus negatives (soft shading / painterly / bloom /
# daytime are all banned there). Every positive tag costs ~2-4 BPE of the
# hard 77-token budget — style has to share that budget with identity.
STYLE = "cel shading, muted colors"

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
# Slimmed from the 3-tag/16-BPE original to one tag: the visual (glowing
# diamond halo behind the head) is unchanged, and trainset/gen/cdcover all
# consume this constant, so LoRA captions and renders stay consistent.
MOTIF = "glowing diamond halo"

VIEW_TAGS = {
    # one shared crop for the whole set — a crew, not three unrelated images
    "front": "cowboy shot",
    "side": "from side, profile",
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
    # --- NIGHTSHIFT (World Bible v1 · 3-person crew, replaces the seven above) ---
    # These three are budgeted to ≤77 *BPE* (verified with the real CLIP
    # tokenizer, lora trigger included). Multi-word tags cost 2-6 BPE each,
    # so every entry below is minimal by design: anchors + silhouette first,
    # everything optional cut. The negatives carry the rest of the art
    # direction. Do not "enrich" these without re-measuring BPE.
    "juno": {
        "codename": "JUNO",
        "district": "Pulse Core",
        "accent": "#E23D3D",
        "trigger": "junobs",
        "subject": "1girl, solo, young woman",
        # headphones-on-one-ear IS her silhouette hook (Bible §7 视觉锚);
        # badge lamp is letterless on purpose — letters garble at this size
        "anchors": "headphones on one ear, glowing red chest badge, radio microphone",
        "appearance": "black side ponytail, tired eyes, smirk",
        "clothing": "red work jacket",
        "background": "night city, radio tower, halftone",
    },
    "atlas": {
        "codename": "ATLAS",
        "district": "Skyline Hook",
        "accent": "#5B8DEF",
        "trigger": "atlasbs",
        "subject": "1other, solo, androgynous",
        # chest field-strength meter is the Bible anchor; the spectrum coat
        # lining is expressed as a visible waveform-print shirt
        "anchors": "chest field meter, waveform print shirt",
        "appearance": "silver messy hair, hair over one eye, amber eyes",
        "clothing": "blue long coat",
        "background": "night rooftop, antenna forest, halftone",
    },
    "torque": {
        "codename": "TORQUE",
        "district": "Chrome Yard",
        "accent": "#8C8079",
        "trigger": "torquebs",
        "subject": "1boy, solo, young man",
        # wrench drumsticks + hubcap gong: drummer-mechanic, never soldier
        # (tactical vests are banned in NEGATIVE)
        "anchors": "holding drumsticks, chrome hubcap gong, wrench in belt",
        "appearance": "dark undercut, stubble, warm grin",
        "clothing": "grey coverall",
        "background": "night scrap yard, halftone",
    },
}


def _cap_77(prompt: str, limit: int = 75) -> str:
    """Cheap comma-tag pre-filter only — the REAL gate is `fit_clip()` in the
    downstream scripts (gen/cdcover/trainset), which measures actual CLIP BPE
    with the pipeline tokenizer. CLIP budget is 77 BPE subwords incl. BOS/EOS,
    not comma count: a 45-tag prompt can be 150 BPE and get its tail silently
    truncated by diffusers' truncation=True (this is exactly what made the
    first render round drop backgrounds and quality tags). NIGHTSHIFT entries
    are verified ≤77 BPE with the real tokenizer; deprecated entries may
    overshoot here and rely on the gen-time fit_clip to trim.
    """
    toks = [t.strip() for t in prompt.split(",") if t.strip()]
    if len(toks) <= limit:
        return ", ".join(toks)
    head_n, tail_n = 16, 4  # head: identity+style+motif+anchors | tail: quality tags
    head = toks[:head_n]
    tail = toks[-tail_n:]
    mid = [t for t in toks[head_n:-tail_n] if t not in head and t not in tail]
    mid = mid[: max(0, limit - head_n - tail_n)]
    return ", ".join(head + mid + tail)


def build_prompt(key: str, view: str = "front", extra: str = "", lora: bool = False) -> str:
    """Compose an Animagine-ordered prompt for one character and view.

    Order matters: STYLE (shared set look) and MOTIF sit right after
    `rating:safe`, followed by the character's Bible anchors — the whole
    identity block lands inside the un-trimmed head. Quality tags stay last.
    """
    c = CHARACTERS[key]
    parts = [
        c["subject"],
        # LoRA identity trigger (<char>bs) only when generating with the
        # fine-tuned adapter — the base model must never see it.
        c.get("trigger", "") if lora else "",
        "rating:safe",
        STYLE,
        MOTIF,
        c.get("anchors") or c.get("prop", ""),  # identity-level props
        c["appearance"],
        c["clothing"],
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
    ap.add_argument("--lora", action="store_true",
                    help="prepend the LoRA identity trigger (<char>bs) into the prompt")
    args = ap.parse_args()

    if args.list:
        for key, c in CHARACTERS.items():
            print(f"{key:8s} {c['codename']:7s} {c['district']:16s} {c['accent']}")
        return 0

    if not args.character:
        ap.error("specify --list or --character")

    if args.character not in CHARACTERS:
        raise SystemExit(f"unknown character: {args.character}")

    prompt = build_prompt(args.character, args.view, lora=args.lora)
    if args.json:
        payload = {
            "character": args.character,
            "view": args.view,
            "prompt": prompt,
            "negative": NEGATIVE,
            "settings": SETTINGS,
        }
        if "trigger" in CHARACTERS[args.character]:
            payload["lora_trigger"] = CHARACTERS[args.character]["trigger"]
        print(json.dumps(payload, indent=2))
        return 0

    c = CHARACTERS[args.character]
    print(f"# {c['codename']} · {args.view}" + (f"  (LoRA: {c['trigger']})" if args.lora and "trigger" in c else ""))
    print()
    print("PROMPT:")
    print(prompt)
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
