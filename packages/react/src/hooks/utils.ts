import { TimeRange } from "@/types";
import ms from "ms";

export function hasValidTimeConfig({
  timeRange,
  startTime,
  endTime,
}: {
  timeRange?: TimeRange;
  startTime?: number;
  endTime?: number;
}) {
  return (
    (typeof startTime === "number" && typeof endTime === "number") ||
    !!timeRange
  );
}

export function getTimeConfig({
  scope,
  props,
}: {
  scope: {
    timeRange: TimeRange;
    startTime?: number;
    endTime?: number;
  };
  props: {
    timeRange?: TimeRange;
    startTime?: number;
    endTime?: number;
  };
}) {
  if (props.timeRange || (props.startTime && props.endTime)) {
    return props;
  } else {
    return scope;
  }
}

export function timeRangeToCalculatedTimestamp(
  timeRange: TimeRange,
): [number, number] {
  const now = Math.floor(Date.now() / 1000);
  const calculatedStartTime = now - Math.floor(ms(timeRange) / 1000);
  const calculatedEndTime = now;
  return [calculatedStartTime, calculatedEndTime];
}

export function deduceTimestamp(
  timeRange?: TimeRange,
  startTime?: number,
  endTime?: number,
): [number, number] {
  let calculatedStartTime: number;
  let calculatedEndTime: number;

  if (typeof startTime === "number" && typeof endTime === "number") {
    calculatedStartTime = startTime!;
    calculatedEndTime = endTime!;
  } else if (timeRange) {
    const [startTime, endTime] = timeRangeToCalculatedTimestamp(timeRange);
    calculatedStartTime = startTime;
    calculatedEndTime = endTime;
  } else {
    throw new Error(
      "Either timeRange or both startTime and endTime must be provided",
    );
  }

  return [calculatedStartTime, calculatedEndTime];
}
