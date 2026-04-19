# AGENTS

This file is the agent-facing operating manual for `sambolgert.com`.

## Mission

Preserve a fast, focused personal site that positions Sam Bolgert as a builder of AI-native products that drive business value.

Do not let the site drift into:

- a generic software engineer portfolio
- a full resume site
- a fake terminal gimmick
- an AI research identity page
- an overbuilt frontend app

## Knowledge Graph

### Entities

- `repo`
  - local source repository for `sambolgert.com`
- `site`
  - the published one-page personal website
- `person.sam_bolgert`
  - the subject of the site
- `page.home`
  - the only required page in the current design
- `content.site_config`
  - canonical homepage content in `src/data/site.ts`
- `layout.base`
  - shared document shell in `src/layouts/BaseLayout.astro`
- `style.global`
  - canonical visual system in `src/styles/global.css`
- `deploy.github_pages`
  - GitHub Pages deployment target
- `domain.primary`
  - `sambolgert.com`
- `channel.github`
  - `https://github.com/linuxlewis`
- `channel.x`
  - `https://x.com/linuxlewis`
- `channel.linkedin`
  - `https://www.linkedin.com/in/sbolgert`

### Relationships

- `repo` -> publishes -> `site`
- `site` -> represents -> `person.sam_bolgert`
- `site` -> deploys_via -> `deploy.github_pages`
- `site` -> resolves_to -> `domain.primary`
- `page.home` -> uses -> `content.site_config`
- `page.home` -> rendered_by -> `layout.base`
- `page.home` -> styled_by -> `style.global`
- `page.home` -> routes_to -> `channel.github`
- `page.home` -> routes_to -> `channel.x`
- `page.home` -> routes_to -> `channel.linkedin`

### Decisions

- `decision.scope`
  - The site is intentionally small and single-purpose.
- `decision.positioning`
  - Primary identity is `builder of AI-native products`.
- `decision.value_frame`
  - AI is framed around business value and production usefulness.
- `decision.contact_model`
  - No email CTA and no contact form.
  - Social profiles are the contact surface.
- `decision.stack`
  - Astro is used for maintainable static output.
- `decision.deploy`
  - GitHub Actions deploys to GitHub Pages.
- `decision.style`
  - Visual language is professional, dark, technical, restrained.
  - Hacker-ish cues are allowed.
  - Terminal cosplay is not allowed.

### Invariants

- Keep the homepage copy concise.
- Keep the three outbound links prominent.
- Keep business value ahead of AI novelty.
- Keep maintenance simple enough for a future editor to understand quickly.
- Keep the site statically buildable.
- Keep the custom domain documented and preserved.

## Source Of Truth

When editing, prefer these files in this order:

1. `src/data/site.ts`
2. `src/pages/index.astro`
3. `src/styles/global.css`
4. `src/layouts/BaseLayout.astro`
5. `.github/workflows/deploy.yml`

If content and layout disagree, `src/data/site.ts` should be treated as the intended message and the page should be brought back into alignment.

## Operational Playbook

### Common tasks

Update content:

```bash
# edit src/data/site.ts
```

Run locally:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Run repo validation:

```bash
npm run validate
```

### Safe change pattern

1. Read `README.md` and `AGENTS.md`.
2. Update `src/data/site.ts` if messaging changes.
3. Update page structure only if the message requires it.
4. Keep the visual system coherent in `src/styles/global.css`.
5. Run a production build before finishing.

## Anti-Patterns

Do not introduce these without an explicit product decision:

- blog engines
- CMS integrations
- analytics clutter
- GitHub stats widgets
- contact forms
- complex client-side state
- decorative animation without communicative value
- generic startup-AI buzzword copy

## Future Expansion Rules

If the site grows beyond a single page, add new entities and relationships here first.

Examples:

- `page.writing`
- `page.projects`
- `content.case_studies`
- `integration.analytics`

Document the change as:

1. new entity
2. why it exists
3. what file owns it
4. how it relates to the rest of the system
