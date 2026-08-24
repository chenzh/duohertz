# NeonBeat — Web Rhythm Game

Standalone browser rhythm game per [`docs/PRD-WEB-RHYTHM-GAME.md`](../../docs/PRD-WEB-RHYTHM-GAME.md).

## Stack

- Vite 6 + React 19 + TypeScript
- 4-lane VSRG (tap + hold), Casual / Arcade / Practice
- Auto-chart from audio (Web Audio API)
- MusicSaas BFF integration (`/demo/api/v1/*`) with offline demo fallback

## Quick start

```bash
cd apps/neonbeat
npm install
npm run dev
```

Open http://127.0.0.1:5174/neonbeat/

## Modes

| URL flag | Effect |
|----------|--------|
| `?kiosk=1` | Hide nav/footer; auto-reset after 60s idle |
| `?chart=<payload>` | Read-only shared chart play |

## MusicSaas integration

With Gateway running on `:8080`, Vite proxies `/demo` to the BFF. Click **Generate via MusicSaas** in Create Studio.

If workers are offline, the app falls back to **procedural demo audio** + demo charts.

Optional env:

```bash
VITE_API_BASE=http://127.0.0.1:8080 npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

## Project layout

```text
apps/neonbeat/
  src/
    api/musicsaas.ts    # BFF client + demo synth
    chart/autoChart.ts  # Auto-chart + demo charts
    engine/             # Judge, play state
    components/         # UI + PlayField
    storage/            # Settings, sessions, share links
    presets.ts          # PRD rhythm presets
```
