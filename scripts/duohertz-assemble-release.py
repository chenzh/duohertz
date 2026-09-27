#!/usr/bin/env python3
"""Assemble a local duohertz site only from independently approved inputs.

This checks records and hashes, not the identity or judgment of human reviewers.
It never deploys, pushes, or contacts a remote service.
"""

from __future__ import annotations

import argparse
from datetime import datetime
import hashlib
from html import escape, unescape
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import tempfile
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

from importlib.util import module_from_spec, spec_from_file_location

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "apps" / "beatscape"
SITE_IMAGES = {
    "icon-192.png": (192, 192),
    "icon-512.png": (512, 512),
    "apple-touch-icon.png": (180, 180),
    "og.png": (1200, 630),
}
SITE_CHECKS = ("branding", "gameplay", "accessibility", "performance", "legal")
CONTENT_FILES = (
    "manifest.json", "audio.m4a", "stream.m4a", "preview_48s.m4a",
    "easy.json", "standard.json", "hard.json", "cover-art.png",
    "cover.svg", "og.png", "cover-thumb.webp",
)


def load_checker():
    spec = spec_from_file_location("duohertz_stage_check_for_release", ROOT / "scripts" / "duohertz-check-staged-content.py")
    assert spec and spec.loader
    result = module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


CHECK = load_checker()


def digest(path: Path) -> str:
    return CHECK.digest(path)


def file(path: Path, label: str) -> Path:
    return CHECK.source_file(path, label)


def directory(path: Path, label: str) -> Path:
    return CHECK.source_directory(path, label)


def tree_hash(root: Path) -> str:
    directory(root, "source build")
    fingerprint = hashlib.sha256()
    for path in sorted(root.rglob("*")):
        if path.is_symlink():
            raise ValueError(f"linked source build entry: {path}")
        if path.is_dir():
            continue
        file(path, "source build entry")
        relative = path.relative_to(root).as_posix()
        fingerprint.update(relative.encode("utf-8") + b"\0" + digest(path).encode("ascii") + b"\n")
    return fingerprint.hexdigest()


def timestamp(value: object, label: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError(f"{label}: missing timestamp")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(f"{label}: invalid timestamp") from error
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(f"{label}: timezone is required")
    return parsed


def evidence_file(signoff: Path, record: dict, label: str) -> None:
    if record.get("status") != "pass" or not isinstance(record.get("reviewedBy"), str) \
            or not record["reviewedBy"].strip():
        raise ValueError(f"{label}: missing human pass/reviewer")
    relative = record.get("evidence")
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute() \
            or any(part in ("", ".", "..") for part in Path(relative).parts):
        raise ValueError(f"{label}: evidence must be a local relative path")
    target = signoff.parent / relative
    if not target.resolve().is_relative_to(signoff.parent.resolve()):
        raise ValueError(f"{label}: evidence escapes signoff directory")
    for parent in (target, *target.parents):
        if parent == signoff.parent:
            break
        if parent.is_symlink():
            raise ValueError(f"{label}: linked evidence is forbidden")
    CHECK.expect_file(target, record.get("sha256"), f"{label} evidence")


def png_size(path: Path, label: str) -> tuple[int, int]:
    with file(path, label).open("rb") as source:
        header = source.read(24)
    if len(header) != 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError(f"{label}: expected PNG")
    try:
        subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-frames:v", "1", "-f", "null", "-"],
                       check=True, capture_output=True)
    except (FileNotFoundError, subprocess.CalledProcessError) as error:
        raise ValueError(f"{label}: PNG cannot be decoded") from error
    return struct.unpack(">II", header[16:24])


def site_origin(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("siteOrigin: missing HTTPS origin")
    parsed = urlsplit(value)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password \
            or parsed.path not in ("", "/") or parsed.query or parsed.fragment \
            or parsed.port is not None:
        raise ValueError("siteOrigin: expected an HTTPS site root without credentials, port or path")
    return f"https://{parsed.hostname.lower()}"


def validate_site_signoff(path: Path, source: Path, catalog: Path, characters: Path,
                          art: Path) -> dict:
    data = CHECK.read_json(path, "site signoff")
    if data.get("schema") != 1 or data.get("scope") != "duohertz_site_signoff" \
            or data.get("siteApproval") is not True:
        raise ValueError("site signoff: missing explicit site approval")
    if not isinstance(data.get("approvedBy"), str) or not data["approvedBy"].strip():
        raise ValueError("site signoff: missing approver")
    approved_at = timestamp(data.get("approvedAt"), "site approvedAt")
    origin = site_origin(data.get("siteOrigin"))
    slogan = data.get("shortSlogan")
    if not isinstance(slogan, str) or not slogan.strip() or len(slogan) > 100:
        raise ValueError("site signoff: missing approved short slogan")
    for field, actual in (
        ("sourceBuildTreeSha256", tree_hash(source)),
        ("catalogJsonSha256", digest(file(catalog / "catalog.json", "catalog stage JSON"))),
        ("charactersJsonSha256", digest(file(characters / "characters.json", "character stage JSON"))),
    ):
        if data.get(field) != actual:
            raise ValueError(f"site signoff: stale {field}")
    images = data.get("siteImagesSha256")
    if not isinstance(images, dict) or set(images) != set(SITE_IMAGES):
        raise ValueError("site signoff: expected four approved site images")
    directory(art, "site image directory")
    for name, size in SITE_IMAGES.items():
        target = art / name
        CHECK.expect_file(target, images[name], f"site image {name}")
        if png_size(target, name) != size:
            raise ValueError(f"site image {name}: expected {size[0]}x{size[1]}")
    checks = data.get("checks")
    if not isinstance(checks, dict) or set(checks) != set(SITE_CHECKS):
        raise ValueError("site signoff: missing required review checks")
    for name in SITE_CHECKS:
        record = checks[name]
        if not isinstance(record, dict):
            raise ValueError(f"site {name}: invalid review record")
        reviewed_at = timestamp(record.get("reviewedAt"), f"site {name} reviewedAt")
        if reviewed_at > approved_at:
            raise ValueError(f"site {name}: review is after site approval")
        evidence_file(path, record, f"site {name}")
    return {"origin": origin, "slogan": slogan.strip(), "approved_by": data["approvedBy"],
            "approved_at": data["approvedAt"], "signoff_sha256": digest(path),
            "source_tree_sha256": data["sourceBuildTreeSha256"], "site_image_hashes": images}


def copy_verified(source: Path, destination: Path, expected: str) -> None:
    CHECK.expect_file(source, expected, str(source))
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    CHECK.expect_file(destination, expected, str(destination))


def replace_once(html: str, pattern: str, replacement: str, label: str) -> str:
    result, count = re.subn(pattern, lambda _match: replacement, html)
    if count != 1:
        raise ValueError(f"source HTML: expected one {label}, found {count}")
    return result


def release_html(source: str, origin: str, slogan: str) -> str:
    if "noindex, nofollow" not in source or "duohertz" not in source.lower():
        raise ValueError("source HTML: expected a noindex duohertz source build")
    title = escape(f"duohertz — {slogan}", quote=True)
    html = replace_once(source, r'<meta name="robots" content="noindex, nofollow"\s*/>',
                        '<meta name="robots" content="index, follow" />', "robots tag")
    html = replace_once(html, r"<title>[^<]*</title>", f"<title>{title}</title>", "title")
    tags = f'''<link rel="canonical" href="{origin}/" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="An electronic rhythm game for every age. Press one or two keys and find your frequency." />
    <meta property="og:url" content="{origin}/" />
    <meta property="og:image" content="{origin}/og.png" />
    <meta name="twitter:card" content="summary_large_image" />'''
    return replace_once(html, r"</head>", f"    {tags}\n  </head>", "head close")


def validate_assets(root: Path, html: str, slogan: str) -> None:
    assets = directory(root / "assets", "duohertz assets")
    entry = re.search(r'<script\b[^>]*\bsrc="/assets/(index-[A-Za-z0-9_-]+\.js)"', html)
    if not entry or not (assets / entry.group(1)).is_file():
        raise ValueError("duohertz bundle: missing compiled entry")
    scripts = re.findall(r'<script\b[^>]*\bsrc="([^"]+)"', html)
    if scripts != [f"/assets/{entry.group(1)}"]:
        raise ValueError("duohertz bundle: unexpected script source")
    legacy = re.compile(r"^(?:Track|Duo|Radio|Characters|FirstShift|Calibration|Leaderboard)-")
    slogan_found = False
    for asset in assets.iterdir():
        file(asset, "source asset")
        if asset.suffix not in (".js", ".css", ".woff2") or legacy.match(asset.name):
            raise ValueError(f"source build: unexpected asset {asset.name}")
        if asset.suffix == ".js":
            code = asset.read_bytes()
            if b"BeatScape" in code or b"NIGHTSHIFT" in code:
                raise ValueError(f"source build: legacy code in {asset.name}")
            slogan_found = slogan_found or slogan.encode("utf-8") in code
    if not slogan_found:
        raise ValueError("source build: approved slogan is missing from the player UI")


def validate_source_build(source: Path, html: str, slogan: str) -> None:
    root_entries = {path.name for path in directory(source, "source build").iterdir()}
    if root_entries != {"index.html", "assets"}:
        raise ValueError("source build: expected only index.html and bundled assets")
    validate_assets(source, html, slogan)


def safe_output(out: Path, inputs: tuple[Path, ...]) -> Path:
    target = out.absolute()
    if target.exists() or target.is_symlink():
        raise ValueError("output directory already exists")
    forbidden = (APP / "public", APP / "candidates", *inputs)
    resolved = target.resolve()
    if any(resolved == base.resolve() or resolved.is_relative_to(base.resolve())
           or base.resolve().is_relative_to(resolved) for base in forbidden):
        raise ValueError("output overlaps source, staged content or old public paths")
    if not target.parent.is_dir() or target.parent.is_symlink():
        raise ValueError("output parent must be an existing real directory")
    return target


def verify_release(site: Path) -> dict:
    """Check a local assembled artifact without trusting its recorded success flag."""
    directory(site, "assembled site")
    expected_root = {
        "index.html", "assets", "duohertz-v2", "catalog", "characters", "icons", "og.png",
        "manifest.webmanifest", "robots.txt", "sitemap.xml", "_redirects", "_headers",
        "release-provenance.json",
    }
    if {path.name for path in site.iterdir()} != expected_root:
        raise ValueError("assembled site: missing or unexpected root entries")
    for path in site.rglob("*"):
        if path.is_symlink():
            raise ValueError(f"assembled site: linked entry {path}")
    provenance = CHECK.read_json(site / "release-provenance.json", "release provenance")
    if provenance.get("brand") != "duohertz" or provenance.get("tracks") != 105 \
            or provenance.get("characters") != 3:
        raise ValueError("release provenance: wrong brand or content counts")
    origin = site_origin(provenance.get("site_origin"))
    slogan = provenance.get("short_slogan")
    if not isinstance(slogan, str) or not slogan.strip() or len(slogan) > 100:
        raise ValueError("release provenance: missing short slogan")
    for field in ("source_build_tree_sha256", "catalog_stage_json_sha256",
                  "character_stage_json_sha256", "site_signoff_sha256"):
        CHECK.sha_field(provenance.get(field), f"release provenance {field}")
    images = provenance.get("site_images_sha256")
    if not isinstance(images, dict) or set(images) != set(SITE_IMAGES):
        raise ValueError("release provenance: missing site image fingerprints")
    if tree_hash(site / "assets") != provenance.get("assets_tree_sha256"):
        raise ValueError("assembled site: changed code assets")
    if {path.name for path in directory(site / "duohertz-v2", "published data").iterdir()} \
            != {"catalog.json", "characters.json"}:
        raise ValueError("assembled site: invalid published data directory")
    if digest(file(site / "duohertz-v2/catalog.json", "published catalog")) \
            != provenance.get("catalog_published_sha256"):
        raise ValueError("assembled site: changed published catalog")
    if digest(file(site / "duohertz-v2/characters.json", "published characters")) \
            != provenance.get("characters_published_sha256"):
        raise ValueError("assembled site: changed published characters")
    tracks = CHECK.check_catalog(site, catalog_filename="duohertz-v2/catalog.json",
                                 expected_approval=True)
    characters = CHECK.check_characters(site, characters_filename="duohertz-v2/characters.json",
                                        expected_approval=True)
    catalog_data = CHECK.read_json(site / "duohertz-v2/catalog.json", "published catalog")
    character_data = CHECK.read_json(site / "duohertz-v2/characters.json", "published characters")
    if {path.name for path in directory(site / "catalog", "published tracks").iterdir()} \
            != {track["track_id"] for track in catalog_data["tracks"]}:
        raise ValueError("assembled site: unexpected track directory")
    for track in catalog_data["tracks"]:
        actual = {path.name for path in (site / "catalog" / track["track_id"]).iterdir()}
        if actual != set(CONTENT_FILES):
            raise ValueError(f"assembled site: unexpected files for {track['track_id']}")
    if {path.name for path in directory(site / "characters", "published characters").iterdir()} \
            != {character["id"] for character in character_data["characters"]}:
        raise ValueError("assembled site: unexpected character directory")
    for character in character_data["characters"]:
        actual = {path.name for path in (site / "characters" / character["id"]).iterdir()}
        if actual != {"front.png", "side.png"}:
            raise ValueError(f"assembled site: unexpected files for {character['id']}")
    if {path.name for path in directory(site / "icons", "site icons").iterdir()} \
            != set(SITE_IMAGES) - {"og.png"}:
        raise ValueError("assembled site: missing or unexpected icons")
    for name, size in SITE_IMAGES.items():
        target = site / ("og.png" if name == "og.png" else f"icons/{name}")
        CHECK.expect_file(target, images[name], f"site image {name}")
        if png_size(target, name) != size:
            raise ValueError(f"site image {name}: wrong dimensions")
    html = file(site / "index.html", "published HTML").read_text(encoding="utf-8")
    if "noindex" in html.lower() or "Internal preview" in html or "BeatScape" in html:
        raise ValueError("assembled site: preview or legacy HTML")
    if len(re.findall(r'<meta name="robots" content="index, follow"\s*/>', html)) != 1:
        raise ValueError("assembled site: missing index metadata")
    title = re.findall(r"<title>([^<]+)</title>", html)
    if len(title) != 1 or unescape(title[0]) != f"duohertz — {slogan}":
        raise ValueError("assembled site: title and approved slogan differ")
    for snippet in (f'<link rel="canonical" href="{origin}/" />',
                    f'<meta property="og:url" content="{origin}/" />',
                    f'<meta property="og:image" content="{origin}/og.png" />',
                    '<link rel="manifest" href="/manifest.webmanifest" />'):
        if html.count(snippet) != 1:
            raise ValueError(f"assembled site: missing or duplicate metadata {snippet}")
    validate_assets(site, html, slogan)
    manifest = CHECK.read_json(site / "manifest.webmanifest", "web manifest")
    if manifest.get("name") != "duohertz — 真我赫兹" or manifest.get("short_name") != "duohertz" \
            or manifest.get("start_url") != "/" or manifest.get("scope") != "/" \
            or manifest.get("display") != "standalone" or slogan not in manifest.get("description", ""):
        raise ValueError("assembled site: invalid web manifest")
    icon_urls = {icon.get("src") for icon in manifest.get("icons", []) if isinstance(icon, dict)}
    if icon_urls != {"/icons/icon-192.png", "/icons/icon-512.png"}:
        raise ValueError("assembled site: web manifest icons mismatch")
    if file(site / "robots.txt", "robots").read_text(encoding="utf-8") \
            != f"User-agent: *\nAllow: /\nSitemap: {origin}/sitemap.xml\n":
        raise ValueError("assembled site: robots metadata mismatch")
    try:
        sitemap = ET.parse(file(site / "sitemap.xml", "sitemap")).getroot()
    except ET.ParseError as error:
        raise ValueError("assembled site: invalid sitemap XML") from error
    locs = {node.text for node in sitemap.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/"
                                                   "{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
    if locs != {f"{origin}{page}" for page in ("/", "/library", "/radio", "/characters")}:
        raise ValueError("assembled site: sitemap URL mismatch")
    if file(site / "_redirects", "routing rules").read_text(encoding="utf-8") != "/* /index.html 200\n":
        raise ValueError("assembled site: missing SPA fallback")
    if file(site / "_headers", "headers").read_text(encoding="utf-8") \
            != "/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n":
        raise ValueError("assembled site: unexpected asset cache rules")
    return {"site_package_integrity_verified": True, "tracks": tracks,
            "charts": tracks * 3, "characters": characters, "site_origin": origin,
            "source_evidence_rechecked": False, "remote_action": False}


def assemble(source: Path, catalog: Path, characters: Path, art: Path, signoff: Path,
             observations: Path, catalog_signoff: Path, roster: Path,
             character_signoff: Path, out: Path) -> dict:
    target = safe_output(out, (source, catalog, characters, art))
    report = CHECK.audit(catalog, characters, observations=observations,
                         catalog_signoff=catalog_signoff, roster=roster,
                         character_signoff=character_signoff)
    if report["blockers"] or not report["source_evidence_verified"]:
        raise ValueError("content source review is incomplete: " + "; ".join(report["blockers"]))
    approval = validate_site_signoff(signoff, source, catalog, characters, art)
    source_html = file(source / "index.html", "source HTML").read_text(encoding="utf-8")
    validate_source_build(source, source_html, approval["slogan"])
    if (source / "duohertz-v2").exists() or (source / "catalog").exists() \
            or (source / "characters").exists() or (source / "manifest.webmanifest").exists():
        raise ValueError("source build already contains content or release metadata")
    html = release_html(source_html, approval["origin"], approval["slogan"])
    catalog_data = CHECK.read_json(catalog / "catalog.json", "catalog stage JSON")
    character_data = CHECK.read_json(characters / "characters.json", "character stage JSON")
    with tempfile.TemporaryDirectory(prefix=".duohertz-release-", dir=target.parent) as temporary:
        stage = Path(temporary)
        shutil.copytree(source, stage, dirs_exist_ok=True, symlinks=False)
        if tree_hash(source) != approval["source_tree_sha256"]:
            raise ValueError("source build changed during assembly")
        for track in catalog_data["tracks"]:
            track_id = track["track_id"]
            source_dir = catalog / "catalog" / track_id
            dest_dir = stage / "catalog" / track_id
            manifest = CHECK.read_json(source_dir / "manifest.json", f"{track_id} manifest")
            copy_verified(source_dir / "manifest.json", dest_dir / "manifest.json", track["manifest_sha256"])
            for name in CONTENT_FILES[1:]:
                expected = track["cover_thumb_sha256"] if name == "cover-thumb.webp" else manifest["files_sha256"][name]
                copy_verified(source_dir / name, dest_dir / name, expected)
        for character in character_data["characters"]:
            character_id = character["id"]
            for name, field in (("front.png", "art_sha256"), ("side.png", "side_art_sha256")):
                copy_verified(characters / "characters" / character_id / name,
                              stage / "characters" / character_id / name, character[field])
        for name in SITE_IMAGES:
            copy_verified(art / name, stage / ("og.png" if name == "og.png" else f"icons/{name}"),
                          approval["site_image_hashes"][name])
        catalog_data["site_and_deployment_approval"] = True
        character_data["site_and_deployment_approval"] = True
        (stage / "duohertz-v2").mkdir()
        (stage / "duohertz-v2" / "catalog.json").write_text(json.dumps(catalog_data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        (stage / "duohertz-v2" / "characters.json").write_text(json.dumps(character_data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        (stage / "index.html").write_text(html, encoding="utf-8")
        manifest = {
            "id": "/", "name": "duohertz — 真我赫兹", "short_name": "duohertz",
            "description": f"{approval['slogan']} An electronic rhythm game for every age.",
            "lang": "en", "start_url": "/", "scope": "/", "display": "standalone",
            "background_color": "#111421", "theme_color": "#111421",
            "categories": ["games", "music"],
            "icons": [
                {"src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
                {"src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
            ],
        }
        (stage / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (stage / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {approval['origin']}/sitemap.xml\n", encoding="utf-8")
        pages = ("/", "/library", "/radio", "/characters")
        (stage / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"  <url><loc>{approval['origin']}{page}</loc></url>\n" for page in pages)
            + "</urlset>\n", encoding="utf-8")
        (stage / "_redirects").write_text("/* /index.html 200\n", encoding="utf-8")
        (stage / "_headers").write_text("/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n", encoding="utf-8")
        provenance = {
            "brand": "duohertz", "tracks": report["tracks"], "characters": report["characters"],
            "source_build_tree_sha256": approval["source_tree_sha256"],
            "assets_tree_sha256": tree_hash(stage / "assets"),
            "catalog_stage_json_sha256": digest(catalog / "catalog.json"),
            "character_stage_json_sha256": digest(characters / "characters.json"),
            "catalog_published_sha256": digest(stage / "duohertz-v2/catalog.json"),
            "characters_published_sha256": digest(stage / "duohertz-v2/characters.json"),
            "site_signoff_sha256": approval["signoff_sha256"],
            "site_images_sha256": approval["site_image_hashes"],
            "site_origin": approval["origin"], "short_slogan": approval["slogan"],
        }
        (stage / "release-provenance.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        verify_release(stage)
        # Recheck original records after copying, then publish the complete local directory atomically.
        if CHECK.audit(catalog, characters, observations=observations,
                       catalog_signoff=catalog_signoff, roster=roster,
                       character_signoff=character_signoff)["blockers"]:
            raise ValueError("content source changed during assembly")
        if validate_site_signoff(signoff, source, catalog, characters, art)["signoff_sha256"] != approval["signoff_sha256"]:
            raise ValueError("site signoff changed during assembly")
        os.rename(stage, target)
    return {"output": str(target), **provenance, "remote_action": False}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    for name in ("source-build", "catalog-stage", "character-stage", "site-art", "site-signoff",
                 "observations", "catalog-signoff", "roster", "character-signoff", "out"):
        parser.add_argument(f"--{name}", type=Path, required=True)
    args = parser.parse_args()
    try:
        result = assemble(args.source_build, args.catalog_stage, args.character_stage,
                          args.site_art, args.site_signoff, args.observations,
                          args.catalog_signoff, args.roster, args.character_signoff, args.out)
    except (OSError, UnicodeError, ValueError, TypeError, KeyError, shutil.Error) as error:
        print(json.dumps({"site_package_ready": False, "error": str(error)}, ensure_ascii=False, indent=2))
        return 1
    print(json.dumps({"site_package_ready": True, **result}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
