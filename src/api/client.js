const TOKEN_KEY = 'astra-health-session-v1'

const read = () => { try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null } }
const write = (value) => {
  try { value ? sessionStorage.setItem(TOKEN_KEY, value) : sessionStorage.removeItem(TOKEN_KEY) } catch { /* sin almacenamiento */ }
}

let token = read()

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status }
}

async function request(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`/api/v1/${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new ApiError('No hay conexión con el backend.', 0)
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(data?.detail || 'No se pudo completar la solicitud.', response.status)
  return data
}

// Reanuda la sesión guardada o crea una nueva si venció o no existe.
export async function openSession() {
  if (token) {
    try { await request('session'); return } catch (error) {
      if (error.status !== 401) throw error
      token = null; write(null)
    }
  }
  const created = await request('sessions', { method: 'POST' })
  token = created.token
  write(token)
}

export const closeSession = async () => {
  try { await request('session', { method: 'DELETE' }) } finally { token = null; write(null) }
}
export const hasSession = () => Boolean(token)
export const listEntries = () => request('entries?limit=500')
export const getHistory = (metric, days = 30) => request(`history?metric=${metric}&days=${days}`)
export const sendMessage = (text) => request('messages', { method: 'POST', body: { text } })
export const confirmPending = (payload) => request('confirmations', { method: 'POST', body: { confirmed: true, ...payload } })
export const discardPending = () => request('pending', { method: 'DELETE' })
