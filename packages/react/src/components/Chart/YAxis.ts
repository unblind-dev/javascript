import uPlot from "uplot";
import { getChartFont } from "./utils";
import { StackedData } from "@/types";
import { getSplitsBuilder } from "./splits";

/**
 * As with other parts of a chart, we want to have nice looking space for each step.
 */
export const calculateNiceStep = (maxMin: number, maxTicks: number = 4) => {
  const roughStep = maxMin / maxTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  let niceStep;
  if (residual > 5) {
    niceStep = 10 * magnitude;
  } else if (residual > 2) {
    niceStep = 5 * magnitude;
  } else if (residual > 1) {
    niceStep = 2 * magnitude;
  } else {
    niceStep = magnitude;
  }
  const niceVal = Math.ceil(maxMin / niceStep) * niceStep;

  return niceVal;
};

/**
 * Just a util function to avoid repeating the same code.
 * @param predefinedNumber
 * @param defaultNumber
 * @returns `predefinedNumber` if declared, otherwise `defaultNumber`
 */
const usePredefinedIfExists = (
  predefinedNumber: number | undefined,
  defaultNumber: number,
) => {
  return typeof predefinedNumber === "number"
    ? predefinedNumber
    : defaultNumber;
};

const PADDING_FACTOR = 0.5;

function niceMax(value: number): number {
  return calculateNiceStep(value * (1 + PADDING_FACTOR));
}

function niceMin(value: number): number {
  return value < 0
    ? -calculateNiceStep(Math.abs(value) * (1 + PADDING_FACTOR))
    : 0;
}

/**
 * Custom scale range for predefined units:
 *  1. Percent/Percent Unit: [0, 100]
 *  2. Small ones: [0, 1]
 *  3. Normal for the rest
 */
export const buildScaleRange: (
  unit: string | undefined,
  predefinedMin?: number,
  predefinedMax?: number,
) => uPlot.Scale.Range = (unit, predefinedMin, predefinedMax) => {
  return (_: uPlot, dataMin: number, dataMax: number) => {
    if (dataMin === 0 && dataMax === 0) {
      return [
        usePredefinedIfExists(predefinedMin, 0),
        usePredefinedIfExists(predefinedMax, unit === "percentunit" ? 1 : 100),
      ];
    }

    if (dataMax > 0 && dataMax <= 0.9999) {
      return [
        usePredefinedIfExists(
          predefinedMin,
          dataMin < 0 ? niceMin(dataMin) : 0,
        ),
        usePredefinedIfExists(predefinedMax, 1),
      ];
    }

    const computedMax = niceMax(dataMax);
    const computedMin = niceMin(dataMin);

    if (unit === "percent" || unit === "percentunit") {
      const naturalMax = unit === "percent" ? 100 : 1;
      return [
        usePredefinedIfExists(predefinedMin, computedMin),
        usePredefinedIfExists(
          predefinedMax,
          dataMax > naturalMax ? computedMax : naturalMax,
        ),
      ];
    }

    return [
      usePredefinedIfExists(predefinedMin, computedMin),
      usePredefinedIfExists(predefinedMax, computedMax),
    ];
  };
};

/**
 * Y-Axis: Calculate axis size based on longest value label
 */
const calculateYAxisSize = (
  self: uPlot,
  values: Array<string>,
  axisIdx: number,
  cycleNum: number,
): number => {
  const axis = self.axes[axisIdx];

  // bail out, force convergence
  if (cycleNum > 1)
    // Do not use .size, it doesn't work. Use ._size instead.
    return (axis as { _size: number })?._size || 0;

  let axisSize = (axis?.ticks?.size || 0) + (axis?.gap || 0);

  // find longest value
  const longestVal = (values ?? []).reduce(
    (acc, val) => (val.length > acc.length ? val : acc),
    "",
  );

  if (longestVal != "") {
    self.ctx.font = axis?.font?.[0] ?? self.ctx.font;
    axisSize += self.ctx.measureText(longestVal).width / devicePixelRatio;
  }

  return Math.ceil(axisSize);
};

/**
 * Y-Axis: Create complete axis configuration
 */
export function createYAxisConfig(
  formatter: (
    v: number,
    decimals?: number,
  ) => { text: string; suffix?: string },
  fontFamiliy: string,
  hideAxis?: boolean,
  unit?: string,
): uPlot.Axis {
  return {
    gap: 0,
    font: getChartFont(fontFamiliy),
    labelFont: getChartFont(fontFamiliy),
    grid: {
      show: true,
      width: 0.5,
    },
    ticks: {
      width: 0.5,
    },
    values: (_, vals) =>
      vals.map((v) => {
        const formmatedVal = formatter(v);
        return formmatedVal.text + (formmatedVal.suffix?.trim() || "");
      }),
    size: calculateYAxisSize,
    space: (self) => {
      const height = self.height;
      if (height <= 100) {
        return 30; // At least 2 ticks, better if 3
      } else if (height <= 150) {
        return 35; // Bettween 3 and 4 ticks
      } else if (height <= 200) {
        return 45; // Between 3 and 4 ticks
      } else if (height <= 250) {
        return 55; // Between 3 and 4 ticks
      } else if (height <= 300) {
        return 60; // Between 4 and 5 ticks
      } else {
        return 70; // At least 4 ticks
      }
    },
    splits: getSplitsBuilder(unit),
    show: !hideAxis,
  };
}

/**
 * Stacking data for bar charts
 * Extracted and mutated from: https://github.com/leeoniya/uPlot/blob/master/demos/stack.js
 */
export function stack(data: uPlot.AlignedData, omit: boolean): StackedData {
  const bands: Array<uPlot.Band> = [];
  const xAxis = data[0];
  const xAxisLen = xAxis.length;
  const accum = Array(xAxisLen).fill(0);
  const accumData: Array<uPlot.AlignedData[number]> = [xAxis];

  data.forEach((serie, i) => {
    // Skip x-axis
    if (i === 0) return;
    if (omit) {
      accumData.push(serie);
    } else {
      accumData.push(
        serie.map(
          (value, index) => (accum[index] = accum[index] + (value || 0)),
        ),
      );
    }
  });

  if (!omit) {
    for (let i = 1; i < data.length - 1; i++) {
      bands.push({
        series: [i + 1, i],
      });
    }
  }

  return {
    data: accumData,
    bands: bands.filter((b) => b.series[1] > -1),
  };
}
