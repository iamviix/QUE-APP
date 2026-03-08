// Shared storage — works identically to the Claude window.storage API
// but uses localStorage so it persists across sessions on any real browser

export const CLIENTS_KEY = "q:clients"
export const JOBS_KEY    = "q:jobs"

export const sGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const sSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export const sRemove = (key) => {
  try { localStorage.removeItem(key) } catch {}
}

// Admin heartbeat — tells client portal that admin is live in the app
export const HEARTBEAT_KEY = "que:admin:heartbeat"
export const HEARTBEAT_TTL = 45000 // 45 seconds

export const pingHeartbeat = () => {
  try { localStorage.setItem(HEARTBEAT_KEY, String(Date.now())) } catch {}
}

export const clearHeartbeat = () => {
  try { localStorage.setItem(HEARTBEAT_KEY, "0") } catch {}
}

export const isAdminLive = () => {
  try {
    const ts = parseInt(localStorage.getItem(HEARTBEAT_KEY) || "0", 10)
    return Date.now() - ts < HEARTBEAT_TTL
  } catch { return false }
}
