import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      retry: (count, error) => count < 1 && ![400, 401, 403, 404, 409, 422, 429].includes(error.status),
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
})
