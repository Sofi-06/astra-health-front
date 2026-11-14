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
  if (!token) return null
  try {
    const session = await request('session')
    if (!session.user) return null
    return session
  } catch (error) {
    if (error.status !== 401) throw error
    token = null
    write(null)
    return null
  }
}

const saveAuth = (session) => {
  token = session.token
  write(token)
  return session
}

export const loginAccount = async (email, password) =>
  saveAuth(await request('auth/login', { method: 'POST', body: { email, password } }))

export const registerAccount = async (name, email, password) =>
  saveAuth(await request('auth/register', { method: 'POST', body: { name, email, password } }))

export const closeSession = async () => {
  try { if (token) await request('auth/logout', { method: 'POST' }) } finally { token = null; write(null) }
}
export const updateProfileImage = (profileImageUrl) =>
  request('profile', { method: 'PATCH', body: { profile_image_url: profileImageUrl || null } })
export const hasSession = () => Boolean(token)
export const listEntries = () => request('entries?limit=500')
export const getHistory = (metric, days = 30) => request(`history?metric=${metric}&days=${days}`)
export const getSleepAnalysis = (days = 7) =>
  request(`analysis/sleep?days=${days}&tz_offset_minutes=${-new Date().getTimezoneOffset()}`)
export const loadSyntheticSleep = () => request('synthetic/sleep', { method: 'POST' })
export const sendMessage = (text) => request('messages', { method: 'POST', body: { text } })
export const confirmPending = (payload) => request('confirmations', { method: 'POST', body: { confirmed: true, ...payload } })
export const discardPending = () => request('pending', { method: 'DELETE' })
