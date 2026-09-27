#!/usr/bin/env python3
"""Verify an assembled duohertz site directory locally without deployment."""

from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
import shutil

SOURCE = Path(__file__).with_name("duohertz-assemble-release.py")
SPEC = importlib.util.spec_from_file_location("duohertz_release_assembler_for_verify", SOURCE)
assert SPEC and SPEC.loader
ASSEMBLER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ASSEMBLER)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--site", required=True, type=Path,
                        help="Previously assembled local duohertz site directory")
    args = parser.parse_args()
    try:
        report = ASSEMBLER.verify_release(args.site)
    except (OSError, UnicodeError, ValueError, TypeError, KeyError, shutil.Error) as error:
        print(json.dumps({"site_package_integrity_verified": False, "error": str(error)},
                         ensure_ascii=False, indent=2))
        return 1
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
