"use client";

import * as React from "react";

export type ServerActionResult<TData = unknown, TError = unknown> = {
  success: boolean;
  message: string;
  data?: TData;
  error?: TError;
};

type MutateValue<TData> = TData | ((currentData: TData | undefined) => TData);

type UseActionSWROptions<TData, TError> = {
  shouldFetch?: boolean;
  initialData?: TData;
  keepPreviousData?: boolean;
  onSuccess?: (
    data: TData | undefined,
    result: ServerActionResult<TData, TError>,
  ) => void;
  onError?: (
    error: TError | string,
    result?: ServerActionResult<TData, TError>,
  ) => void;
  refreshInterval?: number;
};

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (value && typeof value === "object") {
    const sortedEntries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nestedValue]) => [key, sortObjectKeys(nestedValue)]);

    return Object.fromEntries(sortedEntries);
  }

  return value;
}

function serializeParams(params: unknown): string {
  if (params === null || params === undefined) {
    return "";
  }

  return JSON.stringify(sortObjectKeys(params));
}

export function useActionSWR<TParams, TData, TError = unknown>(
  action: (params: TParams) => Promise<ServerActionResult<TData, TError>>,
  params: TParams | null | undefined,
  options: UseActionSWROptions<TData, TError> = {},
) {
  const {
    shouldFetch = true,
    initialData,
    keepPreviousData = true,
    onSuccess,
    onError,
    refreshInterval,
  } = options;

  const [data, setData] = React.useState<TData | undefined>(initialData);
  const [error, setError] = React.useState<TError | string | null>(null);
  const [message, setMessage] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isValidating, setIsValidating] = React.useState<boolean>(false);

  const paramsKey = React.useMemo(() => serializeParams(params), [params]);
  const requestIdRef = React.useRef(0);
  const actionRef = React.useRef(action);
  const paramsRef = React.useRef(params);
  const onSuccessRef = React.useRef(onSuccess);
  const onErrorRef = React.useRef(onError);
  const shouldFetchRef = React.useRef(shouldFetch);
  const keepPreviousDataRef = React.useRef(keepPreviousData);

  React.useEffect(() => {
    actionRef.current = action;
    paramsRef.current = params;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    shouldFetchRef.current = shouldFetch;
    keepPreviousDataRef.current = keepPreviousData;
  }, [action, keepPreviousData, onError, onSuccess, params, shouldFetch]);

  const run = React.useCallback(async () => {
    const currentParams = paramsRef.current;

    if (
      !shouldFetchRef.current ||
      currentParams === null ||
      currentParams === undefined
    ) {
      return undefined;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setIsValidating(true);
    setError(null);

    if (!keepPreviousDataRef.current) {
      setData(undefined);
    }

    try {
      const result = await actionRef.current(currentParams);

      if (requestId !== requestIdRef.current) {
        return result;
      }

      setMessage(result.message);
      setData(result.data);

      if (!result.success) {
        const actionError =
          (result.error as TError | undefined) ?? result.message;
        setError(actionError);
        onErrorRef.current?.(actionError, result);
      } else {
        onSuccessRef.current?.(result.data, result);
      }

      return result;
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) {
        return undefined;
      }

      const actionError =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong";

      setError(actionError);
      setMessage(actionError);
      onErrorRef.current?.(actionError);

      return undefined;
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  }, []);

  const revalidate = React.useCallback(async () => {
    return run();
  }, [run]);

  const mutate = React.useCallback(
    async (nextData?: MutateValue<TData>, shouldRevalidate = true) => {
      if (nextData !== undefined) {
        setData((currentData) => {
          if (typeof nextData === "function") {
            return (nextData as (value: TData | undefined) => TData)(
              currentData,
            );
          }
          return nextData;
        });
      }

      if (shouldRevalidate) {
        return run();
      }

      return undefined;
    },
    [run],
  );

  React.useEffect(() => {
    if (!shouldFetch || params === null || params === undefined) {
      return;
    }

    setIsLoading(true);
    void run();
  }, [paramsKey, run, shouldFetch]);

  React.useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0 || !shouldFetch) {
      return;
    }

    const interval = window.setInterval(() => {
      void run();
    }, refreshInterval);

    return () => window.clearInterval(interval);
  }, [refreshInterval, run, shouldFetch]);

  return {
    data,
    error,
    message,
    isLoading,
    isValidating,
    isError: Boolean(error),
    revalidate,
    mutate,
  };
}
