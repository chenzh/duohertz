# BeatScape QA Audit Report

- Generated: 2026-08-24T22:59:05Z
- Input: `/Users/zhenhuachen/multica_workspaces/98f1c3f7-fc74-4ef5-8ea2-f4a5c7f395ab/775e3feb699e/worktree/apps/beatscape/public`
- Catalog: `/Users/zhenhuachen/multica_workspaces/98f1c3f7-fc74-4ef5-8ea2-f4a5c7f395ab/775e3feb699e/worktree/apps/beatscape/public/catalog.json`

## Summary

| PASS | WARN | FAIL |
|------|------|------|
| 155 | 49 | 0 |

## Human sign-off (required)

- [ ] Ear check — melody / drop / groove acceptable
- [ ] Gameplay — at least one full Arcade run, no unfair Miss clusters
- [ ] Theme — fits BeatScape city vibe

## Tracks

### Neon Pulse (`bs-s1-01`) — **WARN**
- ✅ `catalog.field` — `track_id` present
- ✅ `catalog.field` — `title` present
- ✅ `catalog.field` — `artist` present
- ✅ `catalog.field` — `genre` present
- ✅ `catalog.field` — `bpm` present
- ✅ `catalog.field` — `duration_sec` present
- ✅ `catalog.field` — `preset_id` present
- ✅ `catalog.field` — `engine` present
- ✅ `catalog.field` — `rights` present
- ✅ `catalog.field` — `theme` present
- ✅ `catalog.field` — `audio` present
- ✅ `catalog.field` — `charts` present
- ✅ `catalog.rights` — owned
- ✅ `catalog.theme` — beatscape
- ✅ `catalog.theme_kw` — theme keyword present
- ✅ `catalog.chart_path` — easy -> /catalog/bs-s1-01/easy.json
- ✅ `catalog.chart_path` — standard -> /catalog/bs-s1-01/standard.json
- ✅ `catalog.chart_path` — hard -> /catalog/bs-s1-01/hard.json
- ✅ `catalog.audio_path` — /catalog/bs-s1-01/audio.m4a
- ✅ `chart.total_notes` — 103
- ⚠️ `chart.density.nps` — nps=1.37 outside [2.0,3.5]
- ⚠️ `chart.density.peak_nps` — peak_2s=6.00 outside [0,5]
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [5,15]
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ✅ `chart.total_notes` — 150
- ⚠️ `chart.density.nps` — nps=2.00 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=6.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 358
- ⚠️ `chart.density.nps` — nps=4.59 outside [5.5,8.5]
- ✅ `chart.density.peak_nps` — peak_2s=11.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [15,30]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=1.87 outside [3,6]

### Glass Horizon (`bs-s1-02`) — **WARN**
- ✅ `catalog.field` — `track_id` present
- ✅ `catalog.field` — `title` present
- ✅ `catalog.field` — `artist` present
- ✅ `catalog.field` — `genre` present
- ✅ `catalog.field` — `bpm` present
- ✅ `catalog.field` — `duration_sec` present
- ✅ `catalog.field` — `preset_id` present
- ✅ `catalog.field` — `engine` present
- ✅ `catalog.field` — `rights` present
- ✅ `catalog.field` — `theme` present
- ✅ `catalog.field` — `audio` present
- ✅ `catalog.field` — `charts` present
- ✅ `catalog.rights` — owned
- ✅ `catalog.theme` — beatscape
- ✅ `catalog.theme_kw` — theme keyword present
- ✅ `catalog.chart_path` — easy -> /catalog/bs-s1-02/easy.json
- ✅ `catalog.chart_path` — standard -> /catalog/bs-s1-02/standard.json
- ✅ `catalog.chart_path` — hard -> /catalog/bs-s1-02/hard.json
- ✅ `catalog.audio_path` — /catalog/bs-s1-02/audio.m4a
- ✅ `chart.total_notes` — 31
- ⚠️ `chart.density.nps` — nps=0.41 outside [2.0,3.5]
- ✅ `chart.density.peak_nps` — peak_2s=3.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [5,15]
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ✅ `chart.total_notes` — 110
- ⚠️ `chart.density.nps` — nps=1.47 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=4.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 253
- ⚠️ `chart.density.nps` — nps=3.37 outside [5.5,8.5]
- ✅ `chart.density.peak_nps` — peak_2s=8.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [15,30]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [3,6]

### Night Drive 808 (`bs-s1-03`) — **WARN**
- ✅ `catalog.field` — `track_id` present
- ✅ `catalog.field` — `title` present
- ✅ `catalog.field` — `artist` present
- ✅ `catalog.field` — `genre` present
- ✅ `catalog.field` — `bpm` present
- ✅ `catalog.field` — `duration_sec` present
- ✅ `catalog.field` — `preset_id` present
- ✅ `catalog.field` — `engine` present
- ✅ `catalog.field` — `rights` present
- ✅ `catalog.field` — `theme` present
- ✅ `catalog.field` — `audio` present
- ✅ `catalog.field` — `charts` present
- ✅ `catalog.rights` — owned
- ✅ `catalog.theme` — beatscape
- ✅ `catalog.theme_kw` — theme keyword present
- ✅ `catalog.chart_path` — easy -> /catalog/bs-s1-03/easy.json
- ✅ `catalog.chart_path` — standard -> /catalog/bs-s1-03/standard.json
- ✅ `catalog.chart_path` — hard -> /catalog/bs-s1-03/hard.json
- ✅ `catalog.audio_path` — /catalog/bs-s1-03/audio.m4a
- ✅ `chart.total_notes` — 61
- ⚠️ `chart.density.nps` — nps=0.81 outside [2.0,3.5]
- ✅ `chart.density.peak_nps` — peak_2s=4.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [5,15]
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ✅ `chart.total_notes` — 89
- ⚠️ `chart.density.nps` — nps=1.19 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=4.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 211
- ⚠️ `chart.density.nps` — nps=2.71 outside [5.5,8.5]
- ✅ `chart.density.peak_nps` — peak_2s=7.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [15,30]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=1.07 outside [3,6]

### Velvet Afterhours (`bs-s1-04`) — **WARN**
- ✅ `catalog.field` — `track_id` present
- ✅ `catalog.field` — `title` present
- ✅ `catalog.field` — `artist` present
- ✅ `catalog.field` — `genre` present
- ✅ `catalog.field` — `bpm` present
- ✅ `catalog.field` — `duration_sec` present
- ✅ `catalog.field` — `preset_id` present
- ✅ `catalog.field` — `engine` present
- ✅ `catalog.field` — `rights` present
- ✅ `catalog.field` — `theme` present
- ✅ `catalog.field` — `audio` present
- ✅ `catalog.field` — `charts` present
- ✅ `catalog.rights` — owned
- ✅ `catalog.theme` — beatscape
- ✅ `catalog.theme_kw` — theme keyword present
- ✅ `catalog.chart_path` — easy -> /catalog/bs-s1-04/easy.json
- ✅ `catalog.chart_path` — standard -> /catalog/bs-s1-04/standard.json
- ✅ `catalog.chart_path` — hard -> /catalog/bs-s1-04/hard.json
- ✅ `catalog.audio_path` — /catalog/bs-s1-04/audio.m4a
- ✅ `chart.total_notes` — 65
- ⚠️ `chart.density.nps` — nps=0.76 outside [2.0,3.5]
- ✅ `chart.density.peak_nps` — peak_2s=3.00
- ✅ `chart.density.hold_pct` — hold_pct=14.04
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ✅ `chart.total_notes` — 90
- ⚠️ `chart.density.nps` — nps=1.09 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=3.00
- ⚠️ `chart.density.hold_pct` — hold_pct=9.76 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 189
- ⚠️ `chart.density.nps` — nps=2.52 outside [5.5,8.5]
- ✅ `chart.density.peak_nps` — peak_2s=6.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [15,30]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [3,6]

### Voltage Drop (`bs-s1-05`) — **WARN**
- ✅ `catalog.field` — `track_id` present
- ✅ `catalog.field` — `title` present
- ✅ `catalog.field` — `artist` present
- ✅ `catalog.field` — `genre` present
- ✅ `catalog.field` — `bpm` present
- ✅ `catalog.field` — `duration_sec` present
- ✅ `catalog.field` — `preset_id` present
- ✅ `catalog.field` — `engine` present
- ✅ `catalog.field` — `rights` present
- ✅ `catalog.field` — `theme` present
- ✅ `catalog.field` — `audio` present
- ✅ `catalog.field` — `charts` present
- ✅ `catalog.rights` — owned
- ✅ `catalog.theme` — beatscape
- ✅ `catalog.theme_kw` — theme keyword present
- ✅ `catalog.chart_path` — easy -> /catalog/bs-s1-05/easy.json
- ✅ `catalog.chart_path` — standard -> /catalog/bs-s1-05/standard.json
- ✅ `catalog.chart_path` — hard -> /catalog/bs-s1-05/hard.json
- ✅ `catalog.audio_path` — /catalog/bs-s1-05/audio.m4a
- ✅ `chart.total_notes` — 87
- ⚠️ `chart.density.nps` — nps=1.45 outside [2.0,3.5]
- ⚠️ `chart.density.peak_nps` — peak_2s=6.00 outside [0,5]
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [5,15]
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ✅ `chart.total_notes` — 126
- ⚠️ `chart.density.nps` — nps=2.10 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=6.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 301
- ⚠️ `chart.density.nps` — nps=4.83 outside [5.5,8.5]
- ✅ `chart.density.peak_nps` — peak_2s=12.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [15,30]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=1.83 outside [3,6]

### Chrome Riff (`bs-s1-06`) — **WARN**
- ✅ `catalog.field` — `track_id` present
- ✅ `catalog.field` — `title` present
- ✅ `catalog.field` — `artist` present
- ✅ `catalog.field` — `genre` present
- ✅ `catalog.field` — `bpm` present
- ✅ `catalog.field` — `duration_sec` present
- ✅ `catalog.field` — `preset_id` present
- ✅ `catalog.field` — `engine` present
- ✅ `catalog.field` — `rights` present
- ✅ `catalog.field` — `theme` present
- ✅ `catalog.field` — `audio` present
- ✅ `catalog.field` — `charts` present
- ✅ `catalog.rights` — owned
- ✅ `catalog.theme` — beatscape
- ✅ `catalog.theme_kw` — theme keyword present
- ✅ `catalog.chart_path` — easy -> /catalog/bs-s1-06/easy.json
- ✅ `catalog.chart_path` — standard -> /catalog/bs-s1-06/standard.json
- ✅ `catalog.chart_path` — hard -> /catalog/bs-s1-06/hard.json
- ✅ `catalog.audio_path` — /catalog/bs-s1-06/audio.m4a
- ✅ `chart.total_notes` — 86
- ⚠️ `chart.density.nps` — nps=1.15 outside [2.0,3.5]
- ✅ `chart.density.peak_nps` — peak_2s=4.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [5,15]
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ✅ `chart.total_notes` — 123
- ⚠️ `chart.density.nps` — nps=1.64 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=5.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 294
- ⚠️ `chart.density.nps` — nps=3.77 outside [5.5,8.5]
- ✅ `chart.density.peak_nps` — peak_2s=9.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [15,30]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=1.47 outside [3,6]
