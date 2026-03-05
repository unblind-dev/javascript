import uPlot from "uplot";
import type { LabeledMetricMetadata, Serie, TooltipSerie } from "../../types";
import { tooltipManager } from "./TooltipManager";
import { Tooltip, TooltipProps } from ".";

/**
 * Checks if the data spans multiple calendar days
 * @param xData - Array of timestamps
 * @param timeZone - Timezone string (e.g., "UTC", "America/New_York")
 * @returns True if data spans multiple days
 */
function checkIfSpansMultipleDays(
  xData: uPlot.TypedArray | number[],
  timeZone?: string,
): boolean {
  if (!xData || xData.length === 0) return false;

  const minTimestamp = xData[0];
  const maxTimestamp = xData[xData.length - 1];

  if (minTimestamp == null || maxTimestamp == null) return false;

  const minDate = new Date(minTimestamp * 1000);
  const maxDate = new Date(maxTimestamp * 1000);

  const getDateString = (date: Date) => {
    if (timeZone === "UTC") {
      return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
    }
    return date.toLocaleDateString(undefined, { timeZone });
  };

  return getDateString(minDate) !== getDateString(maxDate);
}

/**
 * Finds the nearest data point with a non-null value
 * @param u - uPlot instance
 * @param idx - Current cursor index
 * @returns Index of nearest non-null data point, or the original index
 */
function findNearestNonNullIndex(u: uPlot, idx: number): number {
  let hasNonNullValue = false;

  // Check if current index has any non-null values
  for (let seriesIndex = 1; seriesIndex < u.series.length; seriesIndex++) {
    if (u.data[seriesIndex]?.[idx] != null) {
      hasNonNullValue = true;
      break;
    }
  }

  if (hasNonNullValue) return idx;

  // Search for nearest non-null value
  const dataLength = u.data[0].length;

  for (
    let distance = 1;
    idx + distance < dataLength || idx - distance >= 0;
    distance++
  ) {
    const leftCandidate = idx - distance;
    const rightCandidate = idx + distance;

    if (leftCandidate >= 0) {
      for (let seriesIndex = 1; seriesIndex < u.series.length; seriesIndex++) {
        if (u.data[seriesIndex]?.[leftCandidate] != null) {
          return leftCandidate;
        }
      }
    }

    if (rightCandidate < dataLength) {
      for (let seriesIndex = 1; seriesIndex < u.series.length; seriesIndex++) {
        if (u.data[seriesIndex]?.[rightCandidate] != null) {
          return rightCandidate;
        }
      }
    }
  }

  return idx;
}

export interface TooltipSerieListOptions {
  maxAttributeKeySetCount: number;
  hasAttributes: boolean;
  hasMultipleMetrics: boolean;
  hasMultipleAttributes: boolean;
  spansMultipleDays: boolean;
}

/**
 * Builds tooltip items from uPlot data
 */
function buildTooltipSerieListParams(
  u: uPlot,
  actualIdx: number,
  formatValue: (v: number) => string,
  stacked: boolean,
  metadata: Record<string, LabeledMetricMetadata>,
  series?: Serie[],
  timeZone?: string,
): { serieList: TooltipSerie[]; options: TooltipSerieListOptions } {
  const serieList: TooltipSerie[] = [];
  const xData = u.data[0];

  // Track unique metrics and attributes efficiently
  const seenMetrics = new Set<string>();
  const seenAttributeKeys = new Set<string>();
  let hasAnyAttributes = false;
  let maxAttributeKeySetCount = 0;

  for (let seriesIndex = 1; seriesIndex < u.series.length; seriesIndex++) {
    let rawVal = (u.data[seriesIndex]?.[actualIdx] ?? null) as number | null;

    if (stacked && rawVal != null && seriesIndex > 1) {
      const prevVal = u.data[seriesIndex - 1]?.[actualIdx] ?? 0;
      rawVal = rawVal - prevVal;
    }

    const s = u.series[seriesIndex] as uPlot.Series;
    const originalSerie = series?.[seriesIndex - 1];

    if (!originalSerie) {
      continue;
    }

    const metric = metadata[originalSerie.metric];
    if (!metric) {
      console.warn("Metric metadata not found");
      continue;
    }

    seenMetrics.add(originalSerie.metric);

    const attributes = originalSerie?.attributes || {};
    const attributesKeySetLength = Object.keys(attributes).length;
    if (attributesKeySetLength > 0) {
      hasAnyAttributes = true;

      if (attributesKeySetLength > maxAttributeKeySetCount) {
        maxAttributeKeySetCount = attributesKeySetLength;
      }

      for (const key in attributes) {
        seenAttributeKeys.add(key);
      }
    }

    const stroke = s?.stroke;
    const color: string =
      typeof stroke === "function"
        ? (stroke(u, seriesIndex) as string)
        : ((stroke as string) ?? "#ffffff00");

    const formattedValue =
      rawVal == null
        ? undefined
        : formatValue
          ? formatValue(rawVal)
          : String(rawVal);

    serieList.push({
      metric,
      color,
      value: rawVal === null ? undefined : rawVal,
      formattedValue,
      attributes,
      serie: s,
    });
  }

  return {
    serieList,
    options: {
      hasAttributes: hasAnyAttributes,
      hasMultipleMetrics: seenMetrics.size > 1,
      hasMultipleAttributes: seenAttributeKeys.size > 1,
      maxAttributeKeySetCount: maxAttributeKeySetCount,
      spansMultipleDays: checkIfSpansMultipleDays(xData, timeZone),
    },
  };
}

/**
 * Configuration interface for the Tooltip Plugin
 */
interface TooltipPluginConfig {
  formatValue: (v: number) => string;
  stacked: boolean;
  metadata: Record<string, LabeledMetricMetadata>;
  timeZone?: string;
  appearance?: React.ComponentType<TooltipProps>;
  series?: Serie[];
  visibilityLimit?: number;
  invertSort?: boolean;
  disableSuggestedLabel?: boolean;
}

class TooltipController {
  private over!: HTMLElement;
  private activeUplot: uPlot | null = null;
  private isHovering = false;

  private boundingLeft = 0;
  private boundingTop = 0;
  private lastCursorLeft: number | null = null;
  private lastCursorTop: number | null = null;

  constructor(private config: TooltipPluginConfig) {}

  public getHooks(): uPlot.Plugin["hooks"] {
    return {
      init: this.init.bind(this),
      setSize: this.syncBounds.bind(this),
      setCursor: this.handleCursor.bind(this),
      destroy: this.destroy.bind(this),
    };
  }

  private init(u: uPlot) {
    tooltipManager.initialize();
    this.over = u.over;
    this.activeUplot = u;

    window.addEventListener("scroll", this.handleWindowEvent, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", this.handleWindowEvent, {
      passive: true,
    });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("blur", this.cleanupHoverState);

    this.over.onmouseenter = this.handleMouseEnter;
    this.over.onmouseleave = this.cleanupHoverState;

    this.syncBounds();
  }

  private handleMouseEnter = () => {
    this.isHovering = true;
    tooltipManager.show();
  };

  private cleanupHoverState = () => {
    if (!this.isHovering) return;

    this.isHovering = false;
    this.lastCursorLeft = null;
    this.lastCursorTop = null;

    if (
      this.activeUplot &&
      tooltipManager.getRenderedUplot() === this.activeUplot
    ) {
      tooltipManager.hide(this.activeUplot);
    }
  };

  private handleVisibilityChange = () => {
    if (document.hidden) this.cleanupHoverState();
  };

  private handleWindowEvent = () => {
    if (this.syncBounds()) {
      this.positionTooltip();
    }
  };

  private handleCursor(u: uPlot) {
    this.syncBounds();
    const { left, top, idx } = u.cursor;

    // Safety guard: prevent background rendering & accumulation
    const shouldHide = !this.isHovering || idx == null || document.hidden;

    if (shouldHide) {
      if (tooltipManager.getRenderedUplot() === u) {
        tooltipManager.hide(u);
      }
      return;
    }

    const actualIdx = findNearestNonNullIndex(u, idx!);
    const timestamp = u.data[0][actualIdx];
    if (timestamp === undefined) return;

    // Build metric data and options for tooltip
    const { serieList, options } = buildTooltipSerieListParams(
      u,
      actualIdx,
      this.config.formatValue,
      this.config.stacked,
      this.config.metadata,
      this.config.series,
      this.config.timeZone,
    );

    tooltipManager.show();

    const tooltipElement = this.buildTooltipElement(
      timestamp,
      serieList,
      options,
    );
    tooltipManager.render(u, tooltipElement);

    this.lastCursorLeft = left || 0;
    this.lastCursorTop = top || 0;
    this.positionTooltip();
  }

  private buildTooltipElement(
    timestamp: number,
    serieList: TooltipSerie[],
    serieListOptions: TooltipSerieListOptions,
  ) {
    const {
      appearance: Appearance,
      timeZone,
      stacked,
      visibilityLimit,
      invertSort,
      disableSuggestedLabel,
    } = this.config;

    return Appearance ? (
      <Appearance
        timestamp={timestamp}
        serieList={serieList}
        options={{
          timeZone,
        }}
      />
    ) : (
      <Tooltip
        timestamp={timestamp}
        serieList={serieList}
        serieListOptions={serieListOptions}
        options={{
          timeZone,
          stacked,
          visibilityLimit,
          invertSort,
          disableSuggestedLabel,
        }}
      />
    );
  }

  private positionTooltip() {
    if (
      !this.isHovering ||
      this.lastCursorLeft == null ||
      this.lastCursorTop == null
    )
      return;

    tooltipManager.positionTooltip({
      left: this.lastCursorLeft + this.boundingLeft,
      top: this.lastCursorTop + this.boundingTop,
    });
  }

  private syncBounds(): boolean {
    const bbox = this.over.getBoundingClientRect();
    const changed =
      bbox.left !== this.boundingLeft || bbox.top !== this.boundingTop;
    this.boundingLeft = bbox.left;
    this.boundingTop = bbox.top;
    return changed;
  }

  private destroy() {
    this.cleanupHoverState();

    // Global listener cleanup
    window.removeEventListener("scroll", this.handleWindowEvent, true);
    window.removeEventListener("resize", this.handleWindowEvent);
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    window.removeEventListener("blur", this.cleanupHoverState);

    if (this.over) {
      this.over.onmouseenter = null;
      this.over.onmouseleave = null;
    }

    this.activeUplot = null;
  }
}

/**
 * Plugin function for uPlot
 */
export function tooltipPlugin(
  formatValue: (v: number) => string,
  stacked: boolean,
  metadata: Record<string, LabeledMetricMetadata>,
  timeZone?: string,
  appearance?: React.ComponentType<TooltipProps>,
  series?: Serie[],
  visibilityLimit?: number,
  invertSort?: boolean,
  disableSuggestedLabel?: boolean,
) {
  const controller = new TooltipController({
    formatValue,
    stacked,
    metadata,
    timeZone,
    appearance,
    series,
    visibilityLimit,
    invertSort,
    disableSuggestedLabel,
  });

  return {
    hooks: controller.getHooks(),
  };
}
