# PRD: NeonBeat — AI-Powered Web Rhythm Game Studio

**Browser-native rhythm game + AI music pipeline for creators and studios**

| Field | Value |
|-------|-------|
| Product Name | **NeonBeat** (working title) |
| Document Version | **v1.3** |
| Status | Draft for customer review |
| Date | 2026-08-23 |
| Parent Platform | [MusicSaas](https://github.com/chenzh/MusicSaas) — Local AI Music Generation API |
| Audience | English-speaking customers: indie game studios, rhythm-game creators, educators, brand marketers |
| Delivery Form | Web application (SPA), no install required |

### Revision History

| Version | Date | Notes |
|---------|------|-------|
| v1.0 | 2026-08-23 | Initial PRD derived from MusicSaas rhythm-game creative presets and web game design |
| **v1.1** | 2026-08-23 | Added browser rhythm-game competitive benchmark; expanded gameplay (holds, mods, modes, feedback, auto-chart tiers) |
| **v1.2** | 2026-08-23 | **Benchmark scope locked to browser-only** — English-market web games; explicit do/don't benchmark matrix; removed desktop/VR/non-rhythm comparables |
| **v1.3** | 2026-08-23 | **Fun-quality acceptance suite** — instant-play hook, chart–audio sync, juice/feedback bar, playtest survey gates; aligned specs with `apps/neonbeat/` MVP |

---

## 0. Executive Summary

**NeonBeat** is a **browser-only** rhythm game studio: create AI-original music, auto-chart it, and play in Chrome — no install, no copyrighted uploads.

**English-market pitch:**

> *Familiar to **Web osu!mania** players. As approachable as **FNF in the browser**. Every song is AI-original via MusicSaas.*

```text
Pick preset → AI generates track → Auto-chart (3 tiers) → Play in browser → Share URL
```

**MVP promise:** Pick *Chart Main @ 160 BPM* → wait for generation → play a 4-lane chart (tap + hold) in the browser → share a link. Zero install.

**What we benchmark (browser only):** Web osu!mania (gameplay), FNF HTML5 (casual/HP), Rhythm Plus (4K VSRG patterns), Bemuse (tutorial/hitsounds polish).

**What we do NOT benchmark:** Desktop osu! client, Beat Saber, StepMania, VR titles, or million-song UGC libraries — out of scope and unrealistic for MVP.

**Strategic fit:** NeonBeat is the playable product layer on MusicSaas. MusicSaas = B2B API; NeonBeat = proof-of-play for English-speaking studios and integrators.

---

## 1. Problem & Opportunity

### 1.1 Market Pain

| Stakeholder | Pain Today | NeonBeat Answer |
|-------------|------------|-----------------|
| **Indie studios** | Custom rhythm tracks + charting cost weeks and require audio engineers | AI BGM in ~1–3 min; semi-auto charting |
| **Content creators** | Can't legally ship fan charts over popular songs | Original AI tracks with clear license path (ACE-Step MIT + SA3 Community) |
| **Educators / workshops** | Rhythm-game demos need install + asset prep | Zero-install URL; works on Chromebook / iPad |
| **Brands / events** | Want interactive music experiences at booths | Kiosk mode + branded neon UI |
| **MusicSaas integrators** | API value is abstract without a playable outcome | Live demo that *is* the product |

### 1.2 Competitive Landscape — Browser Rhythm Games Only

> **Scope rule:** Every competitor in this PRD runs in a **web browser without install**. Desktop clients, VR, and native apps are **reference-only** and must not appear as MVP benchmarks.

#### English web popularity (what players actually know)

| Tier | Game | EN web traffic / mindshare | Role for NeonBeat |
|------|------|---------------------------|-------------------|
| **P0 — Primary** | **Web osu!mania** (webosumania.com) | High among EN rhythm players who want 4K in-browser | **Main gameplay benchmark** — keys, holds, judging, mods |
| **P0 — Primary** | **FNF (HTML5 mirrors)** | Very high in EN meme/streamer/casual circles | **Onboarding + Arcade HP** benchmark — low barrier, fail state |
| **P1 — Secondary** | **Rhythm Plus** (rhythm-plus.com) | Medium; active EN Discord, international VSRG crowd | 4K downscroll, time-based judge, tier clone, share links |
| **P1 — Secondary** | **osu!web** (osu.ppy.sh) | High brand awareness in EN | **Discovery UX only** — not a full in-browser play benchmark |
| **P2 — Polish ref** | **Bemuse** (bemuse.ninja) | Medium; EN hardcore rhythm niche | Tutorial flow, hitsounds, lane juice — not 7K layout |

#### Out of benchmark scope (do not cite in MVP specs)

| Excluded | Why |
|----------|-----|
| Desktop osu! / osu!lazer | Not browser; ranked play + UGC scale unreachable |
| Beat Saber, Etterna, StepMania desktop | Not browser |
| StepFever, Taiko Web | Browser, but **low EN mindshare** and different input model (arrows/drum) |
| Suno, Udio, generic AI APIs | Not rhythm **games** |
| Incredibox, Patatap, Beepbox | Browser music toys — **onboarding inspiration only**, not chart gameplay |

**Differentiation (one line):** The only **browser rhythm game** with **AI-original music + auto-chart** — not another beatmap importer.

### 1.3 Browser Benchmark Detail (P0 + P1 only)

#### P0-A — Web osu!mania ← **primary gameplay target**

| Field | Detail |
|-------|--------|
| URL | https://webosumania.com |
| Input | 4K `D F J K`; touch; gamepad |
| Loop | Find/import beatmap → play → local high score |
| Copy for NeonBeat | Hold notes (LN), V2-style scoring feel, speed mods, SV awareness (defer), calibration expectation |
| Do **not** copy | Beatmap search at osu! scale, `.osu` library size, ranked multiplayer |

#### P0-B — FNF (HTML5) ← **primary casual target**

| Field | Detail |
|-------|--------|
| URL | Official / Newgrounds HTML5 ports and mirrors |
| Input | 4 arrows; keyboard >> touch |
| Loop | Story battle → hit arrows → survive HP bar |
| Copy for NeonBeat | First-run ease, HP fail tension (Arcade mode), streamer-friendly sessions |
| Do **not** copy | Arrow-column layout (we stay 4-lane), mod/IP ecosystem, week-based campaign |

#### P1-A — Rhythm Plus

| Field | Detail |
|-------|--------|
| URL | https://v2.rhythm-plus.com |
| Input | 4K `D F J K`; mobile tap on receptor |
| Loop | Community song → play → share / favorite |
| Copy for NeonBeat | Time-based judging, hold LNs, Easy/Std/Hard clone sheets, share URL, song-select UX |
| Do **not** copy | Full manual editor (MVP), accounts/cloud sync, 3D modes |

#### P1-B — osu!web (brand only)

| Field | Detail |
|-------|--------|
| URL | https://osu.ppy.sh |
| Role | English players recognize the brand; web is browse/replay/discovery |
| Copy for NeonBeat | Trust signal in marketing ("osu!-family mechanics") |
| Do **not** copy | Implies global ranked play or desktop-level feature parity |

#### P2 — Bemuse (polish reference)

| Field | Detail |
|-------|--------|
| URL | https://bemuse.ninja |
| Copy for NeonBeat | Tutorial tone, lane hitsounds, judgment feedback density |
| Do **not** copy | 7-key + scratch layout |

### 1.4 Benchmark Matrix — Do vs Don't (locked for MVP)

| Capability | Benchmark? | Source | MVP target |
|------------|------------|--------|------------|
| 4-lane downscroll, `D F J K` | ✅ Yes | Web osu!mania, Rhythm Plus | Ship |
| Tap + Hold (LN) | ✅ Yes | Web osu!mania, Rhythm Plus | Ship |
| Time-based hit judge (not pixel) | ✅ Yes | Rhythm Plus | Ship |
| Calibration + offset | ✅ Yes | Web osu!mania | Ship |
| Casual speed mod 0.75–1.25× | ✅ Yes | Web osu!mania | Casual only |
| HP fail mode | ✅ Yes | FNF HTML5 | Arcade mode |
| Auto-chart 3 tiers, same audio | ✅ Yes | NeonBeat unique | Ship |
| AI-original music pipeline | ✅ Yes | NeonBeat unique | Ship |
| Share link read-only play | ✅ Yes | Rhythm Plus | Ship |
| Wired headphone onboarding | ✅ Yes | All P0 web games (latent) | Ship |
| Global ranked leaderboard | ❌ No | Desktop osu! | v1.2+ |
| Million-song UGC library | ❌ No | osu! ecosystem | Never MVP |
| `.osu` beatmap import | ❌ No | Web osu!mania | v1.1 optional |
| 7-key / scratch / taiko / DDR | ❌ No | Bemuse, Taiko Web, StepFever | Out of product |
| VR / native app | ❌ No | Beat Saber etc. | Out of product |
| User MP3 upload charting | ❌ No | Various tools | Out of MVP (legal) |
| Full manual chart editor | ❌ No | Rhythm Plus | v1.1 |
| Per-note keysound sampling | ❌ No | Bemuse | v1.1 |

### 1.5 Cross-Game Patterns → NeonBeat (browser-sourced only)

| Pattern | Web source | NeonBeat MVP |
|---------|------------|--------------|
| Headphones + calibration | Web osu!mania, Rhythm Plus | First-run wizard |
| 4-key default `D F J K` | Web osu!mania, Rhythm Plus | Default; remappable |
| Hold notes | Web osu!mania, Rhythm Plus | Ship |
| Time-based judging | Rhythm Plus | Required |
| Speed mods | Web osu!mania | Casual only |
| HP fail vs no-fail | FNF HTML5 vs Web osu!mania casual | Arcade vs Casual |
| Multi-difficulty clone chart | Rhythm Plus | Easy / Std / Hard client-side |
| Share URL | Rhythm Plus | `?chart={id}` |
| Low-pressure first touch | FNF HTML5 | **Instant Demo** → Casual Standard; outer lanes = kick/snare |
| Lane hitsounds (not full keysound) | Bemuse (simplified) | MVP: lane-pitched SFX + noise burst |
| **Time-to-fun** | FNF / mobile hyper-casual | Playable notes ≤ 8 s from landing CTA |
| **Drop as reward** | EDM games / FNF climax | First `drop` section ≤ 10 s after GO |

### 1.6 Strategic Position (browser market only)

```text
         High setup (import maps / accounts)
                      ▲
                      │  Web osu!mania · Rhythm Plus
                      │
   Import songs ◄─────┼─────► AI-generated songs
                      │              ▲
                      │         NeonBeat
                      ▼
         Low setup (URL → play)
```

NeonBeat wins the **bottom-right**: zero import, AI track, instant URL play. It must still **feel** like the bottom-left quadrant (Web osu!mania / Rhythm Plus) when fingers hit the keys.

---

## 2. Product Vision & Positioning

### 2.1 Vision Statement

> **Turn any musical idea into a playable rhythm experience — in the browser, in under five minutes.**

### 2.2 One-Liner (for English customers)

> **NeonBeat** — *Web osu!mania feel, FNF ease, AI-original songs.* Browser 4-key rhythm game powered by MusicSaas.

### 2.3 Product Boundaries

| In Scope (MVP) | Out of Scope (MVP) |
|----------------|-------------------|
| 4-lane falling-note gameplay (keyboard + touch) | Full manual chart editor (note-by-note placement) |
| **Tap + Hold notes** (LN head/tail) | Slide / swipe notes |
| **Casual + Arcade play modes** | Online ranked leaderboards |
| **Speed mod 0.75×–1.25×** (Casual only) | SV / scroll-velocity gimmick maps |
| **Calibration wizard** + offset persistence | Gamepad / dance-pad drivers |
| **3 auto-chart difficulties** (Easy / Standard / Hard) | User-uploaded MP3 charting |
| AI music via MusicSaas `game_bgm` + `game_theme_vocal` | Account system / cloud save |
| Preset-driven creation (6 rhythm presets) | Multiplayer / versus |
| Session-based chart storage + share link | VR / controller-native builds |
| Lane hitsounds + judgment popups | Per-note keysound sampling (Bemuse-style) |
| Neon arcade visual theme | Mobile native apps |
| Remappable keys (default `D F J K`) | Desktop `.osu` import |
| English UI (primary) + optional zh-CN | 7-key / scratch / taiko / DDR arrow modes |

### 2.4 Relationship to MusicSaas

```text
┌─────────────────────────────────────────────────────────────┐
│  NeonBeat (Web Rhythm Game)          ← This PRD             │
│  · Play / Chart / Share                                       │
│  · Creator presets & kiosk mode                               │
├─────────────────────────────────────────────────────────────┤
│  MusicSaas Gateway + Demo BFF                                 │
│  · POST /v1/jobs  ·  polling  ·  audio download               │
├─────────────────────────────────────────────────────────────┤
│  Inference Workers (Mac MLX)                                  │
│  · ACE-Step 1.5 → game_theme_vocal (Rhythm OP)               │
│  · Stable Audio 3 → game_bgm (charts, song select, climax)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Target Users (English Market)

### 3.1 Primary Personas

| Persona | Profile | Job-to-be-Done | Success Signal |
|---------|---------|----------------|----------------|
| **Alex — Indie Studio Lead** | 3-person team building a mobile rhythm spin-off | Validate "AI BGM → chart → feel" before committing art budget | Exports WAV + chart JSON for Unity prototype |
| **Jordan — Content Creator** | YouTube/TikTok, 50K subs, EN-first audience | Record a "I made a game in 5 min" video | Shareable play URL with custom neon skin |
| **Sam — University Lecturer** | Game design course, 30 students | Run a 90-min lab without IT installs | 30 concurrent browser sessions on lab Wi-Fi |
| **Riley — Brand Event Producer** | Agency running arcade-style activations | Branded song-select screen at a conference booth | Kiosk mode + logo overlay |

### 3.2 Secondary Personas

- **MusicSaas API evaluators** — need a playable reference integration
- **Rhythm-game hobbyists** — want chill/hardcore charts without piracy risk

---

## 4. Core Experience

### 4.1 User Journey (Happy Path)

```text
Landing → Pick preset (e.g. "Chart Main") → Tune tags (160 BPM, neon, loop-friendly)
    → Generate (MusicSaas job) → Auto-chart → Song Select preview
    → Play (4-lane) → Results (score, grade, combo) → Share link / Download WAV
```

**Time budget (MVP):**

| Step | Target |
|------|--------|
| Landing → preset selected | ≤ 30 s |
| AI generation (SA3 BGM, 60–90 s clip) | ≤ 3 min (warm MLX) |
| Auto-chart + load gameplay | ≤ 15 s |
| First playable chart | ≤ 4 min total |

### 4.2 Gameplay Design

Design target: **Web osu!mania gameplay + FNF Casual/Arcade tension + Rhythm Plus time-judge** — on AI-original MusicSaas tracks. No desktop/VR parity claims.

#### 4.2.1 Core Mode: **Neon Lanes** (4K VSRG)

| Element | Specification | Rationale (benchmark) |
|---------|---------------|----------------------|
| Lanes | 4 columns, scroll **down** (upscroll = v1.1) | Matches Web osu!mania / Rhythm Plus default |
| Default keys | `D` `F` `J` `K` → lanes 1–4 | Industry default across Tier A |
| Touch | Tap receptor line per lane; hold = press & hold | Rhythm Plus mobile pattern |
| Receptor | Fixed white hit line at bottom 15% of playfield | Rhythm Plus wiki convention |
| Scroll speed | **Approach rate (AR)** per tier: Easy 22 / Std 28 / Hard 34 (MVP tuned for readability) | Web osu!mania / Rhythm Plus |
| Lane semantics (demo) | Lane 0 = kick · Lane 3 = snare · Lanes 1–2 = melody/hats | FNF outer-column clarity |
| Chart segment | 60–90 s playable window from AI output | Fits SA3 generation length |
| Audio sync | **Time-based** judgment using `AudioContext.currentTime` | Rhythm Plus V2 — speed mods must not break accuracy |

#### 4.2.2 Note Types

| Type | Visual | Input | MVP |
|------|--------|-------|-----|
| **Tap** | Filled circle / neon diamond | Press key on receptor overlap | ✅ |
| **Hold (LN)** | Body bar + head circle + tail release marker | Press at head; **hold** until tail passes receptor; release | ✅ |
| **Chord** | 2+ simultaneous taps (max 3 notes/frame) | Press all lanes within 15 ms | ✅ (auto-chart only) |
| **Slide** | Curved trail between lanes | Swipe or sequential tap | ❌ v1.1 |
| **Mine** | Anti-note (gray) | Do **not** press | ❌ v1.2 |

**Hold rules (aligned with Web osu!mania / Rhythm Plus):**

- Head judged like a tap (Perfect/Great/Good/Miss).
- Tail release judged ±45 ms (Great) / ±80 ms (Good); early release = Miss on tail only.
- Hold body awards tick score every 1/4 beat while held (optional; MVP: head + tail only).
- Auto-chart: generate holds on sustained energy ≥ 400 ms with stable pitch band.

#### 4.2.3 Judgment Windows

All windows measured in **milliseconds from note time** (not screen position).

| Judgment | Window (±ms) — **Arcade / Practice** | Window (±ms) — **Casual** | Score (tap) | Feedback |
|----------|-----------------------------------|--------------------------|-------------|----------|
| **Perfect** | 22 | 38 | 300 | Gold burst + particles + micro screen shake |
| **Great** | 45 | 72 | 200 | Lane-color burst + "GREAT" |
| **Good** | 80 | 115 | 100 | Green + "GOOD" |
| **Miss** | beyond Good window | beyond Good window | 0 | Red flash + combo break SFX |

> **Casual** uses wider windows so first-time players feel competent (FNF benchmark). **Arcade** keeps tight osu!mania-style timing for challenge streams.

**Combo & multiplier** (Web osu!mania V2–inspired, simplified):

| Combo streak | Multiplier |
|--------------|------------|
| 0–49 | ×1 |
| 50–99 | ×2 |
| 100–199 | ×3 |
| 200+ | ×4 (cap) |

**Grades** (by weighted accuracy %):

| Grade | Accuracy | Extra badge |
|-------|----------|-------------|
| **S** | ≥ 95% | — |
| **A** | ≥ 90% | — |
| **B** | ≥ 80% | — |
| **C** | ≥ 70% | — |
| **D** | < 70% | — |
| **FC** | 100% + no Miss | Full Combo overlay on any grade |

#### 4.2.4 Play Modes

| Mode | Fail state | Speed mod | Target user | Reference |
|------|------------|-----------|-------------|-----------|
| **Casual** | None — always finish song | 0.75× / 1.0× / 1.25× | First-time, kiosk, classrooms | FNF HTML5 low pressure |
| **Arcade** | **HP bar** — Miss drains HP; empty = fail | 1.0× only | Streamers, challenge | FNF HTML5 survival |
| **Practice** | No fail; **auto-slow** after 3 Miss (0.5× for 5 s) | 0.5×–1.0× | Learning a new AI chart | Web osu!mania no-fail practice |

**Arcade HP rules:**

- Start 100 HP; Perfect +2 · Great +1 · Good 0 · Miss −7 · Hold tail miss −5.
- Fail → retry prompt or downgrade to Casual (no rank penalty — no ranks in MVP).

#### 4.2.5 Modifiers & Settings (MVP)

| Setting | Options | Notes |
|---------|---------|-------|
| Key remap | Any 4 keys | Persisted `localStorage` |
| Global offset | −200 ms … +200 ms | Calibration wizard sets default |
| Scroll speed bias | −15% … +15% on top of AR | Does not affect judgment |
| Hitsounds | On / Off | Lane tap samples + judgment tier pitch |
| Fancy FX | On / Off | Disable particles for low-end Chromebooks |
| Downscroll | On (default) | Upscroll deferred |

#### 4.2.6 Onboarding & Calibration (first run)

Mirrors Web osu!mania offset flow + Bemuse tutorial pacing:

1. **Headphone prompt** — "Use wired headphones for best accuracy" (skippable).
2. **Tap test** — 8 metronome beats @ 120 BPM; measure median early/late → suggest offset.
3. **Hold tutorial** — 4-beat LN on lane 2 only (skippable for returning users).
4. **First chart** — **Instant Demo** (`mg-chart-main` @ Standard Casual) OR `mg-chill` @ Easy via Create Studio.

#### 4.2.7 Feedback & Juice

| Event | Visual | Audio |
|-------|--------|-------|
| Tap Perfect | Lane flash + particle burst | High-pitched hit |
| Hold sustain | Lane glow pulse per 1/4 beat | Soft tick |
| Combo break | Screen edge red vignette 200 ms | Break SFX |
| Combo milestone (25/50/100/200) | Center zoom banner + combo fire | Subtle cheer SFX (v1.1) |
| Song section change (drop) | Full-screen `DROP!` flash + pink vignette | Riser + denser drums (demo timeline) |
| Kick on downbeat | Playfield kick-pulse (inset glow) | Kick sample ducking bass |
| Note approach | Vertical light trail receptor → note | — |
| First 6 s play | Bottom tutorial chip: `D` kick · `K` snare | — |

#### 4.2.8 Fun Design Principles (P0 — “actually fun”)

These are **product requirements**, not polish nice-to-haves. If any P0 fun gate fails in playtest, ship is blocked.

| Principle | Player feeling | Design lever |
|-----------|--------------|--------------|
| **Instant hook** | “I’m playing music in seconds” | `Play Now` skips song-select; 2-beat countdown; notes ≤ 8 s after CTA |
| **Body before brain** | “My hands know what to do” | Outer lanes = kick/snare first; inner lanes only after bar 8 |
| **Reward clock** | “Something big is coming” | Riser + chart density ramp → **Drop ≤ 10 s** after GO on demo |
| **Hit = candy** | “That felt good” | Particles + lane flash + pitched hitsound < 50 ms after input |
| **Forgiveness first** | “I’m not failing, I’m learning” | Casual default; no HP; wider judge windows |
| **One more try** | “Again.” | Results → Replay ≤ 2 taps; demo loop ≤ 48 s |
| **Sync trust** | “The game isn’t lying” | Demo uses **single timeline** for audio + chart (shared beat index) |

**Anti-patterns (reject in QA):**

- \> 15 s of empty scroll before first hittable note  
- Chart dense while audio is sparse (or vice versa) on downbeats  
- Stuck on `Loading…` / `GO!` with no audio (clock desync)  
- Only lane 0–3 alternating with no relation to kick/snare  
- Arcade HP fail on first Casual-target playtest cohort  

#### 4.2.9 Difficulty Tiers

Two axes: **preset** (music character) × **chart density** (auto-chart profile).

**Preset axis** (music generation — unchanged):

| Preset ID | Label | BPM | Music character |
|-----------|-------|-----|-----------------|
| `mg-chill` | Chill Chart | 120 | Soft, low energy |
| `mg-chart-main` | Chart Main | 160 | Default EDM |
| `mg-climax` | Climax Drop | 170 | Build-up + drop |
| `mg-hardcore` | Hardcore Chart | 180 | Dense drums |
| `mg-song-select` | Song Select | — | Menu loop (non-playable) |
| `mg-theme-vocal` | Rhythm OP | — | Vocal + sparse chart |

**Chart density axis** (same audio, re-chart client-side — Rhythm Plus "clone sheet" pattern):

| Chart tier | Notes/s (avg) | Hold ratio | Chord cap | AR |
|------------|---------------|------------|-----------|-----|
| **Easy** | 1.0–1.5 | 10% | 0 | 22 |
| **Standard** | 2.5–3.5 | 20% | 1/frame | 28 |
| **Hard** | 4.5–6.0 | 25% | 2/frame | 34 |

**Demo / Instant Play profile (`mg-chart-main`, offline timeline):**

| Segment | Start (beats @ 160 BPM) | Chart feel | Audio feel |
|---------|-------------------------|------------|------------|
| Intro | 4–8 | `D` / `K` alternation only | Kick + snare dry |
| Build | 8–16 | Offbeat inner lanes | Hats enter |
| Rise | 16–24 | Holds + jumps | Riser sweep |
| **Drop** | **24+** (~6 s post-GO) | Streams, chords, jacks | Full EDM stack |
| Break | 56–64 | Sparse recovery | Half-energy |
| Drop 2 | 64+ | Repeat peak density | Second climax |
| Outro | last 12 beats | Outer-lane only | Fade |

> Demo duration capped at **48 s** for replay loop. Production AI charts use the same tier axes but onset-based pipeline (§4.3).

User picks tier on Song Select **after** generation; no re-call to MusicSaas.

### 4.3 Auto-Charting (MVP)

**Input:** Generated WAV from MusicSaas + selected **chart tier** (Easy / Standard / Hard)  
**Output:** `ChartJSON` v1.1 (taps + holds)

**Pipeline:**

1. Decode audio via Web Audio API (44.1 kHz).
2. **BPM estimation** — autocorrelation on onset envelope; snap to preset hint BPM if within ±5%.
3. **Beat grid** — quantize to 1/4 notes; Hard tier adds 1/8 note slots on high-energy frames.
4. **Onset detection** — spectral flux peaks → candidate tap times.
5. **Lane assignment** — stereo energy (L→lanes 0–1, R→lanes 2–3) + alternating tie-break.
6. **Hold inference** — merge consecutive same-lane onsets with gap ≤ 600 ms into one LN; min hold 2 beats.
7. **Density filter** — apply tier caps (notes/s, chord cap); remove notes closer than 80 ms (anti-spam).
8. **Section tags** — detect energy delta > 6 dB → mark `drop` for AR boost in chart metadata.
9. Export `ChartJSON`; cache all 3 tiers in session for instant re-pick.

**Quality bar:**

| Metric | Target |
|--------|--------|
| Playable without manual edit | ≥ 85% of generated tracks |
| BPM detect within ±3 BPM | ≥ 90% |
| Player "feels on-beat" (survey) | ≥ 70% agree |
| Hold notes feel intentional | ≥ 60% of holds align with audible sustain |
| **Fun score (1–5)** post-first-play | **≥ 3.8 avg** across ≥ 10 naive playtesters |
| **“Would play again”** (yes/no) | **≥ 70%** yes on Instant Demo |
| Kick lane (0) median timing error | ≤ 35 ms vs spectrogram kick (demo mode) |

Manual editor remains Post-MVP; **re-chart tier switch** is free and instant (client-side).

### 4.4 Screens

| Screen | Purpose | Key Components |
|--------|---------|----------------|
| **Landing** | Position product; CTA to Create | Hero animation (16-cell beat grid), **Play Now — D F J K** (instant), Create Studio |
| **Create Studio** | Preset + prompt tags + generate | Scene tab "Rhythm Game", tag chips, progress timeline |
| **Song Select** | Pick generated track + difficulty | Gradient cards, tier picker (Easy/Std/Hard), mode (Casual/Arcade), engine badge |
| **Play** | Core gameplay | 4 lanes, receptors, HP bar (Arcade), combo, judgment popups, progress bar |
| **Results** | Reward + share | Grade, accuracy %, max combo, FC badge, replay / share / download / try other tier |
| **Kiosk** (`?kiosk=1`) | Event mode | Full-screen, auto-reset after 60 s idle, hides dev links |

---

## 5. Music Creation Requirements

### 5.1 MusicSaas API Integration

| Use Case | `mode` | Engine | Duration |
|----------|--------|--------|----------|
| Instrumental charts | `game_bgm` | Stable Audio 3 | 60–90 s |
| Vocal OP / trailer | `game_theme_vocal` | ACE-Step 1.5 | 30–45 s |
| Song-select loop | `game_bgm` | SA3 | 30–45 s |

**Prompt contract (rhythm-game):** All chart prompts MUST include:
- Explicit or implied **BPM**
- **`clear beat`** / **`4/4 kick`**
- **`instrumental, no vocals`** (BGM only — prevents charting vocal bleed)
- **`loop-friendly`** where applicable

### 5.2 Preset Library (Ship with MVP)

| ID | EN Label | Prompt Summary |
|----|----------|----------------|
| `mg-chart-main` | Chart Main | 160 BPM EDM, strong kick/snare, loop-friendly |
| `mg-song-select` | Song Select | Upbeat electronic, neon arcade, seamless loop |
| `mg-climax` | Climax Drop | 170 BPM build-up + drop, synth lead |
| `mg-chill` | Chill Chart | 120 BPM soft pads, easy mood |
| `mg-hardcore` | Hardcore Chart | 180 BPM speedcore-influenced drums |
| `mg-theme-vocal` | Rhythm OP | Anime-style J-pop OP with lyrics hooks |

### 5.3 Prompt Tag Chips (Creator UI)

`clear beat` · `160 BPM` · `loop-friendly` · `electronic` · `no vocals` · `synth lead` · `arcade` · `build-up` · `4/4 kick` · `neon`

### 5.4 Audio Quality Acceptance

| Check | Threshold |
|-------|-----------|
| Format | WAV, 44.1 kHz stereo |
| Vocal bleed on `game_bgm` | ≤ 5% failure rate (manual QA sample) |
| Playable BPM detectable | ≥ 90% of generated charts |
| Loop seam (song select) | No click > −40 dBFS at loop point (best effort) |

---

## 6. Functional Requirements

### 6.1 MVP (P0)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| F-01 | Preset-based music generation | User selects preset → job submitted → audio playable |
| F-02 | Generation progress UI | Status timeline: queued → generating → charting → ready |
| F-03 | Auto-chart from audio | 3 tiers (Easy/Std/Hard) playable without manual edit |
| F-04 | 4-lane gameplay | Tap + Hold; keyboard + touch; time-based judging |
| F-04b | Play modes | Casual (no fail), Arcade (HP), Practice (auto-slow) |
| F-04c | Calibration wizard | First-run offset test; persist offset |
| F-04d | Key remap | 4 keys remappable; default D/F/J/K |
| F-04e | Speed mod | 0.75× / 1.0× / 1.25× in Casual mode only |
| F-05 | Score & grade screen | Accuracy %, combo, letter grade, FC badge |
| F-06 | Session replay | Replay same chart without re-generating |
| F-07 | Share link | `?chart={sessionId}` loads read-only play |
| F-08 | Download WAV | Export generated audio with license hint |
| F-09 | English UI | All player-facing strings in EN |
| F-10 | Health preflight | Block generate if MusicSaas workers offline; show clear message |
| F-11 | Kiosk mode | `?kiosk=1` hides nav; auto-return to song select |

### 6.2 v1.1 (P1)

| ID | Requirement |
|----|-------------|
| F-12 | Slide notes + upscroll option |
| F-13 | Basic chart editor (move/delete notes) |
| F-14 | Account + cloud chart library |
| F-15 | Gamepad / 2-player local versus |
| F-16 | Per-note keysound layer (Bemuse-style) |
| F-17 | OBS-friendly transparent overlay export |
| F-18 | Optional `.osu` 4K import (read-only play) — stretch; not parity with Web osu!mania library |

### 6.3 v1.2 (P2)

| ID | Requirement |
|----|-------------|
| F-19 | Online leaderboard per shared chart |
| F-20 | Custom branding (logo, colors) for enterprise |
| F-21 | Unity / Godot chart JSON export plugin |
| F-22 | SFX hits via MusicSaas `game_sfx` (v0.2 API) |
| F-23 | Mine notes + SV gimmick sections |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Gameplay ≥ 60 FPS on M1 MacBook / mid-range Android Chrome |
| **Audio latency** | Output latency < 50 ms where OS allows; calibration offset; headphone warning on first run |
| **Generation SLA** | P95 ≤ 180 s for 90 s BGM (aligned with MusicSaas M1 benchmark) |
| **Concurrency** | 1 generation per browser session; queue message if worker busy |
| **Offline** | Gameplay works offline if chart cached; generation requires network |
| **Accessibility** | Color-blind lane patterns; remappable keys; reduced motion toggle |
| **Privacy** | No PII in MVP; session IDs are opaque UUIDs |
| **Security** | No API keys in browser; all generation via Gateway BFF |
| **Compliance** | Display AI-generated label + link to MusicSaas license summary |

---

## 8. Technical Architecture

### 8.1 Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite 6 + React 19 + TypeScript |
| Game loop | `requestAnimationFrame` + audio clock sync (`AudioContext.currentTime`) |
| Chart engine | Custom lightweight engine (~2K LOC target) |
| Beat analysis | Web Audio API + energy/onset in Web Worker |
| Styling | CSS variables, neon glassmorphism (extends MusicSaas Demo v3) |
| Backend | MusicSaas Gateway BFF (`/demo/api/v1/*`) |
| Storage | Session: `sessionStorage` + optional Gateway temp file for share links |

### 8.2 Deployment

```text
Browser → CDN static (NeonBeat SPA)
       → MusicSaas Gateway :8080
            → ACE Worker :8101
            → SA3 Worker  :8102
```

**Customer-facing options:**

| Tier | Deployment |
|------|------------|
| **Cloud demo** | Hosted NeonBeat + vendor-managed MusicSaas |
| **Private PoC** | Customer LAN; same Mac MLX stack as MusicSaas |
| **Embedded** | iframe widget for marketing sites (`?embed=1`) |

### 8.3 Chart Data Model (v1.1)

```typescript
type ChartJSON = {
  version: "1.1";
  meta: {
    title: string;
    artist: "AI Generated";
    bpm: number;
    offset_ms: number;
    preset_id: string;
    chart_tier: "easy" | "standard" | "hard";
    play_mode?: "casual" | "arcade" | "practice";
    approach_rate: number;
    audio_url: string;
    engine: "stable-audio-3" | "ace-step-1.5";
    sections?: Array<{ t: number; type: "drop" | "break" }>;
  };
  notes: Array<
    | { t: number; lane: 0 | 1 | 2 | 3; type: "tap" }
    | {
        t: number;
        lane: 0 | 1 | 2 | 3;
        type: "hold";
        end_t: number; // tail release time (ms)
      }
  >;
};
```

---

## 9. UI / Visual Design

### 9.1 Design Language: **Neon Arcade**

| Token | Value |
|-------|-------|
| Primary gradient | Cyan `#06b6d4` → Violet `#8b5cf6` |
| Accent (hardcore) | Red `#ef4444` → Purple `#7c3aed` |
| Background | Deep navy `#0a0a12` with subtle grid |
| Typography | Inter / system-ui; headings semi-bold |
| Motion | Beat-grid pulse (16 cells, 80 ms stagger); lane hit flash |

### 9.2 Preset Card Gradients

| Preset | Gradient |
|--------|----------|
| Chart Main | `#06b6d4` → `#8b5cf6` |
| Song Select | `#ec4899` → `#6366f1` |
| Climax Drop | `#f43f5e` → `#a855f7` |
| Chill Chart | `#14b8a6` → `#3b82f6` |
| Hardcore | `#ef4444` → `#7c3aed` |
| Rhythm OP | `#f97316` → `#db2777` |

### 9.3 Responsive Breakpoints

| Device | Layout |
|--------|--------|
| Desktop (≥1024px) | Landing + side-by-side create panel |
| Tablet (768–1023px) | Stacked; touch lanes full width |
| Phone (<768px) | Play mode only recommended; create via landscape hint |

---

## 10. Monetization & Packaging (Customer-Facing)

### 10.1 Offerings

| Package | Target | Includes |
|---------|--------|----------|
| **NeonBeat Play** (Free demo) | Creators, students | 3 generations/day, watermark share link |
| **NeonBeat Studio** | Indies | Unlimited gen via bundled MusicSaas API credits, no watermark, WAV export |
| **NeonBeat Enterprise** | Brands / agencies | Kiosk mode, custom branding, SLA, on-prem MusicSaas |

### 10.2 Pricing Framework (Placeholder)

| Action | Credits (via MusicSaas) |
|--------|-------------------------|
| Chart BGM (60–90 s) | 5 |
| Rhythm OP (vocal) | 10 |
| Extra auto-chart retry | 0 (client-side) |

*Final pricing follows MusicSaas PRD §14; NeonBeat adds gameplay value on top.*

### 10.3 License Messaging (English)

> All music is AI-generated. Instrumental tracks use Stable Audio 3 (Community License — free commercial use under $1M annual revenue with registration). Vocal tracks use ACE-Step 1.5 (MIT). You are responsible for how you publish and monetize outputs.

---

## 11. Success Metrics

### 11.1 MVP (90 days post-launch)

| Metric | Target |
|--------|--------|
| Landing → first play conversion | ≥ 25% |
| Generation → play completion | ≥ 60% |
| Median time to first play | ≤ 4 min |
| Share link clicks / play | ≥ 15% of sessions |
| Auto-chart "feels right" (survey) | ≥ 70% agree |
| **Fun score (Instant Demo)** | ≥ 3.8 / 5 avg |
| **Median time landing → first note hit** | ≤ 12 s (incl. countdown) |
| **Drop reached in demo session** | ≥ 85% of starts |
| Worker-related abandon rate | ≤ 10% |

### 11.2 Business

| Metric | Target |
|--------|--------|
| PoC requests from NeonBeat demo | ≥ 10 qualified leads / quarter |
| MusicSaas API trials attributed to NeonBeat | ≥ 30% of inbound |
| Enterprise kiosk pilots | ≥ 2 |

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI music off-beat | Unplayable charts | BPM tag enforcement; re-chart button; preset tuning |
| Generation latency | User drop-off | Showcase pre-generated charts; play while next generates |
| Vocal bleed in BGM | Wrong chart feel | Force SA3 for `game_bgm`; QA sampling |
| Browser audio latency | Unfair timing | Calibration wizard; default +30 ms offset on Bluetooth |
| SA3 license revenue cap | Enterprise blocker | Early Enterprise track; ACE MIT fallback for instrumentals only in docs |
| Scope creep (full editor) | MVP delay | Strict P0; editor is P1 |

---

## 13. Roadmap

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **M0 — Design lock** | 1 week | PRD sign-off, Figma flows, ChartJSON spec |
| **M1 — Playable vertical slice** | 3 weeks | 1 preset → generate → auto-chart (tap+hold) → play Casual + Arcade |
| **M2 — Creator studio** | 2 weeks | All 6 presets, 3 chart tiers, song select, results, share link |
| **M3 — Polish & kiosk** | 2 weeks | Touch, calibration wizard, Practice mode, kiosk, EN copy |
| **M4 — Launch** | 1 week | Public demo URL, sales deck, acceptance tests |
| **v1.1** | +4 weeks | Slide notes, basic editor, accounts, optional `.osu` import |

---

## 14. Acceptance Tests (MVP)

### 14.1 Functional acceptance (ship gate)

| ID | Scenario | Pass |
|----|----------|------|
| T-01 | Select "Chart Main" → generate → play Standard Casual | Chart completes with grade screen |
| T-02 | Keyboard `D F J K` tap + hold | Taps and LN head/tail judged correctly |
| T-02b | Arcade mode — 15 consecutive Miss | HP reaches 0 → fail screen |
| T-03 | Touch lanes on iPad Safari | Same scoring as keyboard (±5% judgment distribution) |
| T-03b | Switch Easy → Hard without re-generate | Instant re-chart; denser pattern |
| T-04 | Share URL opened in new browser | Read-only play works |
| T-05 | Worker offline | Offline demo audio + chart; no stuck spinner |
| T-06 | `?kiosk=1` | No nav; returns to landing after idle |
| T-07 | Download WAV | Valid 44.1kHz WAV, >30 s |
| T-08 | "Rhythm OP" vocal preset | Sparse vocal-aligned taps; audio has vocals |
| T-09 | Calibration wizard | Offset saved; persists on reload |
| T-10 | Casual 1.25× speed mod | Judgment windows unchanged vs 1.0× (time-based, not scroll-based) |

### 14.2 Fun acceptance — **P0 ship gate** (“非常好玩”)

Playtest cohort: **≥ 10 users** who did not build the product; ≥ 50% never played osu!/FNF; wired headphones recommended.

| ID | Scenario | Pass (objective) | Pass (feel) |
|----|----------|------------------|-------------|
| **T-FUN-01** | Landing → **Play Now** → first hittable note | ≤ **8 s** from click to first note crossing receptor | Tester describes action without prompting |
| **T-FUN-02** | First 8 notes (intro), keys **D + K only** | ≥ **5/8** notes hit Great or better with no tutorial read | Tester says beat “makes sense” |
| **T-FUN-03** | First **Drop** section (demo) | `DROP!` banner + screen flash within **200 ms** of `sections[].t` | Tester reacts (verbal/emote) without being told |
| **T-FUN-04** | Chart–audio sync (demo timeline) | Lane **0** taps within **±35 ms** of kick transient; lane **3** within **±35 ms** of snare (10-beat sample) | No “off-beat” complaints in cohort |
| **T-FUN-05** | Perfect hit feedback | Particle burst + lane flash + hitsound start within **50 ms** of keydown | Tester uses “satisfying” / “crisp” in debrief |
| **T-FUN-06** | Combo milestones | Banner appears at **25 / 50 / 100** combo; combo text scales at ≥ 10 | Visible without reading HUD labels |
| **T-FUN-07** | Casual = no punishment | **0%** sessions fail due to HP in Casual | No tester thinks they “lost the song” |
| **T-FUN-08** | First-run competence | Naive tester ≥ **60%** accuracy on Easy **or** Standard Casual, no calibration | ≥ **7/10** finish the song |
| **T-FUN-09** | Note readability | Standard AR: tap visible ≥ **1.2 s** before receptor; approach trail visible | No “can’t see notes” reports |
| **T-FUN-10** | Session pacing | Instant Demo ≤ **48 s**; first Drop ≤ **10 s** after GO | Tester reaches Drop before boredom (≤ 30 s wait self-report) |
| **T-FUN-11** | Replay loop | From Results, **Replay** or Home → Play Now in ≤ **2 taps** | ≥ **50%** play twice in same session |
| **T-FUN-12** | Streamer clip test | Record 5 s centered on Drop | Clip readable mute-off (visual sync obvious) |
| **T-FUN-13** | Audio reliability | No stuck `Loading…` / silent `GO!` on Chrome macOS + Safari iOS | Audio starts ≤ **3 s** after countdown |
| **T-FUN-14** | Juice toggle | Hitsounds On vs Off A/B | On wins ≥ **7/10** preference |
| **T-FUN-15** | **Fun survey** (end of session) | “How fun was this?” **1–5** → avg ≥ **3.8** | “Would you play again?” ≥ **70%** yes |

**T-FUN scoring for release:**

| Gate | Rule |
|------|------|
| **Blocker** | Any of T-FUN-01, 03, 04, 07, 13 fails |
| **Major** | T-FUN-15 avg < 3.5 or < 60% “play again” |
| **Minor** | Single tester miss on T-FUN-02 / 08 — log and fix chart tier |

### 14.3 Fun acceptance — playtest script (15 min)

```text
1. [0:00] Open URL cold — no readme. Click "Play Now".
2. [0:30] Play until first Drop; note if you understood D/K without help.
3. [2:00] Finish song; record grade + max combo.
4. [2:30] Replay once on same chart OR switch to Arcade (optional).
5. [3:00] Survey: fun 1–5, play again Y/N, one word ("boring" / "hype" / …).
6. [Optional] Create Studio → generate Chart Main if workers online.
```

### 14.4 Automated / CI hooks (MVP)

| ID | Check | Command / location |
|----|-------|-------------------|
| T-AUTO-01 | Unit judge windows | `apps/neonbeat` → `npm test` |
| T-AUTO-02 | Build SPA | `npm run build` |
| T-AUTO-03 | Demo timeline note count | `standard` tier ≥ 40 notes, ≤ 220 notes (`demoSong.ts`) |
| T-AUTO-04 | First note timing | First note `t` ≥ 1000 ms and ≤ 2500 ms @ 160 BPM demo |

---

## 15. Open Questions

| # | Question | Owner | Default if unresolved |
|---|----------|-------|----------------------|
| 1 | Product name: NeonBeat vs RhythmForge vs MusicSaas Play | Marketing | NeonBeat for MVP |
| 2 | Allow re-chart without re-generate? | Product | Yes (client-side, free) |
| 3 | Max session charts retained | Eng | 10 per browser session |
| 4 | Embed iframe for partners | Legal | v1.1; require attribution |
| 5 | Chinese UI parity | Product | v1.1; EN-only MVP |
| 6 | Benchmark scope | Product | **Locked v1.2** — browser P0/P1 only (see §1.4) |
| 7 | Hold notes + Arcade HP in MVP? | Product | **Yes** — resolved |
| 8 | Fun acceptance in PRD? | Product | **Yes v1.3** — §14.2 T-FUN-* gates |
| 9 | Instant Demo default mode | Product | **Casual Standard** — Arcade opt-in on Song Select |

---

## 16. Appendix

### 16.1 Glossary

| Term | Definition |
|------|------------|
| Chart | Serialized note timeline (ChartJSON) |
| Auto-chart | Algorithmic note placement from audio analysis |
| Preset | Pre-filled MusicSaas job template for rhythm use cases |
| BFF | Backend-for-frontend; hides API keys from browser |

### 16.2 Related Documents

| Document | Path |
|----------|------|
| **NeonBeat implementation (SPA)** | `apps/neonbeat/` — demo timeline: `src/audio/demoSong.ts` |
| **Fun acceptance checklist** | §14.2 T-FUN-01 … T-FUN-15 |
| MusicSaas Platform PRD | `PRD.md` |
| Demo v3 Commercial Plan | `docs/reports/demo-commercial-v3-plan.md` |
| API & Data Model | `docs/DATA_API.md` |
| Acceptance (API) | `docs/ACCEPTANCE.md` |

### 16.3 Reference Links

- MusicSaas Repository: https://github.com/chenzh/MusicSaas
- ACE-Step 1.5: https://github.com/ace-step/ACE-Step-1.5
- Stable Audio 3: https://github.com/Stability-AI/stable-audio-3
- Stability Community License: https://stability.ai/community-license

### 16.4 Browser Benchmark Links (in-scope only)

| Game | URL | Benchmark role |
|------|-----|----------------|
| Web osu!mania | https://webosumania.com | **P0 gameplay** |
| FNF (HTML5) | https://www.newgrounds.com/collection/fridaynightfunkin | **P0 casual / HP** |
| Rhythm Plus V2 | https://v2.rhythm-plus.com | **P1 4K VSRG** |
| Rhythm Plus Wiki | https://wiki.rhythm-plus.com | P1 mechanics reference |
| osu!web | https://osu.ppy.sh | **Brand only** — not full play benchmark |
| Bemuse | https://bemuse.ninja | **P2 polish** — tutorial / hitsounds |
| EN browser rhythm roundup | https://dinogame.gg/blog/best-browser-rhythm-music-games/ | Market context |

---

*v1.3 — Browser-only benchmarks + **fun-quality acceptance suite** (§14.2). Primary: Web osu!mania + FNF HTML5. AI music via MusicSaas.*
