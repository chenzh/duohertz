#!/usr/bin/env python3
"""Build a local, hash-checked contact sheet for duohertz cover review."""

from __future__ import annotations

import html
import importlib.util
import sys
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "apps/beatscape/candidates/duohertz"
OUT = CANDIDATES / "cover-contact-sheet.html"
GENRES = ("Melodic House", "Synthwave", "Future Bass", "Drum & Bass", "Trance")


def load_candidates() -> list[dict]:
    source = ROOT / "scripts/duohertz-review-worksheet.py"
    spec = importlib.util.spec_from_file_location("duohertz_worksheet_for_contact_sheet", source)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load the candidate asset checker")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module.candidates(CANDIDATES)


def build() -> tuple[str, int]:
    tracks = load_candidates()
    sections: list[str] = []
    for genre in GENRES:
        group = [track for track in tracks if track["subgenre"] == genre]
        slug = genre.lower().replace(" ", "-").replace("&", "and")
        cards: list[str] = []
        for track in group:
            track_id = html.escape(track["track_id"], quote=True)
            title = html.escape(str(track["title"]))
            cover = f"{quote(track['track_id'], safe='')}/cover-art.png"
            cards.append(f'''<a class="card" href="review-worksheet.html#{track_id}">
  <span class="art"><img src="{cover}" width="160" height="160" loading="lazy" alt="{title} current cover candidate"><img class="mini" src="{cover}" width="56" height="56" loading="lazy" alt=""></span>
  <span class="number">{track_id}</span><strong>{title}</strong>
</a>''')
        sections.append(f'<section id="{slug}"><h2>{html.escape(genre)} <small>{len(group)} covers</small></h2><div class="grid">{"".join(cards)}</div></section>')

    nav = "".join(f'<a href="#{genre.lower().replace(" ", "-").replace("&", "and")}">{html.escape(genre)}</a>' for genre in GENRES)
    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>duohertz · cover consistency board</title>
<style>
  :root {{ color-scheme: dark; font: 15px/1.4 system-ui, sans-serif; }}
  body {{ max-width: 1220px; margin: auto; padding: 20px; background: #111421; color: #fff9ef; }}
  h1 {{ margin: 0; font-size: clamp(28px, 5vw, 44px); }}
  p {{ max-width: 76ch; color: #d2d5e1; }}
  nav {{ display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0 32px; }}
  nav a {{ padding: 8px 10px; border: 2px solid #67eee0; }}
  a {{ color: inherit; }}
  section {{ margin: 34px 0 50px; scroll-margin-top: 12px; }}
  h2 {{ border-bottom: 3px solid #f34d65; padding-bottom: 8px; font-size: 24px; }}
  h2 small {{ margin-left: 8px; color: #67eee0; font-size: 12px; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 12px; }}
  .card {{ min-width: 0; border: 2px solid #fff9ef; padding: 6px; background: #1b2031; text-decoration: none; }}
  .card:focus-visible {{ outline: 3px solid #67eee0; outline-offset: 3px; }}
  .art {{ position: relative; display: block; }}
  .art > img:first-child {{ display: block; width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; }}
  .mini {{ position: absolute; right: 3px; bottom: 3px; width: 56px; height: 56px; border: 2px solid #fff9ef; }}
  .number {{ display: block; margin-top: 6px; color: #67eee0; font: 700 10px/1.2 ui-monospace, monospace; overflow-wrap: anywhere; }}
  .card strong {{ display: block; margin-top: 3px; font-size: 12px; overflow-wrap: anywhere; }}
  @media (max-width: 520px) {{ body {{ padding: 14px; }} .grid {{ gap: 8px; }} }}
</style>
</head>
<body>
<h1>duohertz · cover consistency board</h1>
<p>{len(tracks)} current technical candidates. Compare full covers and 56px thumbnails within each electronic style; open a card for the hash-bound listening worksheet. This board records no review or release approval.</p>
<nav aria-label="Music styles">{nav}</nav>
{"".join(sections)}
</body>
</html>
'''
    return page, len(tracks)


def main() -> int:
    page, count = build()
    OUT.write_text(page, encoding="utf-8")
    print(f"Wrote {OUT} ({count} hash-checked current covers; review pending)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
