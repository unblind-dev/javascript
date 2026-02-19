/**
 * Chart utilities for Storybook
 * Provides functions to generate times, series, and metadata for chart components
 */

import {
  AggregationOperator,
  MetricMetadata,
  MetricType,
  Serie,
} from "@/types";

// Time utilities
type TimeUnit = "minute" | "hour" | "day" | "week" | "month";

interface TimeGenerationOptions {
  duration: number;
  durationUnit: TimeUnit;
  interval: number;
  intervalUnit: TimeUnit;
}

/**
 * Convert time unit to seconds
 */
function getSeconds(value: number, unit: TimeUnit): number {
  const SECONDS_PER_UNIT: Record<TimeUnit, number> = {
    minute: 60,
    hour: 60 * 60,
    day: 24 * 60 * 60,
    week: 7 * 24 * 60 * 60,
    month: 30 * 24 * 60 * 60, // Approximate
  };
  return value * SECONDS_PER_UNIT[unit];
}

/**
 * Generate an array of Unix timestamps (in seconds)
 *
 * @example
 * // Generate timestamps for the last 24 hours with 1-hour intervals
 * const times = generateTimes({
 *   duration: 24,
 *   durationUnit: 'hour',
 *   interval: 1,
 *   intervalUnit: 'hour'
 * });
 *
 * @example
 * // Generate timestamps for the last week with 1-day intervals
 * const times = generateTimes({
 *   duration: 1,
 *   durationUnit: 'week',
 *   interval: 1,
 *   intervalUnit: 'day'
 * });
 */
export function generateTimes(options: TimeGenerationOptions): Array<number> {
  const { duration, durationUnit, interval, intervalUnit } = options;

  const durationSeconds = getSeconds(duration, durationUnit);
  const intervalSeconds = getSeconds(interval, intervalUnit);
  const endTime = new Date().getTime() / 1000; // now
  const beginTime = endTime - durationSeconds;

  const times: Array<number> = [];
  for (let time = beginTime; time <= endTime; time += intervalSeconds) {
    times.push(time);
  }

  return times;
}

/**
 * Quick helper functions for common time ranges
 */
export const timePresets = {
  last24Hours: () =>
    generateTimes({
      duration: 24,
      durationUnit: "hour",
      interval: 15,
      intervalUnit: "minute",
    }),

  last7Days: () =>
    generateTimes({
      duration: 7,
      durationUnit: "day",
      interval: 1,
      intervalUnit: "hour",
    }),

  last30Days: () =>
    generateTimes({
      duration: 30,
      durationUnit: "day",
      interval: 1,
      intervalUnit: "day",
    }),

  lastHourByMinute: () =>
    generateTimes({
      duration: 1,
      durationUnit: "hour",
      interval: 1,
      intervalUnit: "minute",
    }),

  lastWeekByHour: () =>
    generateTimes({
      duration: 1,
      durationUnit: "week",
      interval: 1,
      intervalUnit: "hour",
    }),
};

// Series generation utilities

type DataPattern =
  | "linear"
  | "sine"
  | "random"
  | "spike"
  | "step"
  | "exponential";

interface SeriesGenerationOptions {
  metric: string;
  length: number;
  pattern?: DataPattern;
  min?: number;
  max?: number;
  queryIndex?: number;
  attributes?: Record<string, string>;
  isEmpty?: boolean;
  baseValue?: number;
  amplitude?: number;
}

/**
 * Generate data values based on a pattern
 */
function generateValues(
  length: number,
  pattern: DataPattern = "random",
  min: number = 0,
  max: number = 100,
  baseValue: number = 50,
  amplitude: number = 30,
): Array<number> {
  const values: Array<number> = [];

  for (let i = 0; i < length; i++) {
    let value: number;

    switch (pattern) {
      case "linear":
        value = min + ((max - min) * i) / (length - 1);
        break;

      case "sine":
        value = baseValue + amplitude * Math.sin((i / length) * Math.PI * 4);
        break;

      case "random":
        value = min + Math.random() * (max - min);
        break;

      case "spike":
        // Mostly baseline with occasional spikes
        value = i % 10 === 0 ? max : min + Math.random() * (max - min) * 0.2;
        break;

      case "step":
        value = min + Math.floor(i / (length / 5)) * ((max - min) / 5);
        break;

      case "exponential":
        value = min + (max - min) * Math.pow(i / length, 2);
        break;

      default:
        value = min + Math.random() * (max - min);
    }

    values.push(Math.round(value * 100) / 100); // Round to 2 decimal places
  }

  return values;
}

/**
 * Generate a single series
 *
 * @example
 * const serie = generateSeries({
 *   metric: 'cpu.usage',
 *   length: 24,
 *   pattern: 'sine',
 *   min: 20,
 *   max: 80,
 *   attributes: { host: 'server-1' }
 * });
 */
export function generateSeries(options: SeriesGenerationOptions): Serie {
  const {
    metric,
    length,
    pattern = "random",
    min = 0,
    max = 100,
    queryIndex = 0,
    attributes,
    isEmpty = false,
    baseValue = 50,
    amplitude = 30,
  } = options;

  return {
    metric,
    attributes,
    values: isEmpty
      ? []
      : generateValues(length, pattern, min, max, baseValue, amplitude),
    queryIndex,
    isEmpty,
  };
}

/**
 * Generate multiple series
 *
 * @example
 * const series = generateMultipleSeries({
 *   count: 3,
 *   metric: 'memory.usage',
 *   length: 24,
 *   pattern: 'random',
 *   attributeSets: [
 *     { host: 'server-1', region: 'us-east' },
 *     { host: 'server-2', region: 'us-west' },
 *     { host: 'server-3', region: 'eu-west' },
 *   ]
 * });
 */
export function generateMultipleSeries(options: {
  count: number;
  metric: string;
  length: number;
  pattern?: DataPattern;
  min?: number;
  max?: number;
  attributeSets?: Array<Record<string, string>>;
}): Array<Serie> {
  const { count, attributeSets, ...baseOptions } = options;
  const series: Array<Serie> = [];

  for (let i = 0; i < count; i++) {
    series.push(
      generateSeries({
        ...baseOptions,
        queryIndex: i,
        attributes: attributeSets?.[i] || { series: `series-${i + 1}` },
      }),
    );
  }

  return series;
}

// Metadata generation utilities

interface MetadataGenerationOptions {
  name: string;
  description?: string;
  suggestedLabel?: string;
  unitCode?: string;
  type?: MetricType;
}

/**
 * Generate metadata for a metric
 *
 * @example
 * const metadata = generateMetadata({
 *   name: 'cpu.usage',
 *   description: 'CPU usage percentage',
 *   suggestedLabel: 'CPU Usage',
 *   unitCode: 'percent',
 *   unitName: 'Percent',
 *   type: 'gauge'
 * });
 */
export function generateMetadata(
  options: MetadataGenerationOptions,
): MetricMetadata {
  const {
    name,
    description = `Metric for ${name}`,
    suggestedLabel = name
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    unitCode,
    type = "gauge",
  } = options;

  return {
    name,
    description,
    suggestedLabel,
    unit: {
      code: unitCode,
    },
    type,
  };
}

/**
 * Generate metadata dictionary for multiple metrics
 *
 * @example
 * const metadata = generateMetadataDict([
 *   { name: 'cpu.usage', unitCode: 'percent', type: 'gauge' },
 *   { name: 'memory.used', unitCode: 'bytes', type: 'gauge' },
 *   { name: 'requests.count', unitCode: 'count', type: 'counter' }
 * ]);
 */
export function generateMetadataDict(
  metricConfigs: Array<MetadataGenerationOptions>,
): Record<string, MetricMetadata> {
  const metadata: Record<string, MetricMetadata> = {};

  for (const config of metricConfigs) {
    metadata[config.name] = generateMetadata(config);
  }

  return metadata;
}

/**
 * Common unit presets
 */
export const unitPresets = {
  percent: {
    unitCode: "percent",
    unitName: "Percent",
    unitSynonym: "%",
    unitCategory: "dimensionless",
  },
  bytes: {
    unitCode: "bytes",
    unitName: "Bytes",
    unitSynonym: "B",
    unitCategory: "digital",
  },
  seconds: {
    unitCode: "s",
    unitName: "Seconds",
    unitSynonym: "sec",
    unitCategory: "time",
  },
  milliseconds: {
    unitCode: "ms",
    unitName: "Milliseconds",
    unitSynonym: "msec",
    unitCategory: "time",
  },
  requests: {
    unitCode: "requests",
    unitName: "Requests",
    unitSynonym: "req",
    unitCategory: "dimensionless",
  },
  operations: {
    unitCode: "ops",
    unitName: "Operations",
    unitCategory: "dimensionless",
  },
};

/**
 * Complete chart data generator - combines times, series, and metadata
 *
 * @example
 * const chartData = generateChartData({
 *   timeOptions: {
 *     duration: 24,
 *     durationUnit: 'hour',
 *     interval: 1,
 *     intervalUnit: 'hour'
 *   },
 *   seriesConfigs: [
 *     {
 *       metric: 'cpu.usage',
 *       pattern: 'sine',
 *       attributes: { host: 'server-1' }
 *     },
 *     {
 *       metric: 'memory.usage',
 *       pattern: 'random',
 *       attributes: { host: 'server-1' }
 *     }
 *   ],
 *   metadataConfigs: [
 *     { name: 'cpu.usage', unitCode: 'percent' },
 *     { name: 'memory.usage', unitCode: 'percent' }
 *   ]
 * });
 */
export function generateChartData(options: {
  timeOptions: TimeGenerationOptions;
  seriesConfigs: Array<Omit<SeriesGenerationOptions, "length">>;
  metadataConfigs: Array<MetadataGenerationOptions>;
}) {
  const { timeOptions, seriesConfigs, metadataConfigs } = options;

  const times = generateTimes(timeOptions);
  const series = seriesConfigs.map((config, index) =>
    generateSeries({
      ...config,
      length: times.length,
      queryIndex: config.queryIndex ?? index,
    }),
  );
  const metadata = generateMetadataDict(metadataConfigs);

  return {
    times,
    series,
    metadata,
  };
}
