"""The local release assembler must fail closed and preserve reviewed bytes."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import sys
import zlib

import pytest

from test_duohertz_check_staged_content import sources, stages

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "duohertz_assemble_release_test", ROOT / "scripts/duohertz-assemble-release.py"
)
assert SPEC and SPEC.loader
ASSEMBLE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ASSEMBLE)


def png(width: int, height: int) -> bytes:
    def chunk(name: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data))
    row = b"\0" + b"\x16\x18\x2b\xff" * width
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(row * height, level=9)) + chunk(b"IEND", b""))


def inputs(tmp_path: Path) -> dict:
    music, cast = stages(tmp_path)
    original = sources(tmp_path, music, cast)
    source = tmp_path / "source"
    (source / "assets").mkdir(parents=True)
    (source / "index.html").write_text('''<!doctype html><html lang="en"><head>
      <meta name="robots" content="noindex, nofollow" />
      <title>duohertz — internal source</title></head>
      <body><div id="root"></div><script src="/assets/index-fixture.js"></script></body></html>''', encoding="utf-8")
    (source / "assets" / "index-fixture.js").write_text(
        "document.title += ' duohertz'; const slogan = 'Music for you. Be your true hertz.';", encoding="utf-8")
    art = tmp_path / "site-art"
    art.mkdir()
    for name, (width, height) in ASSEMBLE.SITE_IMAGES.items():
        (art / name).write_bytes(png(width, height))
    (tmp_path / "site-evidence.txt").write_text("Synthetic site review only", encoding="utf-8")
    record = {
        "status": "pass", "reviewedBy": "Fixture reviewer", "reviewedAt": "2026-09-25T10:00:00Z",
        "evidence": "site-evidence.txt", "sha256": ASSEMBLE.digest(tmp_path / "site-evidence.txt"),
    }
    signoff = tmp_path / "site-signoff.json"
    signoff.write_text(json.dumps({
        "schema": 1, "scope": "duohertz_site_signoff", "siteApproval": True,
        "approvedBy": "Fixture approver", "approvedAt": "2026-09-25T12:00:00Z",
        "siteOrigin": "https://duohertz.example", "shortSlogan": "Music for you. Be your true hertz.",
        "sourceBuildTreeSha256": ASSEMBLE.tree_hash(source),
        "catalogJsonSha256": ASSEMBLE.digest(music / "catalog.json"),
        "charactersJsonSha256": ASSEMBLE.digest(cast / "characters.json"),
        "siteImagesSha256": {name: ASSEMBLE.digest(art / name) for name in ASSEMBLE.SITE_IMAGES},
        "checks": {name: record for name in ASSEMBLE.SITE_CHECKS},
    }), encoding="utf-8")
    return {"source": source, "catalog": music, "characters": cast, "art": art,
            "signoff": signoff, **original, "out": tmp_path / "release"}


def run(**paths: Path) -> dict:
    return ASSEMBLE.assemble(paths["source"], paths["catalog"], paths["characters"],
                             paths["art"], paths["signoff"], paths["observations"],
                             paths["catalog_signoff"], paths["roster"],
                             paths["character_signoff"], paths["out"])


def test_approved_local_assembly_has_only_new_brand_and_reviewed_content(tmp_path: Path) -> None:
    paths = inputs(tmp_path)
    report = run(**paths)
    site = paths["out"]
    assert report["remote_action"] is False
    assert report["tracks"] == 105 and report["characters"] == 3
    html = (site / "index.html").read_text(encoding="utf-8")
    assert "index, follow" in html and "noindex" not in html
    assert "https://duohertz.example/" in html
    assert "Music for you. Be your true hertz." in html
    assert "BeatScape" not in html
    catalog = json.loads((site / "duohertz-v2/catalog.json").read_text(encoding="utf-8"))
    cast = json.loads((site / "duohertz-v2/characters.json").read_text(encoding="utf-8"))
    assert catalog["site_and_deployment_approval"] is True
    assert cast["site_and_deployment_approval"] is True
    assert ASSEMBLE.digest(site / "catalog/dh-001-fixture/audio.m4a") \
        == ASSEMBLE.digest(paths["catalog"] / "catalog/dh-001-fixture/audio.m4a")
    assert (site / "manifest.webmanifest").is_file()
    assert (site / "robots.txt").read_text(encoding="utf-8").startswith("User-agent: *\nAllow: /")
    assert not (site / "catalog.json").exists()
    assert ASSEMBLE.verify_release(site) == {
        "site_package_integrity_verified": True, "tracks": 105, "charts": 315,
        "characters": 3, "site_origin": "https://duohertz.example",
        "source_evidence_rechecked": False, "remote_action": False,
    }
    command = subprocess.run(
        [sys.executable, str(ROOT / "scripts/duohertz-verify-release.py"), "--site", str(site)],
        check=True, capture_output=True, text=True,
    )
    assert json.loads(command.stdout)["site_package_integrity_verified"] is True


def test_final_artifact_verifier_catches_content_and_metadata_changes(tmp_path: Path) -> None:
    paths = inputs(tmp_path)
    run(**paths)
    site = paths["out"]
    edits = (
        ("catalog/dh-001-fixture/audio.m4a", b"changed", "changed bytes"),
        ("duohertz-v2/catalog.json", b"{}", "changed published catalog"),
        ("characters/dh-char-1/front.png", b"changed", "changed bytes"),
        ("assets/index-fixture.js", b"changed", "changed code assets"),
        ("icons/icon-192.png", b"changed", "changed bytes"),
        ("robots.txt", b"Disallow: /\n", "robots metadata mismatch"),
        ("sitemap.xml", b"<urlset/>", "sitemap URL mismatch"),
        ("_redirects", b"/bad /index.html 200\n", "missing SPA fallback"),
    )
    for relative, changed, expected in edits:
        target = site / relative
        original = target.read_bytes()
        target.write_bytes(changed)
        with pytest.raises(ValueError, match=expected):
            ASSEMBLE.verify_release(site)
        target.write_bytes(original)
    assert ASSEMBLE.verify_release(site)["site_package_integrity_verified"] is True


def test_final_artifact_verifier_rejects_extra_or_linked_files(tmp_path: Path) -> None:
    paths = inputs(tmp_path)
    run(**paths)
    site = paths["out"]
    extra = site / "catalog/dh-001-fixture/unsigned.txt"
    extra.write_text("unsigned", encoding="utf-8")
    with pytest.raises(ValueError, match="unexpected files"):
        ASSEMBLE.verify_release(site)
    extra.unlink()
    linked = site / "icons/linked.png"
    linked.symlink_to("icon-192.png")
    with pytest.raises(ValueError, match="linked entry"):
        ASSEMBLE.verify_release(site)


@pytest.mark.parametrize("change,expected", [
    ("unsigned", "missing explicit site approval"),
    ("stale_source", "stale sourceBuildTreeSha256"),
    ("changed_art", "changed bytes"),
    ("missing_review", "missing required review checks"),
    ("changed_human_evidence", "missing or linked file"),
    ("mismatched_slogan", "approved slogan is missing"),
    ("corrupt_art", "PNG cannot be decoded"),
])
def test_missing_or_stale_approval_writes_no_package(tmp_path: Path, change: str, expected: str) -> None:
    paths = inputs(tmp_path)
    signoff = json.loads(paths["signoff"].read_text(encoding="utf-8"))
    if change == "unsigned":
        signoff["siteApproval"] = False
    elif change == "stale_source":
        (paths["source"] / "assets/index-fixture.js").write_text("changed", encoding="utf-8")
    elif change == "changed_art":
        (paths["art"] / "og.png").write_bytes(png(1200, 630) + b"changed")
    elif change == "missing_review":
        del signoff["checks"]["legal"]
    elif change == "changed_human_evidence":
        (tmp_path / "site-evidence.txt").unlink()
    elif change == "mismatched_slogan":
        signoff["shortSlogan"] = "A different line approved later."
    elif change == "corrupt_art":
        (paths["art"] / "og.png").write_bytes((paths["art"] / "og.png").read_bytes()[:24])
        signoff["siteImagesSha256"]["og.png"] = ASSEMBLE.digest(paths["art"] / "og.png")
    paths["signoff"].write_text(json.dumps(signoff), encoding="utf-8")
    with pytest.raises(ValueError, match=expected):
        run(**paths)
    assert not paths["out"].exists()


def test_refuses_output_inside_legacy_public_directory(tmp_path: Path) -> None:
    paths = inputs(tmp_path)
    paths["out"] = ASSEMBLE.APP / "public" / "duohertz-v2"
    with pytest.raises(ValueError, match="output overlaps"):
        run(**paths)


def test_approved_record_cannot_package_legacy_code(tmp_path: Path) -> None:
    paths = inputs(tmp_path)
    (paths["source"] / "assets" / "Track-old.js").write_text("BeatScape", encoding="utf-8")
    signoff = json.loads(paths["signoff"].read_text(encoding="utf-8"))
    signoff["sourceBuildTreeSha256"] = ASSEMBLE.tree_hash(paths["source"])
    paths["signoff"].write_text(json.dumps(signoff), encoding="utf-8")
    with pytest.raises(ValueError, match="unexpected asset"):
        run(**paths)
    assert not paths["out"].exists()
