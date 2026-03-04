import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  TimeseriesQueryConfig,
  Appearance,
  ChartVisualConfig,
} from "../types";
import { TooltipProps } from "../components/Tooltip";
import {
  Loading,
  Error as DefaultErrorComponent,
  Empty,
} from "../components/Defaults";
import { TimeRangeValue } from "@unblind/units";

export type ScopeConfig = TimeseriesQueryConfig &
  ChartVisualConfig & {
    /**
     * Optional appearance configuration for all components
     * within this scope.
     *
     * Use this to globally override UI components such as loading,
     * or error states.
     *
     * Local overrides passed directly to a component take
     * precedence over this configuration.
     *
     * @example
     * ```tsx
     * <Scope
     *   appearance={{
     *     components: {
     *       Loading: CustomLoading,
     *       Error: CustomError,
     *     },
     *   }}
     * >
     *   <App />
     * </Scope>
     * ```
     */
    appearance?: Appearance;
  };

type UpdateTimeRangeFunction = (
  value?: TimeRangeValue,
  startTime?: number,
  endTime?: number,
) => void;

interface ScopeContext extends ScopeConfig {
  updateTimeRange: UpdateTimeRangeFunction;
}

const ScopeConfigContext = createContext<ScopeContext | undefined>(undefined);

export type ScopeProps = ScopeConfig & {
  children?: React.ReactNode;
};

/**
 * Scope provides scoped configuration for all Unblind components (charts, logs, etc).
 * This includes default time ranges, intervals, attributes, groupBy, operator, appearance, and colors.
 *
 * When nested, child scopes inherit defaults from parent scopes and can override specific values.
 * This allows you to set global defaults (like appearance) at the top level and override
 * settings (like timeRange) in nested scopes.
 *
 * @example
 * ```tsx
 * import { Scope } from '@unblind/react';
 *
 * function App() {
 *   return (
 *     <Scope
 *       appearance={{ components: { Loading: CustomLoading } }}
 *       timeRange="24h"
 *     >
 *       // Components here use 24h and CustomLoading
 *
 *       <Scope timeRange="1h">
 *         // Components here use 1h but still inherit CustomLoading
 *       </Scope>
 *     </Scope>
 *   );
 * }
 * ```
 */
export function Scope({
  children,
  timeRange: propsTimeRange,
  startTime: propsStartTime,
  endTime: propsEndTime,
  interval,
  attributes,
  groupBy,
  operator,
  appearance,
  tooltip,
  colors,
  fill,
  hideAxis,
  hideCursor,
  relativeTimeAxis,
  invertSort,
  disableSuggestedLabel,
}: ScopeProps) {
  const parentContext = useContext(ScopeConfigContext);

  const [timeRange, setTimeRange] = useState<TimeRangeValue | undefined>(
    propsTimeRange ?? parentContext?.timeRange,
  );
  const [startTime, setStartTime] = useState(
    propsStartTime ?? parentContext?.startTime,
  );
  const [endTime, setEndTime] = useState(
    propsEndTime ?? parentContext?.endTime,
  );

  const updateTimeRange = useCallback<UpdateTimeRangeFunction>(
    (value?: TimeRangeValue, start?: number, end?: number) => {
      setTimeRange(value);
      setStartTime(start);
      setEndTime(end);
    },
    [],
  );

  // Components
  const LoadingComponent =
    appearance?.components?.Loading ||
    parentContext?.appearance?.components?.Loading;
  const ErrorComponent =
    appearance?.components?.Error ||
    parentContext?.appearance?.components?.Error;
  const TooltipComponent =
    appearance?.components?.Tooltip ||
    parentContext?.appearance?.components?.Tooltip;
  const EmptyComponent =
    appearance?.components?.Empty ||
    parentContext?.appearance?.components?.Empty;

  // Tooltip
  const tooltipHide =
    typeof tooltip?.hide === "boolean"
      ? tooltip?.hide
      : parentContext?.tooltip?.hide;
  const tooltipVisibilityLimit =
    typeof tooltip?.visibilityLimit === "number"
      ? tooltip?.visibilityLimit
      : parentContext?.tooltip?.visibilityLimit;

  const memoizedAppearance = useMemo(() => {
    return {
      components: {
        ...(LoadingComponent && { Loading: LoadingComponent }),
        ...(ErrorComponent && { Error: ErrorComponent }),
        ...(TooltipComponent && { Tooltip: TooltipComponent }),
        ...(EmptyComponent && { Empty: EmptyComponent }),
      },
    };
  }, [LoadingComponent, ErrorComponent, TooltipComponent, EmptyComponent]);

  const memoizedTooltip = useMemo(() => {
    return {
      hide: tooltipHide,
      visibilityLimit: tooltipVisibilityLimit,
    };
  }, [tooltipHide, tooltipVisibilityLimit]);

  const scopeContext: ScopeContext = useMemo(
    () => ({
      timeRange: timeRange ?? parentContext?.timeRange,
      startTime: startTime ?? parentContext?.startTime,
      endTime: endTime ?? parentContext?.endTime,
      interval: interval ?? parentContext?.interval,
      attributes: attributes ?? parentContext?.attributes,
      groupBy: groupBy ?? parentContext?.groupBy,
      operator: operator ?? parentContext?.operator,
      colors: colors ?? parentContext?.colors,
      relativeTimeAxis:
        typeof relativeTimeAxis === "boolean"
          ? relativeTimeAxis
          : parentContext?.relativeTimeAxis,
      fill: typeof fill === "boolean" ? fill : parentContext?.fill,
      hideAxis:
        typeof hideAxis === "boolean" ? hideAxis : parentContext?.hideAxis,
      hideCursor:
        typeof hideCursor === "boolean"
          ? hideCursor
          : parentContext?.hideCursor,
      invertSort:
        typeof invertSort === "boolean"
          ? invertSort
          : parentContext?.invertSort,
      disableSuggestedLabel:
        typeof disableSuggestedLabel === "boolean"
          ? disableSuggestedLabel
          : parentContext?.disableSuggestedLabel,
      appearance: memoizedAppearance,
      tooltip: memoizedTooltip,
      updateTimeRange,
    }),
    [
      timeRange,
      startTime,
      endTime,
      interval,
      attributes,
      groupBy,
      operator,
      colors,
      fill,
      relativeTimeAxis,
      hideAxis,
      hideCursor,
      memoizedAppearance,
      memoizedTooltip,
      parentContext,
      invertSort,
      disableSuggestedLabel,
      updateTimeRange,
    ],
  );

  useEffect(() => {
    if (propsTimeRange !== undefined) setTimeRange(propsTimeRange);
  }, [propsTimeRange]);

  useEffect(() => {
    if (propsStartTime !== undefined) setStartTime(propsStartTime);
  }, [propsStartTime]);

  useEffect(() => {
    if (propsTimeRange !== undefined) setTimeRange(propsTimeRange);
    if (propsStartTime !== undefined) setStartTime(propsStartTime);
    if (propsEndTime !== undefined) setEndTime(propsEndTime);
  }, [propsTimeRange, propsStartTime, propsEndTime]);

  useEffect(() => {
    if (propsTimeRange === undefined && parentContext?.timeRange !== undefined)
      setTimeRange(parentContext.timeRange);
    if (propsStartTime === undefined && parentContext?.startTime !== undefined)
      setStartTime(parentContext.startTime);
    if (propsEndTime === undefined && parentContext?.endTime !== undefined)
      setEndTime(parentContext.endTime);
  }, [
    parentContext?.timeRange,
    parentContext?.startTime,
    parentContext?.endTime,
    propsTimeRange,
    propsStartTime,
    propsEndTime,
  ]);

  return (
    <ScopeConfigContext.Provider value={scopeContext}>
      {children}
    </ScopeConfigContext.Provider>
  );
}

const DEFAULT_TIMERANGE: TimeRangeValue = "Last 6 hours";

export type UseScopeReturn = TimeseriesQueryConfig &
  ChartVisualConfig & {
    timeRange: TimeRangeValue;
    updateTimeRange: UpdateTimeRangeFunction;
    appearance: {
      components: {
        Loading: React.ComponentType;
        Error: React.ComponentType;
        Empty: React.ComponentType;
        Tooltip?: React.ComponentType<TooltipProps>;
      };
    };
  };

/**
 * Hook to access the scoped configuration from Scope.
 * Returns all configuration including time range, attributes,
 * groupBy, operator, colors, and UI components.
 *
 * @example
 * ```tsx
 * function MyChart() {
 *   const { timeRange, colors, appearance } = useScope();
 *   // Use configuration...
 * }
 * ```
 */
export function useScope(): UseScopeReturn {
  const ctx = useContext(ScopeConfigContext);

  if (!ctx) {
    throw new Error("useScope must be used within a ScopeConfigProvider");
  }

  return useMemo(() => {
    return {
      ...ctx,
      timeRange: ctx.timeRange || DEFAULT_TIMERANGE,
      updateTimeRange: ctx.updateTimeRange,
      appearance: {
        components: {
          Loading: ctx.appearance?.components?.Loading ?? Loading,
          Error: ctx.appearance?.components?.Error ?? DefaultErrorComponent,
          Empty: ctx.appearance?.components?.Empty ?? Empty,
          Tooltip: ctx.appearance?.components?.Tooltip,
        },
      },
    };
  }, [ctx]);
}
