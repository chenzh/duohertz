"""BeatScape locked track metadata — Stage 1 + Stage 2 (PRD §6.0.6).

Imported by ingest / stream / audit / chartgen scripts (no package install).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

STAGE1_TRACKS: list[dict[str, Any]] = [
    {
        "track_id": "bs-s1-01",
        "preview_stem": "01-Neon-Pulse",
        "title": "Neon Pulse",
        "artist": "Pulse Atlas",
        "genre": "EDM",
        "bpm": 160,
        "duration_sec": 75,
        "stream_duration_sec": 198,
        "preset_id": "bs-edm-main",
        "district": "Pulse Core",
        "tags": ["Hot Chart Style"],
        "default_mode": "arcade",
        "default_tier": "standard",
        "allows_slide": False,
    },
    {
        "track_id": "bs-s1-02",
        "preview_stem": "02-Glass-Horizon",
        "title": "Glass Horizon",
        "artist": "Soft Circuit",
        "genre": "Pop",
        "bpm": 118,
        "duration_sec": 75,
        "stream_duration_sec": 198,
        "preset_id": "bs-pop-hook",
        "district": "Glass Rim",
        "tags": ["Viral Style"],
        "default_mode": "casual",
        "default_tier": "easy",
        "allows_slide": False,
    },
    {
        "track_id": "bs-s1-03",
        "preview_stem": "03-Night-Drive-808",
        "title": "Night Drive 808",
        "artist": "Low Voltage",
        "genre": "Hip-hop",
        "bpm": 95,
        "duration_sec": 75,
        "stream_duration_sec": 198,
        "preset_id": "bs-hiphop-808",
        "district": "Night Grid",
        "tags": ["Classic Style"],
        "default_mode": "arcade",
        "default_tier": "standard",
        "allows_slide": False,
    },
    {
        "track_id": "bs-s1-04",
        "preview_stem": "04-Velvet-Afterhours",
        "title": "Velvet Afterhours",
        "artist": "Mira Lane",
        "genre": "R&B",
        "bpm": 88,
        "duration_sec": 75,
        "stream_duration_sec": 198,
        "preset_id": "bs-rnb-groove",
        "district": "Afterhours Lane",
        "tags": ["Classic Style"],
        "default_mode": "casual",
        "default_tier": "easy",
        "allows_slide": False,
    },
    {
        "track_id": "bs-s1-05",
        "preview_stem": "05-Voltage-Drop",
        "title": "Voltage Drop",
        "artist": "Gridline",
        "genre": "EDM",
        "bpm": 170,
        "duration_sec": 60,
        "stream_duration_sec": 180,
        "preset_id": "bs-edm-climax",
        "district": "Pulse Core",
        "tags": ["Hot Chart Style"],
        "default_mode": "arcade",
        "default_tier": "hard",
        "allows_slide": False,
    },
    {
        "track_id": "bs-s1-06",
        "preview_stem": "06-Chrome-Riff",
        "title": "Chrome Riff",
        "artist": "Iron Echo",
        "genre": "Rock",
        "bpm": 132,
        "duration_sec": 75,
        "stream_duration_sec": 198,
        "preset_id": "bs-rock-drive",
        "district": "Chrome Yard",
        "tags": ["New Release"],
        "default_mode": "arcade",
        "default_tier": "standard",
        "allows_slide": False,
    },
]

STAGE2_TRACKS: list[dict[str, Any]] = [
    {
        "track_id": "bs-s2-01",
        "preview_stem": "07-Slide-City",
        "preview_file": "07-Slide-City.m4a",
        "title": "Slide City",
        "artist": "Vector Bloom",
        "genre": "EDM",
        "bpm": 140,
        "duration_sec": 90,
        "stream_duration_sec": 198,
        "preset_id": "bs-edm-main",
        "district": "Slide District",
        "tags": ["Hot Chart Style"],
        "default_mode": "arcade",
        "default_tier": "standard",
        "allows_slide": True,
        "play_role": "Slide 主验",
        "prompt": (
            "EDM rhythm game track, 140 BPM, clear 4/4 beat, sidechain sweep, "
            "slide city atmosphere, instrumental, no vocals, chart-friendly for slide notes, "
            "beatscape original, owned rights"
        ),
        "engine": "stable-audio-3",
        "job_duration_sec": 180,
    },
    {
        "track_id": "bs-s2-02",
        "preview_stem": "08-Skyline-Hook",
        "preview_file": "08-Skyline-Hook.m4a",
        "title": "Skyline Hook",
        "artist": "Ada North",
        "genre": "Pop",
        "bpm": 128,
        "duration_sec": 90,
        "stream_duration_sec": 198,
        "preset_id": "bs-theme-en",
        "district": "Skyline Hook",
        "tags": ["Viral Style"],
        "default_mode": "casual",
        "default_tier": "standard",
        "allows_slide": False,
        "play_role": "英文人声稀疏谱",
        "prompt": (
            "English pop vocal rhythm theme, 128 BPM, skyline hook, neon scape lyrics, "
            "clear beat, beatscape original, owned rights"
        ),
        "engine": "ace-step",
        "job_duration_sec": 180,
    },
    {
        "track_id": "bs-s2-03",
        "preview_stem": "09-Blue-Hour-Loop",
        "preview_file": "09-Blue-Hour-Loop.m4a",
        "title": "Blue Hour Loop",
        "artist": "Quiet Neon",
        "genre": "Pop",
        "bpm": 120,
        "duration_sec": 90,
        "stream_duration_sec": 198,
        "preset_id": "bs-chill-pop",
        "district": "Glass Rim",
        "tags": ["Classic Style"],
        "default_mode": "casual",
        "default_tier": "easy",
        "allows_slide": False,
        "play_role": "Practice 练度",
        "prompt": (
            "Chill pop rhythm game track, 120 BPM, soft pads, blue hour neon loop, "
            "clear beat, instrumental, no vocals, practice-friendly, beatscape original, owned rights"
        ),
        "engine": "stable-audio-3",
        "job_duration_sec": 180,
    },
    {
        "track_id": "bs-s2-04",
        "preview_stem": "10-Asphalt-Anthem",
        "preview_file": "10-Asphalt-Anthem.m4a",
        "title": "Asphalt Anthem",
        "artist": "Redline Co.",
        "genre": "Rock",
        "bpm": 148,
        "duration_sec": 90,
        "stream_duration_sec": 198,
        "preset_id": "bs-rock-drive",
        "district": "Chrome Yard",
        "tags": ["Hot Chart Style"],
        "default_mode": "arcade",
        "default_tier": "hard",
        "allows_slide": False,
        "clip_t0": 3.5,
        "play_role": "高速摇滚",
        "prompt": (
            "Rock rhythm game track, 148 BPM, asphalt anthem, electric guitar, tight drums, "
            "clear 4/4, chrome yard energy, instrumental, no vocals, beatscape original, owned rights"
        ),
        "engine": "stable-audio-3",
        "job_duration_sec": 180,
    },
]

DISTRICT_COLORS: dict[str, str] = {
    "Pulse Core": "#3DDCFF",
    "Glass Rim": "#A8C4E8",
    "Night Grid": "#5B6EFF",
    "Afterhours Lane": "#C084FC",
    "Chrome Yard": "#94A3B8",
    "Slide District": "#7CFFB2",
    "Skyline Hook": "#FFB86C",
}

PREVIEW_STEM_BY_ID: dict[str, str] = {
    t["track_id"]: t["preview_stem"] for t in STAGE1_TRACKS + STAGE2_TRACKS
}

# Stage3 stems loaded lazily by ingest/stitch via beatscape-stage3-specs.py


def all_locked_tracks() -> list[dict[str, Any]]:
    import importlib.util

    tracks = list(STAGE1_TRACKS) + list(STAGE2_TRACKS)
    spec = importlib.util.spec_from_file_location(
        "beatscape_stage3_specs",
        Path(__file__).resolve().parent / "beatscape-stage3-specs.py",
    )
    if spec and spec.loader:
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        tracks.extend(m.stage3_tracks())
        for t in m.stage3_tracks():
            PREVIEW_STEM_BY_ID[t["track_id"]] = t["preview_stem"]
    return tracks


LOCKED_BY_ID: dict[str, dict[str, Any]] = {
    t["track_id"]: t for t in STAGE1_TRACKS + STAGE2_TRACKS
}


def _merge_stage3_locked() -> None:
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "beatscape_stage3_specs",
        Path(__file__).resolve().parent / "beatscape-stage3-specs.py",
    )
    if not spec or not spec.loader:
        return
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    for t in m.stage3_tracks():
        LOCKED_BY_ID[t["track_id"]] = t
        PREVIEW_STEM_BY_ID[t["track_id"]] = t["preview_stem"]


_merge_stage3_locked()


def stage_from_track_id(track_id: str) -> int:
    if track_id.startswith("bs-s1-"):
        return 1
    if track_id.startswith("bs-s2-"):
        return 2
    if track_id.startswith("bs-s3-"):
        return 3
    if track_id.startswith("bs-s4-"):
        return 4
    if track_id.startswith("bs-s5-"):
        return 5
    return 0
