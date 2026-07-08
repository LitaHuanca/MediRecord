const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('mr_token')
}

export function setToken(token) {
  localStorage.setItem('mr_token', token)
}

export function removeToken() {
  localStorage.removeItem('mr_token')
  localStorage.removeItem('mr_user')
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('mr_user') || 'null')
  } catch {
    return null
  }
}

export function setUser(user) {
  localStorage.setItem('mr_user', JSON.stringify(user))
}

export function isAuthenticated() {
  return !!getToken()
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = body.detail || `Error ${res.status}`
    throw new Error(Array.isArray(msg) ? msg.map(e => e.msg).join('. ') : msg)
  }

  return res.status === 204 ? null : res.json()
}

// Auth
export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),

  // Ficha
  getFicha: () => request('/api/ficha'),
  upsertFicha: (data) => request('/api/ficha', { method: 'PUT', body: JSON.stringify(data) }),

  // Emergency (no auth)
  getEmergency: (token) => fetch(`${BASE_URL}/api/emergency/${token}`).then(async res => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.detail || `Error ${res.status}`)
    }
    return res.json()
  }),

  // Auth
  changePassword: (data) => request('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),

  // Token
  revokeToken: () => request('/api/ficha/token/revoke', { method: 'POST' }),

  // Catalogs
  getCatalogs: () => request('/api/catalogs'),
  addAlergiasCatalog:  (data) => request('/api/catalogs/alergias',    { method: 'POST', body: JSON.stringify(data) }),
  addCondicionCatalog: (data) => request('/api/catalogs/condiciones', { method: 'POST', body: JSON.stringify(data) }),
  addMedCatalog:       (data) => request('/api/catalogs/medicamentos',{ method: 'POST', body: JSON.stringify(data) }),
}
