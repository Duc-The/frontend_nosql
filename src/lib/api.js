const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

export async function api(path, { method = 'GET', body, signal, token, headers: extraHeaders } = {}) {
  const headers = new Headers(extraHeaders)
  headers.set('Accept', 'application/json')
  const multipart = body instanceof FormData
  if (body !== undefined && !multipart) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', 'Bearer ' + token)

  let response
  try {
    response = await fetch(baseUrl + path, {
      method, signal, headers, body: body === undefined || multipart ? body : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Chưa kết nối được với cửa hàng. Vui lòng thử lại.')
  }
  if (response.status === 204) return null
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.message || 'Cửa hàng chưa thể xử lý yêu cầu. Vui lòng thử lại.')
    error.status = response.status
    error.code = payload?.error?.code
    throw error
  }
  return payload.data
}
