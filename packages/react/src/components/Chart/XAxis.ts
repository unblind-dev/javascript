import {
  dateTimeFormat,
  dateTimeFormatTimeAgo,
  systemDateFormats,
} from "@unblind/units";
import { getChartFont } from "./utils";

// Time unit sizes in milliseconds
const timeUnitSize = {
  millisecond: 1,
  second: 1000,
  minute: 60000,
  hour: 3600000,
  day: 86400000,
  month: 2419200000, // 28 days
  year: 31536000000,
};

// Time axis increments (in seconds)
const timeIncrs = {
  second: [1, 2, 5, 10, 15, 30],
  minute: [1, 2, 5, 10, 15, 30],
  hour: [1, 2, 3, 4, 6, 8, 12],
  day: [1, 2, 3, 7, 14],
  month: [1, 2, 3, 6],
  year: [1, 2, 5, 10, 20, 50, 100],
};

function formatTime(
  splits: number[],
  foundIncr: number,
  timeZone?: string,
): string[] {
  // Handle Month/Year increments
  if (foundIncr > 7 * timeUnitSize.day) {
    let format = systemDateFormats.interval.year;

    const yearRoundedToDay =
      Math.round(timeUnitSize.year / timeUnitSize.day) * timeUnitSize.day;
    const incrementRoundedToDay =
      Math.round(foundIncr / timeUnitSize.day) * timeUnitSize.day;

    if (incrementRoundedToDay === yearRoundedToDay) {
      format = systemDateFormats.interval.year;
    } else if (foundIncr <= timeUnitSize.year) {
      return splits.map((v) => {
        const date = new Date(v);
        const day = timeZone === "UTC" ? date.getUTCDate() : date.getDate();

        if (day === 1) {
          return date.toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
            timeZone,
          });
        } else {
          return date.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            timeZone,
          });
        }
      });
    } else {
      format = systemDateFormats.interval.day;
    }

    return splits.map((v) => dateTimeFormat(v, { format, timeZone }));
  }

  // Handle Intraday (Hours, Minutes, Seconds)
  return splits.map((v) => {
    const date = new Date(v);

    const showSeconds = foundIncr < timeUnitSize.minute;
    const showMillis = foundIncr < timeUnitSize.second;

    // Check for Midnight in the specific TimeZone
    // We use "en-GB" here strictly to check the "00:00" pattern reliably
    // without worrying about AM/PM locale differences in the logic.
    const checkTimeStr = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    });

    // IF it is midnight (and we aren't zooming into seconds), SHOW DATE
    if (
      (checkTimeStr === "00:00" || checkTimeStr === "24:00") &&
      !showSeconds &&
      !showMillis
    ) {
      return date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        timeZone,
      });
    }

    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: showSeconds ? "2-digit" : undefined,
      fractionalSecondDigits: showMillis ? 3 : undefined,
      hour12: false,
      timeZone,
    });
  });
}

/**
 * X-Axis: Tick interval selection.
 * Picks the best increment size based on target spacing
 */
function findBestIncrement(targetSeconds: number): {
  increment: number;
  multiplier: number;
} {
  const scales = [
    { size: timeUnitSize.second / 1000, increments: timeIncrs.second },
    { size: timeUnitSize.minute / 1000, increments: timeIncrs.minute },
    { size: timeUnitSize.hour / 1000, increments: timeIncrs.hour },
    { size: timeUnitSize.day / 1000, increments: timeIncrs.day },
    { size: timeUnitSize.month / 1000, increments: timeIncrs.month },
    { size: timeUnitSize.year / 1000, increments: timeIncrs.year },
  ];

  for (const scale of scales) {
    for (const mult of scale.increments) {
      const incr = scale.size * mult;
      if (incr >= targetSeconds) {
        return { increment: incr * 1000, multiplier: mult };
      }
    }
  }

  // Fallback to largest year increment
  const lastScale = scales[scales.length - 1] as (typeof scales)[0];
  const lastMult = lastScale.increments[
    lastScale.increments.length - 1
  ] as number;
  return {
    increment: lastScale.size * lastMult * 1000,
    multiplier: lastMult,
  };
}

/**
 * X-Axis: Generates splits using the x latest timestamp and soonest timestamp.
 */
function generateRelativeXAxisSplits(
  _: uPlot,
  min: number,
  max: number,
): number[] {
  return [min, max];
}

/**
 * X-Axis: Format splits for relative time axis (only show labels at first and last)
 */
function generateRelativeXAxisValues(
  u: uPlot,
  splits: number[],
  timeZone?: string,
): string[] {
  if (splits.length === 0) return [];

  return splits.map((timestamp) => {
    return dateTimeFormatTimeAgo(timestamp * 1000, { timeZone });
  });
}

/**
 * X-Axis: Format splits into display labels
 */
function generateXAxisValues(
  u: uPlot,
  splits: number[],
  timeZone?: string,
): string[] {
  const scale = u.scales.x;
  const range = (scale?.max ?? 0) - (scale?.min ?? 0);
  const approxTicks = Math.floor(u.width / 100);
  const targetSeconds = range / approxTicks;
  const { increment } = findBestIncrement(targetSeconds);

  // Convert splits from seconds to milliseconds for formatTime
  const splitsInMs = splits.map((s) => s * 1000);
  return formatTime(splitsInMs, increment, timeZone);
}

/**
 * X-Axis: Create complete axis configuration
 */
export function createXAxisConfig(
  fontFamily: string,
  timeZone?: string,
  relativeTimeAxis: boolean = false,
  hideAxis: boolean = false,
): uPlot.Axis {
  const splits: uPlot.Axis.Splits | undefined = relativeTimeAxis
    ? (u, _, min, max) => generateRelativeXAxisSplits(u, min, max)
    : undefined;
  const values: uPlot.Axis.Values = relativeTimeAxis
    ? (u, splits) => generateRelativeXAxisValues(u, splits, timeZone)
    : (u, splits) => generateXAxisValues(u, splits, timeZone);

  return {
    font: getChartFont(fontFamily),
    labelFont: getChartFont(fontFamily),
    grid: {
      show: false,
      width: 0.5,
    },
    ticks: {
      width: 0.5,
    },
    splits,
    values,
    size: 20,
    show: !hideAxis,
    align: relativeTimeAxis ? 2 : undefined,
    space: (_self, _axisIdx, _scaleMin, _scaleMax, plotDim) => {
      if (plotDim < 400) {
        return 100;
      } else if (plotDim < 800) {
        return 150;
      } else {
        return 250;
      }
    },
  };
}
