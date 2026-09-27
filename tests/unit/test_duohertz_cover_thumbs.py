"""Derived card art must stay tied to an unchanged source cover."""

from __future__ import annotations

import importlib.util
from pathlib import Path
import struct
import zlib

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("duohertz_cover_thumbs_test", ROOT / "scripts/duohertz-cover-thumbs.py")
assert SPEC and SPEC.loader
THUMBS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(THUMBS)


def small_png(path: Path) -> None:
    def chunk(kind: bytes, payload: bytes) -> bytes:
        return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload))
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(b"\x00\xff\x30\x40\xff"))
        + chunk(b"IEND", b"")
    )


def test_local_derivation_is_small_and_source_preserving(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    source = tmp_path / "dh-001-test" / "cover-art.png"
    source.parent.mkdir()
    small_png(source)
    original = THUMBS.sha(source)
    monkeypatch.setattr(THUMBS, "candidates", lambda _: [{
        "track_id": "dh-001-test", "assets_sha256": {"cover-art.png": original},
    }])

    report = THUMBS.build(tmp_path)
    thumb = tmp_path / "thumbnails/dh-001-test.webp"
    assert THUMBS.sha(source) == original
    assert report["tracks"][0]["thumbnail_sha256"] == THUMBS.sha(thumb)
    assert thumb.stat().st_size < 100_000
    assert THUMBS.verify(tmp_path) == report

    small_png(tmp_path / "changed.png")
    source.write_bytes(source.read_bytes() + b"changed")
    with pytest.raises(ValueError, match="Stale or invalid thumbnail"):
        THUMBS.verify(tmp_path)


def test_derivation_rejects_linked_cover(tmp_path: Path) -> None:
    source = tmp_path / "source.png"
    small_png(source)
    linked = tmp_path / "linked.png"
    linked.symlink_to(source)
    with pytest.raises(ValueError, match="linked cover source"):
        THUMBS.encode(linked, tmp_path / "thumb.webp")
