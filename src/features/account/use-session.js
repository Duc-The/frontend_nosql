import { useSelector } from 'react-redux'
import { api } from '@/lib/api'
import { queryClient } from '@/app/query-client'
import { store, sessionChanged, sessionRefreshed } from '@/app/store'

let refresh
const currentSession = () => store.getState().auth.session

function save(value) {
  queryClient.clear()
  store.dispatch(sessionChanged(value))
}

async function request(path, options = {}) {
  const initial = currentSession()
  const generation = store.getState().auth.generation
  if (!initial) throw new Error('Bạn cần đăng nhập để tiếp tục.')
  try {
    return await api(path, { ...options, token: initial.accessToken })
  } catch (error) {
    if (error.status !== 401 || !initial.refreshToken || options.signal?.aborted) throw error
    const current = currentSession()
    if (!current || store.getState().auth.generation !== generation) throw error
    if (current.refreshToken !== initial.refreshToken) return api(path, { ...options, token: current.accessToken })
    if (refresh?.token !== current.refreshToken) {
      const token = current.refreshToken
      const pending = api('/auth/refresh', { method: 'POST', body: { refreshToken: token } })
        .then((next) => {
          if (currentSession()?.refreshToken === token && store.getState().auth.generation === generation) {
            store.dispatch(sessionRefreshed(next))
          }
          return next
        }).catch((failure) => {
          if ([401, 403].includes(failure.status) && currentSession()?.refreshToken === token) save(null)
          throw failure
        }).finally(() => { if (refresh?.token === token) refresh = undefined })
      refresh = { token, pending }
    }
    const next = await refresh.pending
    if (currentSession()?.accessToken !== next.accessToken || store.getState().auth.generation !== generation) throw error
    return api(path, { ...options, token: next.accessToken })
  }
}

export function useSession() {
  const session = useSelector((state) => state.auth.session)
  return { session, save, request }
}
