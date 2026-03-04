import {
  dateTime,
  dateTimeForTimeZone,
  parseDateMath,
  parseHumanInput,
  TimeRangeValue,
} from "@unblind/units";

export function hasValidTimeConfig({
  timeRange,
  startTime,
  endTime,
}: {
  timeRange?: TimeRangeValue;
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
    timeRange: TimeRangeValue;
    startTime?: number;
    endTime?: number;
  };
  props: {
    timeRange?: TimeRangeValue;
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

export function timeRangeToTimestamps(
  value: TimeRangeValue,
  timezone?: string,
): [number, number] | null {
  const raw = parseHumanInput(value);
  if (!raw) return null;

  const now = dateTimeForTimeZone(timezone);

  const fromMath = raw.from.startsWith("now")
    ? raw.from.slice("now".length)
    : "";
  const toMath = raw.to.startsWith("now") ? raw.to.slice("now".length) : "";

  const from = fromMath
    ? parseDateMath(fromMath, dateTime(now), false)
    : dateTime(now);
  const to = toMath
    ? parseDateMath(toMath, dateTime(now), true)
    : dateTime(now);

  if (!from?.isValid() || !to?.isValid()) return null;

  return [Math.floor(from.valueOf() / 1000), Math.floor(to.valueOf() / 1000)];
}

export function deduceTimestamp(
  timeRange?: TimeRangeValue,
  startTime?: number,
  endTime?: number,
): [number, number] {
  let calculatedStartTime: number;
  let calculatedEndTime: number;

  if (typeof startTime === "number" && typeof endTime === "number") {
    calculatedStartTime = startTime!;
    calculatedEndTime = endTime!;
  } else if (timeRange) {
    const timestamps = timeRangeToTimestamps(timeRange);
    if (!timestamps) {
      throw new Error("Invalid time range.");
    } else {
      const [startTime, endTime] = timestamps;
      calculatedStartTime = startTime;
      calculatedEndTime = endTime;
    }
  } else {
    throw new Error(
      "Either timeRange or both startTime and endTime must be provided",
    );
  }

  return [calculatedStartTime, calculatedEndTime];
}
