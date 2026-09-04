"""Persona-3-style vocal (wordless hum) track specs (seq 96-105) — 10 tracks.

Same urban lounge / acid-jazz energy as the P3 wave, but with a WORDLESS
HUM vocal (ethereal "ooh / mmm" floating over the chords) — the moody
metropolitan ballad feel. 100% original titles/melodies, zero borrowed
hooks, and the hum is strictly lyric-free (no singing words).

Runtime truth: the SA3 worker only allows this because it now accepts a
per-request negative_prompt. Default game BGM stays fully instrumental —
this module always passes a negative that bans lyrics/speech but ALLOWS
humming, and the prompt suffix swaps "instrumental, no vocals" for
"wordless hum vocal, no lyrics".

Follows the module contract of beatscape-p3-specs.py (p4_tracks / validate).
"""

from __future__ import annotations

# (track_id, seq, title, artist, genre, bpm, preset_id, district, tag, vibe,
#  default_mode, default_tier, allows_slide, motif, hum_style)
P4_SPECS: list[tuple] = [
    # ---- Midnight hum ballads ----
    ("bs-p4-01", 96, "Humming Haze", "Verity Lane", "R&B", 90, "bs-resonance-satin", "Afterhours Lane", "Classic Style", "chill", "casual", "easy", False, "humming haze in a satin pocket", "soft female ooh hum melody floating"),
    ("bs-p4-02", 97, "Chrome Choir", "Nova Circuit", "EDM", 158, "bs-resonance-overdrive", "Pulse Core", "Hot Chart Style", "battle", "arcade", "hard", False, "chrome choir rising over the overdrive", "ethereal choral ooh hum swell"),
    ("bs-p4-03", 98, "Midnight Hum", "Mira Lane", "R&B", 92, "bs-resonance-neosoul", "Afterhours Lane", "New Release", "chill", "casual", "easy", False, "midnight hum under warm rhodes", "breathy mmm hum on the verses"),
    ("bs-p4-04", 99, "Echo Glow Chorus", "Halcyon Flux", "EDM", 162, "bs-resonance-brass", "Pulse Core", "Viral Style", "battle", "arcade", "standard", False, "echo glow chorus over brass stabs", "distant ooh hum hook in the build"),
    ("bs-p4-05", 100, "Glass Aria", "Ada North", "Pop", 118, "bs-resonance-glassdrive", "Glass Rim", "New Release", "night-drive", "arcade", "standard", False, "glass aria on a clear rhodes drive", "airy wordless vocal line over the glass rim"),
    ("bs-p4-06", 101, "Rooftop Hum", "Quiet Neon", "R&B", 88, "bs-resonance-satin", "Glass Rim", "Classic Style", "chill", "casual", "easy", False, "rooftop hum with slow warm bass", "intimate hum over rooftop wind"),
    ("bs-p4-07", 102, "Neon Lullaby", "Luma Rim", "Pop", 122, "bs-resonance-rhodes", "Glass Rim", "Viral Style", "groove", "arcade", "standard", False, "neon lullaby with soft funky pocket", "hummed lullaby melody over rhodes"),
    ("bs-p4-08", 103, "Afterhours Voice", "Verity Lane", "R&B", 90, "bs-resonance-satin", "Afterhours Lane", "New Release", "chill", "casual", "easy", False, "afterhours voice in the quiet lane", "echoing ooh hum after the last call"),
    ("bs-p4-09", 104, "Blue Hour Chorus", "Kite Solar", "EDM", 150, "bs-resonance-nightfall", "Pulse Core", "Hot Chart Style", "night-drive", "arcade", "standard", False, "blue hour chorus under filtered pads", "swelling choral hum on the nightfall"),
    ("bs-p4-10", 105, "Scape Sings Low", "Subline", "Hip-hop", 96, "bs-resonance-funkhop", "Night Grid", "Classic Style", "groove", "casual", "standard", False, "scape sings low on a syncopated groove", "low murmured hum over the grid"),
]

# District -> scape keyword pair injected into every prompt (PRD §1.3a gate)
DISTRICT_KEYWORDS: dict[str, str] = {
    "Pulse Core": "pulse core scape",
    "Night Grid": "night grid scape",
    "Glass Rim": "glass rim scape",
    "Afterhours Lane": "afterhours lane scape",
    "Chrome Yard": "chrome yard scape",
    "Slide District": "slide district scape",
    "Skyline Hook": "skyline hook scape",
}

RESONANCE_PRESETS: dict[str, dict[str, object]] = {
    "bs-resonance-neosoul": {"genre": "R&B", "bpm": 92, "hint": "neo-soul groove, warm bass, spacious mix"},
    "bs-resonance-overdrive": {"genre": "EDM", "bpm": 174, "hint": "high-speed night drive, rolling bass, wide mix"},
    "bs-resonance-funkhop": {"genre": "Hip-hop", "bpm": 100, "hint": "syncopated 808, funk bass, off-beat hats"},
    "bs-resonance-satin": {"genre": "R&B", "bpm": 90, "hint": "satin neo-soul, warm rhodes, relaxed pocket"},
    "bs-resonance-brass": {"genre": "EDM", "bpm": 160, "hint": "brass stabs, four-on-floor, dramatic build"},
    "bs-resonance-rhodes": {"genre": "Pop", "bpm": 122, "hint": "rhodes chords, funky pop groove, bright snare"},
    "bs-resonance-glassdrive": {"genre": "Pop", "bpm": 118, "hint": "glass rim pop drive, bright rhodes, crisp snare"},
    "bs-resonance-nightfall": {"genre": "EDM", "bpm": 152, "hint": "moody nightfall build, filtered pads, steady four-on-floor"},
    "bs-resonance-trapline": {"genre": "Hip-hop", "bpm": 94, "hint": "trapline 808, sparse hats, swagger bass"},
}

GENRE_LEAD: dict[str, str] = {
    "EDM": "EDM rhythm game track",
    "Pop": "pop rhythm game track",
    "Hip-hop": "hip-hop rhythm game track",
    "R&B": "R&B rhythm game track",
    "Rock": "rock rhythm game track",
}

# Wordless-vocal suffix — replaces the "instrumental, no vocals" posture for
# this wave. Banned tokens in prompts still exclude P3/world-bible words.
SUFFIX = (
    "clear 4/4 beat, night drive energy, wide stereo mix, chart-friendly drums, "
    "beatscape original, owned rights, rhythm game chart music, wordless hum vocal, "
    "no lyrics, no words, no singing words, humming only, loop-friendly, "
    "western production, midnight metropolitan lounge vibe"
)

# Negative prompt for wordless-hum generations: allow humming/ooh/mmm, still
# ban any intelligible singing / speech / lyrics / harsh vocals.
HUM_NEGATIVE = (
    "lyrics, singing words, speech, talking, rapping, screaming, harsh vocals, "
    "vocal chops, opera singing, distorted voice, shouting"
)

BANNED_TOKENS = (
    "persona", "atlus", "megami", "megaten", "p3", "p5", "royal", "anime",
    "j-pop", "japanese", "vocaloid", "velvet room", "tarot", "phantom thief",
    "burn my dread", "mass destruction", "full moon full life",
    # World Bible §10 tone don'ts
    "mask", "persona", "velvet", "phantom",
    # must never claim intelligible vocals
    "lyrics", "words", "singing",
)

GAME_DURATION_SEC = 120
STREAM_DURATION_SEC = 216
JOB_DURATION_SEC = 180

SLIDE_ROLE = "Slide chart showcase Std/Hard"


def build_prompt(genre: str, bpm: int, preset_id: str, district: str, motif: str, hum_style: str) -> str:
    hint = str(RESONANCE_PRESETS[preset_id]["hint"])
    return (
        f"{GENRE_LEAD[genre]}, {bpm} BPM, {hint}, {hum_style}, {motif}, "
        f"{DISTRICT_KEYWORDS[district]}, {SUFFIX}"
    )


def _play_role(genre: str, tier: str, vibe: str) -> str:
    if tier == "easy":
        return "Wide-window friendly low density · " + vibe
    return f"P3 hum lounge {genre.lower()} · {vibe}"


def build_track(spec: tuple) -> dict:
    tid, seq, title, artist, genre, bpm, preset, district, tag, vibe, mode, tier, allows_slide, motif, hum_style = spec
    stem = f"{seq:02d}-{title.replace(' ', '-')}"
    return {
        "track_id": tid,
        "seq": seq,
        "batch": "humwave",
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
        "clip_t0": 0.0,
        "play_role": SLIDE_ROLE if allows_slide else _play_role(genre, tier, vibe),
        "prompt": build_prompt(genre, bpm, preset, district, motif, hum_style),
        "negative_prompt": HUM_NEGATIVE,
        "engine": "stable-audio-3",
        "job_duration_sec": JOB_DURATION_SEC,
        "mode": "game_bgm",
    }


def p4_tracks() -> list[dict]:
    return [build_track(s) for s in P4_SPECS]


def validate() -> list[str]:
    """Return a list of constraint violations (empty == clean)."""
    problems: list[str] = []
    seen_titles: set[str] = set()
    seen_ids: set[str] = set()
    seen_seqs: set[int] = set()
    for spec in P4_SPECS:
        tid, seq, title, _artist, genre, bpm, preset, district, tag, vibe, mode, tier, _slide, motif, hum_style = spec
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
        if bpm <= 0 or bpm > 220:
            problems.append(f"{tid}: bpm {bpm} out of range")
        text = " ".join([title, motif, hum_style]).lower()
        for banned in BANNED_TOKENS:
            if banned in text:
                problems.append(f"{tid}: banned token '{banned}'")
        if len(motif.split()) > 9:
            problems.append(f"{tid}: motif has {len(motif.split())} words (max 9)")
    return problems


if __name__ == "__main__":
    import json
    problems = validate()
    if problems:
        for p in problems:
            print("FAIL", p)
        raise SystemExit(1)
    tracks = p4_tracks()
    print(f"ok: {len(tracks)} P4 hum tracks, validate clean")
    for t in tracks:
        print(f"  {t['track_id']}  {t['title']}  [{t['vibe']}]")
