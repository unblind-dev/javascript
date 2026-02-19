import {
  UnblindClientProvider,
  UnblindClientProviderProps,
} from "./UnblindClientProvider";
import { Scope, ScopeProps } from "./ScopeProvider";

// Re-export hooks
export { useUnblindClientConfig, useRefresh } from "./UnblindClientProvider";
export { useScope } from "./ScopeProvider";

export type UnblindProviderProps = UnblindClientProviderProps &
  ScopeProps & { children?: React.ReactNode };

/**
 * UnblindProvider is required for all Unblind hooks to work.
 * It sets up both the QueryClientProvider (for React Query) and the Unblind configuration context.
 * This is a convenience wrapper around `UnblindClientProvider` and `Scope`.
 *
 * @example
 * ```tsx
 * import { UnblindProvider } from '@unblind/react';
 *
 * function App() {
 *   return (
 *     <UnblindProvider apiBaseUrl="/api/unblind">
 *       <YourComponents />
 *     </UnblindProvider>
 *   );
 * }
 * ```
 */
export function UnblindProvider({
  children,
  queryClient,
  apiBaseUrl,
  fetchImpl,
  timeRange,
  startTime,
  endTime,
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
}: UnblindProviderProps) {
  return (
    <UnblindClientProvider
      queryClient={queryClient}
      apiBaseUrl={apiBaseUrl}
      fetchImpl={fetchImpl}
    >
      <Scope
        timeRange={timeRange}
        startTime={startTime}
        endTime={endTime}
        interval={interval}
        attributes={attributes}
        groupBy={groupBy}
        operator={operator}
        appearance={appearance}
        tooltip={tooltip}
        colors={colors}
        fill={fill}
        hideAxis={hideAxis}
        hideCursor={hideCursor}
        relativeTimeAxis={relativeTimeAxis}
        invertSort={invertSort}
        disableSuggestedLabel={disableSuggestedLabel}
      >
        {children}
      </Scope>
    </UnblindClientProvider>
  );
}
