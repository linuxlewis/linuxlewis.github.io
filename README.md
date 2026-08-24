# sambolgert.com

This repository contains the source for `sambolgert.com`, a one-page personal site for Sam Bolgert.

## Stack

- Astro
- static output
- GitHub Pages via GitHub Actions

Canonical homepage content lives in [src/data/site.ts](src/data/site.ts).

## Local Setup

Requirements:

- Node.js 22+ recommended
- npm 10+ or newer

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run the full repo health check:

```bash
npm run validate
```

Preview the production build locally:

```bash
npm run preview
```

## Editing Guide

If you are changing content:

- edit [src/data/site.ts](src/data/site.ts)

## Token Usage Sections

The homepage renders two usage sections from a build-time snapshot fetched from
`https://web.sambolgert.com/data/token-usage.json`:

- **Token usage** (`src/components/TokenUsage.astro`) — a rolling 365-day
  GitHub-style heatmap (Sunday-first weeks, month markers, today's week trailing
  blank squares) with a hover tooltip that breaks each day down per model.
- **Top models** (`src/components/TopModels.astro`) — a ranked list of the top
  five models with token counts.

The loader and fetch live in [src/data/token-usage.ts](src/data/token-usage.ts),
validated at the JSON boundary before rendering. When the file is temporarily
unavailable at build time, both sections render a graceful offline note instead
of failing the build. Zero runtime JavaScript is emitted — all charts are static
HTML/CSS.

### Data source

The snapshot is produced by the private LiteLLM gateway, which lives in a
separate checkout at `/home/sbolgert/workspace/litellm-gateway`. Its
`scripts/export-token-usage.sh` reads `LiteLLM_DailyUserSpend` via
`docker exec litellm-gateway-db psql -U litellm -d litellm` and writes the
privacy-safe JSON to `web-server/public/data/token-usage.json` (served by nginx
at `web.sambolgert.com`).

To inspect the gateway data or run the export manually:

```bash
cd /home/sbolgert/workspace/litellm-gateway

# Inspect the raw daily aggregates (privacy-safe columns only):
docker exec litellm-gateway-db psql -U litellm -d litellm \
  -c 'SELECT date, model, prompt_tokens, completion_tokens, api_requests FROM "LiteLLM_DailyUserSpend" ORDER BY date DESC LIMIT 20;'

# Regenerate the public snapshot:
./scripts/export-token-usage.sh

# Verify the export is fresh and valid:
./scripts/check-token-usage-export.sh
```

The export runs nightly at 03:30 from the user-level systemd pair
`token-usage-export.timer` / `.service` in that checkout. Monitor its success
with:

```bash
systemctl --user status token-usage-export.service
systemctl --user list-timers token-usage-export.timer
journalctl --user -u token-usage-export.service -n 20
```

See `litellm-gateway/README.md` ("Token Usage Export") in that checkout for the
full JSON shape, install steps, and America/Chicago timezone handling.

If you are changing layout or metadata:

- edit [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro)
- edit [src/pages/index.astro](src/pages/index.astro)

If you are changing the visual system:

- edit [src/styles/global.css](src/styles/global.css)

If you are changing deployment:

- edit [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- edit [.github/workflows/ci.yml](.github/workflows/ci.yml) for push/PR validation
- keep [public/CNAME](public/CNAME) aligned with the configured custom domain

## Deployment

The site is designed for GitHub Pages.

Expected setup:

1. GitHub Pages uses `GitHub Actions` as the source.
2. The workflow in `.github/workflows/deploy.yml` builds and deploys the static output.
3. The custom domain is `sambolgert.com`.
4. The built artifact includes `public/CNAME`.

## Documentation

Human-oriented documentation lives here in `README.md`.

Agent-oriented documentation lives in [AGENTS.md](AGENTS.md). That file uses a knowledge-graph-style structure so future maintainers can recover the system intent quickly.
