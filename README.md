# sambolgert.com

This repository contains the source for `sambolgert.com`, a one-page personal site for Sam Bolgert.

## Brief

The site is intentionally narrow in scope:

- Position Sam as a builder of AI-native products.
- Emphasize business value, not AI hype.
- Route visitors to the three channels that matter: GitHub, X, and LinkedIn.
- Stay lightweight, fast, and easy to maintain on GitHub Pages.

The current design direction is a `Signal` / `Console` hybrid:

- dark, technical, restrained
- strong headline typography
- monospace UI details
- subtle grid and panel framing
- no terminal cosplay
- no contact form or email CTA

Canonical homepage copy lives in [src/data/site.ts](src/data/site.ts).

## Stack

- Astro
- static output
- GitHub Pages via GitHub Actions

This is a greenfield rebuild. Nothing from the legacy Foundation site is retained except the domain.

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
