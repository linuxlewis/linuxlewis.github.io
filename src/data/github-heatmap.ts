const GITHUB_HEATMAP_URL = "https://www.dailygreen.xyz/linuxlewis";
const GITHUB_HEATMAP_TIMEOUT_MS = 6_000;

const COLOR_MAP: Record<string, string> = {
  "#ebedf0": "#2a2b2d",
  "#9be9a8": "#ff5a3626",
  "#40c463": "#ff5a364d",
  "#30a14e": "#ff5a367f",
  "#216e39": "#ff5a36",
  "#57606a": "#7a7a76",
};

function recolorHeatmap(svg: string): string | null {
  if (!svg.includes("<svg")) return null;
  let recolored = svg;
  for (const [from, to] of Object.entries(COLOR_MAP)) {
    recolored = recolored.split(from).join(to);
  }
  return recolored;
}

/**
 * Fetch the dailygreen contribution chart and remap its GitHub greens to the
 * site's orange accent. Returns null when the external source is unavailable.
 */
export async function loadGithubHeatmap(): Promise<string | null> {
  try {
    const response = await fetch(GITHUB_HEATMAP_URL, {
      headers: { accept: "image/svg+xml" },
      signal: AbortSignal.timeout(GITHUB_HEATMAP_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return recolorHeatmap(await response.text());
  } catch {
    return null;
  }
}
