#!/usr/bin/env python3
"""Generate per-track radio request notes (World Bible §8 — call-in board).

Every track gets a fictional call-in from Scape City. These are story details,
not claims about the real recording's performers, samples, or production.
Hand-written pools rotate deterministically within each vibe.

Usage:
  python3 scripts/beatscape-track-requests.py            # write src/data JSON
  python3 scripts/beatscape-track-requests.py --check    # verify checked-in JSON
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
        "Chrome Yard, line two: 'The shutter's stuck again. Give us something to lift to.'",
        "TORQUE called from the van: 'One more flight of stairs. Tell JUNO she packed too many cables.'",
        "A caller has a job interview at nine. They'd like to feel brave for three minutes first.",
        "'For my sister's first gig. She's the drummer. I'm the one carrying everything.'",
        "The closing crew at the arcade has one machine left to move. This is their request.",
        "'My friend finally said no to a second shift. Play something for the walk out.'",
        "Someone in Night Grid is fixing a puncture under a streetlight. They're still listening.",
        "'We lost the match. We booked the court again for Thursday. Same song, please.'",
        "TORQUE's note: 'For the kid who stayed to help stack chairs. You can pick the next one.'",
        "A rehearsal room called. Their neighbors asked to turn it down, then asked for the title.",
        "'First night running the kitchen on my own. Dinner survived. So did I.'",
        "The station's kettle just tripped the breaker. JUNO would like a distraction.",
        "'For everyone waiting outside the venue with a ticket and absolutely no coat.'",
        "A courier in Slide District is off the clock and still halfway up the stairs.",
        "'My brother got his license back. We're celebrating on the bus.'",
        "Chrome Yard's garage radio only works if you hold the antenna. They've taken turns all evening.",
    ],
    "groove": [
        "'The laundromat's empty and my socks have another twelve minutes. Play this one.'",
        "A nurse on the late bus asked for something that doesn't remind her of an alarm.",
        "JUNO's note: 'For my downstairs neighbor, who returned the mug with coffee in it.'",
        "'We cleared a space between the tables. The mop can wait one song.'",
        "Glass Rim, line four: 'The lift's working. We're taking the stairs anyway.'",
        "'My dad says he doesn't dance. Please explain what he's doing while he washes up.'",
        "A barber in Pulse Core is closing late. The last customer gets to choose.",
        "'For the person who left a bowl of noodles outside the rehearsal room. We owe you.'",
        "TORQUE wants this on while he cooks. ATLAS wants him to stop using the good pan as a drum.",
        "'New apartment. Two chairs, no curtains. Housewarming starts now.'",
        "Someone called to dedicate this to their bus driver. They don't know his name yet.",
        "'For my partner. Eight years, and they still save me the corner piece.'",
        "The bakery's early crew has started work. Last Call is their breakfast show.",
        "'I fixed the jacket instead of buying a new one. It has terrible stitching. I love it.'",
        "JUNO found last week's shopping list in the request box. Bread, batteries, this song.",
        "'Our first rehearsal had three people and one working socket. We booked another.'",
    ],
    "night-drive": [
        "'Last fare dropped off. I'm parked by the river with the radio on.'",
        "ATLAS sent a request from the last train: 'Missed my stop. The roof can wait.'",
        "'For everyone who promised to call when they got home. Consider this your reminder.'",
        "A caller's moving out of Night Grid tomorrow. Tonight they're taking one last bus ride.",
        "'My daughter fell asleep before the bridge. Keep this one on until we're home.'",
        "The van's heater works on the passenger side only. TORQUE says he's fine. He is wearing two coats.",
        "'Waiting at arrivals. Her flight's late, but I haven't seen her in a year. I can wait.'",
        "Someone left an umbrella at the station. JUNO's keeping it by the door until they call.",
        "'Three of us, one back seat, too much gear. Worth it for the gig.'",
        "A night cleaner wants to hear this before the first train arrives and the floor gets dirty again.",
        "'For the bus route that takes forty minutes to do a ten-minute journey. I like the view.'",
        "ATLAS's note: 'For whoever replaced the broken shelter light. I can read the timetable now.'",
        "'We're pulled over for coffee. My friend has been telling the same story for two districts.'",
        "A caller on the footbridge says the station reaches the middle, then fades. They'll stay a minute.",
        "'First trip back since I moved away. The corner shop still knows my order.'",
        "JUNO missed the last bus while taking requests. TORQUE has gone back for her.",
    ],
    "chill": [
        "'Flatmate's asleep. Headphones on. First quiet hour I've had all week.'",
        "TORQUE's note: 'For anyone eating dinner out of the pan. You're doing fine.'",
        "'The cat's on my jacket. I guess I'm staying for another song.'",
        "A caller in Afterhours Lane finished a difficult letter. They haven't sent it yet.",
        "'For my mum. We don't have much to say on the phone lately, but we still call.'",
        "ATLAS left this request under a cup: 'No equipment talk for one song. Please.'",
        "'The shop's closed. The chairs are up. I'm keeping one down for a minute.'",
        "Someone's waiting for bread to rise. Last Call is keeping them company.",
        "'Didn't finish everything today. Putting the notebook away anyway.'",
        "JUNO's keeping a seat by the window for the caller who just got off work.",
        "'For the neighbor who waters my plants and pretends not to notice the dead one.'",
        "A student in Pulse Core has shut their laptop. The deadline can have them again in the morning.",
        "'It's raining on the fire escape. I don't need a dedication. Just let this play.'",
        "TORQUE asked for this after rehearsal. He put his sticks down before it started.",
        "'My friend came over to help me pack. We opened every box we meant to close.'",
        "'Back in town after a while. Nice to hear the station's still here.'",
    ],
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    catalog = json.loads(CATALOG.read_text())
    tracks = catalog["tracks"] if isinstance(catalog, dict) else catalog
    track_ids = [t["track_id"] for t in tracks]
    if len(set(track_ids)) != len(track_ids):
        raise SystemExit("catalog has duplicate track IDs")

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
        try:
            existing = json.loads(OUT.read_text())
        except (OSError, json.JSONDecodeError) as exc:
            raise SystemExit(f"cannot read request notes: {exc}") from exc
        if existing != notes:
            raise SystemExit("request notes are stale; run scripts/beatscape-track-requests.py")
        print(f"check OK: {len(notes)}/{len(tracks)} tracks covered; checked-in JSON matches")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(notes, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {len(notes)} notes -> {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
