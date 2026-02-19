import {
  ChartType,
  Colors,
  isLineThreshold,
  isRangeThreshold,
  MetricMetadata,
  Serie,
  StackedData,
  Threshold,
  ThresholdLevel,
  ThresholdLineType,
} from "@/types";

import uPlot from "uplot";
import { getValueFormat } from "@unblind/units";
import { createXAxisConfig } from "./XAxis";
import { buildScaleRange, createYAxisConfig } from "./YAxis";
import { TooltipProps } from "../Tooltip";
import { tooltipPlugin } from "../Tooltip/plugin";

/**
 * Default chart color palette.
 *
 * Note:
 * Colors are cycled in order when the number of series exceeds
 * the palette length.
 */
export const DEFAULT_COLORS: string[] = [
  "oklch(0.70 0.24 293)",
  "oklch(0.85 0.18 95)",
  "oklch(0.65 0.25 255)",
  "oklch(0.72 0.26 27)",
  "oklch(0.70 0.22 150)",
  "oklch(0.78 0.18 50)",
  "oklch(0.72 0.18 215)",
  "oklch(0.70 0.27 301)",
  "oklch(0.75 0.20 90)",
  "oklch(0.68 0.23 277)",
  "oklch(0.70 0.18 193)",
  "oklch(0.68 0.25 4)",
];

/**
 * Gets the chart font from CSS variables
 *
 * We want to use the same font style the application is using.
 * Some sort of manual font heritage.
 */
export const getChartFont = (fontFamiliy: string) => {
  const style = getComputedStyle(document.documentElement);
  const fontStyle = `${style.getPropertyValue("--ub-chart-font-size").trim()} ${fontFamiliy}`;

  return fontStyle;
};

export const compareAndResolveUnit = (
  paramsUnit?: string,
  metricMetadata?: MetricMetadata,
) => {
  let unit = paramsUnit;

  if (
    metricMetadata &&
    metricMetadata.unit &&
    metricMetadata.unit.code &&
    metricMetadata.unit.code !== "1"
  ) {
    if (!unit && metricMetadata.unit) {
      unit = metricMetadata.unit.code;
    } else if (unit && metricMetadata.unit.code !== unit) {
      unit = undefined;
    }
  }

  return unit;
};

// Type guards for colors
export function isColorsObject(
  colors: Colors,
): colors is { fill: string[]; border: string[] } {
  return (
    typeof colors === "object" &&
    colors !== null &&
    !Array.isArray(colors) &&
    Array.isArray(
      (colors as { fill: Array<string>; border: Array<string> }).fill,
    ) &&
    Array.isArray(colors.border)
  );
}

export function isColorsArray(colors: Colors): colors is string[] {
  return Array.isArray(colors);
}

export function isColorsFunction(
  colors: Colors,
): colors is (
  serie: Serie,
  index: number,
  type: ChartType,
  isFilling?: boolean,
) => string {
  return typeof colors === "function";
}

const MAX_COLORS = 12;

const getFillingColor = ({
  isFilling,
  useSolid,
  index,
}: {
  isFilling?: boolean;
  useSolid: boolean;
  index: number;
}) => {
  const colorIndex = (index % MAX_COLORS) + 1;

  if (isFilling) {
    return useSolid
      ? `--ub-chart-serie-color-${colorIndex}`
      : `--ub-chart-serie-fill-color-${colorIndex}`;
  }

  return `--ub-chart-serie-color-${colorIndex}`;
};

// Util to get a color from the colros variable.
export const getColor = (
  serie: Serie,
  index: number,
  colors: Colors | undefined,
  type: ChartType,
  computedStyle: CSSStyleDeclaration,
  isFilling?: boolean,
) => {
  const useSolid = type === "bar" || type === "area";

  if (colors) {
    // User provided
    if (isColorsArray(colors)) {
      return colors[index];
    } else if (isColorsObject(colors)) {
      return isFilling ? colors.fill[index] : colors.border[index];
    } else {
      return colors(serie, index, type, isFilling);
    }
  }

  // If no colors provided, try to get from CSS variables
  const cssColorVar = getFillingColor({ isFilling, useSolid, index });
  const cssColor = computedStyle.getPropertyValue(cssColorVar).trim();

  if (cssColor) {
    return cssColor;
  }

  // Static fallback
  return isFilling && useSolid
    ? DEFAULT_COLORS[index % DEFAULT_COLORS.length]?.replace(")", " / 0.4)")
    : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
};

// ============================================================================
// Chart Path & Fill Generation
// ============================================================================

/**
 * Generates the path for a particular chart type
 */
const generatePath = (type: "bar" | "line" | "area" | "step" | "spline") => {
  const barsPath = uPlot.paths.bars!({ size: [0.6, 100], radius: 0, gap: 0 });
  const linearPath = uPlot.paths.linear!({
    alignGaps: 0,
  });
  const splinePath = uPlot.paths.spline!({ alignGaps: 1 });
  const steppedPath = uPlot.paths.stepped!({ alignGaps: 1 });

  switch (type) {
    case "line":
      return linearPath;
    case "bar":
      return barsPath;
    case "area":
      return linearPath;
    case "step":
      return steppedPath;
    case "spline":
      return splinePath;
    default:
      return linearPath;
  }
};

/**
 * Fill color for a particular chart type
 */
const generateFill = (
  serie: Serie,
  index: number,
  colors: Colors | undefined,
  type: ChartType,
  computedStyle: CSSStyleDeclaration,
) => {
  return getColor(serie, index, colors, type, computedStyle, true);
};

// ============================================================================
// Chart Utilities
// ============================================================================

const getStrokeWidthByType = (type: ChartType, fill: boolean): number => {
  switch (type) {
    case "bar":
      return 1;
    case "line":
      return fill ? 1.5 : 2;
    case "spline":
      return fill ? 1.5 : 2;
    case "area":
      return 1;
    case "step":
      return 1.5;
    default:
      return 1;
  }
};

const cursorMovement: uPlot.Cursor.MousePosRefiner = (u, left, top) => {
  if (left < 0 || top < 0) {
    // Return early if it is out of bounds
    return [left, top];
  }

  const xVal = u.posToVal(left, "x");

  const xData = u.data[0];
  if (!xData || xData.length === 0) {
    return [left, top];
  }

  let nearestIdx = 0;

  let lo = 0;
  let hi = xData.length - 1;

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const midVal = xData[mid];
    if (midVal != null && midVal < xVal) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const loVal = xData[lo];
  const hiVal = xData[hi];
  if (loVal != null && hiVal != null) {
    nearestIdx = Math.abs(loVal - xVal) < Math.abs(hiVal - xVal) ? lo : hi;
  } else if (loVal != null) {
    nearestIdx = lo;
  } else if (hiVal != null) {
    nearestIdx = hi;
  }

  // Search backward from nearestIdx to find first non-null value
  let snapIdx = nearestIdx;
  for (let i = nearestIdx; i >= 0; i--) {
    let hasValue = false;

    for (let j = 1; j < u.data.length; j++) {
      const seriesData = u.data[j];
      if (seriesData && seriesData[i] != null) {
        hasValue = true;
        break;
      }
    }
    if (hasValue) {
      snapIdx = i;
      break;
    }
  }

  const snapVal = xData[snapIdx];
  if (snapVal == null) {
    return [left, top];
  }

  const snappedLeft = u.valToPos(snapVal, "x");

  return [snappedLeft, top];
};

const mutateAxisGridAndTextColor = (
  opts: uPlot.Options,
  computedStyle: CSSStyleDeclaration,
) => {
  const textColor = computedStyle
    .getPropertyValue("--ub-chart-font-color")
    .trim();
  const gridColor = computedStyle
    .getPropertyValue("--ub-chart-grid-color")
    .trim();

  const xAxis = opts.axes?.[0];
  const yAxis = opts.axes?.[1];
  if (xAxis) {
    xAxis.stroke = textColor;
    if (xAxis.grid) {
      xAxis.grid.stroke = gridColor;
    } else {
      xAxis.grid = {
        stroke: gridColor,
      };
    }
  }

  if (yAxis) {
    yAxis.stroke = textColor;
    if (yAxis.grid) {
      yAxis.grid.stroke = gridColor;
    } else {
      yAxis.grid = {
        stroke: gridColor,
      };
    }
  }

  return opts;
};

// ============================================================================
// Thresholds
// ============================================================================

const getThresholdColor = (
  computedStyle: CSSStyleDeclaration,
  level?: ThresholdLevel,
): string => {
  return (
    computedStyle.getPropertyValue(`--ub-chart-threshold-${level}`).trim() ||
    computedStyle.getPropertyValue("--ub-chart-threshold-default").trim()
  );
};

const getThresholdRangeFillColor = (
  computedStyle: CSSStyleDeclaration,
  level?: ThresholdLevel,
): string => {
  return (
    computedStyle
      .getPropertyValue(`--ub-chart-threshold-${level}-fill`)
      .trim() ||
    computedStyle.getPropertyValue("--ub-chart-threshold-default-fill").trim()
  );
};

const getThresholdWidth = (lineType?: ThresholdLineType): number => {
  switch (lineType) {
    case "bold":
      return 2;
    case "line":
      return 1;
    case "dashed":
      return 1;
    default:
      return 1;
  }
};

const getThresholdDash = (
  lineType?: ThresholdLineType,
): number[] | undefined => {
  return lineType === "line" ? undefined : [5, 5];
};

const createThresholds = (
  computedStyle: CSSStyleDeclaration,
  thresholds?: Array<Threshold>,
): Array<uPlot.Series> => {
  if (!thresholds) {
    return [];
  } else {
    const thresholdSeries: Array<uPlot.Series> = [];

    thresholds.forEach((threshold) => {
      const thresholdSerie = {
        label: threshold.label,
        stroke: getThresholdColor(computedStyle, threshold.level),
        width: getThresholdWidth(),
        dash: getThresholdDash(threshold.type),
        points: { show: false, size: 0 },
        spanGaps: true,
        show: true,
        auto: false,
      };

      if (isLineThreshold(threshold)) {
        thresholdSeries.push(thresholdSerie);
      } else {
        thresholdSeries.push(thresholdSerie);
        thresholdSeries.push(thresholdSerie);
      }
    });

    return thresholdSeries;
  }
};

// ============================================================================
// Chart Options Creation
// ============================================================================
export const createChartBands = (
  series: Array<Serie>,
  stackedData: StackedData,
  computedStyle: CSSStyleDeclaration,
  thresholds?: Array<Threshold>,
) => {
  if (!thresholds || !thresholds.some((x) => isRangeThreshold(x))) {
    return stackedData.bands;
  }

  const rangeThresholdBands = thresholds
    .map((threshold, idx) => {
      if (isLineThreshold(threshold)) {
        return null;
      }

      return {
        series: [series.length + idx * 2 + 1, series.length + idx * 2 + 2],
        fill: getThresholdRangeFillColor(computedStyle, threshold.level),
        dir: 1,
      };
    })
    .filter((band) => band !== null);

  return [...stackedData.bands, ...rangeThresholdBands];
};

const createChartSeries = (
  series: Array<Serie>,
  type: ChartType,
  colors: Colors | undefined,
  fill: boolean,
  stacked: boolean,
  computedStyle: CSSStyleDeclaration,
  thresholds?: Array<Threshold>,
): Array<uPlot.Series> => {
  const strokeWidth = getStrokeWidthByType(type, fill);
  return [
    {},
    ...series.map((serie, index) => ({
      label: serie.metric,
      stroke: getColor(serie, index, colors, type, computedStyle),
      width: strokeWidth,
      points: { show: false },
      spanGaps: true,
      paths: generatePath(type),
      fill:
        fill || stacked
          ? generateFill(serie, index, colors, type, computedStyle)
          : undefined,
    })),
    ...createThresholds(computedStyle, thresholds),
  ];
};

const parseUnit = (unit?: string) => {
  if (typeof unit === "string") {
    const sUnit = String(unit).toLowerCase().trim();
    if (sUnit === "by") {
      return "bytes";
    } else if (sUnit.startsWith("{") && sUnit.endsWith("}")) {
      // This is not always the case but is preferable over rendering {unit}
      // e.g. {cpu} or {cores}
      return "short";
    }
  }

  return unit;
};

/**
 * Creates the complete uPlot options object for the chart
 */
export const createChartOptions = (
  container: HTMLDivElement,
  metadata: Record<string, MetricMetadata>,
  stackedData: StackedData,
  unit: string | undefined,
  series: Array<Serie>,
  type: ChartType,
  stacked: boolean,
  colors: Colors | undefined,
  fill: boolean,
  timeZone?: string,
  tooltipComponent?: React.ComponentType<TooltipProps>,
  relativeTimeAxis?: boolean,
  hideTooltip?: boolean,
  thresholds?: Array<Threshold>,
  predefinedMin?: number,
  predefinedMax?: number,
  hideAxis?: boolean,
  hideCursor?: boolean,
  visibilityLimit?: number,
  invertSort?: boolean,
  disableSuggestedLabel?: boolean,
): uPlot.Options => {
  const computedStyle = window.getComputedStyle(container);
  const fontFamily = computedStyle.fontFamily;

  const initialWidth = container?.clientWidth ?? 1050;
  const initialHeight = container?.clientHeight ?? 250;
  const formatUnit = parseUnit(unit);
  const formatter = getValueFormat(formatUnit === "1" ? null : formatUnit);
  const formattingFunction = (v: number) => {
    const f = formatter(v);
    return f.text + (f.suffix?.trim() || "");
  };

  const opts: uPlot.Options = {
    width: initialWidth,
    height: initialHeight,
    scales: {
      y: {
        range: buildScaleRange(unit, predefinedMin, predefinedMax),
      },
    },
    plugins: hideTooltip
      ? []
      : [
          tooltipPlugin(
            formattingFunction,
            stacked,
            metadata,
            timeZone,
            tooltipComponent,
            series,
            visibilityLimit,
            invertSort,
            disableSuggestedLabel,
          ),
        ],
    // [top, right, bottom, left];
    padding: relativeTimeAxis ? [8, 10, 8, 48] : [8, 10, 8, 18],
    cursor: {
      y: false,
      sync: { key: "_" },
      drag: {
        setScale: true,
        x: true,
        y: false,
      },
      move: cursorMovement,
      show: !hideCursor,
    },
    series: createChartSeries(
      series,
      type,
      colors,
      fill,
      stacked,
      computedStyle,
      thresholds,
    ),
    bands: createChartBands(series, stackedData, computedStyle, thresholds) as
      | uPlot.Band[]
      | undefined,
    axes: [
      createXAxisConfig(fontFamily, timeZone, relativeTimeAxis, hideAxis),
      createYAxisConfig(formatter, fontFamily, hideAxis),
    ],
    legend: {
      show: false,
    },
  };

  return mutateAxisGridAndTextColor(opts, computedStyle);
};
