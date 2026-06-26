import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  Clock3,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Grid2X2,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
  Menu,
  PackageCheck,
  RefreshCcw,
  Save,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShipWheel,
  Truck,
  UploadCloud,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react"
import { api, clearApiCache } from "@/lib/api"
import { getRealtimeSocket } from "@/lib/realtime"
import { useAuth, AuthProvider } from "@/context/AuthContext"
import { ALL_ADMIN_MODULES, ADMIN_NAV_ITEMS, CLIENT_NAV_ITEMS, MODULE_LABELS } from "@/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Select, Textarea } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const ADMIN_PATHS = {
  "/admin": "dashboard",
  "/admin/account-approval": "account-approval",
  "/admin/pre-advice-approval": "pre-advice-approval",
  "/admin/booking-approval": "booking-approval",
  "/admin/gate-in": "gate-in",
  "/admin/users": "users",
  "/admin/api-logs": "api-logs",
  "/admin/audit-logs": "audit-logs",
  "/admin/settings": "settings",
}

const CLIENT_TITLES = {
  "/": "Client Login",
  "/register": "Create Account",
  "/profile": "My Profile",
  "/pre-advice": "Pre-Advice Submission",
  "/booking": "Booking Request",
  "/my-bookings": "My Bookings",
}

const documentLabels = {
  businessPermit: "Business Permit",
  birCertificate: "BIR Certificate",
  validId: "Valid ID",
  authorizationLetter: "Authorization Letter",
  otherDocument: "Other Document",
  billOfLading: "Bill of Lading",
  packingList: "Packing List",
  commercialInvoice: "Commercial Invoice",
}

function useRoute() {
  const [path, setPath] = useState(window.location.pathname || "/")

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname || "/")
    window.addEventListener("popstate", handlePop)
    return () => window.removeEventListener("popstate", handlePop)
  }, [])

  const navigate = (nextPath) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath)
    }
    setPath(nextPath)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return { path, navigate }
}

function useApiData(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await fetcher()
        if (!cancelled) setData(response)
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load data.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [...deps, version])

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  return {
    data,
    loading,
    error,
    reload,
  }
}

function useRealtimeReload(events, reload, enabled = true) {
  const { token } = useAuth()
  const eventsKey = events.join("|")

  useEffect(() => {
    if (!enabled || !token || !events.length) return undefined

    const socket = getRealtimeSocket(token)
    if (!socket) return undefined

    const handleRealtimeChange = () => {
      clearApiCache()
      reload()
    }

    events.forEach((eventName) => socket.on(eventName, handleRealtimeChange))

    return () => {
      events.forEach((eventName) => socket.off(eventName, handleRealtimeChange))
    }
  }, [enabled, token, eventsKey, reload])
}

function formatDate(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function compactDate(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
  }).format(date)
}

function getStatusVariant(status) {
  return ["pending", "verified", "approved", "completed", "rejected", "cancelled", "suspended"].includes(status)
    ? status
    : "default"
}

function getCompanyName(item) {
  return item?.company?.companyName || item?.client?.company?.companyName || item?.companyName || "-"
}

function getUserName(user) {
  return user?.name || user?.email || "User"
}

function messageFrom(error, fallback = "Something went wrong.") {
  return error?.message || fallback
}

function StatusBadge({ status }) {
  return <Badge variant={getStatusVariant(status)}>{status || "unknown"}</Badge>
}

function LoadingScreen({ label = "Loading" }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        {label}
      </div>
    </div>
  )
}

function Notice({ type = "info", message }) {
  if (!message) return null

  const classes = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  }

  return (
    <div className={cn("mb-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium", classes[type])}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">{eyebrow}</p> : null}
        <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  )
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {Icon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div>
        <h2 className="font-bold text-slate-950">{title}</h2>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
    </div>
  )
}

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </span>
      {children}
    </label>
  )
}

function FileField({ label, name, onChange, accept = ".pdf,.jpg,.jpeg,.png,.webp" }) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50/40">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <UploadCloud className="h-4 w-4 text-blue-600" />
        {label}
      </span>
      <input
        type="file"
        name={name}
        accept={accept}
        onChange={(event) => onChange(name, event.target.files?.[0] || null)}
        className="text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
      />
    </label>
  )
}

function DocumentsList({ documents }) {
  const entries = Object.entries(documents || {}).filter(([, doc]) => doc?.url)

  if (!entries.length) return <span className="text-sm text-slate-400">No uploaded document</span>

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, doc]) => (
        <a
          key={key}
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
        >
          {documentLabels[key] || doc.fileName || key}
          <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </div>
  )
}

function EmptyState({ title = "No records found", description = "Records will appear here once available." }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
      <FileText className="mx-auto mb-3 h-9 w-9 text-slate-400" />
      <p className="font-bold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  )
}

function TableWrap({ children }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{children}</div>
}

function ClientUserDropdown({ user, path, navigate }) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickAway = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) return
      setOpen(false)
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handleClickAway)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickAway)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [path])

  const goTo = (nextPath) => {
    setOpen(false)
    navigate(nextPath)
  }

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate("/")
  }

  const initials = getUserName(user)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"

  const menuItems = [
    {
      label: "Profile",
      description: "Company details and documents",
      path: "/profile",
      icon: UserCog,
    },
    {
      label: "My Bookings",
      description: "View submitted booking list",
      path: "/my-bookings",
      icon: CalendarCheck,
    },
  ]

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "group flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-2.5 py-2 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md",
          open && "border-blue-300 bg-blue-50 shadow-md"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-black text-white shadow-sm">
          {initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[150px] truncate text-sm font-black text-slate-950">{getUserName(user)}</span>
          <span className="block max-w-[150px] truncate text-xs font-semibold text-slate-500">{getCompanyName(user)}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-blue-600", open && "rotate-180 text-blue-600")} />
      </button>

      {open ? (
        <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/12 ring-1 ring-slate-900/5 z-50">
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-sm font-black ring-1 ring-white/20">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{getUserName(user)}</p>
                <p className="truncate text-xs font-semibold text-blue-50/90">{user?.email}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-white/20">{user?.status || "client"}</span>
              <span className="max-w-full truncate rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold ring-1 ring-white/20">{getCompanyName(user)}</span>
            </div>
          </div>

          <div className="p-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = path === item.path

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => goTo(item.path)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                    active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  )}
                  role="menuitem"
                >
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500")}> 
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="block text-xs font-semibold text-slate-500">{item.description}</span>
                  </span>
                </button>
              )
            })}

            <div className="my-2 border-t border-slate-100" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-rose-600 transition hover:bg-rose-50"
              role="menuitem"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <LogOut className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black">Logout</span>
                <span className="block text-xs font-semibold text-rose-500/80">Sign out from client portal</span>
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ClientLayout({ path, navigate, children }) {
  const { user, portal } = useAuth()
  const clientLoggedIn = user?.role === "client" && portal === "client"

  const visibleNavItems = CLIENT_NAV_ITEMS.filter((item) => {
    if (!clientLoggedIn) return false
    return !["/", "/register", "/profile", "/my-bookings"].includes(item.path)
  })

  const logoTarget = clientLoggedIn ? "/pre-advice" : "/"

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-blue-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <button type="button" onClick={() => navigate(logoTarget)} className="flex items-center gap-3 text-left">
            <div className="logo-mark flex h-11 w-11 items-center justify-center bg-blue-600 text-white shadow-sm">
              <ShipWheel className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-black leading-none text-slate-950">OTLI</p>
              <p className="text-xs font-semibold text-slate-500">Client Portal</p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {visibleNavItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-bold transition",
                  path === item.path ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {clientLoggedIn ? (
              <ClientUserDropdown user={user} path={path} navigate={navigate} />
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/register")}>Register</Button>
                <Button size="sm" onClick={() => navigate("/")}>Login</Button>
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 md:hidden">
          {visibleNavItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition",
                path === item.path ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">{children}</main>
    </div>
  )
}

function AdminLayout({ activeModule, navigate, children }) {
  const { user, logout, hasModule } = useAuth()
  const [open, setOpen] = useState(false)

  const visibleNav = useMemo(() => {
    if (user?.role === "super-admin") return ADMIN_NAV_ITEMS
    return ADMIN_NAV_ITEMS.filter((item) => hasModule(item.id))
  }, [user, hasModule])

  return (
    <div className="min-h-screen bg-slate-50/80">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <button type="button" onClick={() => navigate("/admin")} className="flex items-center gap-3 text-left">
            <div className="logo-mark flex h-11 w-11 items-center justify-center bg-slate-950 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-black leading-none text-slate-950">OTLI Admin</p>
              <p className="text-xs font-semibold text-slate-500">Super Admin and Admin</p>
            </div>
          </button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1 p-4">
          {visibleNav.map((item) => {
            const Icon = item.icon
            const active = item.id === activeModule

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  navigate(item.path)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition",
                  active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 p-4">
          <div className="mb-3 rounded-2xl bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">{getUserName(user)}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="blue">{user?.role}</Badge>
              {user?.isLocked ? <Badge>locked</Badge> : null}
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {open ? <button aria-label="Close sidebar" className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setOpen(false)} /> : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-20 items-center justify-between gap-4 px-4 md:px-7">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Admin Portal</p>
                <h1 className="text-lg font-black text-slate-950 md:text-2xl">{MODULE_LABELS[activeModule] || "Dashboard"}</h1>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <Badge variant="green">Backend connected</Badge>
              <p className="max-w-[260px] truncate text-right text-sm font-semibold text-slate-600">{api.baseUrl}</p>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-7 md:py-8">{children}</main>
      </div>
    </div>
  )
}

function ProtectedClientNotice({ navigate }) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="p-8 text-center">
        <LockKeyhole className="mx-auto mb-4 h-12 w-12 text-blue-600" />
        <h2 className="text-xl font-black text-slate-950">Login required</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Please login as a verified client to access this module.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={() => navigate("/")}>Go to Login</Button>
          <Button variant="outline" onClick={() => navigate("/register")}>Create Account</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ClientLoginPage({ navigate }) {
  const { user, portal, login, logout } = useAuth()
  const [form, setForm] = useState({ email: "", password: "" })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const clientLoggedIn = user?.role === "client" && portal === "client"

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    setMessage("")

    try {
      const response = await login({ ...form, portal: "client" })
      setMessage(response.message || "Login successful.")
      navigate(response.data?.status === "verified" ? "/pre-advice" : "/profile")
    } catch (err) {
      setError(messageFrom(err, "Unable to login."))
    } finally {
      setBusy(false)
    }
  }

  if (clientLoggedIn) {
    const isVerified = user.status === "verified"

    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardContent className="p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Client Portal</p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">Welcome, {getUserName(user)}</h1>
                <p className="mt-2 text-slate-600">Your company information is connected to the backend and will auto-fill on submissions.</p>
              </div>
              <StatusBadge status={user.status} />
            </div>

            {!isVerified ? (
              <Notice
                type={user.status === "rejected" ? "error" : "warning"}
                message={user.status === "rejected"
                  ? "Your account was rejected. You can update your profile or replace documents, then resubmit for review."
                  : "Your account is pending review. You can still update your profile or upload missing documents."}
              />
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              <button type="button" onClick={() => navigate("/profile")} className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
                <UserCog className="mb-3 h-7 w-7 text-blue-600" />
                <p className="font-black text-slate-950">My Profile</p>
                <p className="mt-1 text-sm text-slate-600">Update details or documents.</p>
              </button>
              <button type="button" onClick={() => navigate("/pre-advice")} className={cn("rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm", isVerified ? "border-blue-100 bg-blue-50" : "border-slate-200 bg-slate-50")}>
                <ClipboardCheck className={cn("mb-3 h-7 w-7", isVerified ? "text-blue-600" : "text-slate-400")} />
                <p className="font-black text-slate-950">Submit Pre-Advice</p>
                <p className="mt-1 text-sm text-slate-600">{isVerified ? "Upload shipping documents." : "Available after admin verification."}</p>
              </button>
              <button type="button" onClick={() => navigate("/booking")} className={cn("rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm", isVerified ? "border-emerald-100 bg-emerald-50" : "border-slate-200 bg-slate-50")}>
                <PackageCheck className={cn("mb-3 h-7 w-7", isVerified ? "text-emerald-600" : "text-slate-400")} />
                <p className="font-black text-slate-950">Create Booking</p>
                <p className="mt-1 text-sm text-slate-600">{isVerified ? "Book truck schedule." : "Available after admin verification."}</p>
              </button>
            </div>

            <Button variant="outline" className="mt-5" onClick={() => { logout(); navigate("/") }}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Company" value={getCompanyName(user)} />
            <InfoRow label="Type" value={user.company?.companyType || "-"} />
            <InfoRow label="Phone" value={user.company?.phoneNumber || "-"} />
            <InfoRow label="Representative" value={getUserName(user)} />
            <InfoRow label="Email" value={user.email} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="pt-4 md:pt-12">
        <Badge variant="blue">OTLI client side</Badge>
        <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Online Terminal Logistics Interface</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Clients can create accounts, submit pre-advice, request bookings, and track approval status. Document uploads are sent to the backend and stored through Cloudinary.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => navigate("/register")}>Create Client Account <ArrowRight className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => navigate("/admin")}>Admin Portal</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Login</CardTitle>
          <Badge variant="green">API ready</Badge>
        </CardHeader>
        <CardContent>
          <Notice type="success" message={message} />
          <Notice type="error" message={error} />
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email" required>
              <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="client@email.com" />
            </Field>
            <Field label="Password" required>
              <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter password" />
            </Field>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Login as Client
            </Button>
            <p className="text-center text-sm text-slate-500">
              No account yet?{" "}
              <button type="button" className="font-bold text-blue-600" onClick={() => navigate("/register")}>Create one here</button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function RegisterClientPage({ navigate }) {
  const emptyForm = {
    email: "",
    password: "",
    companyName: "",
    companyAddress: "",
    companyType: "trucking",
    companyTypeOther: "",
    phoneNumber: "",
    representativeFirstName: "",
    representativeMiddleName: "",
    representativeLastName: "",
    representativePosition: "",
  }
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const setFile = (key, file) => setFiles((current) => ({ ...current, [key]: file }))

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage("")
    setError("")

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file)
      })

      const response = await api.registerClient(formData)
      setMessage(response.message || "Account submitted.")
      setForm(emptyForm)
      setFiles({})
    } catch (err) {
      setError(messageFrom(err, "Unable to submit account registration."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Client module"
        title="Account Creation"
        description="Submit company details and required documents. Admin will verify the account before the client can submit pre-advice or bookings."
      >
        <Button variant="outline" onClick={() => navigate("/")}>Back to Login</Button>
      </PageHeader>

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={Building2} title="Company Information" description="These fields are saved to the client profile." />
            <Notice type="success" message={message} />
            <Notice type="error" message={error} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Company Name" required>
                <Input value={form.companyName} onChange={(event) => setValue("companyName", event.target.value)} />
              </Field>
              <Field label="Company Type" required>
                <Select value={form.companyType} onChange={(event) => setValue("companyType", event.target.value)}>
                  <option value="trucking">Trucking</option>
                  <option value="customs brokerage">Customs Brokerage</option>
                  <option value="consignee/importer">Consignee / Importer</option>
                  <option value="shipping line">Shipping Line</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              {form.companyType === "other" ? (
                <Field label="Specify Company Type">
                  <Input value={form.companyTypeOther} onChange={(event) => setValue("companyTypeOther", event.target.value)} />
                </Field>
              ) : null}
              <Field label="Phone Number">
                <Input value={form.phoneNumber} onChange={(event) => setValue("phoneNumber", event.target.value)} />
              </Field>
              <Field label="Company Address">
                <Textarea value={form.companyAddress} onChange={(event) => setValue("companyAddress", event.target.value)} />
              </Field>
            </div>

            <SectionTitle icon={Users} title="Representative Information" description="This will become the client user profile." />
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="First Name" required>
                <Input value={form.representativeFirstName} onChange={(event) => setValue("representativeFirstName", event.target.value)} />
              </Field>
              <Field label="Middle Name">
                <Input value={form.representativeMiddleName} onChange={(event) => setValue("representativeMiddleName", event.target.value)} />
              </Field>
              <Field label="Last Name" required>
                <Input value={form.representativeLastName} onChange={(event) => setValue("representativeLastName", event.target.value)} />
              </Field>
              <Field label="Position">
                <Input value={form.representativePosition} onChange={(event) => setValue("representativePosition", event.target.value)} />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={form.email} onChange={(event) => setValue("email", event.target.value)} />
              </Field>
              <Field label="Password" required>
                <Input type="password" value={form.password} onChange={(event) => setValue("password", event.target.value)} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={UploadCloud} title="Submitted Documents" description="Files will be uploaded to Cloudinary through the Express server." />
            <div className="grid gap-3">
              <FileField label="Business Permit" name="businessPermit" onChange={setFile} />
              <FileField label="BIR Certificate" name="birCertificate" onChange={setFile} />
              <FileField label="Valid ID" name="validId" onChange={setFile} />
              <FileField label="Authorization Letter" name="authorizationLetter" onChange={setFile} />
              <FileField label="Other Document" name="otherDocument" onChange={setFile} />
            </div>
            <Button type="submit" className="mt-5 w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon />}
              Submit Registration
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}


function ClientProfilePage({ navigate }) {
  const { user, portal, updateUser } = useAuth()
  const clientLoggedIn = user?.role === "client" && portal === "client"
  const buildForm = (sourceUser) => ({
    companyName: sourceUser?.company?.companyName || "",
    companyAddress: sourceUser?.company?.companyAddress || "",
    companyType: sourceUser?.company?.companyType || "trucking",
    companyTypeOther: sourceUser?.company?.companyTypeOther || "",
    phoneNumber: sourceUser?.company?.phoneNumber || "",
    representativeFirstName: sourceUser?.company?.representativeFirstName || "",
    representativeMiddleName: sourceUser?.company?.representativeMiddleName || "",
    representativeLastName: sourceUser?.company?.representativeLastName || "",
    representativePosition: sourceUser?.company?.representativePosition || "",
  })

  const [form, setForm] = useState(() => buildForm(user))
  const [files, setFiles] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) setForm(buildForm(user))
  }, [user?._id])

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const setFile = (key, file) => setFiles((current) => ({ ...current, [key]: file }))

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage("")
    setError("")

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file)
      })

      const response = await api.updateClientProfile(formData)
      updateUser(response.data)
      setFiles({})
      setMessage(response.message || "Profile updated.")
    } catch (err) {
      setError(messageFrom(err, "Unable to update profile."))
    } finally {
      setBusy(false)
    }
  }

  if (!clientLoggedIn) return <ProtectedClientNotice navigate={navigate} />

  const isRejected = user.status === "rejected"
  const isPending = user.status === "pending"
  const isVerified = user.status === "verified"

  return (
    <div>
      <PageHeader
        eyebrow="Client module"
        title="My Profile and Documents"
        description="Pending and rejected accounts can still login here. Update the company profile, replace files, and resubmit for admin review."
      >
        <StatusBadge status={user.status} />
      </PageHeader>

      {isRejected ? (
        <Notice
          type="error"
          message={`Your account was rejected. Reason: ${user.rejectionReason || "No reason provided."} Update the details or documents below, then resubmit.`}
        />
      ) : null}
      {isPending ? <Notice type="warning" message="Your account is pending admin review. You can update your profile or upload missing documents while waiting." /> : null}
      {isVerified ? <Notice type="success" message="Your account is verified. Pre-advice and booking modules are now available." /> : null}
      <Notice type="success" message={message} />
      <Notice type="error" message={error} />

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={Building2} title="Company Information" description="Update company and representative details." />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Company Name" required>
                <Input value={form.companyName} onChange={(event) => setValue("companyName", event.target.value)} />
              </Field>
              <Field label="Company Type" required>
                <Select value={form.companyType} onChange={(event) => setValue("companyType", event.target.value)}>
                  <option value="trucking">Trucking</option>
                  <option value="customs brokerage">Customs Brokerage</option>
                  <option value="consignee/importer">Consignee / Importer</option>
                  <option value="shipping line">Shipping Line</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              {form.companyType === "other" ? (
                <Field label="Specify Company Type">
                  <Input value={form.companyTypeOther} onChange={(event) => setValue("companyTypeOther", event.target.value)} />
                </Field>
              ) : null}
              <Field label="Phone Number">
                <Input value={form.phoneNumber} onChange={(event) => setValue("phoneNumber", event.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Company Address">
                  <Textarea value={form.companyAddress} onChange={(event) => setValue("companyAddress", event.target.value)} />
                </Field>
              </div>
            </div>

            <SectionTitle icon={Users} title="Representative Information" description="This information is used as the client account profile." />
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="First Name" required>
                <Input value={form.representativeFirstName} onChange={(event) => setValue("representativeFirstName", event.target.value)} />
              </Field>
              <Field label="Middle Name">
                <Input value={form.representativeMiddleName} onChange={(event) => setValue("representativeMiddleName", event.target.value)} />
              </Field>
              <Field label="Last Name" required>
                <Input value={form.representativeLastName} onChange={(event) => setValue("representativeLastName", event.target.value)} />
              </Field>
              <Field label="Position">
                <Input value={form.representativePosition} onChange={(event) => setValue("representativePosition", event.target.value)} />
              </Field>
              <Field label="Email">
                <Input value={user.email} disabled />
              </Field>
              <Field label="Current Status">
                <Input value={user.status} disabled />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={UploadCloud} title="Submitted Documents" description="Existing files are shown below. Choose a new file only for the document you want to replace." />
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-sm font-black text-slate-950">Current Uploads</p>
              <DocumentsList documents={user.documents} />
            </div>
            <div className="grid gap-3">
              <FileField label="Replace Business Permit" name="businessPermit" onChange={setFile} />
              <FileField label="Replace BIR Certificate" name="birCertificate" onChange={setFile} />
              <FileField label="Replace Valid ID" name="validId" onChange={setFile} />
              <FileField label="Replace Authorization Letter" name="authorizationLetter" onChange={setFile} />
              <FileField label="Replace Other Document" name="otherDocument" onChange={setFile} />
            </div>
            <Button type="submit" className="mt-5 w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isRejected ? "Resubmit Profile" : isPending ? "Update Pending Application" : "Save Profile"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

function SendIcon() {
  return <ArrowRight className="h-4 w-4" />
}

function PreAdvicePage({ navigate }) {
  const { user, portal } = useAuth()
  const clientLoggedIn = user?.role === "client" && portal === "client"
  const [form, setForm] = useState({
    containerNo: "",
    sealNo: "",
    shippingLine: "",
    vesselName: "",
    voyageNo: "",
    containerSize: "20FT",
    cargoDescription: "",
    expectedArrivalDate: "",
  })
  const [files, setFiles] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const records = useApiData(() => clientLoggedIn ? api.myPreAdvices() : Promise.resolve({ data: [] }), [clientLoggedIn])
  useRealtimeReload(["preAdvice:created", "preAdvice:updated"], records.reload, clientLoggedIn)

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const setFile = (key, file) => setFiles((current) => ({ ...current, [key]: file }))

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage("")
    setError("")

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file)
      })

      const response = await api.submitPreAdvice(formData)
      setMessage(response.message || "Pre-advice submitted.")
      setForm({
        containerNo: "",
        sealNo: "",
        shippingLine: "",
        vesselName: "",
        voyageNo: "",
        containerSize: "20FT",
        cargoDescription: "",
        expectedArrivalDate: "",
      })
      setFiles({})
      records.reload()
    } catch (err) {
      setError(messageFrom(err, "Unable to submit pre-advice."))
    } finally {
      setBusy(false)
    }
  }

  if (!clientLoggedIn) return <ProtectedClientNotice navigate={navigate} />

  const isVerified = user.status === "verified"
  const rows = records.data?.data || []

  return (
    <div>
      <PageHeader
        eyebrow="Client module"
        title="Pre-Advice Submission"
        description="Company name is pulled from your verified account. Upload BL, packing list, invoice, or other supporting documents."
      >
        <StatusBadge status={user.status} />
      </PageHeader>

      {!isVerified ? <Notice type="warning" message="Your account must be verified by admin before submitting pre-advice." /> : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={ClipboardCheck} title="Pre-Advice Details" description="This form calls POST /api/pre-advices." />
            <Notice type="success" message={message} />
            <Notice type="error" message={error} />
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Company Name">
                  <Input value={getCompanyName(user)} disabled />
                </Field>
                <Field label="Container No." required>
                  <Input value={form.containerNo} onChange={(event) => setValue("containerNo", event.target.value)} placeholder="ABCD1234567" />
                </Field>
                <Field label="Seal No.">
                  <Input value={form.sealNo} onChange={(event) => setValue("sealNo", event.target.value)} />
                </Field>
                <Field label="Shipping Line">
                  <Input value={form.shippingLine} onChange={(event) => setValue("shippingLine", event.target.value)} />
                </Field>
                <Field label="Vessel Name">
                  <Input value={form.vesselName} onChange={(event) => setValue("vesselName", event.target.value)} />
                </Field>
                <Field label="Voyage No.">
                  <Input value={form.voyageNo} onChange={(event) => setValue("voyageNo", event.target.value)} />
                </Field>
                <Field label="Container Size">
                  <Select value={form.containerSize} onChange={(event) => setValue("containerSize", event.target.value)}>
                    <option value="20FT">20FT</option>
                    <option value="40FT">40FT</option>
                    <option value="40HC">40HC</option>
                    <option value="45FT">45FT</option>
                  </Select>
                </Field>
                <Field label="Expected Arrival Date">
                  <Input type="date" value={form.expectedArrivalDate} onChange={(event) => setValue("expectedArrivalDate", event.target.value)} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Cargo Description">
                    <Textarea value={form.cargoDescription} onChange={(event) => setValue("cargoDescription", event.target.value)} />
                  </Field>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <FileField label="Bill of Lading" name="billOfLading" onChange={setFile} />
                <FileField label="Packing List" name="packingList" onChange={setFile} />
                <FileField label="Commercial Invoice" name="commercialInvoice" onChange={setFile} />
                <FileField label="Other Document" name="otherDocument" onChange={setFile} />
              </div>

              <Button type="submit" disabled={busy || !isVerified} className="w-full md:w-auto">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Submit Pre-Advice
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Pre-Advice Records</CardTitle>
            <Button variant="outline" size="sm" onClick={records.reload}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Notice type="error" message={records.error} />
            {records.loading ? <LoadingBlock /> : rows.length ? (
              <div className="space-y-3">
                {rows.map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950">{item.referenceNo}</p>
                        <p className="text-sm text-slate-500">{item.containerNo}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-sm text-slate-600">ETA: {compactDate(item.expectedArrivalDate)}</p>
                    <div className="mt-3"><DocumentsList documents={item.documents} /></div>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No pre-advice yet" description="Your submitted pre-advice records will appear here." />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function BookingPage({ navigate }) {
  const { user, portal } = useAuth()
  const clientLoggedIn = user?.role === "client" && portal === "client"
  const [form, setForm] = useState({
    preAdviceId: "",
    containerNo: "",
    truckPlateNo: "",
    driverName: "",
    driverMobile: "",
    scheduleDate: "",
    scheduleTime: "",
    purpose: "gate-in",
    remarks: "",
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const preAdvices = useApiData(() => clientLoggedIn ? api.myPreAdvices() : Promise.resolve({ data: [] }), [clientLoggedIn])
  useRealtimeReload(["preAdvice:created", "preAdvice:updated"], preAdvices.reload, clientLoggedIn)

  const approvedPreAdvices = (preAdvices.data?.data || []).filter((item) => item.status === "approved")

  const setValue = (key, value) => {
    if (key === "preAdviceId") {
      const selected = approvedPreAdvices.find((item) => item._id === value)
      setForm((current) => ({
        ...current,
        preAdviceId: value,
        containerNo: selected?.containerNo || current.containerNo,
      }))
      return
    }

    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage("")
    setError("")

    try {
      const payload = { ...form }
      if (!payload.preAdviceId) delete payload.preAdviceId
      const response = await api.submitBooking(payload)
      setMessage(response.message || "Booking submitted.")
      setForm({
        preAdviceId: "",
        containerNo: "",
        truckPlateNo: "",
        driverName: "",
        driverMobile: "",
        scheduleDate: "",
        scheduleTime: "",
        purpose: "gate-in",
        remarks: "",
      })
      clearApiCache("/bookings/mine")
    } catch (err) {
      setError(messageFrom(err, "Unable to submit booking."))
    } finally {
      setBusy(false)
    }
  }

  if (!clientLoggedIn) return <ProtectedClientNotice navigate={navigate} />

  const isVerified = user.status === "verified"

  return (
    <div>
      <PageHeader
        eyebrow="Client module"
        title="Booking Request"
        description="Create a booking using an approved pre-advice or enter container details manually."
      >
        <StatusBadge status={user.status} />
      </PageHeader>

      {!isVerified ? <Notice type="warning" message="Your account must be verified by admin before creating a booking." /> : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={PackageCheck} title="Booking Details" description="This form calls POST /api/bookings." />
            <Notice type="success" message={message} />
            <Notice type="error" message={error} />
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Company Name">
                  <Input value={getCompanyName(user)} disabled />
                </Field>
                <Field label="Approved Pre-Advice">
                  <Select value={form.preAdviceId} onChange={(event) => setValue("preAdviceId", event.target.value)}>
                    <option value="">Manual booking</option>
                    {approvedPreAdvices.map((item) => (
                      <option key={item._id} value={item._id}>{item.referenceNo} - {item.containerNo}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Container No.">
                  <Input value={form.containerNo} onChange={(event) => setValue("containerNo", event.target.value)} />
                </Field>
                <Field label="Truck Plate No." required>
                  <Input value={form.truckPlateNo} onChange={(event) => setValue("truckPlateNo", event.target.value)} />
                </Field>
                <Field label="Driver Name" required>
                  <Input value={form.driverName} onChange={(event) => setValue("driverName", event.target.value)} />
                </Field>
                <Field label="Driver Mobile">
                  <Input value={form.driverMobile} onChange={(event) => setValue("driverMobile", event.target.value)} />
                </Field>
                <Field label="Schedule Date" required>
                  <Input type="date" value={form.scheduleDate} onChange={(event) => setValue("scheduleDate", event.target.value)} />
                </Field>
                <Field label="Schedule Time">
                  <Input type="time" value={form.scheduleTime} onChange={(event) => setValue("scheduleTime", event.target.value)} />
                </Field>
                <Field label="Purpose">
                  <Select value={form.purpose} onChange={(event) => setValue("purpose", event.target.value)}>
                    <option value="gate-in">Gate In</option>
                    <option value="gate-out">Gate Out</option>
                    <option value="inspection">Inspection</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Remarks">
                    <Textarea value={form.remarks} onChange={(event) => setValue("remarks", event.target.value)} />
                  </Field>
                </div>
              </div>
              <Button type="submit" disabled={busy || !isVerified} className="w-full md:w-auto">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                Submit Booking
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-5 text-white shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/15">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <p className="text-lg font-black">Booking list moved to your profile dropdown</p>
              <p className="mt-2 text-sm font-medium leading-6 text-blue-50/85">
                Use the username dropdown and click My Bookings to view all submitted bookings, statuses, schedules, and container details.
              </p>
              <Button type="button" variant="secondary" className="mt-5 w-full justify-center" onClick={() => navigate("/my-bookings")}>
                View My Bookings
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Booking page purpose</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                This navbar Booking page is now focused on creating a new booking request only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


function MyBookingsPage({ navigate }) {
  const { user, portal } = useAuth()
  const clientLoggedIn = user?.role === "client" && portal === "client"
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")

  const bookings = useApiData(() => clientLoggedIn ? api.myBookings() : Promise.resolve({ data: [] }), [clientLoggedIn])
  useRealtimeReload(["booking:created", "booking:updated", "gateIn:created"], bookings.reload, clientLoggedIn)

  if (!clientLoggedIn) return <ProtectedClientNotice navigate={navigate} />

  const rows = bookings.data?.data || []
  const stats = {
    total: rows.length,
    pending: rows.filter((item) => item.status === "pending").length,
    approved: rows.filter((item) => item.status === "approved").length,
    completed: rows.filter((item) => item.status === "completed").length,
  }

  const filteredRows = rows.filter((item) => {
    const matchesStatus = status === "all" || item.status === status
    const haystack = [
      item.bookingNo,
      item.containerNo,
      item.preAdvice?.containerNo,
      item.truckPlateNo,
      item.driverName,
      item.driverMobile,
      item.purpose,
      item.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return matchesStatus && haystack.includes(search.trim().toLowerCase())
  })

  return (
    <div>
      <PageHeader
        eyebrow="Client records"
        title="My Bookings"
        description="View your submitted booking list, approval status, schedules, and container details."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={bookings.reload}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => navigate("/booking")}>
            New Booking
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Bookings", value: stats.total, icon: ClipboardCheck },
          { label: "Pending", value: stats.pending, icon: Clock3 },
          { label: "Approved", value: stats.approved, icon: Check },
          { label: "Completed", value: stats.completed, icon: PackageCheck },
        ].map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-950">{item.value}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking List</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search booking, container, truck, driver"
                className="pl-9 sm:w-80"
              />
            </div>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="sm:w-44">
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Notice type="error" message={bookings.error} />
          {bookings.loading ? <LoadingBlock /> : filteredRows.length ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500 md:grid md:grid-cols-[1fr_1fr_1fr_1fr_120px]">
                <div className="px-4 py-3">Booking</div>
                <div className="px-4 py-3">Truck / Driver</div>
                <div className="px-4 py-3">Schedule</div>
                <div className="px-4 py-3">Container</div>
                <div className="px-4 py-3 text-right">Status</div>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredRows.map((item) => (
                  <div key={item._id} className="grid gap-3 p-4 transition hover:bg-slate-50 md:grid-cols-[1fr_1fr_1fr_1fr_120px] md:items-center">
                    <div>
                      <p className="font-black text-slate-950">{item.bookingNo}</p>
                      <p className="text-xs font-semibold capitalize text-slate-500">{item.purpose || "gate-in"}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.truckPlateNo || "-"}</p>
                      <p className="text-sm text-slate-500">{item.driverName || "-"}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{compactDate(item.scheduleDate)}</p>
                      <p className="text-sm text-slate-500">{item.scheduleTime || "No time set"}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.containerNo || item.preAdvice?.containerNo || "-"}</p>
                      <p className="text-sm text-slate-500">{item.preAdvice?.referenceNo || "Manual booking"}</p>
                    </div>
                    <div className="flex md:justify-end">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : rows.length ? (
            <EmptyState title="No matching bookings" description="Try changing the status filter or search keyword." />
          ) : (
            <EmptyState title="No booking yet" description="Create your first booking request from the Booking page in the navbar." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminLoginPage({ navigate }) {
  const { user, portal, login } = useAuth()
  const [form, setForm] = useState({ email: "", password: "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const adminLoggedIn = ["admin", "super-admin"].includes(user?.role) && portal === "admin"

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError("")

    try {
      await login({ ...form, portal: "admin" })
      navigate("/admin")
    } catch (err) {
      setError(messageFrom(err, "Unable to login as admin."))
    } finally {
      setBusy(false)
    }
  }

  if (adminLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-blue-600" />
            <h1 className="text-2xl font-black text-slate-950">Admin already logged in</h1>
            <p className="mt-2 text-sm text-slate-600">Continue to the admin dashboard.</p>
            <Button className="mt-5" onClick={() => navigate("/admin")}>Go to Admin Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_0.8fr]">
      <div className="flex items-center justify-center bg-slate-950 px-6 py-12 text-white">
        <div className="max-w-xl">
          <div className="logo-mark mb-6 flex h-16 w-16 items-center justify-center bg-blue-600 text-white">
            <Shield className="h-9 w-9" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-300">OTLI Admin</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Admin access uses /admin</h1>
          <p className="mt-5 leading-7 text-slate-300">Super admin can create admin accounts and assign selected module access. The locked super admin modules cannot be changed.</p>
          <Button variant="outline" className="mt-6 border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => navigate("/")}>Go to Client Portal</Button>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <Badge variant="blue">/admin</Badge>
          </CardHeader>
          <CardContent>
            <Notice type="error" message={error} />
            <form onSubmit={submit} className="space-y-4">
              <Field label="Email" required>
                <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="admin@email.com" />
              </Field>
              <Field label="Password" required>
                <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter password" />
              </Field>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Login to Admin
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AdminDashboardPage() {
  const dashboard = useApiData(() => api.adminDashboard(), [])
  useRealtimeReload(["account:created", "account:resubmitted", "account:updated", "preAdvice:created", "preAdvice:updated", "booking:created", "booking:updated", "gateIn:created"], dashboard.reload)
  const stats = dashboard.data?.data?.stats || {}
  const recent = dashboard.data?.data?.recent || {}

  const cards = [
    { label: "Pending Accounts", value: stats.pendingAccounts || 0, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Pending Pre-Advice", value: stats.pendingPreAdvices || 0, icon: FileCheck2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Pending Bookings", value: stats.pendingBookings || 0, icon: CalendarCheck, color: "bg-violet-50 text-violet-600" },
    { label: "Gate In Today", value: stats.gateInToday || 0, icon: Truck, color: "bg-orange-50 text-orange-600" },
    { label: "Total Clients", value: stats.totalClients || 0, icon: Building2, color: "bg-slate-100 text-slate-700" },
  ]

  return (
    <div>
      <PageHeader eyebrow="Live backend data" title="Admin Dashboard" description="Counts and recent records are loaded from MongoDB through the Express API." >
        <Button variant="outline" onClick={dashboard.reload}>
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>
      <Notice type="error" message={dashboard.error} />
      {dashboard.loading ? <LoadingBlock /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                        <p className="mt-2 text-3xl font-black text-slate-950">{card.value}</p>
                      </div>
                      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", card.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <RecentList title="Recent Accounts" items={recent.accounts || []} type="account" />
            <RecentList title="Recent Pre-Advice" items={recent.preAdvices || []} type="pre-advice" />
            <RecentList title="Recent Bookings" items={recent.bookings || []} type="booking" />
          </div>
        </>
      )}
    </div>
  )
}

function RecentList({ title, items, type }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">
                      {type === "account" ? getCompanyName(item) : item.referenceNo || item.bookingNo}
                    </p>
                    <p className="text-sm text-slate-500">{type === "account" ? item.email : getCompanyName(item)}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-xs text-slate-400">Updated {formatDate(item.updatedAt)}</p>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No records" description="Recent records will appear here." />}
      </CardContent>
    </Card>
  )
}

function ApprovalActions({ onApprove, onReject, busy }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="success" size="sm" onClick={onApprove} disabled={busy}>
        <Check className="h-4 w-4" />
        Approve
      </Button>
      <Button variant="destructive" size="sm" onClick={onReject} disabled={busy}>
        <X className="h-4 w-4" />
        Reject
      </Button>
    </div>
  )
}

function AccountApprovalPage() {
  const [status, setStatus] = useState("all")
  const [busyId, setBusyId] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const accounts = useApiData(() => api.adminAccounts(status), [status])
  useRealtimeReload(["account:created", "account:resubmitted", "account:updated"], accounts.reload)
  const rows = accounts.data?.data || []

  const approve = async (id) => {
    setBusyId(id)
    setMessage("")
    setError("")
    try {
      const response = await api.approveAccount(id)
      setMessage(response.message || "Account approved.")
      accounts.reload()
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setBusyId("")
    }
  }

  const reject = async (id) => {
    const reason = window.prompt("Reason for rejection?", "Incomplete or invalid submitted documents.") || ""
    setBusyId(id)
    setMessage("")
    setError("")
    try {
      const response = await api.rejectAccount(id, reason)
      setMessage(response.message || "Account rejected.")
      accounts.reload()
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setBusyId("")
    }
  }

  return (
    <AdminTablePage
      title="Account Approval"
      description="Verify client company details and uploaded documents. Approvals call PATCH /api/admin/accounts/:id/approve."
      status={status}
      setStatus={setStatus}
      reload={accounts.reload}
      loading={accounts.loading}
      error={accounts.error || error}
      message={message}
    >
      {rows.length ? (
        <TableWrap>
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Representative</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((item) => (
                <tr key={item._id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-black text-slate-950">{getCompanyName(item)}</p>
                    <p className="text-slate-500">{item.company?.companyType || "-"}</p>
                    <p className="text-slate-500">{item.company?.phoneNumber || "-"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{getUserName(item)}</p>
                    <p className="text-slate-500">{item.email}</p>
                    <p className="text-slate-500">{item.company?.representativePosition || "-"}</p>
                  </td>
                  <td className="px-4 py-4"><DocumentsList documents={item.documents} /></td>
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-4 text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-4">
                    {item.status === "pending" ? (
                      <ApprovalActions busy={busyId === item._id} onApprove={() => approve(item._id)} onReject={() => reject(item._id)} />
                    ) : <span className="text-xs font-semibold text-slate-400">No action</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : <EmptyState />}
    </AdminTablePage>
  )
}

function PreAdviceApprovalPage() {
  const [status, setStatus] = useState("all")
  const [busyId, setBusyId] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const records = useApiData(() => api.adminPreAdvices(status), [status])
  useRealtimeReload(["preAdvice:created", "preAdvice:updated"], records.reload)
  const rows = records.data?.data || []

  const approve = async (id) => {
    setBusyId(id)
    setMessage("")
    setError("")
    try {
      const response = await api.approvePreAdvice(id)
      setMessage(response.message || "Pre-advice approved.")
      records.reload()
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setBusyId("")
    }
  }

  const reject = async (id) => {
    const reason = window.prompt("Reason for rejection?", "Document details need correction.") || ""
    setBusyId(id)
    setMessage("")
    setError("")
    try {
      const response = await api.rejectPreAdvice(id, reason)
      setMessage(response.message || "Pre-advice rejected.")
      records.reload()
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setBusyId("")
    }
  }

  return (
    <AdminTablePage
      title="Pre-Advice Approval"
      description="Review submitted pre-advice and Cloudinary document links. Approved pre-advice can be used for bookings."
      status={status}
      setStatus={setStatus}
      reload={records.reload}
      loading={records.loading}
      error={records.error || error}
      message={message}
    >
      {rows.length ? (
        <TableWrap>
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Container</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((item) => (
                <tr key={item._id} className="align-top">
                  <td className="px-4 py-4 font-black text-slate-950">{item.referenceNo}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{getCompanyName(item)}</p>
                    <p className="text-slate-500">{item.client?.email || "-"}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <p>{item.containerNo}</p>
                    <p>{item.containerSize || "-"}</p>
                    <p>ETA: {compactDate(item.expectedArrivalDate)}</p>
                  </td>
                  <td className="px-4 py-4"><DocumentsList documents={item.documents} /></td>
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-4 text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-4">
                    {item.status === "pending" ? (
                      <ApprovalActions busy={busyId === item._id} onApprove={() => approve(item._id)} onReject={() => reject(item._id)} />
                    ) : <span className="text-xs font-semibold text-slate-400">No action</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : <EmptyState />}
    </AdminTablePage>
  )
}

function BookingApprovalPage() {
  const [status, setStatus] = useState("all")
  const [busyId, setBusyId] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const records = useApiData(() => api.adminBookings(status), [status])
  useRealtimeReload(["booking:created", "booking:updated", "gateIn:created"], records.reload)
  const rows = records.data?.data || []

  const approve = async (id) => {
    setBusyId(id)
    setMessage("")
    setError("")
    try {
      const response = await api.approveBooking(id)
      setMessage(response.message || "Booking approved.")
      records.reload()
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setBusyId("")
    }
  }

  const reject = async (id) => {
    const reason = window.prompt("Reason for rejection?", "Booking schedule needs correction.") || ""
    setBusyId(id)
    setMessage("")
    setError("")
    try {
      const response = await api.rejectBooking(id, reason)
      setMessage(response.message || "Booking rejected.")
      records.reload()
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setBusyId("")
    }
  }

  return (
    <AdminTablePage
      title="Booking Approval"
      description="Approve or reject client booking requests. Approved bookings can be completed through the Gate In module."
      status={status}
      setStatus={setStatus}
      reload={records.reload}
      loading={records.loading}
      error={records.error || error}
      message={message}
    >
      {rows.length ? (
        <TableWrap>
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Truck / Driver</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((item) => (
                <tr key={item._id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-black text-slate-950">{item.bookingNo}</p>
                    <p className="text-slate-500">Container: {item.containerNo || item.preAdvice?.containerNo || "-"}</p>
                    <p className="text-slate-500">PA: {item.preAdvice?.referenceNo || "Manual"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{getCompanyName(item)}</p>
                    <p className="text-slate-500">{item.client?.email || "-"}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <p>{item.truckPlateNo}</p>
                    <p>{item.driverName}</p>
                    <p>{item.driverMobile || "-"}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{compactDate(item.scheduleDate)} {item.scheduleTime || ""}</td>
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-4">
                    {item.status === "pending" ? (
                      <ApprovalActions busy={busyId === item._id} onApprove={() => approve(item._id)} onReject={() => reject(item._id)} />
                    ) : <span className="text-xs font-semibold text-slate-400">No action</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : <EmptyState />}
    </AdminTablePage>
  )
}

function AdminTablePage({ title, description, status, setStatus, reload, loading, error, message, children }) {
  return (
    <div>
      <PageHeader eyebrow="Admin module" title={title} description={description}>
        {setStatus ? (
          <Select className="h-10 w-40" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </Select>
        ) : null}
        <Button variant="outline" onClick={reload}>
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>
      <Notice type="success" message={message} />
      <Notice type="error" message={error} />
      {loading ? <LoadingBlock /> : children}
    </div>
  )
}

function GateInPage() {
  const [form, setForm] = useState({
    companyName: "",
    containerNo: "",
    truckPlateNo: "",
    driverName: "",
    guardName: "",
    gateInAt: "",
    remarks: "",
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const records = useApiData(() => api.gateIns(), [])
  useRealtimeReload(["gateIn:created", "booking:updated"], records.reload)
  const rows = records.data?.data || []

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage("")
    setError("")

    try {
      const response = await api.createGateIn(form)
      setMessage(response.message || "Gate in recorded.")
      setForm({ companyName: "", containerNo: "", truckPlateNo: "", driverName: "", guardName: "", gateInAt: "", remarks: "" })
      records.reload()
    } catch (err) {
      setError(messageFrom(err, "Unable to record gate in."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Admin module" title="Gate In Module" description="Record actual gate-in details. This module writes to MongoDB through POST /api/gate-ins." />
      <div className="grid gap-5 xl:grid-cols-[0.75fr_1fr]">
        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={Truck} title="Record Gate In" description="Use approved booking details or encode the details manually." />
            <Notice type="success" message={message} />
            <Notice type="error" message={error} />
            <form onSubmit={submit} className="space-y-4">
              <Field label="Company Name" required><Input value={form.companyName} onChange={(event) => setValue("companyName", event.target.value)} /></Field>
              <Field label="Container No." required><Input value={form.containerNo} onChange={(event) => setValue("containerNo", event.target.value)} /></Field>
              <Field label="Truck Plate No." required><Input value={form.truckPlateNo} onChange={(event) => setValue("truckPlateNo", event.target.value)} /></Field>
              <Field label="Driver Name" required><Input value={form.driverName} onChange={(event) => setValue("driverName", event.target.value)} /></Field>
              <Field label="Guard Name"><Input value={form.guardName} onChange={(event) => setValue("guardName", event.target.value)} /></Field>
              <Field label="Gate In Date and Time"><Input type="datetime-local" value={form.gateInAt} onChange={(event) => setValue("gateInAt", event.target.value)} /></Field>
              <Field label="Remarks"><Textarea value={form.remarks} onChange={(event) => setValue("remarks", event.target.value)} /></Field>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Gate In
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gate In Records</CardTitle>
            <Button variant="outline" size="sm" onClick={records.reload}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Notice type="error" message={records.error} />
            {records.loading ? <LoadingBlock /> : rows.length ? (
              <TableWrap>
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Gate In No.</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Container</th>
                      <th className="px-4 py-3">Truck / Driver</th>
                      <th className="px-4 py-3">Gate In At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((item) => (
                      <tr key={item._id}>
                        <td className="px-4 py-4 font-black text-slate-950">{item.gateInNo}</td>
                        <td className="px-4 py-4">{item.companyName}</td>
                        <td className="px-4 py-4">{item.containerNo}</td>
                        <td className="px-4 py-4">{item.truckPlateNo} • {item.driverName}</td>
                        <td className="px-4 py-4 text-slate-500">{formatDate(item.gateInAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            ) : <EmptyState />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function UsersPage() {
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", moduleAccess: [] })
  const records = useApiData(() => api.adminUsers(), [])
  useRealtimeReload(["admin:userCreated", "admin:moduleAccessUpdated"], records.reload)
  const rows = records.data?.data || []
  const modules = records.data?.modules || ALL_ADMIN_MODULES
  const canManage = user?.role === "super-admin"

  const toggleNewModule = (moduleId) => {
    setNewAdmin((current) => {
      const set = new Set(current.moduleAccess)
      if (set.has(moduleId)) set.delete(moduleId)
      else set.add(moduleId)
      return { ...current, moduleAccess: [...set] }
    })
  }

  const createAdmin = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage("")
    setError("")
    try {
      const response = await api.createAdmin(newAdmin)
      setMessage(response.message || "Admin user created.")
      setNewAdmin({ name: "", email: "", password: "", moduleAccess: [] })
      records.reload()
    } catch (err) {
      setError(messageFrom(err, "Unable to create admin user."))
    } finally {
      setBusy(false)
    }
  }

  const toggleUserModule = async (targetUser, moduleId) => {
    if (!canManage || targetUser.role === "super-admin" || targetUser.isLocked) return
    setMessage("")
    setError("")

    try {
      const set = new Set(targetUser.moduleAccess || [])
      if (set.has(moduleId)) set.delete(moduleId)
      else set.add(moduleId)
      const response = await api.updateModuleAccess(targetUser._id, [...set])
      setMessage(response.message || "Module access updated.")
      records.reload()
    } catch (err) {
      setError(messageFrom(err))
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Admin module" title="Users and Module Access" description="Super admin can create admin users and assign which admin modules they can access." >
        <Button variant="outline" onClick={records.reload}>
          <RefreshCcw className="h-4 w-4" /> Refresh
        </Button>
      </PageHeader>
      <Notice type="success" message={message} />
      <Notice type="error" message={records.error || error} />
      {!canManage ? <Notice type="warning" message="Only super admin can create admin users or change module access." /> : null}

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Admin</CardTitle>
            <Badge variant={canManage ? "green" : "default"}>{canManage ? "enabled" : "super admin only"}</Badge>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAdmin} className="space-y-4">
              <Field label="Name" required><Input disabled={!canManage} value={newAdmin.name} onChange={(event) => setNewAdmin({ ...newAdmin, name: event.target.value })} /></Field>
              <Field label="Email" required><Input disabled={!canManage} type="email" value={newAdmin.email} onChange={(event) => setNewAdmin({ ...newAdmin, email: event.target.value })} /></Field>
              <Field label="Password" required><Input disabled={!canManage} type="password" value={newAdmin.password} onChange={(event) => setNewAdmin({ ...newAdmin, password: event.target.value })} /></Field>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Module Access</p>
                <div className="grid gap-2">
                  {modules.map((moduleId) => (
                    <label key={moduleId} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">
                      <input type="checkbox" disabled={!canManage} checked={newAdmin.moduleAccess.includes(moduleId)} onChange={() => toggleNewModule(moduleId)} />
                      {MODULE_LABELS[moduleId] || moduleId}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={!canManage || busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Create Admin
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            {records.loading ? <LoadingBlock /> : rows.length ? (
              <div className="space-y-4">
                {rows.map((admin) => (
                  <div key={admin._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950">{getUserName(admin)}</p>
                        <p className="text-sm text-slate-500">{admin.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="blue">{admin.role}</Badge>
                        {admin.isLocked ? <Badge>locked</Badge> : null}
                      </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {modules.map((moduleId) => {
                        const checked = admin.role === "super-admin" || admin.moduleAccess?.includes(moduleId)
                        return (
                          <label key={moduleId} className={cn("flex items-center gap-2 rounded-xl border p-3 text-xs font-bold", checked ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500")}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!canManage || admin.role === "super-admin" || admin.isLocked}
                              onChange={() => toggleUserModule(admin, moduleId)}
                            />
                            {MODULE_LABELS[moduleId] || moduleId}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No admin users" description="Create an admin user to show module access here." />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LogsPage({ type }) {
  const isApi = type === "api"
  const records = useApiData(() => (isApi ? api.apiLogs() : api.auditLogs()), [type])
  const rows = records.data?.data || []

  return (
    <div>
      <PageHeader eyebrow="Admin module" title={isApi ? "API Logs" : "Audit Logs"} description={isApi ? "Recent HTTP requests captured by the backend logger." : "Admin actions and approval changes recorded by the audit logger."}>
        <Button variant="outline" onClick={records.reload}>
          <RefreshCcw className="h-4 w-4" /> Refresh
        </Button>
      </PageHeader>
      <Notice type="error" message={records.error} />
      {records.loading ? <LoadingBlock /> : rows.length ? (
        <TableWrap>
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {isApi ? (
                  <>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Path</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">Date</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Date</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((item) => (
                <tr key={item._id}>
                  {isApi ? (
                    <>
                      <td className="px-4 py-4"><Badge variant="blue">{item.method}</Badge></td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-700">{item.path || item.originalUrl || "-"}</td>
                      <td className="px-4 py-4">{item.statusCode || "-"}</td>
                      <td className="px-4 py-4 text-slate-500">{item.ip || "-"}</td>
                      <td className="px-4 py-4 text-slate-500">{formatDate(item.createdAt)}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-4 font-black text-slate-950">{item.action}</td>
                      <td className="px-4 py-4"><Badge variant="default">{MODULE_LABELS[item.module] || item.module}</Badge></td>
                      <td className="px-4 py-4 text-slate-600">{item.actor?.email || "System"}</td>
                      <td className="px-4 py-4 text-slate-600">{item.message || "-"}</td>
                      <td className="px-4 py-4 text-slate-500">{formatDate(item.createdAt)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : <EmptyState />}
    </div>
  )
}

function SettingsPage() {
  const health = useApiData(() => api.health(), [])
  const modules = useApiData(() => api.settingsModules(), [])

  return (
    <div>
      <PageHeader eyebrow="Admin module" title="Settings" description="Frontend API connection and available admin modules." >
        <Button variant="outline" onClick={() => { health.reload(); modules.reload() }}>
          <RefreshCcw className="h-4 w-4" /> Refresh
        </Button>
      </PageHeader>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>API Connection</CardTitle>
            <Badge variant="blue">{api.baseUrl}</Badge>
          </CardHeader>
          <CardContent>
            <Notice type="error" message={health.error} />
            {health.loading ? <LoadingBlock /> : (
              <div className="space-y-4">
                <InfoRow label="Service" value={health.data?.service || "otli-server"} />
                <InfoRow label="Status" value={health.data?.status || "-"} />
                <InfoRow label="Mongo" value={health.data?.mongo || "-"} />
                <InfoRow label="Timestamp" value={formatDate(health.data?.timestamp)} />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Admin Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <Notice type="error" message={modules.error} />
            {modules.loading ? <LoadingBlock /> : (
              <div className="grid gap-2">
                {(modules.data?.data || ALL_ADMIN_MODULES).map((moduleId) => (
                  <div key={moduleId} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <span className="text-sm font-bold text-slate-800">{MODULE_LABELS[moduleId] || moduleId}</span>
                    <Badge>{moduleId}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-right text-sm font-bold text-slate-900">{value || "-"}</span>
    </div>
  )
}

function LoadingBlock() {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        Loading records
      </div>
    </div>
  )
}

function ForbiddenModule({ activeModule }) {
  return (
    <Card>
      <CardContent className="p-10 text-center">
        <LockKeyhole className="mx-auto mb-4 h-12 w-12 text-slate-400" />
        <h2 className="text-2xl font-black text-slate-950">No module access</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Your admin account does not have access to {MODULE_LABELS[activeModule] || activeModule}. Ask the super admin to update your module access.</p>
      </CardContent>
    </Card>
  )
}

function getActiveAdminModule(path) {
  if (ADMIN_PATHS[path]) return ADMIN_PATHS[path]
  const match = Object.entries(ADMIN_PATHS).find(([route]) => route !== "/admin" && path.startsWith(route))
  return match?.[1] || "dashboard"
}

function AdminPortal({ path, navigate }) {
  const { user, portal, hasModule } = useAuth()
  const activeModule = getActiveAdminModule(path)
  const adminLoggedIn = ["admin", "super-admin"].includes(user?.role) && portal === "admin"

  if (!adminLoggedIn || path === "/admin/login") {
    return <AdminLoginPage navigate={navigate} />
  }

  const allowed = hasModule(activeModule)

  let page = null

  if (!allowed) {
    page = <ForbiddenModule activeModule={activeModule} />
  } else if (activeModule === "dashboard") {
    page = <AdminDashboardPage />
  } else if (activeModule === "account-approval") {
    page = <AccountApprovalPage />
  } else if (activeModule === "pre-advice-approval") {
    page = <PreAdviceApprovalPage />
  } else if (activeModule === "booking-approval") {
    page = <BookingApprovalPage />
  } else if (activeModule === "gate-in") {
    page = <GateInPage />
  } else if (activeModule === "users") {
    page = <UsersPage />
  } else if (activeModule === "api-logs") {
    page = <LogsPage type="api" />
  } else if (activeModule === "audit-logs") {
    page = <LogsPage type="audit" />
  } else if (activeModule === "settings") {
    page = <SettingsPage />
  }

  return <AdminLayout activeModule={activeModule} navigate={navigate}>{page}</AdminLayout>
}

function ClientPortal({ path, navigate }) {
  let page = null

  if (path === "/register") {
    page = <RegisterClientPage navigate={navigate} />
  } else if (path === "/profile") {
    page = <ClientProfilePage navigate={navigate} />
  } else if (path === "/pre-advice") {
    page = <PreAdvicePage navigate={navigate} />
  } else if (path === "/booking") {
    page = <BookingPage navigate={navigate} />
  } else if (path === "/my-bookings") {
    page = <MyBookingsPage navigate={navigate} />
  } else {
    page = <ClientLoginPage navigate={navigate} />
  }

  return <ClientLayout path={path in CLIENT_TITLES ? path : "/"} navigate={navigate}>{page}</ClientLayout>
}

function AppContent() {
  const { path, navigate } = useRoute()
  const { loading } = useAuth()

  if (loading) return <LoadingScreen label="Checking session" />
  if (path.startsWith("/admin")) return <AdminPortal path={path} navigate={navigate} />
  return <ClientPortal path={path} navigate={navigate} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
