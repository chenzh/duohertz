#!/usr/bin/env python3
"""Limit ACE-Step uv required-environments to macOS arm64 only."""
from pathlib import Path

p = Path.home() / "workers/ACE-Step-1.5/pyproject.toml"
text = p.read_text()
start = text.index("required-environments = [")
end = text.index("]", start) + 1
new_block = """required-environments = [
    "sys_platform == 'darwin' and platform_machine == 'arm64'",
]"""
p.write_text(text[:start] + new_block + text[end:])
print("patched", p)
