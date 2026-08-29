"""Stage4 wave-1 track specs (seq 26–35) — RESONANCE groove catalog."""

from __future__ import annotations

import json
from pathlib import Path

_VIBES: dict[str, str] = json.loads(
    (Path(__file__).parent / "beatscape-track-vibes.json").read_text(encoding="utf-8")
)
STAGE4_RESONANCE_SPECS: list[tuple] = [
    ("bs-s4-01", 26, "Brass Scape Rush", "Neon Arc", "EDM", 160, "bs-resonance-brass", "Pulse Core", "Hot Chart Style", False),
    ("bs-s4-02", 27, "Syncopated Grid", "Subline", "Hip-hop", 98, "bs-resonance-funkhop", "Night Grid", "Classic Style", False),
    ("bs-s4-03", 28, "Halftone Drive", "Luma Rim", "Pop", 122, "bs-resonance-rhodes", "Glass Rim", "Viral Style", False),
    ("bs-s4-04", 29, "Satin Afterpulse", "Mira Lane", "R&B", 92, "bs-resonance-neosoul", "Afterhours Lane", "Classic Style", False),
    ("bs-s4-05", 30, "Ink Stomp Riff", "Iron Echo", "Rock", 132, "bs-resonance-stomp", "Chrome Yard", "Hot Chart Style", False),
    ("bs-s4-06", 31, "Resonance Overload", "Gridline", "EDM", 168, "bs-resonance-climax", "Pulse Core", "Hot Chart Style", False),
    ("bs-s4-07", 32, "Lane Shuffle Flow", "Low Voltage", "Hip-hop", 102, "bs-resonance-funkhop", "Night Grid", "Viral Style", False),
    ("bs-s4-08", 33, "Crimson Hookline", "Ada North", "Pop", 126, "bs-resonance-rhodes", "Glass Rim", "New Release", False),
    ("bs-s4-09", 34, "Moonlit Groove", "Quiet Neon", "R&B", 94, "bs-resonance-neosoul", "Afterhours Lane", "Classic Style", False),
    ("bs-s4-10", 35, "Strike Vector", "Redline Co.", "Rock", 134, "bs-resonance-stomp", "Slide District", "Hot Chart Style", True),
]

TRACK_PROMPTS: dict[str, str] = {
    "bs-s4-01": "EDM rhythm game track, 160 BPM, clear 4/4 kick, brass stab hooks, neon pulse energy, urban scape at night, build-up and drop within 8 seconds, chart-friendly drums, instrumental, no vocals, beatscape original, owned rights, loop-friendly, western production",
    "bs-s4-02": "hip-hop rhythm game track, 98 BPM, syncopated funk groove, 808 bass, off-beat hi-hats, night grid atmosphere, clear downbeat for charts, instrumental, no vocals, beatscape original, owned rights, loop-friendly, western production",
    "bs-s4-03": "pop rhythm game track, 122 BPM, rhodes electric piano hook, funky groove, bright snare, glass horizon mood, clear 4/4 beat, instrumental, no vocals, beatscape original, owned rights, loop-friendly, western production",
    "bs-s4-04": "R&B rhythm game track, 92 BPM, neo-soul groove, warm bass, soft kick, spacious mix, afterhours pulse, clear downbeat, instrumental, no vocals, beatscape original, owned rights, loop-friendly, western production",
    "bs-s4-05": "rock rhythm game track, 132 BPM, funk rock electric guitar riff, stomp drum pattern, chrome edge energy, tight 4/4 kit, instrumental, no vocals, beatscape original, owned rights, loop-friendly, western production",
    "bs-s4-06": "EDM rhythm game track, 168 BPM, intense drop, filtered nu-disco layer, dramatic tension, pulse core overload, chart-friendly dense drums, instrumental, no vocals, beatscape original, owned rights, loop-friendly, western production",
    "bs-s4-07": "hip-hop rhythm game track, 102 BPM, shuffle groove, funk bass line, crisp snare, lane grid syncopation, clear beat for rhythm game, instrumental, no vocals, beatscape original, owned rights, loop-friendly, western production",
    "bs-s4-08": "pop rhythm game track, 126 BPM, catchy synth hook, funky bass, driving 4/4, crimson night skyline, bright production, instrumental, no vocals, beatscape original, owned rights, loop-friendly, western production",
    "bs-s4-09": "R&B rhythm game track, 94 BPM, neo-soul chords, smooth groove, legato-friendly pockets, moonlit afterhours scape, clear kick and snare, instrumental, no vocals, beatscape original, owned rights, loop-friendly, western production",
    "bs-s4-10": "rock rhythm game track, 134 BPM, funk rock drive, wah guitar accents, brass hits optional, slide district energy, tight drums for lane charts, instrumental, no vocals, beatscape original, owned rights, loop-friendly, western production",
}

GENRE_PROMPT: dict[str, str] = {
    "EDM": "EDM rhythm game track, {bpm} BPM, clear 4/4 beat, neon pulse grid atmosphere",
    "Pop": "English pop rhythm game track, {bpm} BPM, bright synth, glass horizon scape atmosphere",
    "Hip-hop": "Hip-hop rhythm game track, {bpm} BPM, 808 bass, crisp hats, night grid voltage atmosphere",
    "R&B": "R&B rhythm game track, {bpm} BPM, smooth groove, afterhours scape atmosphere",
    "Rock": "Rock rhythm game track, {bpm} BPM, electric guitar riff, chrome yard energy",
}

SUFFIX = (
    "instrumental, no vocals, chart-friendly drums, beatscape original, owned rights, loop-friendly, western production"
)

RESONANCE_PRESETS: dict[str, dict[str, str | int]] = {
    "bs-resonance-brass": {"genre": "EDM", "bpm": 160, "hint": "brass stabs, four-on-floor, dramatic build"},
    "bs-resonance-climax": {"genre": "EDM", "bpm": 168, "hint": "intense drop, filtered disco layer"},
    "bs-resonance-funkhop": {"genre": "Hip-hop", "bpm": 100, "hint": "syncopated 808, funk bass, off-beat hats"},
    "bs-resonance-rhodes": {"genre": "Pop", "bpm": 122, "hint": "rhodes chords, funky pop groove"},
    "bs-resonance-neosoul": {"genre": "R&B", "bpm": 92, "hint": "neo-soul groove, warm bass"},
    "bs-resonance-stomp": {"genre": "Rock", "bpm": 132, "hint": "funk rock guitar, stomp beat"},
}

GAME_DURATION_SEC = 120
STREAM_DURATION_SEC = 216


def build_track(spec: tuple) -> dict:
    tid, seq, title, artist, genre, bpm, preset, district, tag, allows_slide = spec
    stem = f"{seq:02d}-{title.replace(' ', '-')}"
    prompt = TRACK_PROMPTS.get(tid) or f"{GENRE_PROMPT[genre].format(bpm=bpm)}, {SUFFIX}"
    mode = "casual" if tag == "Classic Style" and genre in ("Hip-hop", "R&B", "Pop") else "arcade"
    tier = "easy" if mode == "casual" and tag == "Classic Style" else "standard"
    if tid == "bs-s4-06":
        tier = "hard"
    if tid == "bs-s4-10":
        tier = "hard"
    return {
        "track_id": tid,
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
        "vibe": _VIBES[tid],
        "default_mode": mode,
        "default_tier": tier,
        "allows_slide": allows_slide,
        "play_role": _play_role(tid),
        "prompt": prompt,
        "engine": "stable-audio-3",
        "job_duration_sec": 180,
        "mode": "game_bgm",
    }


def _play_role(tid: str) -> str:
    roles = {
        "bs-s4-01": "Brass stabs + drop≤8s demo",
        "bs-s4-02": "Syncopated groove practice",
        "bs-s4-03": "Rhodes hook in first 10s",
        "bs-s4-04": "Wide-window friendly low density",
        "bs-s4-05": "Guitar riff density chart",
        "bs-s4-06": "High density Hard acceptance",
        "bs-s4-07": "Shuffle feel mid BPM",
        "bs-s4-08": "Strong chorus hook",
        "bs-s4-09": "Hold-friendly legato pockets",
        "bs-s4-10": "Slide chart showcase Std/Hard",
    }
    return roles.get(tid, "Stage4 RESONANCE groove")


def stage4_tracks() -> list[dict]:
    return [build_track(s) for s in STAGE4_RESONANCE_SPECS]
