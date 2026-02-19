import uPlot from "uplot";
import { getChartFont } from "./utils";
import { StackedData } from "@/types";

export const calculateNiceStep = (maxMin: number, maxTicks: number = 4) => {
  // Determine step size based on min/max value (targeting ~4-5 ticks)
  const roughStep = maxMin / maxTicks;

  // Round to "nice" numbers (1, 2, 5) at any magnitude
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

const usePredefinedIfExists = (
  predefinedNumber: number | undefined,
  defaultNumber: number,
) => {
  return typeof predefinedNumber === "number"
    ? predefinedNumber
    : defaultNumber;
};

export const buildScaleRange: (
  unit: string | undefined,
  predefinedMin?: number | undefined,
  predefinedMax?: number | undefined,
) => uPlot.Scale.Range = (
  unit: string | undefined,
  predefinedMin?: number | undefined,
  predefinedMax?: number | undefined,
) => {
  return (_: uPlot, dataMin: number, dataMax: number) => {
    if (dataMin === 0 && dataMax === 0) {
      return [
        usePredefinedIfExists(predefinedMin, 0),
        usePredefinedIfExists(predefinedMax, 100),
      ];
    }
    // Add a bit of padding at the top
    const padding = 1;
    const max = dataMax * (1 + padding);
    const min = dataMin < 0 ? dataMin * (1 + padding) : dataMin * (1 - padding);

    if (unit === "percent" || unit === "percentunit") {
      // Percentunit ranges from 0 to 1
      const percentMax = unit === "percent" ? 100 : 1;
      if (dataMax > percentMax) {
        if (dataMin < 0) {
          return [
            usePredefinedIfExists(predefinedMin, min),
            usePredefinedIfExists(predefinedMax, max),
          ];
        }
        return [
          usePredefinedIfExists(predefinedMin, 0),
          usePredefinedIfExists(predefinedMax, max),
        ];
      } else if (dataMin < 0) {
        return [
          usePredefinedIfExists(predefinedMin, min),
          usePredefinedIfExists(predefinedMax, percentMax),
        ];
      }

      // Normal case
      return [
        usePredefinedIfExists(predefinedMin, 0),
        usePredefinedIfExists(predefinedMax, percentMax),
      ];
    }

    // For edge case where max is 0 or very close to 0
    if (dataMax <= 0.9999) {
      if (dataMin <= 0) {
        return [
          usePredefinedIfExists(predefinedMin, min),
          usePredefinedIfExists(predefinedMax, 1),
        ];
      }
      return [
        usePredefinedIfExists(predefinedMin, 0),
        usePredefinedIfExists(predefinedMax, 1),
      ];
    }

    const niceMax = calculateNiceStep(max);
    const niceMin = calculateNiceStep(Math.abs(min));

    // Important to not do <= 0, otherwise will break some edge cases where dataMin = 0
    if (dataMin < 0) {
      return [
        usePredefinedIfExists(predefinedMax, -niceMin),
        usePredefinedIfExists(predefinedMax, niceMax),
      ];
    }

    return [
      usePredefinedIfExists(predefinedMin, 0),
      usePredefinedIfExists(predefinedMax, niceMax),
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
    space: (self, _axisIdx, _scaleMin, _scaleMax, _plotDim) => {
      const height = self.height;
      if (height <= 100) {
          return 30; // At least 2 ticks, better if 3
      } if (height <= 150) {
          return 35; // Bettween 3 and 4 ticks
      } if (height <= 200) {
        return 45; // Between 3 and 4 ticks
      } else if (height <= 250) {
          return 55; // Between 3 and 4 ticks
      } if (height <= 300) {
        return 60; // Between 4 and 5 ticks
      } else {
        return 70; // At least 4 ticks
      }
    },
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
