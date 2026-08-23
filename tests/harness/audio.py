"""WAV validation helpers shared across acceptance scripts."""

from __future__ import annotations

import struct
import wave
from io import BytesIO


def wav_duration_sec(data: bytes) -> float:
    with wave.open(BytesIO(data)) as wf:
        return wf.getnframes() / float(wf.getframerate())


def wav_info(data: bytes) -> tuple[float, int, int]:
    try:
        with wave.open(BytesIO(data)) as wf:
            return wf.getnframes() / wf.getframerate(), wf.getnchannels(), wf.getframerate()
    except wave.Error:
        pos = 12
        fmt: bytes | None = None
        while pos + 8 <= len(data):
            chunk_id = data[pos : pos + 4]
            chunk_size = struct.unpack("<I", data[pos + 4 : pos + 8])[0]
            chunk_data = data[pos + 8 : pos + 8 + chunk_size]
            if chunk_id == b"fmt ":
                fmt = chunk_data
                break
            pos += 8 + chunk_size
        if not fmt or len(fmt) < 16:
            raise ValueError("invalid wav")
        audio_format, channels, sample_rate = struct.unpack("<HHI", fmt[:8])
        bits = struct.unpack("<H", fmt[14:16])[0] if len(fmt) >= 16 else 16
        if audio_format == 3:  # IEEE float
            sample_width = 4
        else:
            sample_width = bits // 8
        pos = 12
        while pos + 8 <= len(data):
            chunk_id = data[pos : pos + 4]
            chunk_size = struct.unpack("<I", data[pos + 4 : pos + 8])[0]
            if chunk_id == b"data":
                frames = chunk_size // (channels * sample_width)
                return frames / sample_rate, channels, sample_rate
            pos += 8 + chunk_size
        raise ValueError("missing data chunk")


def wav_ok(data: bytes, *, min_bytes: int = 1024, min_duration: float = 1.0) -> bool:
    if len(data) < min_bytes:
        return False
    try:
        duration, _, _ = wav_info(data)
        return duration >= min_duration
    except (ValueError, struct.error, wave.Error):
        return False
