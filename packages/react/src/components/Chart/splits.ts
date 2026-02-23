import {
  getCategoryForUnit,
  BIN_PREFIXES,
  SI_PREFIXES,
  SI_BASE_INDEX,
  INTERVALS_IN_SECONDS,
  TIME_UNIT_ID_TO_SECONDS,
  Interval,
} from "@unblind/units";
import uPlot from "uplot";

/// The following code is used just by the Y-Axis splits
// to render timeseries.

const TIME_MS_THRESHOLDS = [
  {
    threshold: INTERVALS_IN_SECONDS[Interval.Day] * 1000,
    size: INTERVALS_IN_SECONDS[Interval.Day] * 1000,
  },
  {
    threshold: INTERVALS_IN_SECONDS[Interval.Hour] * 1000,
    size: INTERVALS_IN_SECONDS[Interval.Hour] * 1000,
  },
  {
    threshold: INTERVALS_IN_SECONDS[Interval.Minute] * 1000,
    size: INTERVALS_IN_SECONDS[Interval.Minute] * 1000,
  },
  {
    threshold: INTERVALS_IN_SECONDS[Interval.Second] * 1000,
    size: INTERVALS_IN_SECONDS[Interval.Second] * 1000,
  },
  { threshold: 0, size: 1 },
];

function niceStepInUnits(rangeInUnits: number, maxTicks = 4): number {
  const roughStep = rangeInUnits / maxTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  if (residual > 5) return 10 * magnitude;
  if (residual > 2) return 5 * magnitude;
  if (residual > 1) return 2 * magnitude;
  return magnitude;
}

function buildSplits(
  scaleMin: number,
  scaleMax: number,
  stepRaw: number,
): number[] {
  const splits: number[] = [];
  const start = Math.ceil(scaleMin / stepRaw) * stepRaw;
  const count = Math.floor((scaleMax - start) / stepRaw);
  for (let i = 0; i <= count; i++) {
    splits.push(start + i * stepRaw);
  }
  return splits;
}

function buildBinarySplits(scaleMin: number, scaleMax: number): number[] {
  const tier = Math.floor(Math.log(Math.abs(scaleMax)) / Math.log(1024));
  const unitSize = Math.pow(
    1024,
    Math.max(0, Math.min(tier, BIN_PREFIXES.length - 1)),
  );
  const stepRaw = niceStepInUnits(scaleMax / unitSize) * unitSize;
  return buildSplits(scaleMin, scaleMax, stepRaw);
}

function buildSISplits(scaleMin: number, scaleMax: number): number[] {
  const tier = Math.floor(Math.log10(Math.abs(scaleMax)) / 3);
  const unitSize = Math.pow(
    1000,
    Math.max(0, Math.min(tier, SI_PREFIXES.length - SI_BASE_INDEX - 1)),
  );
  const stepRaw = niceStepInUnits(scaleMax / unitSize) * unitSize;
  return buildSplits(scaleMin, scaleMax, stepRaw);
}

function buildTimeSplits(
  scaleMin: number,
  scaleMax: number,
  unit: string,
): number[] {
  const unitInSeconds = TIME_UNIT_ID_TO_SECONDS[unit] ?? 1;
  const rangeMs = (scaleMax - scaleMin) * unitInSeconds * 1000;

  const FALLBACK_THRESHOLD = { threshold: 0, size: 1 };

  const entry =
    TIME_MS_THRESHOLDS.find((t) => rangeMs >= t.threshold * 2) ??
    TIME_MS_THRESHOLDS[TIME_MS_THRESHOLDS.length - 1] ??
    FALLBACK_THRESHOLD;

  const stepRaw =
    (niceStepInUnits(rangeMs / entry.size) * entry.size) /
    (unitInSeconds * 1000);
  return buildSplits(scaleMin, scaleMax, stepRaw);
}

export function getSplitsBuilder(unit?: string): uPlot.Axis.Splits | undefined {
  const category = getCategoryForUnit(unit);

  if (category === "Data")
    return (_: uPlot, _xid: number, scaleMin: number, scaleMax: number) =>
      buildBinarySplits(scaleMin, scaleMax);
  if (category === "Data Rate")
    return (_: uPlot, _xid: number, scaleMin: number, scaleMax: number) =>
      buildSISplits(scaleMin, scaleMax);
  if (category === "Time" && unit)
    return (_: uPlot, _xid: number, scaleMin: number, scaleMax: number) =>
      buildTimeSplits(scaleMin, scaleMax, unit);
}
