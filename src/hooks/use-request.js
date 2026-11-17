import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function useRequest(path) {
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    api(path, { signal: controller.signal }).then(
      (data) => setResult({ path, attempt, data }),
      (error) => {
        if (!controller.signal.aborted) setResult({ path, attempt, error })
      },
    )
    return () => controller.abort()
  }, [path, attempt])

  const current = result?.path === path && result?.attempt === attempt ? result : null
  return { ...current, loading: Boolean(path && !current), retry: () => setAttempt((value) => value + 1) }
}
