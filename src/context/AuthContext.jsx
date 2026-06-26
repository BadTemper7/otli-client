import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import { disconnectRealtime, getRealtimeSocket } from "@/lib/realtime"

const AuthContext = createContext(null)
const STORAGE_KEY = "otli_auth"

const readStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStoredAuth())
  const [loading, setLoading] = useState(Boolean(readStoredAuth()?.token))

  useEffect(() => {
    let cancelled = false

    const verifyToken = async () => {
      const stored = readStoredAuth()

      if (!stored?.token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.me()
        if (cancelled) return

        const updatedAuth = {
          ...stored,
          user: response.data,
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAuth))
        setAuth(updatedAuth)
      } catch {
        if (cancelled) return
        localStorage.removeItem(STORAGE_KEY)
        setAuth(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    verifyToken()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!auth?.token || auth?.portal !== "client") return undefined

    const socket = getRealtimeSocket(auth.token)
    if (!socket) return undefined

    const refreshCurrentUser = async () => {
      try {
        const response = await api.me()

        setAuth((current) => {
          if (!current) return current

          const nextAuth = {
            ...current,
            user: response.data,
          }

          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth))
          return nextAuth
        })
      } catch {
        // Keep the current local session if a realtime refresh fails.
      }
    }

    socket.on("account:updated", refreshCurrentUser)

    return () => {
      socket.off("account:updated", refreshCurrentUser)
    }
  }, [auth?.token, auth?.portal])

  const login = async ({ email, password, portal }) => {
    const response = await api.login({ email, password, portal })
    const nextAuth = {
      token: response.token,
      user: response.data,
      portal,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth))
    setAuth(nextAuth)
    return response
  }

  const logout = () => {
    disconnectRealtime()
    localStorage.removeItem(STORAGE_KEY)
    setAuth(null)
  }

  const updateUser = (nextUser) => {
    setAuth((current) => {
      if (!current) return current

      const nextAuth = {
        ...current,
        user: nextUser,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth))
      return nextAuth
    })
  }

  const hasModule = (moduleId) => {
    if (!auth?.user) return false
    if (auth.user.role === "super-admin") return true
    return Array.isArray(auth.user.moduleAccess) && auth.user.moduleAccess.includes(moduleId)
  }

  const value = useMemo(
    () => ({
      auth,
      user: auth?.user || null,
      token: auth?.token || "",
      portal: auth?.portal || "",
      loading,
      login,
      logout,
      updateUser,
      hasModule,
      setAuth,
    }),
    [auth, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
