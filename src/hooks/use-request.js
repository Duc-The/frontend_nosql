import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useRequest(path) {
  const query = useQuery({
    queryKey: ['public', path],
    queryFn: ({ signal }) => api(path, { signal }),
    enabled: Boolean(path),
  })
  return { data: query.data, error: query.error, loading: Boolean(path) && query.isPending, retry: query.refetch }
}
