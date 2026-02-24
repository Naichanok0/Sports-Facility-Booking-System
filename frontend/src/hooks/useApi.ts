import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  skip?: boolean;
  dependencies?: any[];
}

/**
 * Custom hook for handling API calls with loading and error states
 */
export function useApi<T>(
  apiCall: () => Promise<any>,
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiCall();
      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch data',
        });
      }
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || 'An error occurred',
      });
    }
  }, [apiCall]);

  useEffect(() => {
    if (!options.skip) {
      fetchData();
    }
  }, options.dependencies ? options.dependencies : []);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Custom hook for handling mutations (POST, PUT, DELETE)
 */
export function useMutation<TInput, TOutput>(
  mutationFn: (data: TInput) => Promise<any>
) {
  const [state, setState] = useState<UseApiState<TOutput>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (input: TInput) => {
      setState({ data: null, loading: true, error: null });
      try {
        const response = await mutationFn(input);
        if (response.success) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });
          return response.data;
        } else {
          setState({
            data: null,
            loading: false,
            error: response.error || 'Mutation failed',
          });
          throw new Error(response.error || 'Mutation failed');
        }
      } catch (error: any) {
        const errorMsg = error.message || 'An error occurred';
        setState({
          data: null,
          loading: false,
          error: errorMsg,
        });
        throw error;
      }
    },
    [mutationFn]
  );

  return {
    ...state,
    mutate,
  };
}
