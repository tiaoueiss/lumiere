// ===========================================
// api.js — Central API service
// ===========================================
// All calls to the backend go through here.
// Token is read from localStorage on every request so it's always current.

const BASE_URL = '/api'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) {
    const validationMessage = data.errors?.map(error => error.msg).join(', ')
    throw new Error(data.message || data.error || validationMessage || 'Request failed')
  }
  return data
}

// ── Auth ────────────────────────────────────
export const requestSignupOtp = (name, email, password) =>
  request('/auth/signup/request-otp', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })

export const verifySignupOtp = (email, otp) =>
  request('/auth/signup/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })

export const login = (email, password) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const getMe = () => request('/auth/me')

export const deleteAccount = (password) =>
  request('/auth/me', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  })

// ── Necklaces ───────────────────────────────
export const fetchNecklaces = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return request(`/necklaces${qs ? `?${qs}` : ''}`)
}

export const fetchNecklaceById = (id) => request(`/necklaces/${id}`)

// ── Wishlist ────────────────────────────────
export const getWishlist = () => request('/wishlist')

export const addToWishlist = (necklaceId) =>
  request(`/wishlist/${necklaceId}`, { method: 'POST' })

export const removeFromWishlist = (necklaceId) =>
  request(`/wishlist/${necklaceId}`, { method: 'DELETE' })

// ── AI Analysis ─────────────────────────────
export const saveAiAnalysis = (results) =>
  request('/style-analysis/save', {
    method: 'POST',
    body: JSON.stringify({ results }),
  })

export const getSavedAiAnalysis = () =>
  request('/style-analysis/saved')

export const deleteSavedAiAnalysis = () =>
  request('/style-analysis/saved', { method: 'DELETE' })

export const getMyUploads = () => request('/necklaces/my-uploads')

export const deleteCustomNecklace = (id) =>
  request(`/necklaces/${id}`, { method: 'DELETE' })

// ── Custom upload (multipart) ───────────────
export async function uploadCustomNecklace(formData) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE_URL}/necklaces/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData, // do NOT set Content-Type — browser sets it with boundary
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Upload failed')
  return data
}
