export function userStorageKey(baseKey, user) {
  const userId = user?.id || user?._id
  return userId ? `${baseKey}:${userId}` : null
}

export function loadUserJson(baseKey, user, fallback) {
  const key = userStorageKey(baseKey, user)
  if (!key) return fallback

  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveUserJson(baseKey, user, value) {
  const key = userStorageKey(baseKey, user)
  if (!key) return false

  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event('lumiere:user-storage'))
  return true
}

export function removeUserJson(baseKey, user) {
  const key = userStorageKey(baseKey, user)
  if (!key) return false

  localStorage.removeItem(key)
  window.dispatchEvent(new Event('lumiere:user-storage'))
  return true
}
