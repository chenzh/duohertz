#!/usr/bin/env python3
"""End-to-end Stage6 expansion: sync → generate → clip → stitch → ingest → chart → QA.

50 new tracks (bs-s4-11..15, bs-s5-01..10, bs-s6-01..35), catalog 35 → 85.

Usage:
  python3 scripts/beatscape-stage6-pipeline.py --dry-run
  python3 scripts/beatscape-stage6-pipeline.py --only-generate
  python3 scripts/beatscape-stage6-pipeline.py --skip-generate
  python3 scripts/beatscape-stage6-pipeline.py --track bs-s6-01
"""

from __future__ import annotations

import argparse
import importlib.util
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
MANIFEST = SCRIPTS / "beatscape-stage6-manifest.json"


def load_stage6() -> list[dict]:
    spec = importlib.util.spec_from_file_location("s6", SCRIPTS / "beatscape-stage6-specs.py")
    assert spec and spec.loader
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m.stage6_tracks()


def run(cmd: list[str], dry_run: bool) -> None:
    print("+", " ".join(str(c) for c in cmd))
    if dry_run:
        return
    subprocess.run([str(c) for c in cmd], cwd=ROOT, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Stage6 end-to-end pipeline")
    parser.add_argument("--track", help="Only process one track_id")
    parser.add_argument("--batch", help="Only process one batch (s4-wave-3 | s5-formal | s6-expansion)")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--only-generate", action="store_true")
    parser.add_argument("--skip-generate", action="store_true")
    args = parser.parse_args()

    run([sys.executable, str(SCRIPTS / "beatscape-stage6-sync-manifest.py")], args.dry_run)

    tracks = load_stage6()
    if args.track:
        tracks = [t for t in tracks if t["track_id"] == args.track]
    elif args.batch:
        tracks = [t for t in tracks if t["batch"] == args.batch]

    if not args.skip_generate:
        for tr in tracks:
            run(
                [
                    sys.executable,
                    str(SCRIPTS / "beatscape-generate-tracks.py"),
                    "--manifest", str(MANIFEST),
                    "--track", tr["track_id"],
                ],
                args.dry_run,
            )

    if args.only_generate:
        return 0

    for tr in tracks:
        run(
            [
                sys.executable, str(SCRIPTS / "beatscape-clip-game.py"),
                "--track", tr["track_id"],
                "--t0", "0",
                "--duration", str(tr["duration_sec"]),
            ],
            args.dry_run,
        )

    run([sys.executable, str(SCRIPTS / "beatscape-stitch-stream.py"), "--all-stage6"], args.dry_run)
    run([sys.executable, str(SCRIPTS / "beatscape-ingest-stage6.py")], args.dry_run)

    for tr in tracks:
        run([sys.executable, str(SCRIPTS / "beatscape-chartgen.py"), "--track", tr["track_id"]], args.dry_run)

    # 门禁：谱面必须与音频匹配（onset 踩点 / 互相关偏移 / 贴格率），失败即中断，
    # 坏谱不会进 catalog.json。老曲重跑若卡在音频硬上限，用 --min-* 放宽。
    run(
        [sys.executable, str(SCRIPTS / "beatscape-chart-gate.py")]
        + sum((["--track", tr["track_id"]] for tr in tracks), []),
        args.dry_run,
    )

    run([sys.executable, str(SCRIPTS / "beatscape-ingest-stream.py")], args.dry_run)
    run([sys.executable, str(SCRIPTS / "beatscape-cover.py"), "--all"], args.dry_run)
    run([sys.executable, str(SCRIPTS / "beatscape-generate-og.py"), "--all-catalog"], args.dry_run)
    run(
        [
            sys.executable, str(SCRIPTS / "beatscape-audit.py"),
            "--dir", "apps/beatscape/public",
            "--catalog", "apps/beatscape/public/catalog.json",
        ],
        args.dry_run,
    )
    run([sys.executable, str(SCRIPTS / "beatscape-earcheck.py")], args.dry_run)
    run([sys.executable, str(SCRIPTS / "beatscape-catalog-status.py"), "--stage", "6"], args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
