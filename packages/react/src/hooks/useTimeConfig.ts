import { getTimeConfig } from "./utils";
import { useScope } from "@/providers";
import { useMemo } from "react";
import { TimeRangeValue } from "@unblind/units";

export function useTimeConfig(props: {
  startTime?: number;
  endTime?: number;
  timeRange?: TimeRangeValue;
}) {
  const scope = useScope();

  const { timeRange, startTime, endTime } = getTimeConfig({
    props,
    scope,
  });

  return useMemo(
    () => ({
      timeRange,
      startTime,
      endTime,
    }),
    [timeRange, startTime, endTime],
  );
}
