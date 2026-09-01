#!/usr/bin/env python3
"""Generate per-track radio request notes (World Bible §8 — call-in board).

Every track gets one NIGHTSHIFT-flavored line: the "reason" JUNO reads on air
when The Listener requests it. Sentence pools are hand-written per vibe (no
per-track template mush); assignment rotates within each vibe so the same line
never lands on neighboring tracks.

Usage:
  python3 scripts/beatscape-track-requests.py            # write src/data JSON
  python3 scripts/beatscape-track-requests.py --check    # verify coverage only
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "apps" / "beatscape" / "public" / "catalog.json"
OUT = ROOT / "apps" / "beatscape" / "src" / "data" / "trackRequests.json"

POOLS: dict[str, list[str]] = {
    "battle": [
        "For the night the block needs a war drum, not a lullaby.",
        "Requested by TORQUE — he drums harder when this one's on.",
        "Three blocks went quiet on the same street. This is the answer.",
        "The Drop at 03:03 doesn't wait. Neither does this.",
        "Somebody in Chrome Yard asked for something loud. We delivered twice.",
        "Play it like the Grid is listening — it is.",
        "For every skyline that ever blinked first.",
        "The Hush hates this one. That's the whole review.",
        "Cue it when the streetlights start arguing back.",
        "Battle Call standard issue: kick first, questions later.",
        "One take, no net, full broadcast.",
        "Signed, sealed, cranked to the level the law allows. Barely.",
    ],
    "groove": [
        "SOLENN rates this one 'almost too clean'. From her, that's a love letter.",
        "Groove Hour opener material — the city walks differently to this.",
        "For the crosswalk that thinks it's a catwalk.",
        "DIZZ tried to solo over this and forgot to stop.",
        "Slip this on and even the elevators sway.",
        "Glass Rim keeps asking for it. We keep saying yes.",
        "Syncopated enough to trip the Hush's metronome.",
        "The bassline does the talking. The rest is agreeable.",
        "Requested by a nurse coming off night shift. This one's hers.",
        "For dancing like nobody's billing you by the hour.",
        "Groove Hour keeps this in rotation because you keep calling it in.",
        "Smooth is a decision. This one makes it easy.",
    ],
    "night-drive": [
        "For the late shift rolling home with the windows down.",
        "Wide mix, empty freeway, city in the mirror — that's the whole brief.",
        "ATLAS sequenced this one for the tunnel at exactly this speed.",
        "Requested by a cab driver who says the city hums back to this.",
        "Overnight Drive staple: headlights, low end, no small talk.",
        "For everyone still on the bridge at 3 a.m. — we see your high beams.",
        "The kind of song the streetlights sync to.",
        "Mile markers keep time better than a metronome. So does this.",
        "Put your hazards on for the drop, not for trouble.",
        "This one sounds like rain on glass that never lands.",
        "For the long way home, taken on purpose.",
        "MARLOW sampled an actual engine for this. You're welcome.",
    ],
    "chill": [
        "Last Call material — for when the amp hums louder than the crowd.",
        "For the stool by the window and whatever's left in the cup.",
        "Afterhours Lane holds its breath for this one.",
        "Quiet isn't the Hush. Quiet is this, on purpose.",
        "Requested for the walk home when you take the long stairs.",
        "JUNO signs off most nights with something like this.",
        "For practicing falsetto at nobody in particular.",
        "Low stakes, low lights, high fidelity.",
        "The city exhales on the two. Find it.",
        "For warming up, winding down, or both at once.",
        "Some blocks just want a lullaby with taste.",
        "Last Call, first pour — this one goes down easy.",
    ],
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    catalog = json.loads(CATALOG.read_text())
    tracks = catalog["tracks"] if isinstance(catalog, dict) else catalog

    groups: dict[str, list[dict]] = {}
    for t in tracks:
        groups.setdefault(t.get("vibe", "groove"), []).append(t)

    notes: dict[str, str] = {}
    for vibe, group in sorted(groups.items()):
        pool = POOLS.get(vibe)
        if not pool:
            raise SystemExit(f"no sentence pool for vibe: {vibe}")
        group.sort(key=lambda t: t["track_id"])
        for i, t in enumerate(group):
            notes[t["track_id"]] = pool[i % len(pool)]

    missing = [t["track_id"] for t in tracks if t["track_id"] not in notes]
    if missing:
        raise SystemExit(f"uncovered tracks: {missing}")

    if args.check:
        print(f"check OK: {len(notes)}/{len(tracks)} tracks covered")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(notes, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {len(notes)} notes -> {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
