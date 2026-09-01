"""Persona-3-style track specs (seq 86-95) — 10 new tracks, catalog 85 -> 95.

Brief: urban acid-jazz / psycho-pop rhythm-game tracks in the mood of a
midnight metropolitan JRPG (think P3's lounge-jazz battle energy), but 100%
original — fresh titles, fresh melodies, zero borrowed names or hooks.

Production truth: docs/BEATSCAPE-SONIC-DIRECTION.md (in-car wide mix + urban
jazz battle). Every prompt ends with the mandatory RESONANCE suffix and
contains no banned tokens. These reuse the Stage4/6 RESONANCE preset pool, so
no preset changes are needed.

Follows the exact module contract of beatscape-stage6-specs.py:
  * P3_SPECS     -> tuple list (tid, seq, title, artist, genre, bpm, preset,
                    district, tag, vibe, mode, tier, allows_slide, motif)
  * p3_tracks()  -> list[dict] ready for the manifest / generate pipeline
  * validate()   -> constraint checks (duplicate id/seq/title, genre, preset,
                    district, vibe, tier, mode, banned words, word count)
"""

from __future__ import annotations

# (track_id, seq, title, artist, genre, bpm, preset_id, district, tag, vibe,
#  default_mode, default_tier, allows_slide, motif)
P3_SPECS: list[tuple] = [
    # ---- Midnight Metropolitan (the P3-lounge mood) ----
    ("bs-p3-01", 86, "Midnight Velvet", "Verity Lane", "R&B", 92, "bs-resonance-neosoul", "Afterhours Lane", "Classic Style", "chill", "casual", "easy", False, "midnight velvet lounge after the last train"),
    ("bs-p3-02", 87, "Chrome Psychosis", "Nova Circuit", "EDM", 156, "bs-resonance-overdrive", "Pulse Core", "Hot Chart Style", "battle", "arcade", "hard", False, "chrome psychosis drop through the overdrive"),
    ("bs-p3-03", 88, "Tunnel After Hours", "Low Voltage", "Hip-hop", 96, "bs-resonance-funkhop", "Night Grid", "Viral Style", "groove", "arcade", "standard", False, "tunnel after hours with syncopated 808"),
    ("bs-p3-04", 89, "Lounge Phantom", "Mira Lane", "R&B", 90, "bs-resonance-satin", "Afterhours Lane", "New Release", "chill", "casual", "easy", False, "lounge phantom glide on satin keys"),
    ("bs-p3-05", 90, "Scarlet Hour", "Halcyon Flux", "EDM", 160, "bs-resonance-brass", "Pulse Core", "Hot Chart Style", "battle", "arcade", "standard", False, "scarlet hour brass over the pulse core"),
    ("bs-p3-06", 91, "Deep Rooftop Sigh", "Quiet Neon", "R&B", 88, "bs-resonance-satin", "Glass Rim", "Classic Style", "chill", "casual", "easy", False, "deep rooftop sigh over the glass rim"),
    ("bs-p3-07", 92, "Glass Phantom Drive", "Kite Solar", "Pop", 120, "bs-resonance-rhodes", "Glass Rim", "New Release", "groove", "arcade", "standard", False, "glass phantom drive with funky rhodes"),
    ("bs-p3-08", 93, "Midnight Rhapsody", "Ada North", "Pop", 116, "bs-resonance-glassdrive", "Glass Rim", "Viral Style", "night-drive", "arcade", "standard", False, "midnight rhapsody on the glass turnpike"),
    ("bs-p3-09", 94, "Asphalt Waltz", "Iron Echo", "Rock", 138, "bs-resonance-chromeline", "Chrome Yard", "Classic Style", "battle", "arcade", "hard", True, "asphalt waltz with wah guitar and brass"),
    ("bs-p3-10", 95, "Scape Shade", "Subline", "Hip-hop", 100, "bs-resonance-trapline", "Night Grid", "Hot Chart Style", "night-drive", "arcade", "standard", False, "scape shade with trapline 808"),
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

# Reuse the Stage6 RESONANCE preset pool (same ids, same prompts). A P3
# flavor is achieved through motifs + a "midnight metropolitan" descriptor
# in the suffix, not by touching the presets.
RESONANCE_PRESETS: dict[str, dict[str, object]] = {
    "bs-resonance-neosoul": {"genre": "R&B", "bpm": 92, "hint": "neo-soul groove, warm bass, spacious mix"},
    "bs-resonance-overdrive": {"genre": "EDM", "bpm": 174, "hint": "high-speed night drive, rolling bass, wide mix"},
    "bs-resonance-funkhop": {"genre": "Hip-hop", "bpm": 100, "hint": "syncopated 808, funk bass, off-beat hats"},
    "bs-resonance-satin": {"genre": "R&B", "bpm": 90, "hint": "satin neo-soul, warm rhodes, relaxed pocket"},
    "bs-resonance-brass": {"genre": "EDM", "bpm": 160, "hint": "brass stabs, four-on-floor, dramatic build"},
    "bs-resonance-rhodes": {"genre": "Pop", "bpm": 122, "hint": "rhodes chords, funky pop groove, bright snare"},
    "bs-resonance-glassdrive": {"genre": "Pop", "bpm": 118, "hint": "glass rim pop drive, bright rhodes, crisp snare"},
    "bs-resonance-chromeline": {"genre": "Rock", "bpm": 140, "hint": "chrome rock drive, wah guitar accents, tight kit"},
    "bs-resonance-trapline": {"genre": "Hip-hop", "bpm": 94, "hint": "trapline 808, sparse hats, swagger bass"},
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
    "no vocals, loop-friendly, western production, midnight metropolitan lounge vibe"
)

BANNED_TOKENS = (
    "persona", "atlus", "megami", "megaten", "p3", "p5", "royal", "anime",
    "j-pop", "japanese", "vocaloid", "velvet room", "tarot", "phantom thief",
    "burn my dread", "mass destruction", "full moon full life",
)

GAME_DURATION_SEC = 120
STREAM_DURATION_SEC = 216
JOB_DURATION_SEC = 180

SLIDE_ROLE = "Slide chart showcase Std/Hard"

# Game-slice start offset (seconds) for masters with a long quiet intro.
# Same convention as Stage6: clip_t0 = first_strong_onset - 1.5, so the
# chart's first playable note lands near 1.5s inside the slice.
CLIP_T0: dict[str, float] = {
    "bs-p3-05": 1.5,   # first_strong_onset 3.06s
    "bs-p3-10": 8.1,   # first_strong_onset 9.6s
}


def build_prompt(genre: str, bpm: int, preset_id: str, district: str, motif: str) -> str:
    hint = str(RESONANCE_PRESETS[preset_id]["hint"])
    return (
        f"{GENRE_LEAD[genre]}, {bpm} BPM, {hint}, {motif}, "
        f"{DISTRICT_KEYWORDS[district]}, {SUFFIX}"
    )


def _play_role(genre: str, tier: str, vibe: str) -> str:
    if tier == "easy":
        return "Wide-window friendly low density · " + vibe
    return f"P3 urban lounge {genre.lower()} · {vibe}"


def build_track(spec: tuple) -> dict:
    tid, seq, title, artist, genre, bpm, preset, district, tag, vibe, mode, tier, allows_slide, motif = spec
    stem = f"{seq:02d}-{title.replace(' ', '-')}"
    return {
        "track_id": tid,
        "seq": seq,
        "batch": "p3-wave",
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


def p3_tracks() -> list[dict]:
    return [build_track(s) for s in P3_SPECS]


def validate() -> list[str]:
    """Return a list of constraint violations (empty == clean)."""
    problems: list[str] = []
    seen_titles: set[str] = set()
    seen_ids: set[str] = set()
    seen_seqs: set[int] = set()
    for spec in P3_SPECS:
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
        if bpm <= 0 or bpm > 220:
            problems.append(f"{tid}: bpm {bpm} out of range")
        for banned in BANNED_TOKENS:
            if banned in low or banned in motif.lower() or banned in title.lower():
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
    tracks = p3_tracks()
    print(f"ok: {len(tracks)} P3-style tracks, validate clean")
    for t in tracks:
        print(f"  {t['track_id']}  {t['title']}  [{t['vibe']}]")
