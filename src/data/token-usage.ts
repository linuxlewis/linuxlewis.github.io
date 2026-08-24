/**
 * Build-time loader for the sambolgert.com token-usage heatmap.
 *
 * The payload is produced nightly by the private LiteLLM gateway export and
 * published by the static web-server at https://web.sambolgert.com/data/token-usage.json.
 * This module fetches it once during the Astro build and degrades gracefully
 * when the file is temporarily absent (e.g. the first deploy before the export
 * has ever run).
 */

export interface TokenUsageModel {
  name: string;
  provider: string;
  tokens: number;
  prompt: number;
  completion: number;
}

export interface TokenUsageDay {
  date: string;
  totalTokensPerDay: number;
  requests: number;
  models: TokenUsageModel[];
}

export interface TokenUsageTotals {
  byModel: TokenUsageModel[];
  requests: number;
  cacheReadTokens: number;
  models: number;
}

export interface TokenUsageData {
  generatedAt: string;
  days: TokenUsageDay[];
  totals: TokenUsageTotals;
}

export const TOKEN_USAGE_URL =
  "https://web.sambolgert.com/data/token-usage.json";

// Local web-server copy, tried first when the build runs on the host that also
// serves web.sambolgert.com. This keeps local `astro dev`/`astro build` runs
// deterministic and offline-resistant; visitors/builds on other hosts simply
// fall through to the public origin below.
export const TOKEN_USAGE_LOCAL_URL =
  "http://127.0.0.1:8082/data/token-usage.json";

const TOKEN_USAGE_SOURCES = [TOKEN_USAGE_LOCAL_URL, TOKEN_USAGE_URL];

const TOKEN_USAGE_TIMEOUT_MS = 4_000;

const MEGATOKEN = 1_000_000;
const GIGATOKEN = 1_000_000_000;

/** Format a raw token count as a compact, human-scale label. */
export function formatTokens(tokens: number): string {
  if (tokens >= GIGATOKEN) {
    return `${(tokens / GIGATOKEN).toFixed(2)}B`;
  }
  if (tokens >= MEGATOKEN) {
    return `${(tokens / MEGATOKEN).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return String(tokens);
}

function isModel(value: unknown): value is TokenUsageModel {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.provider === "string" &&
    typeof v.tokens === "number" &&
    typeof v.prompt === "number" &&
    typeof v.completion === "number"
  );
}

function sanitizeModel(value: unknown): TokenUsageModel | null {
  if (!isModel(value)) return null;
  return {
    name: value.name,
    provider: value.provider,
    tokens: Math.max(0, value.tokens),
    prompt: Math.max(0, value.prompt),
    completion: Math.max(0, value.completion),
  };
}

function sanitize(value: unknown): TokenUsageData | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.generatedAt !== "string") return null;
  if (typeof v.totals !== "object" || v.totals === null) return null;
  const totals = v.totals as Record<string, unknown>;
  if (!Array.isArray(totals.byModel) || !Array.isArray(v.days)) return null;

  const byModel = totals.byModel
    .map(sanitizeModel)
    .filter((m): m is TokenUsageModel => m !== null);
  if (byModel.length !== totals.byModel.length) return null;
  if (
    typeof totals.requests !== "number" ||
    typeof totals.models !== "number"
  ) {
    return null;
  }
  if (typeof totals.cacheReadTokens !== "number") return null;

  const days: TokenUsageDay[] = [];
  for (const entry of v.days) {
    if (typeof entry !== "object" || entry === null) return null;
    const d = entry as Record<string, unknown>;
    if (typeof d.date !== "string" || typeof d.totalTokensPerDay !== "number") {
      return null;
    }
    if (typeof d.requests !== "number" || !Array.isArray(d.models)) return null;
    const models = d.models
      .map(sanitizeModel)
      .filter((m): m is TokenUsageModel => m !== null);
    if (models.length !== d.models.length) return null;
    days.push({
      date: d.date,
      totalTokensPerDay: Math.max(0, d.totalTokensPerDay),
      requests: Math.max(0, d.requests),
      models,
    });
  }

  return {
    generatedAt: v.generatedAt,
    days,
    totals: {
      byModel,
      requests: Math.max(0, totals.requests as number),
      cacheReadTokens: Math.max(0, totals.cacheReadTokens as number),
      models: Math.max(0, totals.models as number),
    },
  };
}

/**
 * Fetch the token-usage payload at build time; null when anything is off.
 *
 * Probes each candidate source in order and returns the first response that
 * both parses as JSON and passes shape validation. A short per-source timeout
 * keeps an unreachable public origin from stalling the build.
 */
export async function loadTokenUsage(): Promise<TokenUsageData | null> {
  for (const url of TOKEN_USAGE_SOURCES) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(TOKEN_USAGE_TIMEOUT_MS),
      });
    } catch {
      continue;
    }
    if (!response.ok) continue;
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      continue;
    }
    const data = sanitize(value);
    if (data) return data;
  }
  return null;
}

/**
 * Map a day's token total to a 0..4 heatmap intensity.
 *
 * Uses GitHub's linear quartile scale (level 1 = up to 25% of the heaviest
 * day, level 4 = the heaviest days) so the graph reads like a contribution
 * chart and one heavy day doesn't compress the rest to a single color.
 */
export function heatLevel(tokens: number, maxTokens: number): number {
  if (tokens <= 0 || maxTokens <= 0) return 0;
  const ratio = tokens / maxTokens;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

/** 0 = Sunday ... 6 = Saturday for a date-only string (parsed as UTC). */
export function weekdayOf(date: string): number {
  const day = Date.parse(`${date}T00:00:00Z`);
  return new Date(day).getUTCDay();
}

const DAY_MS = 86_400_000;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-08-23" -> "Aug 23". */
export function formatShortDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${MONTH_NAMES[Number(month) - 1] ?? ""} ${Number(day)}`;
}

/** Milliseconds since epoch -> "YYYY-MM-DD" (UTC). */
function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

// LiteLLM buckets usage by the gateway host's wall clock. The host runs in
// America/Chicago, so "today" for the heatmap must follow the same zone — not
// UTC, where a late-evening request already belongs to the next calendar day.
const LOCAL_TIME_ZONE = "America/Chicago";

/** "today" in the gateway's local timezone (handles DST automatically). */
function localToday(): string {
  // The en-CA locale formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LOCAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export interface HeatCell {
  key: string;
  level: number;
  /** Date for in-window days; null for the padding days before/after the window. */
  date: string | null;
  /** true for the current week's not-yet-elapsed days (render blank). */
  future: boolean;
  tokens: number;
  requests: number;
  models: TokenUsageModel[];
}

function padCell(key: string, future: boolean): HeatCell {
  return {
    key,
    level: 0,
    date: null,
    future,
    tokens: 0,
    requests: 0,
    models: [],
  };
}

/**
 * Build the GitHub-style week grid over a rolling 365-day window.
 *
 * The window ends today (clamped to the latest data day) and spans a full year
 * back, matching the GitHub contribution graph's timeframe. Each column is a
 * calendar week; rows are Sun..Sat (Sunday first). Days with no data render as
 * faint empty cells, and the current week's not-yet-elapsed days render blank.
 */
export function buildHeatCells(data: TokenUsageData): HeatCell[] {
  const cells: HeatCell[] = [];
  if (data.days.length === 0) return cells;

  const maxTokens = Math.max(0, ...data.days.map((d) => d.totalTokensPerDay));
  const byDate = new Map(data.days.map((d) => [d.date, d]));

  // End on today so the current week shows squares for elapsed days and blanks
  // for days still to come. Clamp to the latest data day in case the build
  // runs before the nightly export has produced today's row.
  const lastDataDate = data.days[data.days.length - 1].date;
  const today = localToday();
  const endDate = today > lastDataDate ? today : lastDataDate;
  const endMs = Date.parse(`${endDate}T00:00:00Z`);
  const startMs = endMs - 364 * DAY_MS; // 365 days inclusive
  const startWeekday = weekdayOf(isoDate(startMs)); // 0 = Sun

  // Leading blanks pad the first partial week; 365 real days follow, rounded
  // up to whole weeks so the trailing partial week is covered too.
  const totalCells = startWeekday + 365;
  const weekCount = Math.ceil(totalCells / 7);

  for (let i = 0; i < weekCount * 7; i++) {
    const dayOffset = i - startWeekday; // days since startMs
    if (dayOffset < 0) {
      // Leading blanks of the first partial week render as faint cells.
      cells.push(padCell(`pad-${i}`, false));
      continue;
    }
    if (dayOffset >= 365) {
      // The current week's not-yet-elapsed days render as blank space.
      cells.push(padCell(`pad-${i}`, true));
      continue;
    }
    const date = isoDate(startMs + dayOffset * DAY_MS);
    const day = byDate.get(date);
    cells.push(
      day
        ? {
            key: date,
            level: heatLevel(day.totalTokensPerDay, maxTokens),
            date,
            future: false,
            tokens: day.totalTokensPerDay,
            requests: day.requests,
            models: day.models,
          }
        : {
            key: date,
            level: 0,
            date,
            future: false,
            tokens: 0,
            requests: 0,
            models: [],
          },
    );
  }
  return cells;
}
