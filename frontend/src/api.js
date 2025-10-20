
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function api(path, { method='GET', body, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch (e) {
      data = text
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.detail || data.message)) ||
      (typeof data === 'string' && data) ||
      res.statusText ||
      'Request failed'
    throw new Error(message)
  }

  if (!text) return null
  return data
}
