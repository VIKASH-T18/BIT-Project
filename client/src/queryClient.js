/**
 * @file queryClient.js
 * @description Centralized React Query client instance so it can be cleared on auth changes.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.response?.status === 401) return false;
        if (error?.response?.status === 403) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export default queryClient;
