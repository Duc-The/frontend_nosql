import { useCallback, useState } from 'react'
import { api } from '@/lib/api'

const key = 'mua-xanh-session'
let refresh

function read() {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null') } catch { return null }
}

export function useSession() {
  const [session, setSession] = useState(read)
  const save = useCallback((value) => {
    if (value) sessionStorage.setItem(key, JSON.stringify(value))
    else sessionStorage.removeItem(key)
    setSession(value)
  }, [])

  const request = useCallback(async (path, options = {}) => {
    const initial = read()
    if (!initial) throw new Error('Bạn cần đăng nhập để tiếp tục.')
    try {
      return await api(path, { ...options, token: initial.accessToken })
    } catch (error) {
      if (error.status !== 401 || !initial.refreshToken || options.signal?.aborted) throw error
      const current = read()
      if (!current) throw error
      if (current.refreshToken !== initial.refreshToken) {
        return api(path, { ...options, token: current.accessToken })
      }
      if (refresh?.token !== current.refreshToken) {
        const token = current.refreshToken
        const pending = api('/auth/refresh', { method: 'POST', body: { refreshToken: token } })
          .then((next) => {
            if (read()?.refreshToken === token) save(next)
            return next
          }).catch((failure) => {
            if ([401, 403].includes(failure.status) && read()?.refreshToken === token) save(null)
            throw failure
          }).finally(() => { if (refresh?.token === token) refresh = undefined })
        refresh = { token, pending }
      }
      const next = await refresh.pending
      if (read()?.accessToken !== next.accessToken) throw error
      return api(path, { ...options, token: next.accessToken })
    }
  }, [save])

  return { session, save, request }
}
