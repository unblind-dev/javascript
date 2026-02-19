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

/**
 * Builds tooltip items from uPlot data
 */
function buildTooltipSerieList(
  u: uPlot,
  actualIdx: number,
  formatValue: (v: number) => string,
  stacked: boolean,
  metadata: Record<string, LabeledMetricMetadata>,
  series?: Serie[],
  timeZone?: string,
): {
  tooltipSerieList: TooltipSerie[];
  hasAttributes: boolean;
  hasMultipleMetrics: boolean;
  hasMultipleAttributes: boolean;
  spansMultipleDays: boolean;
} {
  const tooltipSerieList: TooltipSerie[] = [];
  const xData = u.data[0];

  // Track unique metrics and attributes efficiently
  const seenMetrics = new Set<string>();
  const seenAttributeKeys = new Set<string>();
  let hasAnyAttributes = false;

  for (let seriesIndex = 1; seriesIndex < u.series.length; seriesIndex++) {
    let rawVal = (u.data[seriesIndex]?.[actualIdx] ?? null) as number | null;

    if (stacked && rawVal != null && seriesIndex > 1) {
      const prevVal = u.data[seriesIndex - 1]?.[actualIdx] ?? 0;
      rawVal = rawVal - prevVal;
    }

    const s = u.series[seriesIndex] as uPlot.Series;
    const originalSerie = series?.[seriesIndex - 1];

    if (!originalSerie) {
      console.warn("Original serie not found");
      continue;
    }

    const metric = metadata[originalSerie.metric];
    if (!metric) {
      console.warn("Metric metadata not found");
      continue;
    }

    seenMetrics.add(originalSerie.metric);

    const attributes = originalSerie?.attributes;
    if (attributes && Object.keys(attributes).length > 0) {
      hasAnyAttributes = true;

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

    tooltipSerieList.push({
      metric,
      color,
      value: rawVal === null ? undefined : rawVal,
      formattedValue,
      attributes,
      serie: s,
    });
  }

  return {
    tooltipSerieList,
    hasAttributes: hasAnyAttributes,
    hasMultipleMetrics: seenMetrics.size > 1,
    hasMultipleAttributes: seenAttributeKeys.size > 1,
    spansMultipleDays: checkIfSpansMultipleDays(xData, timeZone),
  };
}

/**
 * uPlot plugin for interactive tooltips
 * Extracted from: https://github.com/leeoniya/uPlot/blob/master/demos/cursor-tooltip.html
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
  let over: HTMLElement;
  let boundingLeft: number;
  let boundingTop: number;
  let isHovering = false;

  function syncBounds(): void {
    const bbox = over.getBoundingClientRect();
    boundingLeft = bbox.left;
    boundingTop = bbox.top;
  }

  return {
    hooks: {
      init: (u: uPlot) => {
        tooltipManager.initialize();
        over = u.over;

        window.addEventListener("scroll", syncBounds, true);
        window.addEventListener("resize", syncBounds);

        over.onmouseenter = () => {
          isHovering = true;
          tooltipManager.show();
        };

        over.onmouseleave = () => {
          isHovering = false;

          if (tooltipManager.getRenderedUplot() === u) {
            tooltipManager.hide(u);
          }
        };

        syncBounds();
      },

      setSize: () => {
        syncBounds();
      },

      setCursor: (u: uPlot) => {
        const { left, top, idx } = u.cursor;
        const shouldHideTooltip = !isHovering || idx == null;

        if (shouldHideTooltip) {
          if (tooltipManager.getRenderedUplot() === u) {
            tooltipManager.hide(u);
          }
          return;
        }

        const actualIdx = findNearestNonNullIndex(u, idx);
        const timestamp = u.data[0][actualIdx];

        if (timestamp === undefined) {
          return;
        }

        const {
          tooltipSerieList,
          hasAttributes,
          hasMultipleAttributes,
          hasMultipleMetrics,
          spansMultipleDays,
        } = buildTooltipSerieList(
          u,
          actualIdx,
          formatValue,
          stacked,
          metadata,
          series,
          timeZone,
        );

        tooltipManager.show();

        const AppearanceTooltip = appearance;
        const tooltipElement = AppearanceTooltip ? (
          <AppearanceTooltip
            timestamp={timestamp}
            tooltipSerieList={tooltipSerieList}
            timeZone={timeZone}
          />
        ) : (
          <Tooltip
            timestamp={timestamp}
            tooltipSerieList={tooltipSerieList}
            timeZone={timeZone}
            spansMultipleDays={spansMultipleDays}
            stacked={stacked}
            hasAttributes={hasAttributes}
            hasMultipleAttributes={hasMultipleAttributes}
            hasMultipleMetrics={hasMultipleMetrics}
            visibilityLimit={visibilityLimit}
            invertSort={invertSort}
            disableSuggestedLabel={disableSuggestedLabel}
          />
        );

        tooltipManager.render(u, tooltipElement);
        tooltipManager.positionTooltip({
          left: (left || 0) + boundingLeft,
          top: (top || 0) + boundingTop,
        });
      },

      destroy(u: uPlot) {
        window.removeEventListener("scroll", syncBounds, true);
        window.removeEventListener("resize", syncBounds);

        if (over) {
          over.onmouseenter = null;
          over.onmouseleave = null;
        }

        if (tooltipManager.getRenderedUplot() === u) {
          tooltipManager.hide(u);
        }
      },
    },
  };
}
