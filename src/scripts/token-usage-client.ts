import {
  buildHeatCells,
  formatShortDate,
  formatTokens,
  parseTokenUsage,
} from "../data/token-usage";
import type { HeatCell, TokenUsageData } from "../data/token-usage";

const MONTHS = [
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

const HEAT_ROWS = ["Mon", "Wed", "Fri"];
const FLIP_COLUMNS = 8;

function escapeHtml(value: string | number): string {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function getMonthMarkers(cells: HeatCell[]) {
  const markers: { week: number; label: string }[] = [];
  const firstDate = cells.find((cell) => cell.date)?.date;

  if (firstDate) {
    markers.push({
      week: 0,
      label: MONTHS[Number(firstDate.slice(5, 7)) - 1],
    });
  }

  cells.forEach((cell, index) => {
    if (!cell.date || !cell.date.endsWith("-01")) return;
    const week = Math.floor(index / 7);
    const last = markers[markers.length - 1];
    if (!last || last.week !== week) {
      markers.push({
        week,
        label: MONTHS[Number(cell.date.slice(5, 7)) - 1],
      });
    }
  });

  return markers;
}

function renderTooltip(cell: HeatCell): string {
  if (!cell.date || cell.tokens <= 0) return "";

  const models = cell.models
    .map(
      (model) => `
        <span class="heat-tooltip__model">
          <span class="heat-tooltip__model-name">${escapeHtml(model.name)}</span>
          <span class="heat-tooltip__model-tokens">${formatTokens(model.tokens)}</span>
          <span class="heat-tooltip__model-split">${formatTokens(model.prompt)} prompt &middot; ${formatTokens(model.completion)} completion</span>
        </span>`,
    )
    .join("");

  return `
    <span class="heat-tooltip" role="tooltip">
      <span class="heat-tooltip__date">${formatShortDate(cell.date)}</span>
      <span class="heat-tooltip__total">${formatTokens(cell.tokens)} tokens &middot; ${cell.requests} requests</span>
      <span class="heat-tooltip__models">${models}</span>
    </span>`;
}

function renderHeatmap(data: TokenUsageData): string {
  const cells = buildHeatCells(data);
  if (cells.length === 0) return "";

  const weekCount = cells.length / 7;
  const gridStyle = `grid-template-columns:repeat(${weekCount},1fr);aspect-ratio:${13 * weekCount - 3}/88`;
  const monthStyle = `grid-template-columns:repeat(${weekCount},1fr)`;
  const monthMarkers = getMonthMarkers(cells)
    .map(
      (marker) =>
        `<span class="heat-month" style="grid-column:${marker.week + 1}">${marker.label}</span>`,
    )
    .join("");
  const rowLabels = HEAT_ROWS.map(
    (label, index) =>
      `<span class="heat-row__label" style="grid-row:${index * 2 + 2}">${label}</span>`,
  ).join("");
  const heatCells = cells
    .map((cell, index) => {
      const week = Math.floor(index / 7);
      const edge =
        week < FLIP_COLUMNS
          ? "heat-cell--tip-l"
          : week >= weekCount - FLIP_COLUMNS
            ? "heat-cell--tip-r"
            : "";
      const tokenClass = cell.future ? "heat-empty" : `heat-${cell.level}`;
      const interactive =
        cell.tokens > 0
          ? ` tabindex="0" data-heat-cell aria-controls="heat-mobile-detail" aria-label="${escapeHtml(`${cell.date}: ${formatTokens(cell.tokens)} tokens, ${cell.requests} requests`)}"`
          : "";

      return `<li class="heat-cell ${tokenClass} ${edge}"${interactive}>${renderTooltip(cell)}</li>`;
    })
    .join("");

  const legend = [0, 1, 2, 3, 4]
    .map(
      (level) =>
        `<span class="heat-cell heat-${level}" aria-hidden="true"></span>`,
    )
    .join("");

  return `
    <div class="data-card usage-body">
      <div class="usage-heat">
        <div
          class="usage-heat__scroller"
          aria-label="Scrollable token usage heatmap for the trailing 365 days"
        >
          <div class="usage-heat__canvas">
            <div class="heat-months" aria-hidden="true" style="${monthStyle}">${monthMarkers}</div>
            <div class="heat-plot">
              <div class="heat-rows" aria-hidden="true">${rowLabels}</div>
              <ul class="heat-grid" style="${gridStyle}">${heatCells}</ul>
            </div>
          </div>
        </div>
      </div>
      <div class="heat-legend">
        <span class="heat-legend__label">Less</span>
        ${legend}
        <span class="heat-legend__label">More</span>
      </div>
      <div
        class="heat-mobile-detail"
        id="heat-mobile-detail"
        data-heat-mobile-detail
        aria-live="polite"
        hidden
      ></div>
    </div>`;
}

function renderTopModels(data: TokenUsageData): string {
  const models = data.totals.byModel.slice(0, 5);
  if (models.length === 0) return "";

  const maxTokens = Math.max(...models.map((model) => model.tokens));
  const rows = models
    .map(
      (model, index) => `
        <li class="top-model-row">
          <span class="top-model-row__rank">${index + 1}</span>
          <span class="top-model-row__name">${escapeHtml(model.name)}</span>
          <span class="top-model-row__bar" aria-hidden="true">
            <span class="top-model-row__bar-fill" style="--bar-width:${maxTokens > 0 ? (model.tokens / maxTokens) * 100 : 0}%"></span>
          </span>
          <span class="top-model-row__tokens">${formatTokens(model.tokens)}</span>
        </li>`,
    )
    .join("");

  return `<div class="data-card top-model-body"><ol class="top-model-list">${rows}</ol></div>`;
}

function initHeatmapInteractions(section: HTMLElement) {
  const scroller = section.querySelector<HTMLElement>(".usage-heat__scroller");
  const detail = section.querySelector<HTMLElement>(
    "[data-heat-mobile-detail]",
  );
  const cells = section.querySelectorAll<HTMLElement>("[data-heat-cell]");
  const mobile = window.matchMedia("(max-width: 760px)");

  const selectCell = (cell: HTMLElement) => {
    if (!mobile.matches || !detail) return;
    const tooltip = cell.querySelector<HTMLElement>(".heat-tooltip");
    if (!tooltip) return;

    cells.forEach((item) => item.classList.toggle("is-active", item === cell));
    detail.innerHTML = tooltip.innerHTML;
    detail.hidden = false;
  };

  cells.forEach((cell) => {
    cell.addEventListener("click", () => selectCell(cell));
    cell.addEventListener("focus", () => selectCell(cell));
  });

  if (scroller && mobile.matches) {
    scroller.tabIndex = 0;
    let pointerId: number | null = null;
    let pointerStart = 0;
    let scrollStart = 0;
    let didDrag = false;

    scroller.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse") return;
      pointerId = event.pointerId;
      pointerStart = event.clientX;
      scrollStart = scroller.scrollLeft;
      didDrag = false;
      scroller.classList.add("is-dragging");
      scroller.setPointerCapture(event.pointerId);
    });

    scroller.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      const distance = event.clientX - pointerStart;
      didDrag ||= Math.abs(distance) > 3;
      scroller.scrollLeft = scrollStart - distance;
    });

    const stopDragging = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      scroller.classList.remove("is-dragging");
    };

    scroller.addEventListener("pointerup", stopDragging);
    scroller.addEventListener("pointercancel", stopDragging);
    scroller.addEventListener(
      "click",
      (event) => {
        if (!didDrag) return;
        event.preventDefault();
        event.stopPropagation();
        didDrag = false;
      },
      true,
    );

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scroller.scrollLeft = scroller.scrollWidth;
      });
    });
  }
}

function setState(section: Element, message: string, showBody: boolean) {
  const body = section.querySelector<HTMLElement>(
    "[data-usage-body], [data-top-model-body]",
  );
  const state = section.querySelector<HTMLElement>(
    "[data-usage-state], [data-top-model-state]",
  );

  if (body) body.hidden = !showBody;
  if (state) {
    state.hidden = showBody;
    state.textContent = message;
  }
}

export function initTokenUsage() {
  const usageSection =
    document.querySelector<HTMLElement>("[data-token-usage]");
  const topModelsSection =
    document.querySelector<HTMLElement>(".top-model-section");
  const dataUrl = usageSection?.dataset.dataUrl;

  if (!usageSection || !topModelsSection || !dataUrl) return;

  setState(usageSection, "Loading live token usage...", false);
  setState(topModelsSection, "Loading live model rankings...", false);

  const requestUrl = new URL(dataUrl, window.location.href);
  requestUrl.searchParams.set("_", String(Date.now()));

  fetch(requestUrl, {
    headers: { accept: "application/json" },
    cache: "no-store",
  })
    .then((response) => {
      if (!response.ok)
        throw new Error(`Usage request failed: ${response.status}`);
      return response.json() as Promise<unknown>;
    })
    .then((value) => {
      const data = parseTokenUsage(value);
      if (!data) throw new Error("Usage response failed validation");

      const usageBody =
        usageSection.querySelector<HTMLElement>("[data-usage-body]");
      const topModelsBody = topModelsSection.querySelector<HTMLElement>(
        "[data-top-model-body]",
      );
      if (!usageBody || !topModelsBody)
        throw new Error("Usage markup is incomplete");

      const heatmapMarkup = renderHeatmap(data);
      const topModelsMarkup = renderTopModels(data);
      if (!heatmapMarkup || !topModelsMarkup) {
        throw new Error("Usage response contained no displayable data");
      }

      usageBody.innerHTML = heatmapMarkup;
      topModelsBody.innerHTML = topModelsMarkup;
      setState(usageSection, "", true);
      setState(topModelsSection, "", true);
      initHeatmapInteractions(usageSection);
    })
    .catch(() => {
      setState(
        usageSection,
        "Live token usage is not available right now. Check back after the next export.",
        false,
      );
      setState(
        topModelsSection,
        "Model rankings are not available right now. Check back after the next export.",
        false,
      );
    });
}
