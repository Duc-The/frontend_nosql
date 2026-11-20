import axios from 'axios'
import { queryClient } from '@/app/query-client'

const client = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, ''),
  headers: { Accept: 'application/json' },
  timeout: 30_000,
})

client.interceptors.request.use((config) => {
  if (config.token) config.headers.set('Authorization', 'Bearer ' + config.token)
  if (config.data instanceof FormData) config.headers.delete('Content-Type')
  return config
})

function apiError(payload, status, message) {
  const error = new Error(payload?.message || message)
  error.status = status
  error.code = payload?.error?.code
  error.details = payload?.error?.details || []
  return error
}

client.interceptors.response.use((response) => {
  if (response.status === 204) return null
  if (!response.data?.success) throw apiError(response.data, response.status, 'Cửa hàng chưa thể xử lý yêu cầu. Vui lòng thử lại.')
  return response.data.data
}, (failure) => {
  if (axios.isCancel(failure)) {
    failure.name = 'AbortError'
    return Promise.reject(failure)
  }
  return Promise.reject(apiError(failure.response?.data, failure.response?.status,
    failure.response ? 'Cửa hàng chưa thể xử lý yêu cầu. Vui lòng thử lại.' : 'Chưa kết nối được với cửa hàng. Vui lòng thử lại.'))
})

export async function api(path, { method = 'GET', body, signal, token, headers } = {}) {
  const data = await client.request({ url: path, method, data: body, signal, token, headers })
  if (method.toUpperCase() !== 'GET' && !path.startsWith('/auth/')) void queryClient.invalidateQueries()
  return data
}
