# BeatScape QA Audit Report

- Generated: 2026-08-24T21:23:35Z
- Input: `/Users/zhenhuachen/Desktop/MusicSaas/apps/beatscape/public`
- Catalog: `/Users/zhenhuachen/Desktop/MusicSaas/apps/beatscape/public/catalog.json`

## Summary

| PASS | WARN | FAIL |
|------|------|------|
| 155 | 47 | 2 |

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
- ✅ `chart.total_notes` — 87
- ⚠️ `chart.density.nps` — nps=1.16 outside [2.0,3.5]
- ✅ `chart.density.peak_nps` — peak_2s=3.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [5,15]
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ✅ `chart.total_notes` — 172
- ⚠️ `chart.density.nps` — nps=2.29 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=6.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 723
- ⚠️ `chart.density.nps` — nps=9.16 outside [5.5,8.5]
- ⚠️ `chart.density.peak_nps` — peak_2s=22.00 outside [0,12]
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [15,30]
- ✅ `chart.density.chord_10s` — chord_per_10s=4.80

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
- ✅ `chart.total_notes` — 64
- ⚠️ `chart.density.nps` — nps=0.85 outside [2.0,3.5]
- ✅ `chart.density.peak_nps` — peak_2s=2.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [5,15]
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ✅ `chart.total_notes` — 127
- ⚠️ `chart.density.nps` — nps=1.69 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=4.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 506
- ✅ `chart.density.nps` — nps=6.75
- ⚠️ `chart.density.peak_nps` — peak_2s=16.00 outside [0,12]
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
- ✅ `chart.total_notes` — 51
- ⚠️ `chart.density.nps` — nps=0.68 outside [2.0,3.5]
- ✅ `chart.density.peak_nps` — peak_2s=2.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [5,15]
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ✅ `chart.total_notes` — 102
- ⚠️ `chart.density.nps` — nps=1.36 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=4.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 428
- ⚠️ `chart.density.nps` — nps=5.43 outside [5.5,8.5]
- ⚠️ `chart.density.peak_nps` — peak_2s=14.00 outside [0,12]
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [15,30]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=2.80 outside [3,6]

### Velvet Afterhours (`bs-s1-04`) — **FAIL**
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
- ❌ `chart.total_notes` — declared 51 != counted 48
- ⚠️ `chart.density.nps` — nps=0.64 outside [2.0,3.5]
- ✅ `chart.density.peak_nps` — peak_2s=2.00
- ✅ `chart.density.hold_pct` — hold_pct=6.25
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ❌ `chart.total_notes` — declared 102 != counted 94
- ⚠️ `chart.density.nps` — nps=1.25 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=3.00
- ⚠️ `chart.density.hold_pct` — hold_pct=8.51 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 377
- ⚠️ `chart.density.nps` — nps=5.03 outside [5.5,8.5]
- ✅ `chart.density.peak_nps` — peak_2s=12.00
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
- ✅ `chart.total_notes` — 73
- ⚠️ `chart.density.nps` — nps=1.22 outside [2.0,3.5]
- ✅ `chart.density.peak_nps` — peak_2s=3.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [5,15]
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ✅ `chart.total_notes` — 145
- ⚠️ `chart.density.nps` — nps=2.42 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=6.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 610
- ⚠️ `chart.density.nps` — nps=9.65 outside [5.5,8.5]
- ⚠️ `chart.density.peak_nps` — peak_2s=24.00 outside [0,12]
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [15,30]
- ✅ `chart.density.chord_10s` — chord_per_10s=5.17

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
- ✅ `chart.total_notes` — 71
- ⚠️ `chart.density.nps` — nps=0.95 outside [2.0,3.5]
- ✅ `chart.density.peak_nps` — peak_2s=3.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [5,15]
- ✅ `chart.density.chord_10s` — chord_per_10s=0.00
- ✅ `chart.total_notes` — 142
- ⚠️ `chart.density.nps` — nps=1.89 outside [3.5,5.5]
- ✅ `chart.density.peak_nps` — peak_2s=5.00
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [10,25]
- ⚠️ `chart.density.chord_10s` — chord_per_10s=0.00 outside [1,3]
- ✅ `chart.total_notes` — 597
- ✅ `chart.density.nps` — nps=7.56
- ⚠️ `chart.density.peak_nps` — peak_2s=18.00 outside [0,12]
- ⚠️ `chart.density.hold_pct` — hold_pct=0.00 outside [15,30]
- ✅ `chart.density.chord_10s` — chord_per_10s=4.00
