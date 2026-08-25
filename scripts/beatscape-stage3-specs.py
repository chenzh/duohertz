"""Stage3 track specs (seq 11–25) — titles locked for catalog ingest."""

from __future__ import annotations

# track_id, seq, title, artist, genre, bpm, preset_id, district, tag
STAGE3_SPECS: list[tuple] = [
    ("bs-s3-01", 11, "Grid Voltage", "Neon Arc", "EDM", 155, "bs-edm-main", "Pulse Core", "Hot Chart Style"),
    ("bs-s3-02", 12, "Night Pulse 808", "Subline", "Hip-hop", 98, "bs-hiphop-808", "Night Grid", "Classic Style"),
    ("bs-s3-03", 13, "Soft Horizon", "Luma Rim", "Pop", 122, "bs-pop-hook", "Glass Rim", "Viral Style"),
    ("bs-s3-04", 14, "Velvet Scape", "Mira Lane", "R&B", 90, "bs-rnb-groove", "Afterhours Lane", "Classic Style"),
    ("bs-s3-05", 15, "Chrome Grid", "Iron Echo", "Rock", 138, "bs-rock-drive", "Chrome Yard", "Hot Chart Style"),
    ("bs-s3-06", 16, "Pulse Overload", "Gridline", "EDM", 168, "bs-edm-climax", "Pulse Core", "Hot Chart Style"),
    ("bs-s3-07", 17, "Low Grid Flow", "Low Voltage", "Hip-hop", 92, "bs-hiphop-808", "Night Grid", "Classic Style"),
    ("bs-s3-08", 18, "Blue Loop Hour", "Quiet Neon", "Pop", 118, "bs-chill-pop", "Glass Rim", "Classic Style"),
    ("bs-s3-09", 19, "Afterhours Pulse", "Mira Lane", "R&B", 86, "bs-rnb-groove", "Afterhours Lane", "Classic Style"),
    ("bs-s3-10", 20, "Riff Voltage", "Redline Co.", "Rock", 142, "bs-rock-drive", "Chrome Yard", "New Release"),
    ("bs-s3-11", 21, "Neon Gridline", "Pulse Atlas", "EDM", 158, "bs-edm-main", "Pulse Core", "Viral Style"),
    ("bs-s3-12", 22, "Trap Grid", "Subline", "Hip-hop", 100, "bs-hiphop-808", "Night Grid", "Hot Chart Style"),
    ("bs-s3-13", 23, "Scape Velvet", "Mira Lane", "R&B", 88, "bs-rnb-groove", "Afterhours Lane", "New Release"),
    ("bs-s3-14", 24, "808 Horizon", "Low Voltage", "Hip-hop", 96, "bs-hiphop-808", "Night Grid", "Viral Style"),
    ("bs-s3-15", 25, "Anthem Chrome", "Iron Echo", "Rock", 136, "bs-rock-drive", "Chrome Yard", "Hot Chart Style"),
]

GENRE_PROMPT: dict[str, str] = {
    "EDM": "EDM rhythm game track, {bpm} BPM, clear 4/4 beat, neon pulse grid atmosphere",
    "Pop": "English pop rhythm game track, {bpm} BPM, bright synth, glass horizon scape atmosphere",
    "Hip-hop": "Hip-hop rhythm game track, {bpm} BPM, 808 bass, crisp hats, night grid voltage atmosphere",
    "R&B": "R&B rhythm game track, {bpm} BPM, smooth groove, velvet afterhours scape atmosphere",
    "Rock": "Rock rhythm game track, {bpm} BPM, electric guitar riff, chrome yard energy",
}

SUFFIX = (
    "instrumental, no vocals, chart-friendly drums, beatscape original, owned rights, loop-friendly"
)


CLIP_T0_BY_ID: dict[str, float] = {
    "bs-s3-14": 9.0,
}


def build_track(spec: tuple) -> dict:
    tid, seq, title, artist, genre, bpm, preset, district, tag = spec
    stem = f"{seq:02d}-{title.replace(' ', '-')}"
    prompt = f"{GENRE_PROMPT[genre].format(bpm=bpm)}, {SUFFIX}"
    mode = "arcade" if genre in ("EDM", "Rock") else "casual"
    tier = "standard" if genre != "Rock" else "hard"
    out = {
        "track_id": tid,
        "preview_stem": stem,
        "preview_file": f"{stem}.m4a",
        "title": title,
        "artist": artist,
        "genre": genre,
        "bpm": bpm,
        "duration_sec": 90,
        "stream_duration_sec": 198,
        "preset_id": preset,
        "district": district,
        "tags": [tag],
        "default_mode": mode,
        "default_tier": tier,
        "allows_slide": False,
        "prompt": prompt,
        "engine": "stable-audio-3",
        "job_duration_sec": 180,
        "mode": "game_bgm",
    }
    if tid in CLIP_T0_BY_ID:
        out["clip_t0"] = CLIP_T0_BY_ID[tid]
    return out


def stage3_tracks() -> list[dict]:
    return [build_track(s) for s in STAGE3_SPECS]
