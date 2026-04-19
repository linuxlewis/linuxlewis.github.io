import type { APIRoute } from "astro";
import { site } from "../data/site";

const markdown = `# ${site.profile.name}

> ${site.profile.headline}

This is the markdown version of ${site.profile.name}'s personal website.

## About

${site.profile.body}

## Current Focus

${site.status.prefix} [${site.status.company.label}](${site.status.company.href})

## Links

- [GitHub](${site.links[0].href}) - ${site.links[0].detail}
- [X](${site.links[1].href}) - ${site.links[1].detail}
- [LinkedIn](${site.links[2].href}) - ${site.links[2].detail}

## Focus Areas

${site.focus.map((item) => `- ${item}`).join("\n")}

## Agent Notes

- HTML homepage: https://sambolgert.com/
- Markdown homepage: https://sambolgert.com/index.md
- Agent index: https://sambolgert.com/llms.txt
`;

export const GET: APIRoute = () =>
  new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
