#!/usr/bin/env python3
"""BeatScape content QA — audio / catalog / chart automated gate (PRD §6.0.4, §4.6, §6.0.16).

Usage:
  python3 scripts/beatscape-audit.py --dir data/beatscape-preview
  python3 scripts/beatscape-audit.py --dir apps/beatscape/public --catalog apps/beatscape/public/catalog.json
  python3 scripts/beatscape-audit.py --dir data/beatscape-preview --out data/beatscape-preview/reports

Exit codes: 0 = all PASS (WARN ok), 1 = any FAIL.
"""

from __future__ import annotations

import argparse
import array
import importlib.util
import json
import math
import re
import sys
import wave
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

ROOT = Path(__file__).resolve().parents[1]

Status = Literal["PASS", "WARN", "FAIL"]

# PRD §6.0.6-A Stage1 locked specs (filename slug -> metadata)
STAGE1_BY_SLUG: dict[str, dict[str, Any]] = {
    "01-neon-pulse": {
        "track_id": "bs-s1-01",
        "title": "Neon Pulse",
        "bpm": 160,
        "duration_sec": 75,
        "genre": "EDM",
        "stage": 1,
    },
    "02-glass-horizon": {
        "track_id": "bs-s1-02",
        "title": "Glass Horizon",
        "bpm": 118,
        "duration_sec": 75,
        "genre": "Pop",
        "stage": 1,
    },
    "03-night-drive-808": {
        "track_id": "bs-s1-03",
        "title": "Night Drive 808",
        "bpm": 95,
        "duration_sec": 75,
        "genre": "Hip-hop",
        "stage": 1,
    },
    "04-velvet-afterhours": {
        "track_id": "bs-s1-04",
        "title": "Velvet Afterhours",
        "bpm": 88,
        "duration_sec": 75,
        "genre": "R&B",
        "stage": 1,
    },
    "05-voltage-drop": {
        "track_id": "bs-s1-05",
        "title": "Voltage Drop",
        "bpm": 170,
        "duration_sec": 60,
        "genre": "EDM",
        "stage": 1,
    },
    "06-chrome-riff": {
        "track_id": "bs-s1-06",
        "title": "Chrome Riff",
        "bpm": 132,
        "duration_sec": 75,
        "genre": "Rock",
        "stage": 1,
    },
}

STAGE2_BY_SLUG: dict[str, dict[str, Any]] = {
    "07-slide-city": {
        "track_id": "bs-s2-01",
        "title": "Slide City",
        "bpm": 140,
        "duration_sec": 90,
        "genre": "EDM",
        "stage": 2,
        "allows_slide": True,
    },
    "08-skyline-hook": {
        "track_id": "bs-s2-02",
        "title": "Skyline Hook",
        "bpm": 128,
        "duration_sec": 90,
        "genre": "Pop",
        "stage": 2,
    },
    "09-blue-hour-loop": {
        "track_id": "bs-s2-03",
        "title": "Blue Hour Loop",
        "bpm": 120,
        "duration_sec": 90,
        "genre": "Pop",
        "stage": 2,
    },
    "10-asphalt-anthem": {
        "track_id": "bs-s2-04",
        "title": "Asphalt Anthem",
        "bpm": 148,
        "duration_sec": 90,
        "genre": "Rock",
        "stage": 2,
    },
}

LOCKED_BY_SLUG = {**STAGE1_BY_SLUG, **STAGE2_BY_SLUG}

# PRD §4.6 density windows (NPS average, peak 2s, hold %, chord per 10s)
DENSITY_SPEC: dict[str, dict[str, tuple[float, float]]] = {
    "easy": {"nps": (2.0, 3.5), "peak_nps": (0, 5), "hold_pct": (5, 15), "chord_10s": (0, 1)},
    "standard": {"nps": (3.5, 5.5), "peak_nps": (0, 8), "hold_pct": (10, 25), "chord_10s": (1, 3)},
    "hard": {"nps": (5.5, 8.5), "peak_nps": (0, 12), "hold_pct": (15, 30), "chord_10s": (3, 6)},
}

CATALOG_REQUIRED = (
    "track_id",
    "title",
    "artist",
    "genre",
    "bpm",
    "duration_sec",
    "preset_id",
    "engine",
    "rights",
    "theme",
    "audio",
    "charts",
)

THEME_KEYWORDS = re.compile(
    r"\b(neon|scape|pulse|glass|horizon|grid|chrome|velvet|voltage|skyline|afterhours|beat|slide|asphalt|blue|quiet|anthem)\b",
    re.I,
)


@dataclass
class Check:
    status: Status
    code: str
    message: str


@dataclass
class TrackReport:
    source: str
    track_id: str | None = None
    title: str | None = None
    checks: list[Check] = field(default_factory=list)
    metrics: dict[str, Any] = field(default_factory=dict)

    @property
    def worst(self) -> Status:
        order = {"FAIL": 3, "WARN": 2, "PASS": 1}
        return max((c.status for c in self.checks), key=lambda s: order[s], default="PASS")


@dataclass
class AuditReport:
    generated_at: str
    input_dir: str
    catalog: str | None
    tracks: list[TrackReport] = field(default_factory=list)
    summary: dict[str, int] = field(default_factory=dict)

    def finalize(self) -> None:
        counts = {"PASS": 0, "WARN": 0, "FAIL": 0}
        for t in self.tracks:
            for c in t.checks:
                counts[c.status] += 1
        self.summary = counts


def slug_from_stem(stem: str) -> str:
    return stem.lower().replace("_", "-")


def stage_from_track_id(track_id: str) -> int:
    for prefix, stage in (
        ("bs-s1-", 1),
        ("bs-s2-", 2),
        ("bs-s3-", 3),
        ("bs-s4-", 4),
        ("bs-s5-", 5),
    ):
        if track_id.startswith(prefix):
            return stage
    return 0


def resolve_spec(stem: str, meta: dict[str, Any] | None) -> dict[str, Any] | None:
    if meta:
        return meta
    slug = slug_from_stem(stem)
    if slug in LOCKED_BY_SLUG:
        return LOCKED_BY_SLUG[slug]
    for spec in LOCKED_BY_SLUG.values():
        if spec["track_id"] == stem:
            return spec
    return None


def read_wav_mono(path: Path) -> tuple[list[float], int, int, int]:
    with wave.open(str(path), "rb") as w:
        n, rate, ch, sw = w.getnframes(), w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(n)
    if sw != 2:
        raise ValueError(f"unsupported sample width {sw}")
    samples = array.array("h")
    samples.frombytes(raw)
    if ch == 2:
        mono = [(samples[i] + samples[i + 1]) / 2 for i in range(0, len(samples), 2)]
    else:
        mono = [float(x) for x in samples]
    return mono, rate, ch, sw


def window_rms(mono: list[float], rate: int, win_s: float = 1.0) -> list[float]:
    win = max(1, int(rate * win_s))
    out: list[float] = []
    for i in range(0, len(mono), win):
        chunk = mono[i : i + win]
        if not chunk:
            break
        out.append(math.sqrt(sum(x * x for x in chunk) / len(chunk)))
    return out


def estimate_bpm(mono: list[float], rate: int, target: int) -> float | None:
    hop = max(1, rate // 100)  # ~10ms
    env: list[float] = []
    for i in range(0, len(mono), hop):
        chunk = mono[i : i + hop]
        if not chunk:
            break
        env.append(math.sqrt(sum(x * x for x in chunk) / len(chunk)))
    if len(env) < 40:
        return None
    mx = max(env) or 1.0
    env = [e / mx for e in env]
    onset = [max(0.0, env[i] - env[i - 1]) for i in range(1, len(env))]
    scale = rate / hop  # samples per second in envelope
    min_lag = int(60 / target * scale * 0.82)
    max_lag = int(60 / target * scale * 1.18)
    best_lag, best_score = None, -1.0
    for lag in range(max(2, min_lag), min(max_lag, len(onset) // 2)):
        score = sum(onset[i] * onset[i + lag] for i in range(len(onset) - lag))
        if score > best_score:
            best_score, best_lag = score, lag
    if not best_lag:
        return None
    return 60.0 / (best_lag / scale)


def audit_audio(path: Path, spec: dict[str, Any]) -> TrackReport:
    report = TrackReport(
        source=str(path),
        track_id=spec.get("track_id"),
        title=spec.get("title"),
    )
    target_bpm = int(spec["bpm"])
    target_dur = float(spec["duration_sec"])

    try:
        mono, rate, ch, _sw = read_wav_mono(path)
    except Exception as exc:
        report.checks.append(Check("FAIL", "audio.read", str(exc)))
        return report

    dur = len(mono) / rate
    rms = window_rms(mono, rate, 1.0)
    peak = max(abs(x) for x in mono) if mono else 0
    clip_ratio = sum(1 for x in mono if abs(x) > 32000) / max(len(mono), 1)
    active_s = len([x for x in rms if x > 80])
    silent_tail = 0
    for v in reversed(rms):
        if v < 80:
            silent_tail += 1
        else:
            break
    diffs = [abs(rms[i] - rms[i - 1]) for i in range(1, len(rms))]
    beat_var = sum(diffs) / len(diffs) if diffs else 0.0
    est_bpm = estimate_bpm(mono, rate, target_bpm)

    report.metrics = {
        "duration_sec": round(dur, 2),
        "sample_rate": rate,
        "channels": ch,
        "peak": round(peak, 1),
        "clip_ratio": round(clip_ratio, 6),
        "active_seconds": active_s,
        "silent_tail_sec": silent_tail,
        "beat_var_proxy": round(beat_var, 1),
        "est_bpm": round(est_bpm, 1) if est_bpm else None,
        "target_bpm": target_bpm,
        "target_duration_sec": target_dur,
    }

    if abs(dur - target_dur) > 1.5:
        report.checks.append(Check("FAIL", "audio.duration", f"{dur:.1f}s vs target {target_dur}s"))
    else:
        report.checks.append(Check("PASS", "audio.duration", f"{dur:.1f}s"))

    if rate != 44100 or ch != 2:
        report.checks.append(Check("FAIL", "audio.format", f"{rate}Hz ch{ch} (want 44100 stereo)"))
    else:
        report.checks.append(Check("PASS", "audio.format", "44.1kHz stereo"))

    if clip_ratio > 0.005:
        report.checks.append(Check("FAIL", "audio.clip", f"clipping {clip_ratio * 100:.2f}%"))
    elif clip_ratio > 0.001:
        report.checks.append(Check("WARN", "audio.clip", f"light clipping {clip_ratio * 100:.2f}%"))
    else:
        report.checks.append(Check("PASS", "audio.clip", "no significant clipping"))

    if active_s < target_dur - 5:
        report.checks.append(Check("WARN", "audio.energy", f"~{active_s}s audible vs {target_dur}s target"))
    else:
        report.checks.append(Check("PASS", "audio.energy", "full-length energy"))

    if silent_tail > 3:
        report.checks.append(Check("WARN", "audio.tail", f"{silent_tail}s silent tail"))
    else:
        report.checks.append(Check("PASS", "audio.tail", "tail ok"))

    if est_bpm is None:
        report.checks.append(Check("WARN", "audio.bpm", "could not estimate BPM"))
    elif abs(est_bpm - target_bpm) > 3:
        report.checks.append(
            Check("FAIL", "audio.bpm", f"est ~{est_bpm:.0f} vs target {target_bpm} (±3 gate)")
        )
    else:
        report.checks.append(Check("PASS", "audio.bpm", f"est ~{est_bpm:.0f} (target {target_bpm})"))

    if beat_var < 150:
        report.checks.append(Check("WARN", "audio.beat", "weak beat contrast — may be mushy for charting"))
    else:
        report.checks.append(Check("PASS", "audio.beat", "beat contrast ok (proxy)"))

    return report


def note_count(notes: list[dict[str, Any]]) -> int:
    """Total judgment objects (PRD §4.4): hold = head+tail = 2, slide = 1,
    chord = len(lanes), tap = 1. Matches the runtime engine countTotalNotes so
    chart.total_notes is the correct accuracy denominator."""
    total = 0
    for n in notes:
        t = n.get("type")
        if t == "chord":
            total += len(n.get("lanes") or [])
        elif t == "hold":
            total += 2
        else:
            total += 1
    return total


def tier_nps(notes: list[dict[str, Any]], duration: float) -> tuple[float, float, float, float]:
    if duration <= 0:
        return 0.0, 0.0, 0.0, 0.0
    events: list[tuple[float, str]] = []
    holds = 0
    chords = 0
    for n in notes:
        t = n.get("type")
        if t == "chord":
            events.append((float(n["t"]), "chord"))
            chords += 1
        elif t == "hold":
            events.append((float(n["t"]), "hold"))
            holds += 1
        elif t in ("tap", "slide"):
            events.append((float(n["t"]), t))
    nps = len(events) / duration
    hold_pct = (holds / max(len(events), 1)) * 100
    chord_per_10s = (chords / duration) * 10
    # peak 2s window
    times = sorted(t for t, _ in events)
    peak = 0
    if times:
        j = 0
        for i, t0 in enumerate(times):
            while j < len(times) and times[j] <= t0 + 2.0:
                j += 1
            peak = max(peak, j - i)
    return nps, float(peak), hold_pct, chord_per_10s


def _load_audio_module():
    spec = importlib.util.spec_from_file_location("beatscape_audio", ROOT / "scripts" / "beatscape-audio.py")
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules["beatscape_audio"] = mod
    spec.loader.exec_module(mod)
    return mod


_audio_mod: Any | None = None


def audio_module():
    global _audio_mod
    if _audio_mod is None:
        _audio_mod = _load_audio_module()
    return _audio_mod


def audit_chart_onset_alignment(
    chart: dict[str, Any],
    audio_path: Path,
    bpm_hint: float,
) -> list[Check]:
    checks: list[Check] = []
    beat_map = chart.get("beat_map") or {}
    if beat_map.get("source") != "onset-v1":
        checks.append(Check("WARN", "chart.beat_map", "missing onset-v1 beat_map — legacy grid chart?"))
        return checks

    try:
        analysis = audio_module().analyze_audio(audio_path, bpm_hint)
    except Exception as exc:
        checks.append(Check("WARN", "chart.onset.audio", f"cannot analyze audio: {exc}"))
        return checks

    onsets = analysis.onsets_sec
    notes = chart.get("notes") or []
    head_times = [float(n["t"]) for n in notes if n.get("type") in ("tap", "hold", "chord")]
    if not head_times:
        checks.append(Check("FAIL", "chart.onset.empty", "no note heads to align"))
        return checks

    dists = [audio_module().nearest_onset_distance(t, onsets) for t in head_times]
    dists.sort()
    median = dists[len(dists) // 2]
    p90 = dists[int(len(dists) * 0.9)]
    coverage = sum(1 for d in dists if d <= 80) / len(dists)

    if median <= 55 and p90 <= 120 and coverage >= 0.75:
        checks.append(
            Check(
                "PASS",
                "chart.onset.align",
                f"median {median:.0f}ms · p90 {p90:.0f}ms · coverage {coverage * 100:.0f}%",
            )
        )
    elif median <= 90 and p90 <= 180:
        checks.append(
            Check(
                "WARN",
                "chart.onset.align",
                f"loose align median {median:.0f}ms · p90 {p90:.0f}ms · coverage {coverage * 100:.0f}%",
            )
        )
    else:
        checks.append(
            Check(
                "FAIL",
                "chart.onset.align",
                f"poor align median {median:.0f}ms · p90 {p90:.0f}ms · coverage {coverage * 100:.0f}%",
            )
        )

    offset = int(chart.get("audio_offset_ms") or 0)
    if offset != 0:
        checks.append(Check("WARN", "chart.audio_offset", f"audio_offset_ms={offset} (onset charts expect 0)"))
    else:
        checks.append(Check("PASS", "chart.audio_offset", "0 (file-timeline notes)"))

    first_beat = beat_map.get("first_beat_ms")
    if first_beat is not None and abs(int(first_beat) - analysis.audio_offset_ms) > 120:
        checks.append(
            Check(
                "WARN",
                "chart.first_beat",
                f"beat_map {first_beat}ms vs analysis {analysis.audio_offset_ms}ms",
            )
        )
    else:
        checks.append(Check("PASS", "chart.first_beat", f"{analysis.audio_offset_ms}ms"))

    return checks


def audit_chart(path: Path, *, stage: int, duration_sec: float) -> list[Check]:
    checks: list[Check] = []
    try:
        chart = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [Check("FAIL", "chart.read", str(exc))]

    tier = str(chart.get("tier", path.stem)).lower()
    notes = chart.get("notes") or []
    if not isinstance(notes, list):
        return [Check("FAIL", "chart.notes", "notes must be array")]

    times = [float(n.get("t", -1)) for n in notes]
    if times != sorted(times):
        checks.append(Check("FAIL", "chart.sort", "notes not sorted by t"))

    declared = chart.get("total_notes")
    counted = note_count(notes)
    if declared is not None and int(declared) != counted:
        checks.append(Check("FAIL", "chart.total_notes", f"declared {declared} != counted {counted}"))
    else:
        checks.append(Check("PASS", "chart.total_notes", str(counted)))

    for i, n in enumerate(notes):
        t = n.get("type")
        if t == "slide":
            if stage == 1:
                checks.append(Check("FAIL", "chart.slide", f"slide forbidden in Stage1 (note #{i})"))
            elif abs(int(n.get("to", 0)) - int(n.get("lane", 0))) != 1:
                checks.append(Check("FAIL", "chart.slide", f"invalid slide lane delta (note #{i})"))
        elif t == "hold":
            end = float(n.get("end", 0))
            if end - float(n.get("t", 0)) < 0.4:
                checks.append(Check("FAIL", "chart.hold", f"hold < 0.4s (note #{i})"))
        elif t == "chord":
            lanes = n.get("lanes") or []
            if not (2 <= len(lanes) <= 3):
                checks.append(Check("FAIL", "chart.chord", f"chord lanes must be 2-3 (note #{i})"))
        elif t == "tap":
            lane = n.get("lane")
            if lane not in (0, 1, 2, 3):
                checks.append(Check("FAIL", "chart.tap", f"invalid lane (note #{i})"))

    slide_count = sum(1 for n in notes if n.get("type") == "slide")
    if tier in ("standard", "hard") and stage >= 2 and slide_count:
        checks.append(Check("PASS", "chart.slide", f"{slide_count} slide(s)"))

    if tier in DENSITY_SPEC:
        spec = DENSITY_SPEC[tier]
        nps, peak, hold_pct, chord_10s = tier_nps(notes, duration_sec)
        def band(key: str, val: float, label: str) -> None:
            lo, hi = spec[key]
            if val < lo or val > hi:
                checks.append(Check("WARN", f"chart.density.{key}", f"{label}={val:.2f} outside [{lo},{hi}]"))
            else:
                checks.append(Check("PASS", f"chart.density.{key}", f"{label}={val:.2f}"))

        band("nps", nps, "nps")
        band("peak_nps", peak, "peak_2s")
        band("hold_pct", hold_pct, "hold_pct")
        band("chord_10s", chord_10s, "chord_per_10s")

    if not checks:
        checks.append(Check("PASS", "chart.schema", "basic schema ok"))
    return checks


def audit_catalog_entry(entry: dict[str, Any], base: Path) -> TrackReport:
    report = TrackReport(source=entry.get("track_id", "?"), track_id=entry.get("track_id"), title=entry.get("title"))

    for key in CATALOG_REQUIRED:
        if key not in entry or entry[key] in (None, ""):
            report.checks.append(Check("FAIL", "catalog.field", f"missing `{key}`"))
        else:
            report.checks.append(Check("PASS", "catalog.field", f"`{key}` present"))

    if entry.get("rights") != "owned":
        report.checks.append(Check("FAIL", "catalog.rights", f"rights={entry.get('rights')!r}"))
    else:
        report.checks.append(Check("PASS", "catalog.rights", "owned"))

    if entry.get("theme") != "beatscape":
        report.checks.append(Check("FAIL", "catalog.theme", f"theme={entry.get('theme')!r}"))
    else:
        report.checks.append(Check("PASS", "catalog.theme", "beatscape"))

    title = str(entry.get("title", ""))
    artist = str(entry.get("artist", ""))
    if not THEME_KEYWORDS.search(f"{title} {artist}"):
        report.checks.append(Check("WARN", "catalog.theme_kw", "title/artist lack scape keyword (manual review)"))
    else:
        report.checks.append(Check("PASS", "catalog.theme_kw", "theme keyword present"))

    charts = entry.get("charts") or {}
    for tier, rel in charts.items():
        p = base / str(rel).lstrip("/")
        if not p.is_file():
            report.checks.append(Check("FAIL", "catalog.chart_path", f"{tier} missing: {rel}"))
        else:
            report.checks.append(Check("PASS", "catalog.chart_path", f"{tier} -> {rel}"))

    audio_rel = entry.get("audio")
    if audio_rel:
        ap = base / str(audio_rel).lstrip("/")
        if not ap.is_file():
            report.checks.append(Check("FAIL", "catalog.audio_path", f"missing {audio_rel}"))
        else:
            report.checks.append(Check("PASS", "catalog.audio_path", str(audio_rel)))

    duration_sec = float(entry.get("duration_sec") or 0)
    stream_audio = entry.get("stream_audio")
    stream_dur = entry.get("stream_duration_sec")
    track_id = str(entry.get("track_id", ""))
    is_stage2_plus = track_id.startswith("bs-s2-") or track_id.startswith("bs-s3-")

    if stream_audio:
        sp = base / str(stream_audio).lstrip("/")
        if not sp.is_file():
            report.checks.append(Check("FAIL", "catalog.stream_audio", f"missing {stream_audio}"))
        else:
            report.checks.append(Check("PASS", "catalog.stream_audio", str(stream_audio)))
        if not stream_dur:
            report.checks.append(Check("FAIL", "catalog.stream_duration", "stream_audio set but stream_duration_sec missing"))
        elif duration_sec and float(stream_dur) < duration_sec * 1.8:
            report.checks.append(
                Check(
                    "FAIL",
                    "catalog.stream_duration",
                    f"stream_duration_sec={stream_dur} < game×1.8 ({duration_sec * 1.8:.0f})",
                )
            )
        else:
            report.checks.append(Check("PASS", "catalog.stream_duration", f"stream {stream_dur}s vs game {duration_sec}s"))
    elif is_stage2_plus:
        report.checks.append(Check("FAIL", "catalog.stream_dual", "Stage2+ requires stream_audio + stream_duration_sec"))
    elif stream_dur and duration_sec and float(stream_dur) < duration_sec * 1.8:
        report.checks.append(
            Check("WARN", "catalog.stream_planned", f"planned stream {stream_dur}s < game×1.8 (full master not ingested)")
        )
    elif stream_dur:
        report.checks.append(Check("PASS", "catalog.stream_planned", f"planned stream {stream_dur}s (Stage1 teaser ok)"))

    return report


def find_audio_files(directory: Path) -> list[Path]:
    root_wavs = {p.stem.lower(): p for p in directory.glob("*.wav")}
    root_m4a = {p.stem.lower(): p for p in directory.glob("*.m4a")}
    masters_dir = directory / "masters"
    master_wavs = {p.stem.lower(): p for p in masters_dir.glob("*.wav")} if masters_dir.is_dir() else {}

    keys = sorted(set(root_wavs) | set(root_m4a) | set(master_wavs))
    out: list[Path] = []
    for key in keys:
        if key in root_wavs:
            out.append(root_wavs[key])
        elif key in master_wavs:
            out.append(master_wavs[key])
        elif key in root_m4a:
            out.append(root_m4a[key])
    return out


def render_markdown(report: AuditReport) -> str:
    lines = [
        "# BeatScape QA Audit Report",
        "",
        f"- Generated: {report.generated_at}",
        f"- Input: `{report.input_dir}`",
        f"- Catalog: `{report.catalog or '(none)'}`",
        "",
        "## Summary",
        "",
        f"| PASS | WARN | FAIL |",
        f"|------|------|------|",
        f"| {report.summary.get('PASS', 0)} | {report.summary.get('WARN', 0)} | {report.summary.get('FAIL', 0)} |",
        "",
        "## Human sign-off (required)",
        "",
        "- [ ] Ear check — melody / drop / groove acceptable",
        "- [ ] Gameplay — at least one full Arcade run, no unfair Miss clusters",
        "- [ ] Theme — fits BeatScape city vibe",
        "",
        "## Tracks",
        "",
    ]
    for t in report.tracks:
        lines.append(f"### {t.title or t.source} (`{t.track_id or '?'}`) — **{t.worst}**")
        if t.metrics:
            m = t.metrics
            lines.append(
                f"- Metrics: {m.get('duration_sec')}s · est BPM {m.get('est_bpm')} · "
                f"clip {float(m.get('clip_ratio', 0)) * 100:.3f}%"
            )
        for c in t.checks:
            icon = {"PASS": "✅", "WARN": "⚠️", "FAIL": "❌"}[c.status]
            lines.append(f"- {icon} `{c.code}` — {c.message}")
        lines.append("")
    return "\n".join(lines)


def run_audit(args: argparse.Namespace) -> AuditReport:
    input_dir = Path(args.dir).resolve()
    out_dir = Path(args.out).resolve() if args.out else input_dir / "reports"
    catalog_path = Path(args.catalog).resolve() if args.catalog else None

    audit = AuditReport(
        generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        input_dir=str(input_dir),
        catalog=str(catalog_path) if catalog_path else None,
    )

    catalog_by_id: dict[str, dict[str, Any]] = {}
    if catalog_path and catalog_path.is_file():
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        base = catalog_path.parent
        for entry in catalog.get("tracks", []):
            tr = audit_catalog_entry(entry, base)
            audit.tracks.append(tr)
            if entry.get("track_id"):
                catalog_by_id[entry["track_id"]] = entry
            # charts
            stage = stage_from_track_id(str(entry.get("track_id", ""))) or 2
            charts = entry.get("charts") or {}
            dur = float(entry.get("duration_sec") or 75)
            bpm_hint = float(entry.get("bpm") or 120)
            audio_rel = entry.get("audio")
            audio_path = base / str(audio_rel).lstrip("/") if audio_rel else None
            for tier, rel in charts.items():
                cp = base / str(rel).lstrip("/")
                if cp.is_file():
                    chart_checks = audit_chart(cp, stage=stage, duration_sec=dur)
                    tr.checks.extend(chart_checks)
                    if audio_path and audio_path.is_file():
                        try:
                            chart = json.loads(cp.read_text(encoding="utf-8"))
                            tr.checks.extend(audit_chart_onset_alignment(chart, audio_path, bpm_hint))
                            if (
                                str(entry.get("track_id")) == "bs-s2-01"
                                and tier in ("standard", "hard")
                                and not any(n.get("type") == "slide" for n in chart.get("notes", []))
                            ):
                                tr.checks.append(
                                    Check(
                                        "WARN",
                                        "chart.slide.required",
                                        f"{tier} chart should include slide notes (Slide City)",
                                    )
                                )
                        except Exception as exc:
                            tr.checks.append(Check("WARN", "chart.onset", str(exc)))

    if args.audio:
        audio_files = [Path(p).resolve() for p in args.audio]
    else:
        audio_files = find_audio_files(input_dir)

    audio_reports: dict[str, TrackReport] = {}
    for path in audio_files:
        if path.suffix.lower() == ".m4a":
            wav_alt = path.with_suffix(".wav")
            master = input_dir / "masters" / f"{path.stem}.wav"
            if wav_alt.is_file():
                path = wav_alt
            elif master.is_file():
                path = master
            else:
                tr = TrackReport(source=str(path), title=path.stem)
                tr.checks.append(Check("WARN", "audio.m4a", "no WAV master — skip deep audio QA"))
                audit.tracks.append(tr)
                continue

        spec = resolve_spec(path.stem, None)
        if not spec and catalog_by_id:
            for entry in catalog_by_id.values():
                master = entry.get("audio_master") or ""
                if path.name in master or entry.get("track_id", "") in path.name:
                    spec = entry
                    break
        if not spec:
            tr = TrackReport(source=str(path), title=path.stem)
            tr.checks.append(Check("WARN", "meta.unknown", "no Stage1 spec — pass --catalog or rename file"))
            audit.tracks.append(tr)
            continue

        tr = audit_audio(path, spec)
        key = spec.get("track_id") or path.stem.lower()
        audio_reports[key] = tr

    # merge: catalog entries first, then audio-only
    seen_ids = {t.track_id for t in audit.tracks if t.track_id}
    for key, tr in audio_reports.items():
        if tr.track_id in seen_ids:
            # append audio checks onto existing catalog row
            for existing in audit.tracks:
                if existing.track_id == tr.track_id:
                    existing.checks.extend(tr.checks)
                    existing.metrics = tr.metrics
                    break
        else:
            audit.tracks.append(tr)

    audit.finalize()
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / "audit-report.json"
    md_path = out_dir / "audit-report.md"
    json_path.write_text(json.dumps({"report": asdict(audit)}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md_path.write_text(render_markdown(audit), encoding="utf-8")
    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")
    print(f"Summary: PASS={audit.summary.get('PASS', 0)} WARN={audit.summary.get('WARN', 0)} FAIL={audit.summary.get('FAIL', 0)}")
    return audit


def main() -> int:
    parser = argparse.ArgumentParser(description="BeatScape automated content QA")
    parser.add_argument("--dir", default="data/beatscape-preview", help="Directory with WAV/m4a previews")
    parser.add_argument("--catalog", help="Path to catalog.json (optional)")
    parser.add_argument("--audio", nargs="*", help="Explicit audio files to audit")
    parser.add_argument("--out", help="Report output directory (default: <dir>/reports)")
    args = parser.parse_args()

    audit = run_audit(args)
    if audit.summary.get("FAIL", 0) > 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
