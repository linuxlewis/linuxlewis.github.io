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

## Token usage sections

The homepage renders two usage sections from a runtime snapshot fetched from
`https://web.sambolgert.com/data/token-usage.json`:

- **Token usage** (`src/components/TokenUsage.astro`) — a rolling 365-day
  GitHub-style heatmap (Sunday-first weeks, month markers, today's week trailing
  blank squares) with a hover tooltip that breaks each day down per model.
- **Top models** (`src/components/TopModels.astro`) — a ranked list of the top
  five models with token counts.

The data parser and display helpers live in
[src/data/token-usage.ts](src/data/token-usage.ts), while
[src/scripts/token-usage-client.ts](src/scripts/token-usage-client.ts) fetches,
validates, and renders the response in the browser. When the file is
temporarily unavailable, both sections render a graceful offline note. The rest
of the page remains static; only these two data-driven sections use runtime
JavaScript.

The data endpoint must allow CORS requests from `https://sambolgert.com`.
The Nginx rule for that endpoint also sends `Cache-Control: no-cache`, and the
client adds a cache-busting query parameter so a newly exported snapshot is
visible without rebuilding or redeploying the homepage.

### Data source

The private CLIProxyAPI installation at
`/home/sbolgert/workspace/cliproxyapi-service` supplies new usage. Its
`cliproxyapi-usage.service` runs `scripts/usage.py collect`, which subscribes to
CLIProxyAPI's authenticated local usage stream and saves events in
`state/usage.sqlite3`. The database also contains a separate import of the
pre-migration LiteLLM daily aggregates. Only requests routed through the proxy
produce new events.

`token-usage-export.timer` runs every 15 minutes. Its service runs
`scripts/usage.py export`, combining the historical aggregates and new events
for a rolling 365-day window in the `America/Chicago` timezone. The script
writes `/home/sbolgert/workspace/web-server/public/data/token-usage.json`,
which nginx serves at the URL above. The JSON contains dates, model and
provider names, token and request counts, and a generation timestamp. It
contains no prompts, credentials, or client identifiers. The website reads the
snapshot when a visitor opens the page, so new usage does not require a site
build.

The collector depends on CLIProxyAPI's in-memory usage queue during an outage.
Events that the proxy has not delivered to SQLite can be lost on a proxy
restart. The [token source research](docs/cliproxy-usage-research.md) records
the accounting rules, queue limits, and source references.

To check the collector and publish a snapshot manually on the server:

```bash
cd /home/sbolgert/workspace/cliproxyapi-service
systemctl --user status cliproxyapi.service cliproxyapi-usage.service
python3 scripts/usage.py status
systemctl --user start token-usage-export.service
systemctl --user list-timers token-usage-export.timer
journalctl --user -u cliproxyapi-usage.service -u token-usage-export.service -n 20
```

Check the published response and its CORS header:

```bash
curl -fsSI -H 'Origin: https://sambolgert.com' \
  https://web.sambolgert.com/data/token-usage.json
```

The CLIProxyAPI checkout's `README.md` and `MIGRATION.md` document the
collector, token accounting, historical import, and recovery limits.

## Analytics

Page views and outbound clicks are tracked with a self-hosted, cookieless
[Umami](https://umami.is) instance at `https://analytics.sambolgert.com`.

- The script URL, website ID, and allowed domain live in `site.analytics` in
  [src/data/site.ts](src/data/site.ts).
- [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) only emits the
  tracker in production builds, and `data-domains` keeps localhost and preview
  hosts out of the stats.
- The three social link cards send an `outbound-link` event with a `label`
  property (`GitHub`, `X`, `LinkedIn`) via `data-umami-event` attributes in
  [src/pages/index.astro](src/pages/index.astro).

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
