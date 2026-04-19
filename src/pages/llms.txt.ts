import type { APIRoute } from "astro";

const body = `# Sam Bolgert

> Personal website for Sam Bolgert, an AI-native software engineer building practical AI software and linking out to his primary public profiles.

The site is intentionally small. Start with the markdown homepage if you want the core content in a clean machine-readable format.

## Primary

- [Homepage markdown](https://sambolgert.com/index.md): Canonical markdown version of the homepage.

## Profiles

- [GitHub](https://github.com/linuxlewis): Code, experiments, and shipped work.
- [X](https://x.com/linuxlewis): Thoughts, product notes, and signal.
- [LinkedIn](https://www.linkedin.com/in/sbolgert): Professional history and network.

## Optional

- [Homepage HTML](https://sambolgert.com/): Human-facing homepage.
`;

export const GET: APIRoute = () =>
  new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
