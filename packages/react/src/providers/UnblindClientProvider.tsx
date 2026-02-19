import {
  QueryClient,
  QueryClientConfig,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

export type UnblindClientConfig = {
  /**
   * Base URL that client-side hooks will use.
   * Should point to the host app endpoint that is proxied by middleware.
   * Defaults to `/api/unblind`.
   */
  apiBaseUrl: string;

  /**
   * Optional custom fetch implementation (for tests or advanced setups).
   * When not provided, the global `fetch` will be used.
   */
  fetchImpl?: typeof fetch;
};

const UnblindClientConfigContext = createContext<
  UnblindClientConfig | undefined
>(undefined);

export type UnblindClientProviderProps = {
  children?: ReactNode;
  /**
   * Optional QueryClient instance. If not provided, a new one will be created.
   * Useful if you already have a QueryClientProvider in your app and want to reuse it.
   */
  queryClient?: QueryClient;

  /**
   * Optional QueryClientConfig. If not provided, a default one will be used.
   * Useful if you already have a QueryClientProvider in your app and want to reuse it.
   */
  queryClientConfig?: QueryClientConfig | undefined;

  /**
   * Optional API base URL override. Defaults to `/api/unblind`.
   */
  apiBaseUrl?: string;
  /**
   * Optional custom fetch implementation (for tests or advanced setups).
   */
  fetchImpl?: typeof fetch;
};

/**
 * UnblindClientProvider sets up the QueryClientProvider (for React Query)
 * and the Unblind client configuration context.
 *
 * @example
 * ```tsx
 * import { UnblindClientProvider } from '@unblind/react';
 *
 * function App() {
 *   return (
 *     <UnblindClientProvider apiBaseUrl="/api/unblind">
 *       <YourComponents />
 *     </UnblindClientProvider>
 *   );
 * }
 * ```
 */
export function UnblindClientProvider({
  children,
  queryClient: providedQueryClient,
  queryClientConfig: providedQueryClientConfig,
  apiBaseUrl = "/api/unblind",
  fetchImpl,
}: UnblindClientProviderProps) {
  // Create a QueryClient if one wasn't provided
  const queryClient = useMemo(() => {
    if (providedQueryClient) {
      return providedQueryClient;
    }

    const defaultQueryConfig = {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    };

    const baseConfig = {
      defaultOptions: {
        queries: defaultQueryConfig,
      },
    };

    // Merge with provided config, ensuring our defaults aren't overwritten
    if (providedQueryClientConfig) {
      return new QueryClient({
        ...providedQueryClientConfig,
        defaultOptions: {
          ...providedQueryClientConfig.defaultOptions,
          queries: {
            ...defaultQueryConfig,
            ...providedQueryClientConfig.defaultOptions?.queries,
          },
        },
      });
    }

    return new QueryClient(baseConfig);
  }, [providedQueryClient, providedQueryClientConfig]);

  const configValue: UnblindClientConfig = useMemo(
    () => ({
      apiBaseUrl,
      fetchImpl,
    }),
    [apiBaseUrl, fetchImpl],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <UnblindClientConfigContext.Provider value={configValue}>
        {children}
      </UnblindClientConfigContext.Provider>
    </QueryClientProvider>
  );
}

/**
 * Access the Unblind client configuration.
 *
 * @throws Error if called outside of an UnblindClientProvider.
 * This ensures that QueryClientProvider is always available for hooks.
 */
export function useUnblindClientConfig(): UnblindClientConfig {
  const ctx = useContext(UnblindClientConfigContext);

  if (!ctx) {
    throw new Error(
      "useUnblindConfig must be used within an UnblindClientProvider. " +
        "Please wrap your app or component tree with <UnblindClientProvider>.",
    );
  }

  return ctx;
}

/**
 * Hook to refresh all timeseries data.
 * Invalidates all queries with the 'unblind' and 'timeseries' keys,
 * causing them to refetch automatically.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const refresh = useRefresh();
 *   return (
 *     <>
 *       <button onClick={() => refresh()}>Refresh</button>
 *       <Timeseries metrics={["cpu"]} />
 *     </>
 *   );
 * }
 * ```
 */
export function useRefresh(): () => Promise<void> {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await queryClient.refetchQueries({
      queryKey: ["unblind", "timeseries"],
    });
  }, [queryClient]);
}
