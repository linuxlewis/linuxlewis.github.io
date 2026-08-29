export const site = {
  seo: {
    title: "Sam Bolgert | AI-Native Product Builder",
    description: "Sam Bolgert builds AI-native products for business value.",
  },
  profile: {
    name: "Sam Bolgert",
    intro: "Hi, I'm Sam Bolgert.",
    role: "AI-native software engineer",
    headline: "Building AI software that ships, scales, and gets used.",
    body: "I build and lead teams building software across applied AI, product engineering, and systems design. I ship AI that delivers business outcomes, not demos.",
  },
  links: [
    {
      label: "GitHub",
      href: "https://github.com/linuxlewis",
      detail: "AI products, experiments, and shipped code",
    },
    {
      label: "X",
      href: "https://x.com/linuxlewis",
      detail: "AI thoughts, hot takes, and memes",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/sbolgert",
      detail: "Professional history and network",
    },
  ],
  focus: [
    "AI-native products",
    "Applied AI",
    "Technical leadership",
    "Product engineering",
    "Automation",
    "Business impact",
  ],
  status: {
    label: "Current",
    prefix: "Head of AI at",
    company: {
      label: "Mindbloom",
      href: "https://www.mindbloom.com",
    },
  },
  heatmap: {
    label: "GitHub activity",
    href: "https://github.com/linuxlewis",
    image: "https://www.dailygreen.xyz/linuxlewis",
    alt: "GitHub contribution heatmap for linuxlewis",
  },
  usage: {
    label: "Token usage",
    sub: "Trailing 365 days",
    summary: "tokens across {models} models",
    unavailable:
      "Live token usage isn't available right now. Check back after the nightly export has run.",
    dataUrl: import.meta.env.DEV
      ? "/data/token-usage.json"
      : "https://web.sambolgert.com/data/token-usage.json",
    heatRows: ["Mon", "Wed", "Fri"],
    donutCount: 6,
  },
  topModels: {
    label: "Top models",
    unavailable:
      "Model rankings aren't available right now. Check back after the nightly export has run.",
    count: 8,
  },
} as const;
