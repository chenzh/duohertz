"""Stage6 expansion track specs (seq 36-85) — 50 new tracks, catalog 35 -> 85.

Wave composition:
  * batch ``s4-wave-3`` + ``s5-formal`` (seq 36-50): closes the formal 50 roadmap.
  * batch ``s6-expansion`` (seq 51-85): 35 pure expansion tracks.

Sonic truth: docs/BEATSCAPE-SONIC-DIRECTION.md (in-car wide mix + urban jazz battle).
Every prompt ends with the mandatory RESONANCE suffix and contains no banned tokens.
"""

from __future__ import annotations

# (track_id, seq, title, artist, genre, bpm, preset_id, district, tag, vibe,
#  default_mode, default_tier, allows_slide, motif)
STAGE6_SPECS: list[tuple] = [
    # ---- batch 1: close the formal 50 (seq 36-50) ----
    ("bs-s4-11", 36, "Ember Pulse Line", "Halcyon Flux", "EDM", 158, "bs-resonance-brass", "Pulse Core", "Hot Chart Style", "battle", "arcade", "standard", False, "ember-lit pulse core overpass at midnight"),
    ("bs-s4-12", 37, "Gridline Cipher", "Subline", "Hip-hop", 96, "bs-resonance-funkhop", "Night Grid", "Classic Style", "groove", "casual", "standard", False, "coded messages under the night grid"),
    ("bs-s4-13", 38, "Halftone Skyline", "Luma Rim", "Pop", 120, "bs-resonance-rhodes", "Glass Rim", "Viral Style", "groove", "arcade", "easy", False, "halftone sunset over the glass skyline"),
    ("bs-s4-14", 39, "Chrome Mile Anthem", "Iron Echo", "Rock", 134, "bs-resonance-stomp", "Chrome Yard", "New Release", "battle", "arcade", "hard", False, "chrome yard mile-long guitar anthem"),
    ("bs-s4-15", 40, "Neon Scape Drift", "Nova Circuit", "EDM", 166, "bs-resonance-climax", "Pulse Core", "Viral Style", "night-drive", "arcade", "standard", False, "neon scape drifting past the windshield"),
    ("bs-s5-01", 41, "Pulse Overpass", "Halcyon Flux", "EDM", 160, "bs-resonance-brass", "Pulse Core", "Hot Chart Style", "battle", "arcade", "standard", False, "brass stabs on a raised pulse overpass"),
    ("bs-s5-02", 42, "Glass Turnpike", "Ada North", "Pop", 124, "bs-resonance-rhodes", "Glass Rim", "New Release", "groove", "arcade", "easy", False, "glass turnpike cruise with bright rhodes"),
    ("bs-s5-03", 43, "Nightlane Static", "Low Voltage", "Hip-hop", 100, "bs-resonance-funkhop", "Night Grid", "Classic Style", "night-drive", "casual", "standard", False, "static on the radio down an empty nightlane"),
    ("bs-s5-04", 44, "Afterhours Satin", "Mira Lane", "R&B", 90, "bs-resonance-neosoul", "Afterhours Lane", "Classic Style", "chill", "casual", "easy", False, "satin smooth afterhours lane"),
    ("bs-s5-05", 45, "Chrome Vector", "Redline Co.", "Rock", 134, "bs-resonance-stomp", "Chrome Yard", "Hot Chart Style", "battle", "arcade", "standard", True, "chrome vector slide across four lanes"),
    ("bs-s5-06", 46, "Overload Scape", "Gridline", "EDM", 170, "bs-resonance-climax", "Pulse Core", "Hot Chart Style", "battle", "arcade", "hard", False, "pulse core overload on the night drive"),
    ("bs-s5-07", 47, "Halftone Harbour", "Kite Solar", "Pop", 116, "bs-resonance-glassdrive", "Glass Rim", "Classic Style", "chill", "casual", "easy", False, "halftone harbour lights across the water"),
    ("bs-s5-08", 48, "Gridlock Anthem", "Subline", "Hip-hop", 94, "bs-resonance-trapline", "Night Grid", "Viral Style", "groove", "arcade", "standard", False, "gridlock anthem with swagger bass"),
    ("bs-s5-09", 49, "Satin Nightline", "Verity Lane", "R&B", 88, "bs-resonance-neosoul", "Afterhours Lane", "New Release", "chill", "casual", "easy", False, "satin nightline after the last train"),
    ("bs-s5-10", 50, "Iron Boulevard", "Iron Echo", "Rock", 142, "bs-resonance-chromeline", "Chrome Yard", "Hot Chart Style", "battle", "arcade", "hard", False, "iron boulevard stomp with wah guitar"),
    # ---- batch 2: Stage6 expansion (seq 51-85) ----
    ("bs-s6-01", 51, "Afterglow Scape", "Pale Ember", "EDM", 162, "bs-resonance-brass", "Pulse Core", "Hot Chart Style", "battle", "arcade", "standard", False, "afterglow scape above the pulse core"),
    ("bs-s6-02", 52, "Halftone Bloom", "Luma Rim", "Pop", 120, "bs-resonance-glassdrive", "Glass Rim", "Viral Style", "groove", "arcade", "easy", False, "halftone bloom on the glass rim"),
    ("bs-s6-03", 53, "Lowbeam Groove", "Low Voltage", "Hip-hop", 98, "bs-resonance-funkhop", "Night Grid", "Classic Style", "groove", "casual", "standard", False, "lowbeam groove through the night grid"),
    ("bs-s6-04", 54, "Moonlit Turnpike", "Verity Lane", "R&B", 92, "bs-resonance-neosoul", "Afterhours Lane", "New Release", "chill", "casual", "easy", False, "moonlit turnpike with warm rhodes"),
    ("bs-s6-05", 55, "Chrome Foundry", "Iron Echo", "Rock", 136, "bs-resonance-stomp", "Chrome Yard", "New Release", "battle", "arcade", "hard", False, "chrome foundry stomp and brass hits"),
    ("bs-s6-06", 56, "Neon Overpass", "Gridline", "EDM", 166, "bs-resonance-climax", "Pulse Core", "Hot Chart Style", "battle", "arcade", "hard", False, "neon overpass drop with filtered disco"),
    ("bs-s6-07", 57, "Glass Verandah", "Soft Circuit", "Pop", 118, "bs-resonance-glassdrive", "Glass Rim", "New Release", "chill", "casual", "easy", False, "glass verandah at blue hour"),
    ("bs-s6-08", 58, "Grid Alley Flow", "Subline", "Hip-hop", 96, "bs-resonance-trapline", "Night Grid", "Viral Style", "groove", "arcade", "standard", False, "trapline flow down a narrow grid alley"),
    ("bs-s6-09", 59, "Voltage Causeway", "Redline Co.", "Rock", 140, "bs-resonance-chromeline", "Chrome Yard", "Hot Chart Style", "battle", "arcade", "hard", False, "voltage causeway guitar drive"),
    ("bs-s6-10", 60, "Scape Ignition", "Nova Circuit", "EDM", 168, "bs-resonance-climax", "Pulse Core", "Viral Style", "night-drive", "arcade", "standard", False, "scape ignition on the midnight expressway"),
    ("bs-s6-11", 61, "Prism Skyline", "Kite Solar", "Pop", 122, "bs-resonance-rhodes", "Glass Rim", "Viral Style", "groove", "arcade", "standard", False, "prism skyline with a funky rhodes hook"),
    ("bs-s6-12", 62, "Nightlane Drift", "Low Voltage", "Hip-hop", 102, "bs-resonance-funkhop", "Night Grid", "Classic Style", "night-drive", "casual", "standard", False, "nightlane drift with syncopated bass"),
    ("bs-s6-13", 63, "Satin Underpass", "Mira Lane", "R&B", 90, "bs-resonance-satin", "Afterhours Lane", "New Release", "chill", "casual", "easy", False, "satin underpass echo and soft kick"),
    ("bs-s6-14", 64, "Iron Skyline Riff", "Iron Echo", "Rock", 144, "bs-resonance-chromeline", "Chrome Yard", "Hot Chart Style", "battle", "arcade", "hard", False, "iron skyline riff with brass hits"),
    ("bs-s6-15", 65, "Midnight Overpass", "Halcyon Flux", "EDM", 174, "bs-resonance-overdrive", "Pulse Core", "New Release", "night-drive", "arcade", "hard", False, "midnight overpass at full overdrive"),
    ("bs-s6-16", 66, "Neon Chorus Line", "Ada North", "Pop", 126, "bs-resonance-rhodes", "Glass Rim", "New Release", "groove", "arcade", "standard", False, "neon chorus line with bright snare"),
    ("bs-s6-17", 67, "Static Boulevard", "Subline", "Hip-hop", 94, "bs-resonance-trapline", "Night Grid", "New Release", "groove", "arcade", "standard", False, "static boulevard with swagger 808"),
    ("bs-s6-18", 68, "Afterhours Cadence", "Verity Lane", "R&B", 88, "bs-resonance-satin", "Afterhours Lane", "Viral Style", "chill", "casual", "easy", False, "afterhours cadence in a warm pocket"),
    ("bs-s6-19", 69, "Chrome Boulevard", "Redline Co.", "Rock", 132, "bs-resonance-stomp", "Chrome Yard", "Classic Style", "battle", "arcade", "standard", False, "chrome boulevard stomp groove"),
    ("bs-s6-20", 70, "Pulse Foundry", "Halcyon Flux", "EDM", 158, "bs-resonance-brass", "Pulse Core", "Hot Chart Style", "night-drive", "arcade", "standard", False, "pulse foundry brass and four-on-floor"),
    ("bs-s6-21", 71, "Halftone Parade", "Luma Rim", "Pop", 120, "bs-resonance-glassdrive", "Glass Rim", "Viral Style", "groove", "arcade", "standard", False, "halftone parade down the glass rim"),
    ("bs-s6-22", 72, "Grid Circuit Flow", "Low Voltage", "Hip-hop", 100, "bs-resonance-funkhop", "Night Grid", "Viral Style", "groove", "casual", "standard", False, "grid circuit flow with off-beat hats"),
    ("bs-s6-23", 73, "Lantern Scape", "Quiet Neon", "R&B", 94, "bs-resonance-neosoul", "Afterhours Lane", "New Release", "chill", "casual", "easy", False, "lantern scape glow on afterhours lane"),
    ("bs-s6-24", 74, "Asphalt Overdrive", "Iron Echo", "Rock", 144, "bs-resonance-chromeline", "Chrome Yard", "Hot Chart Style", "battle", "arcade", "hard", False, "asphalt overdrive with wah guitar"),
    ("bs-s6-25", 75, "Halftone Ignition", "Kite Solar", "EDM", 152, "bs-resonance-nightfall", "Pulse Core", "Viral Style", "night-drive", "arcade", "standard", False, "nightfall ignition with filtered pads"),
    ("bs-s6-26", 76, "Prism Boulevard", "Kite Solar", "Pop", 122, "bs-resonance-rhodes", "Glass Rim", "New Release", "groove", "arcade", "easy", False, "prism boulevard cruise at golden hour"),
    ("bs-s6-27", 77, "Nightfall Cipher", "Subline", "Hip-hop", 92, "bs-resonance-trapline", "Night Grid", "Viral Style", "night-drive", "casual", "standard", False, "nightfall cipher with sparse trap hats"),
    ("bs-s6-28", 78, "Amber Afterhours", "Mira Lane", "R&B", 90, "bs-resonance-neosoul", "Afterhours Lane", "Classic Style", "chill", "casual", "easy", False, "amber afterhours with walking bass"),
    ("bs-s6-29", 79, "Riffline Overdrive", "Redline Co.", "Rock", 142, "bs-resonance-chromeline", "Chrome Yard", "Viral Style", "battle", "arcade", "hard", False, "riffline overdrive with tight kit"),
    ("bs-s6-30", 80, "Grid Apex Run", "Nova Circuit", "EDM", 170, "bs-resonance-climax", "Pulse Core", "Hot Chart Style", "night-drive", "arcade", "hard", False, "grid apex run with dramatic build"),
    ("bs-s6-31", 81, "Skyline Cadence", "Soft Circuit", "Pop", 124, "bs-resonance-rhodes", "Glass Rim", "New Release", "groove", "arcade", "standard", False, "skyline cadence with funky bass"),
    ("bs-s6-32", 82, "Alley Voltage", "Low Voltage", "Hip-hop", 98, "bs-resonance-funkhop", "Night Grid", "Classic Style", "night-drive", "casual", "standard", False, "alley voltage with syncopated funk bass"),
    ("bs-s6-33", 83, "Scape Lullaby", "Quiet Neon", "R&B", 88, "bs-resonance-satin", "Afterhours Lane", "New Release", "chill", "casual", "easy", False, "scape lullaby with spacious kick"),
    ("bs-s6-34", 84, "Foundry Boulevard", "Iron Echo", "Rock", 134, "bs-resonance-stomp", "Chrome Yard", "Hot Chart Style", "battle", "arcade", "standard", True, "foundry boulevard slide riff"),
    ("bs-s6-35", 85, "Zenith Scape", "Pulse Atlas", "EDM", 172, "bs-resonance-overdrive", "Pulse Core", "New Release", "night-drive", "arcade", "hard", False, "zenith scape overdrive on the night drive"),
]

# District -> scape keyword pair injected into every prompt (PRD §1.3a theme gate)
DISTRICT_KEYWORDS: dict[str, str] = {
    "Pulse Core": "pulse core scape",
    "Glass Rim": "glass rim scape",
    "Night Grid": "night grid scape",
    "Afterhours Lane": "afterhours lane scape",
    "Chrome Yard": "chrome yard scape",
    "Slide District": "slide district scape",
    "Skyline Hook": "skyline hook scape",
}

# Stage6 adds 6 presets on top of the 6 Stage4 RESONANCE packs.
RESONANCE_PRESETS: dict[str, dict[str, object]] = {
    "bs-resonance-brass": {"genre": "EDM", "bpm": 160, "hint": "brass stabs, four-on-floor, dramatic build"},
    "bs-resonance-climax": {"genre": "EDM", "bpm": 168, "hint": "intense drop, filtered nu-disco layer"},
    "bs-resonance-funkhop": {"genre": "Hip-hop", "bpm": 100, "hint": "syncopated 808, funk bass, off-beat hats"},
    "bs-resonance-rhodes": {"genre": "Pop", "bpm": 122, "hint": "rhodes chords, funky pop groove, bright snare"},
    "bs-resonance-neosoul": {"genre": "R&B", "bpm": 92, "hint": "neo-soul groove, warm bass, spacious mix"},
    "bs-resonance-stomp": {"genre": "Rock", "bpm": 132, "hint": "funk rock guitar, stomp beat, brass hits"},
    # --- Stage6 additions ---
    "bs-resonance-overdrive": {"genre": "EDM", "bpm": 174, "hint": "high-speed night drive, rolling bass, wide mix"},
    "bs-resonance-nightfall": {"genre": "EDM", "bpm": 152, "hint": "moody nightfall build, filtered pads, steady four-on-floor"},
    "bs-resonance-glassdrive": {"genre": "Pop", "bpm": 118, "hint": "glass rim pop drive, bright rhodes, crisp snare"},
    "bs-resonance-trapline": {"genre": "Hip-hop", "bpm": 94, "hint": "trapline 808, sparse hats, swagger bass"},
    "bs-resonance-satin": {"genre": "R&B", "bpm": 90, "hint": "satin neo-soul, warm rhodes, relaxed pocket"},
    "bs-resonance-chromeline": {"genre": "Rock", "bpm": 140, "hint": "chrome rock drive, wah guitar accents, tight kit"},
}

GENRE_LEAD: dict[str, str] = {
    "EDM": "EDM rhythm game track",
    "Pop": "pop rhythm game track",
    "Hip-hop": "hip-hop rhythm game track",
    "R&B": "R&B rhythm game track",
    "Rock": "rock rhythm game track",
}

# Mandatory RESONANCE suffix — SONIC-DIRECTION §4
SUFFIX = (
    "clear 4/4 beat, night drive energy, wide stereo mix, chart-friendly drums, "
    "beatscape original, owned rights, rhythm game chart music, instrumental, "
    "no vocals, loop-friendly, western production"
)

BANNED_TOKENS = (
    "persona", "atlus", "megami", "megaten", "p5", "royal", "anime", "j-pop",
    "japanese", "vocaloid", "velvet room", "tarot", "phantom thief",
    "life will change", "beneath the mask", "last surprise",
)

GAME_DURATION_SEC = 120
STREAM_DURATION_SEC = 216
JOB_DURATION_SEC = 180

SLIDE_ROLE = "Slide chart showcase Std/Hard"

# Game-slice start offset (seconds) for masters with a long quiet intro.
# Without this the chart's first playable note lands outside the 1.0-2.5s gate.
# Values measured from the master onset analysis against the target:
#   clip_t0 = first_strong_onset - 1.5  (so the first note lands near 1.5s)
CLIP_T0: dict[str, float] = {
    "bs-s5-01": 1.0,    # first note 3.15s -> ~2.15s
    "bs-s6-08": 11.25,  # 12.76s dead intro
    "bs-s6-10": 4.2,    # 5.71s dead intro
    "bs-s6-14": 3.7,    # 5.21s dead intro
    "bs-s6-27": 12.2,   # 13.71s dead intro
    "bs-s6-28": 0.4,    # first note 2.67s -> ~2.27s
    "bs-s6-33": 0.5,    # first note 2.81s -> ~2.31s
}


def build_prompt(genre: str, bpm: int, preset_id: str, district: str, motif: str) -> str:
    hint = str(RESONANCE_PRESETS[preset_id]["hint"])
    return (
        f"{GENRE_LEAD[genre]}, {bpm} BPM, {hint}, {motif}, "
        f"{DISTRICT_KEYWORDS[district]}, {SUFFIX}"
    )


def build_track(spec: tuple) -> dict:
    (
        tid, seq, title, artist, genre, bpm, preset, district,
        tag, vibe, mode, tier, allows_slide, motif,
    ) = spec
    stem = f"{seq:02d}-{title.replace(' ', '-')}"
    batch = "s6-expansion" if tid.startswith("bs-s6-") else (
        "s4-wave-3" if tid.startswith("bs-s4-") else "s5-formal"
    )
    return {
        "track_id": tid,
        "seq": seq,
        "batch": batch,
        "preview_stem": stem,
        "preview_file": f"{stem}.m4a",
        "title": title,
        "artist": artist,
        "genre": genre,
        "bpm": bpm,
        "duration_sec": GAME_DURATION_SEC,
        "stream_duration_sec": STREAM_DURATION_SEC,
        "preset_id": preset,
        "district": district,
        "tags": [tag],
        "vibe": vibe,
        "default_mode": mode,
        "default_tier": tier,
        "allows_slide": allows_slide,
        "clip_t0": CLIP_T0.get(tid, 0.0),
        "play_role": SLIDE_ROLE if allows_slide else _play_role(genre, tier, vibe),
        "prompt": build_prompt(genre, bpm, preset, district, motif),
        "engine": "stable-audio-3",
        "job_duration_sec": JOB_DURATION_SEC,
        "mode": "game_bgm",
    }


def _play_role(genre: str, tier: str, vibe: str) -> str:
    if tier == "hard":
        return f"High density Hard acceptance · {vibe}"
    if tier == "easy":
        return f"Wide-window friendly low density · {vibe}"
    return f"Stage6 RESONANCE {genre.lower()} · {vibe}"


def stage6_tracks() -> list[dict]:
    return [build_track(s) for s in STAGE6_SPECS]


def validate() -> list[str]:
    """Return a list of constraint violations (empty == clean)."""
    problems: list[str] = []
    seen_titles: set[str] = set()
    seen_ids: set[str] = set()
    seen_seqs: set[int] = set()
    for spec in STAGE6_SPECS:
        tid, seq, title, _artist, genre, bpm, preset, district, tag, vibe, mode, tier, _slide, motif = spec
        low = title.lower()
        if tid in seen_ids:
            problems.append(f"{tid}: duplicate track_id")
        seen_ids.add(tid)
        if seq in seen_seqs:
            problems.append(f"{tid}: duplicate seq {seq}")
        seen_seqs.add(seq)
        if low in seen_titles:
            problems.append(f"{tid}: duplicate title {title}")
        seen_titles.add(low)
        if len(title.split()) > 3:
            problems.append(f"{tid}: title has {len(title.split())} words (max 3)")
        if genre not in GENRE_LEAD:
            problems.append(f"{tid}: unknown genre {genre}")
        if preset not in RESONANCE_PRESETS:
            problems.append(f"{tid}: unknown preset {preset}")
        elif RESONANCE_PRESETS[preset]["genre"] != genre:
            problems.append(f"{tid}: preset {preset} genre mismatch")
        if district not in DISTRICT_KEYWORDS:
            problems.append(f"{tid}: unknown district {district}")
        if vibe not in ("night-drive", "groove", "battle", "chill"):
            problems.append(f"{tid}: unknown vibe {vibe}")
        if tier not in ("easy", "standard", "hard"):
            problems.append(f"{tid}: unknown tier {tier}")
        if mode not in ("arcade", "casual"):
            problems.append(f"{tid}: unknown mode {mode}")
        prompt = build_prompt(genre, bpm, preset, district, motif).lower()
        for token in BANNED_TOKENS:
            if token in prompt or token in low:
                problems.append(f"{tid}: banned token '{token}'")
    return problems


if __name__ == "__main__":
    errs = validate()
    for e in errs:
        print("FAIL", e)
    print(f"{len(STAGE6_SPECS)} tracks · {len(errs)} problem(s)")
    raise SystemExit(1 if errs else 0)
