export const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://otli-server.onrender.com/api").replace(/\/$/, "")
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "")
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || API_ORIGIN).replace(/\/$/, "")

const GET_CACHE_TTL_MS = 1500
const getCache = new Map()
const inFlightGets = new Map()

const readAuth = () => {
  try {
    return JSON.parse(localStorage.getItem("otli_auth") || "null")
  } catch {
    return null
  }
}

export const getStoredToken = () => readAuth()?.token || ""

export const clearApiCache = (prefix = "") => {
  if (!prefix) {
    getCache.clear()
    return
  }

  for (const key of getCache.keys()) {
    if (key.includes(prefix)) getCache.delete(key)
  }
}

async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    token = getStoredToken(),
    isForm = body instanceof FormData,
  } = options

  const methodUpper = method.toUpperCase()
  const isGet = methodUpper === "GET" && !body
  const cacheKey = `${token || "guest"}:${path}`

  if (isGet) {
    const cached = getCache.get(cacheKey)
    if (cached && Date.now() - cached.createdAt < GET_CACHE_TTL_MS) {
      return cached.payload
    }

    if (inFlightGets.has(cacheKey)) {
      return inFlightGets.get(cacheKey)
    }
  }

  const headers = {
    Accept: "application/json",
  }

  if (token) headers.Authorization = `Bearer ${token}`
  if (body && !isForm) headers["Content-Type"] = "application/json"

  const runRequest = async () => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: methodUpper,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      cache: "no-store",
    })

    let payload = null
    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      payload = await response.json()
    } else {
      payload = { success: response.ok, message: await response.text() }
    }

    if (!response.ok) {
      const message = payload?.message || `Request failed with status ${response.status}`
      const error = new Error(message)
      error.status = response.status
      error.payload = payload
      throw error
    }

    if (isGet) {
      getCache.set(cacheKey, { payload, createdAt: Date.now() })
    } else {
      clearApiCache()
    }

    return payload
  }

  const promise = runRequest()

  if (isGet) {
    inFlightGets.set(cacheKey, promise)
  }

  try {
    return await promise
  } finally {
    if (isGet) inFlightGets.delete(cacheKey)
  }
}

export const api = {
  baseUrl: API_BASE_URL,

  health: () => request("/health"),

  login: ({ email, password, portal }) =>
    request("/auth/login", {
      method: "POST",
      body: { email, password, portal },
      token: "",
    }),

  me: () => request("/auth/me"),

  registerClient: (formData) =>
    request("/auth/register-client", {
      method: "POST",
      body: formData,
      token: "",
    }),

  createAdmin: (data) =>
    request("/auth/admin/create", {
      method: "POST",
      body: data,
    }),

  clientProfile: () => request("/client/profile"),

  updateClientProfile: (data) =>
    request("/client/profile", {
      method: "PATCH",
      body: data,
    }),

  submitPreAdvice: (formData) =>
    request("/pre-advices", {
      method: "POST",
      body: formData,
    }),

  myPreAdvices: () => request("/pre-advices/mine"),

  submitBooking: (data) =>
    request("/bookings", {
      method: "POST",
      body: data,
    }),

  myBookings: () => request("/bookings/mine"),

  adminDashboard: () => request("/admin/dashboard"),

  adminAccounts: (status = "all") => request(`/admin/accounts?status=${encodeURIComponent(status)}`),

  approveAccount: (id) =>
    request(`/admin/accounts/${id}/approve`, {
      method: "PATCH",
      body: {},
    }),

  rejectAccount: (id, reason = "") =>
    request(`/admin/accounts/${id}/reject`, {
      method: "PATCH",
      body: { reason },
    }),

  adminPreAdvices: (status = "all") => request(`/pre-advices/admin?status=${encodeURIComponent(status)}`),

  approvePreAdvice: (id) =>
    request(`/pre-advices/${id}/approve`, {
      method: "PATCH",
      body: {},
    }),

  rejectPreAdvice: (id, reason = "") =>
    request(`/pre-advices/${id}/reject`, {
      method: "PATCH",
      body: { reason },
    }),

  adminBookings: (status = "all") => request(`/bookings/admin?status=${encodeURIComponent(status)}`),

  approveBooking: (id) =>
    request(`/bookings/${id}/approve`, {
      method: "PATCH",
      body: {},
    }),

  rejectBooking: (id, reason = "") =>
    request(`/bookings/${id}/reject`, {
      method: "PATCH",
      body: { reason },
    }),

  gateIns: () => request("/gate-ins"),

  createGateIn: (data) =>
    request("/gate-ins", {
      method: "POST",
      body: data,
    }),

  adminUsers: () => request("/admin/users"),

  updateModuleAccess: (id, moduleAccess) =>
    request(`/admin/users/${id}/module-access`, {
      method: "PATCH",
      body: { moduleAccess },
    }),

  apiLogs: () => request("/admin/api-logs"),

  auditLogs: () => request("/admin/audit-logs"),

  settingsModules: () => request("/admin/settings/modules"),
}
