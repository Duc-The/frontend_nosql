import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

export function useResource(request, path) {
  const generation = useSelector((state) => state.auth.generation)
  const query = useQuery({
    queryKey: ['resource', generation, path],
    queryFn: ({ signal }) => request(path, { signal }),
    enabled: Boolean(path),
  })
  return {
    data: query.data,
    error: query.error?.message,
    loaded: Boolean(path) && !query.isPending,
    refreshing: query.isFetching && !query.isPending,
    reload: query.refetch,
  }
}
