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
  "/admin/inventory": "inventory",
  "/admin/billing": "billing",
  "/admin/gate-out": "gate-out",
  "/admin/payment-verification": "payment-verification",
  "/admin/reports": "reports",
  "/admin/validation-rules": "validation-rules",
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
  "/booking": "Gate Appointment Request",
  "/my-bookings": "My Gate Appointments",
  "/gate-out": "Gate-Out Request",
  "/my-gate-outs": "My Gate-Out Requests",
  "/my-billings": "My Billing",
}

const documentLabels = {
  businessPermit: "Business Permit",
  birCertificate: "BIR Certificate",
  validId: "Valid ID",
  authorizationLetter: "Authorization Letter",
  otherDocument: "Other Document",
  eir: "EIR",
  deliveryOrder: "Delivery Order",
  bookingConfirmation: "Booking Confirmation",
  packingList: "Packing List",
  customsClearance: "Customs Clearance",
  billOfLading: "Bill of Lading",
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

function ValidationSummary({ results }) {
  const entries = Object.entries(results || {})
  if (!entries.length) return null

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {entries.map(([key, result]) => {
        const passed = result?.passed !== false
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (char) => char.toUpperCase())

        return (
          <div
            key={key}
            className={cn(
              "flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-semibold",
              passed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
            )}
          >
            {passed ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            <span>
              <span className="block font-black">{label}</span>
              <span className="font-medium">{result?.message || (passed ? "Passed" : "Failed")}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

function PreAdviceOutput({ item, compact = false }) {
  if (!item) return null

  const gate = item.gateAppointment || {}
  const qr = item.qrCode || {}

  return (
    <div className={cn("rounded-2xl border border-blue-100 bg-blue-50/60 p-3", !compact && "p-4")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Generated output</p>
          <p className="mt-1 text-sm font-black text-slate-950">Pre-Advice No: {item.referenceNo || "-"}</p>
          <p className="text-xs font-semibold text-slate-600">Gate Appointment: {gate.appointmentNo || "-"}</p>
          <p className="text-xs text-slate-500">
            {compactDate(gate.appointmentDate || item.arrivalDate || item.expectedArrivalDate)} {gate.timeWindow ? `• ${gate.timeWindow}` : ""}
          </p>
        </div>
        {qr.imageDataUrl ? (
          <div className="flex items-center gap-3">
            <img src={qr.imageDataUrl} alt={`QR code for ${item.referenceNo}`} className="h-20 w-20 rounded-xl border border-white bg-white p-1 shadow-sm" />
            {!compact ? (
              <a
                href={qr.imageDataUrl}
                download={`${item.referenceNo || "pre-advice"}-qr.png`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 text-xs font-black text-blue-700 hover:bg-blue-50"
              >
                <Download className="h-4 w-4" />
                QR
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
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
      description: "View submitted gate appointments",
      path: "/my-bookings",
      icon: CalendarCheck,
    },
    {
      label: "My Gate-Out Requests",
      description: "Track release requests",
      path: "/my-gate-outs",
      icon: PackageCheck,
    },
    {
      label: "My Billing",
      description: "Invoices and payment status",
      path: "/my-billings",
      icon: FileText,
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
    return !["/", "/register", "/profile", "/my-bookings", "/my-gate-outs", "/my-billings"].includes(item.path)
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

function OtpSixBoxInput({ value, onChange, disabled = false }) {
  const refs = useRef([])
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "")

  const setDigit = (index, nextValue) => {
    const clean = String(nextValue || "").replace(/\D/g, "")
    const current = digits.slice()

    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split("")
      onChange(pasted.join(""))
      const nextIndex = Math.min(pasted.length, 5)
      setTimeout(() => refs.current[nextIndex]?.focus(), 0)
      return
    }

    current[index] = clean
    const nextCode = current.join("").slice(0, 6)
    onChange(nextCode)

    if (clean && index < 5) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
      const current = digits.slice()
      current[index - 1] = ""
      onChange(current.join(""))
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault()
      refs.current[index - 1]?.focus()
    }

    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (event) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    onChange(pasted)
    setTimeout(() => refs.current[Math.min(pasted.length, 5)]?.focus(), 0)
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={handlePaste}
          className={cn(
            "h-14 w-12 rounded-2xl border bg-white text-center text-2xl font-black text-slate-950 shadow-sm outline-none transition sm:h-16 sm:w-14",
            digit ? "border-blue-400 ring-4 ring-blue-100" : "border-slate-200 hover:border-blue-200",
            "focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          )}
        />
      ))}
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
  const [emailOtpCode, setEmailOtpCode] = useState("")
  const [otpRequestId, setOtpRequestId] = useState("")
  const [otpSentTo, setOtpSentTo] = useState("")
  const [otpExpiresAt, setOtpExpiresAt] = useState("")
  const [resendCountdown, setResendCountdown] = useState(0)
  const [step, setStep] = useState("form")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (step !== "otp" || resendCountdown <= 0) return undefined

    const timer = window.setTimeout(() => {
      setResendCountdown((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [step, resendCountdown])

  const resetOtp = () => {
    setEmailOtpCode("")
    setOtpRequestId("")
    setOtpSentTo("")
    setOtpExpiresAt("")
    setResendCountdown(0)
  }

  const setValue = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))

    if (["email", "phoneNumber"].includes(key)) {
      resetOtp()
      setStep("form")
    }
  }

  const setFile = (key, file) => setFiles((current) => ({ ...current, [key]: file }))

  const cleanForm = () => ({
    email: form.email.trim(),
    password: form.password,
    companyName: form.companyName.trim(),
    companyAddress: form.companyAddress.trim(),
    companyType: form.companyType.trim(),
    companyTypeOther: form.companyTypeOther.trim(),
    phoneNumber: form.phoneNumber.trim(),
    representativeFirstName: form.representativeFirstName.trim(),
    representativeMiddleName: form.representativeMiddleName.trim(),
    representativeLastName: form.representativeLastName.trim(),
    representativePosition: form.representativePosition.trim(),
  })

  const validateRegistrationForm = () => {
    const current = cleanForm()
    const missingFields = []

    if (!current.companyName) missingFields.push("Company Name")
    if (!current.companyAddress) missingFields.push("Company Address")
    if (!current.phoneNumber) missingFields.push("Phone Number")
    if (!current.representativeFirstName) missingFields.push("Representative First Name")
    if (!current.representativeLastName) missingFields.push("Representative Last Name")
    if (!current.representativePosition) missingFields.push("Representative Position")
    if (!current.email) missingFields.push("Email")
    if (!current.password) missingFields.push("Password")
    if (current.companyType === "other" && !current.companyTypeOther) missingFields.push("Company Type Other")

    if (missingFields.length) {
      throw new Error(`Please complete these required fields before continuing to OTP: ${missingFields.join(", ")}.`)
    }

    if (!/^\S+@\S+\.\S+$/.test(current.email)) {
      throw new Error("Please enter a valid email address before continuing to OTP.")
    }

    if (!/^(09\d{9}|\+639\d{9})$/.test(current.phoneNumber)) {
      throw new Error("Please enter a valid Philippine phone number. Use 09XXXXXXXXX or +639XXXXXXXXX.")
    }

    if (current.password.length < 8) {
      throw new Error("Password must be at least 8 characters before continuing to OTP.")
    }

    return current
  }

  const requestOtpOnly = async () => {
    const current = validateRegistrationForm()

    const response = await api.sendRegisterEmailOtp({
      email: current.email,
      phoneNumber: current.phoneNumber,
    })

    setOtpRequestId(response.data?.otpRequestId || "")
    setOtpSentTo(response.data?.email || form.email)
    setOtpExpiresAt(response.data?.expiresAt || "")
    setEmailOtpCode("")
    setStep("otp")
    setResendCountdown(60)
    setMessage(response.devOtp ? `${response.message || "OTP sent."} Development OTP: ${response.devOtp}` : response.message || "OTP sent. Please check your email.")
  }

  const createAccountAfterOtp = async () => {
    if (!otpRequestId) {
      throw new Error("Please submit the registration form first so we can send your email OTP.")
    }

    if (emailOtpCode.length !== 6) {
      throw new Error("Please enter the complete 6-digit OTP.")
    }

    const current = validateRegistrationForm()

    const formData = new FormData()
    Object.entries(current).forEach(([key, value]) => formData.append(key, value))
    formData.append("emailOtpCode", emailOtpCode.trim())
    formData.append("emailOtpRequestId", otpRequestId)

    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file)
    })

    const response = await api.registerClient(formData)
    setMessage(response.message || "Account submitted. Your account is now ready for admin verification.")
    setForm(emptyForm)
    setFiles({})
    resetOtp()
    setStep("success")
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage("")
    setError("")

    try {
      if (step === "form") {
        await requestOtpOnly()
        return
      }

      if (step === "otp") {
        await createAccountAfterOtp()
      }
    } catch (err) {
      setError(messageFrom(err, step === "form" ? "Unable to send email OTP." : "Unable to submit account registration."))
    } finally {
      setBusy(false)
    }
  }

  const handleEditDetails = () => {
    resetOtp()
    setError("")
    setMessage("")
    setStep("form")
  }

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return

    setBusy(true)
    setError("")
    setMessage("")

    try {
      await requestOtpOnly()
    } catch (err) {
      const waitMatch = String(err?.message || "").match(/(\d+)\s*seconds?/i)
      if (err?.status === 429 && waitMatch?.[1]) {
        setResendCountdown(Number(waitMatch[1]))
      }
      setError(messageFrom(err, "Unable to resend email OTP."))
    } finally {
      setBusy(false)
    }
  }

  if (step === "success") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 via-blue-600 to-cyan-500 px-6 py-10 text-center text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/25">
              <Check className="h-9 w-9" />
            </div>
            <h1 className="mt-5 text-3xl font-black">Registration submitted</h1>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-white/85">Your account was added to the database and is now ready for admin verification.</p>
          </div>
          <CardContent className="p-6 text-center">
            <Notice type="success" message={message} />
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Button onClick={() => navigate("/")}>Go to Login</Button>
              <Button variant="outline" onClick={() => navigate("/admin")}>Admin Portal</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "otp") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden border-blue-100 shadow-xl shadow-blue-950/5">
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 px-6 py-8 text-center text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/25">
              <ShieldCheck className="h-9 w-9" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-blue-100">Email Verification</p>
            <h1 className="mt-2 text-3xl font-black">Enter your 6-digit OTP</h1>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-white/85">We sent a verification code to {otpSentTo || form.email}.</p>
          </div>

          <CardContent className="p-6 sm:p-8">
            <Notice type="success" message={message} />
            <Notice type="error" message={error} />

            <form onSubmit={submit} className="space-y-6">
              <OtpSixBoxInput value={emailOtpCode} onChange={setEmailOtpCode} disabled={busy} />

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4 text-center">
                <p className="text-sm font-black text-slate-950">Registration is not saved yet</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Your company details and documents will only be added to the database after this OTP is verified.</p>
                {otpExpiresAt ? (
                  <p className="mt-3 inline-flex items-center justify-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                    <Clock3 className="h-3.5 w-3.5" />
                    Expires {formatDate(otpExpiresAt)}
                  </p>
                ) : null}
              </div>

              <Button type="submit" className="h-12 w-full rounded-2xl" disabled={busy || emailOtpCode.length !== 6}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                Verify OTP and Submit Registration
              </Button>
            </form>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={handleResendOtp} disabled={busy || resendCountdown > 0}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : resendCountdown > 0 ? (
                  <Clock3 className="h-4 w-4" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : "Resend OTP"}
              </Button>
              <Button type="button" variant="ghost" onClick={handleEditDetails} disabled={busy}>
                <ChevronLeft className="h-4 w-4" />
                Edit Registration Details
              </Button>
            </div>
            <p className="mt-3 text-center text-xs font-semibold text-slate-500">
              Did not receive the code? You can request a new OTP after the countdown ends.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Client module"
        title="Account Creation"
        description="Fill out the registration form first. When you submit, the system will only send an email OTP. Your account is saved after OTP verification."
      >
        <Button variant="outline" onClick={() => navigate("/")}>Back to Login</Button>
      </PageHeader>

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={Building2} title="Company Information" description="These details will be saved after OTP verification." />
            <Notice type="error" message={error} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Company Name" required>
                <Input required value={form.companyName} onChange={(event) => setValue("companyName", event.target.value)} />
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
                  <Input required value={form.companyTypeOther} onChange={(event) => setValue("companyTypeOther", event.target.value)} />
                </Field>
              ) : null}
              <Field label="Phone Number" required>
                <Input required placeholder="09XXXXXXXXX or +639XXXXXXXXX" value={form.phoneNumber} onChange={(event) => setValue("phoneNumber", event.target.value)} />
              </Field>
              <Field label="Company Address" required>
                <Textarea required value={form.companyAddress} onChange={(event) => setValue("companyAddress", event.target.value)} />
              </Field>
            </div>

            <SectionTitle icon={Users} title="Representative Information" description="This will become the client user profile after OTP verification." />
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="First Name" required>
                <Input required value={form.representativeFirstName} onChange={(event) => setValue("representativeFirstName", event.target.value)} />
              </Field>
              <Field label="Middle Name">
                <Input value={form.representativeMiddleName} onChange={(event) => setValue("representativeMiddleName", event.target.value)} />
              </Field>
              <Field label="Last Name" required>
                <Input required value={form.representativeLastName} onChange={(event) => setValue("representativeLastName", event.target.value)} />
              </Field>
              <Field label="Position" required>
                <Input required value={form.representativePosition} onChange={(event) => setValue("representativePosition", event.target.value)} />
              </Field>
              <Field label="Email" required>
                <Input required type="email" autoComplete="email" value={form.email} onChange={(event) => setValue("email", event.target.value)} />
              </Field>
              <Field label="Password" required>
                <Input required type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={(event) => setValue("password", event.target.value)} />
              </Field>
            </div>

            <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">OTP is sent after form submit</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Click Submit Registration below. The system will first check all required fields, then check duplicate email and phone, then send OTP. The account is not saved yet at this step.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={UploadCloud} title="Submitted Documents" description="Files are uploaded only after the OTP is verified." />
            <div className="grid gap-3">
              <FileField label="Business Permit" name="businessPermit" onChange={setFile} />
              <FileField label="BIR Certificate" name="birCertificate" onChange={setFile} />
              <FileField label="Valid ID" name="validId" onChange={setFile} />
              <FileField label="Authorization Letter" name="authorizationLetter" onChange={setFile} />
              <FileField label="Other Document" name="otherDocument" onChange={setFile} />
            </div>
            <Button type="submit" className="mt-5 h-12 w-full rounded-2xl" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Submit Registration and Send OTP
            </Button>
            <p className="mt-3 text-center text-xs font-semibold text-slate-500">Step 1 only sends OTP. Step 2 saves the account after OTP verification.</p>
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
  const initialForm = {
    containerNo: "",
    containerSize: "20ft",
    containerType: "Dry",
    containerStatus: "Empty",
    shippingLine: "",
    bookingNumber: "",
    blNumber: "",
    vesselVoyage: "",
    cargoDescription: "",
    dangerousGoodsClass: "",
    weight: "",
    arrivalDate: "",
  }
  const [form, setForm] = useState(initialForm)
  const [files, setFiles] = useState({})
  const [lastSubmitted, setLastSubmitted] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
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
    setValidationResults(null)
    setLastSubmitted(null)

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file)
      })

      const response = await api.submitPreAdvice(formData)
      setMessage(response.message || "Pre-advice submitted.")
      setLastSubmitted(response.data || null)
      setValidationResults(response.data?.validationResults || null)
      setForm(initialForm)
      setFiles({})
      records.reload()
    } catch (err) {
      setValidationResults(err.payload?.validationResults || null)
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
        description="Notify the terminal before container arrival. The system checks duplicates, blacklists, outstanding charges, and ownership rules before creating the pre-advice number, QR code, and gate appointment."
      >
        <StatusBadge status={user.status} />
      </PageHeader>

      {!isVerified ? <Notice type="warning" message="Your account must be verified by admin before submitting pre-advice." /> : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={ClipboardCheck} title="Shipping Line Pre-Advice" description="Complete the container details and upload terminal documents." />
            <Notice type="success" message={message} />
            <Notice type="error" message={error} />
            {validationResults ? <div className="mb-4"><ValidationSummary results={validationResults} /></div> : null}
            {lastSubmitted ? <div className="mb-4"><PreAdviceOutput item={lastSubmitted} /></div> : null}

            <form onSubmit={submit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Company Name">
                  <Input value={getCompanyName(user)} disabled />
                </Field>
                <Field label="Container Number" required>
                  <Input value={form.containerNo} onChange={(event) => setValue("containerNo", event.target.value.toUpperCase())} placeholder="ABCD1234567" />
                </Field>
                <Field label="Container Size" required>
                  <Select value={form.containerSize} onChange={(event) => setValue("containerSize", event.target.value)}>
                    <option value="20ft">20ft</option>
                    <option value="40ft">40ft</option>
                    <option value="45ft">45ft</option>
                  </Select>
                </Field>
                <Field label="Container Type" required>
                  <Select value={form.containerType} onChange={(event) => setValue("containerType", event.target.value)}>
                    <option value="Dry">Dry</option>
                    <option value="Reefer">Reefer</option>
                    <option value="Tank">Tank</option>
                    <option value="Open Top">Open Top</option>
                    <option value="Flat Rack">Flat Rack</option>
                  </Select>
                </Field>
                <Field label="Container Status" required>
                  <Select value={form.containerStatus} onChange={(event) => setValue("containerStatus", event.target.value)}>
                    <option value="Empty">Empty</option>
                    <option value="Laden">Laden</option>
                  </Select>
                </Field>
                <Field label="Shipping Line" required>
                  <Input value={form.shippingLine} onChange={(event) => setValue("shippingLine", event.target.value)} placeholder="Example: Maersk" />
                </Field>
                <Field label="Booking Number">
                  <Input value={form.bookingNumber} onChange={(event) => setValue("bookingNumber", event.target.value)} />
                </Field>
                <Field label="BL Number">
                  <Input value={form.blNumber} onChange={(event) => setValue("blNumber", event.target.value)} />
                </Field>
                <Field label="Vessel / Voyage">
                  <Input value={form.vesselVoyage} onChange={(event) => setValue("vesselVoyage", event.target.value)} placeholder="Vessel Name / Voyage No." />
                </Field>
                <Field label="Dangerous Goods Classification">
                  <Input value={form.dangerousGoodsClass} onChange={(event) => setValue("dangerousGoodsClass", event.target.value)} placeholder="Leave blank if not DG" />
                </Field>
                <Field label="Weight">
                  <Input type="number" min="0" step="0.01" value={form.weight} onChange={(event) => setValue("weight", event.target.value)} placeholder="Weight in kg" />
                </Field>
                <Field label="Arrival Date" required>
                  <Input type="date" value={form.arrivalDate} onChange={(event) => setValue("arrivalDate", event.target.value)} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Cargo Description">
                    <Textarea value={form.cargoDescription} onChange={(event) => setValue("cargoDescription", event.target.value)} />
                  </Field>
                </div>
              </div>

              <div>
                <SectionTitle icon={FileCheck2} title="Upload Documents" description="Upload the required documents sent by the shipping line, depot, trucker, or customer." />
                <div className="grid gap-3 md:grid-cols-2">
                  <FileField label="EIR" name="eir" onChange={setFile} />
                  <FileField label="Delivery Order" name="deliveryOrder" onChange={setFile} />
                  <FileField label="Booking Confirmation" name="bookingConfirmation" onChange={setFile} />
                  <FileField label="Packing List" name="packingList" onChange={setFile} />
                  <FileField label="Customs Clearance" name="customsClearance" onChange={setFile} />
                </div>
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
                    <div className="grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                      <p>Size: {item.containerSize || "-"}</p>
                      <p>Type: {item.containerType || "-"}</p>
                      <p>Status: {item.containerStatus || "-"}</p>
                      <p>Arrival: {compactDate(item.arrivalDate || item.expectedArrivalDate)}</p>
                      <p>Shipping Line: {item.shippingLine || "-"}</p>
                      <p>Booking: {item.bookingNumber || "-"}</p>
                    </div>
                    <div className="mt-3"><PreAdviceOutput item={item} compact /></div>
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
      description="Review shipping line pre-advice, validation results, QR output, gate appointment, and uploaded Cloudinary document links."
      status={status}
      setStatus={setStatus}
      reload={records.reload}
      loading={records.loading}
      error={records.error || error}
      message={message}
    >
      {rows.length ? (
        <TableWrap>
          <table className="w-full min-w-[1450px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Container Details</th>
                <th className="px-4 py-3">Booking / Vessel</th>
                <th className="px-4 py-3">Validation</th>
                <th className="px-4 py-3">Output</th>
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
                    <p className="font-black text-slate-900">{item.containerNo}</p>
                    <p>{item.containerSize || "-"} / {item.containerType || "-"}</p>
                    <p>{item.containerStatus || "-"}</p>
                    <p>Arrival: {compactDate(item.arrivalDate || item.expectedArrivalDate)}</p>
                    <p>Weight: {item.weight ? `${item.weight} kg` : "-"}</p>
                    <p>DG: {item.dangerousGoodsClass || "Not declared"}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <p>Shipping Line: {item.shippingLine || "-"}</p>
                    <p>Booking: {item.bookingNumber || "-"}</p>
                    <p>BL: {item.blNumber || "-"}</p>
                    <p>Vessel/Voyage: {item.vesselVoyage || [item.vesselName, item.voyageNo].filter(Boolean).join(" / ") || "-"}</p>
                    <p className="mt-2 max-w-[220px] text-xs leading-5 text-slate-500">{item.cargoDescription || "No cargo description"}</p>
                  </td>
                  <td className="px-4 py-4 min-w-[280px]"><ValidationSummary results={item.validationResults} /></td>
                  <td className="px-4 py-4 min-w-[260px]"><PreAdviceOutput item={item} compact /></td>
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

function money(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)
}

function GateOutPage({ navigate, listOnly = false }) {
  const { user, portal } = useAuth()
  const clientLoggedIn = user?.role === "client" && portal === "client"
  const [form, setForm] = useState({
    containerNo: "",
    releaseOrderNo: "",
    customsClearanceNo: "",
    paymentReference: "",
    truckPlateNo: "",
    driverName: "",
    driverMobile: "",
    requestedReleaseDate: "",
    remarks: "",
  })
  const [files, setFiles] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const records = useApiData(() => clientLoggedIn ? api.myGateOuts() : Promise.resolve({ data: [] }), [clientLoggedIn])
  const billings = useApiData(() => clientLoggedIn ? api.myBillings() : Promise.resolve({ data: [] }), [clientLoggedIn])
  useRealtimeReload(["gateOut:created", "gateOut:updated", "billing:updated"], () => { records.reload(); billings.reload() }, clientLoggedIn)

  if (!clientLoggedIn) return <ProtectedClientNotice navigate={navigate} />

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const setFile = (key, file) => setFiles((current) => ({ ...current, [key]: file }))

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))
      Object.entries(files).forEach(([key, file]) => { if (file) formData.append(key, file) })
      const response = await api.submitGateOut(formData)
      setMessage(response.message || "Gate-out request submitted.")
      setForm({ containerNo: "", releaseOrderNo: "", customsClearanceNo: "", paymentReference: "", truckPlateNo: "", driverName: "", driverMobile: "", requestedReleaseDate: "", remarks: "" })
      setFiles({})
      records.reload()
    } catch (err) {
      setError(messageFrom(err, "Unable to submit gate-out request."))
    } finally {
      setBusy(false)
    }
  }

  const rows = records.data?.data || []
  const invoices = billings.data?.data || []

  return (
    <div>
      <PageHeader eyebrow="Client module" title={listOnly ? "My Gate-Out Requests" : "Gate-Out Request"} description="Request container release from the yard. Admin validates release order, customs clearance, and payment before final gate-out." />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        {!listOnly ? (
          <Card>
            <CardContent className="p-5">
              <SectionTitle icon={PackageCheck} title="Gate-Out Details" description="Submit release information and attach required documents." />
              <Notice type="success" message={message} />
              <Notice type="error" message={error} />
              <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Container Number" required><Input value={form.containerNo} onChange={(event) => setValue("containerNo", event.target.value.toUpperCase())} placeholder="ABCD1234567" /></Field>
                  <Field label="Release Order No." required><Input value={form.releaseOrderNo} onChange={(event) => setValue("releaseOrderNo", event.target.value)} /></Field>
                  <Field label="Customs Clearance No." required><Input value={form.customsClearanceNo} onChange={(event) => setValue("customsClearanceNo", event.target.value)} /></Field>
                  <Field label="Payment Reference" required><Input value={form.paymentReference} onChange={(event) => setValue("paymentReference", event.target.value)} /></Field>
                  <Field label="Truck Plate No."><Input value={form.truckPlateNo} onChange={(event) => setValue("truckPlateNo", event.target.value)} /></Field>
                  <Field label="Driver Name"><Input value={form.driverName} onChange={(event) => setValue("driverName", event.target.value)} /></Field>
                  <Field label="Driver Mobile"><Input value={form.driverMobile} onChange={(event) => setValue("driverMobile", event.target.value)} /></Field>
                  <Field label="Requested Release Date"><Input type="date" value={form.requestedReleaseDate} onChange={(event) => setValue("requestedReleaseDate", event.target.value)} /></Field>
                  <div className="md:col-span-2"><Field label="Remarks"><Textarea value={form.remarks} onChange={(event) => setValue("remarks", event.target.value)} /></Field></div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <FileField label="Release Order" name="releaseOrder" onChange={setFile} />
                  <FileField label="Customs Clearance" name="customsClearance" onChange={setFile} />
                  <FileField label="Payment Proof" name="paymentProof" onChange={setFile} />
                  <FileField label="Other Document" name="otherDocument" onChange={setFile} />
                </div>
                <Button type="submit" disabled={busy || user.status !== "verified"}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                  Submit Gate-Out Request
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <Card className={listOnly ? "xl:col-span-2" : ""}>
          <CardHeader><CardTitle>Gate-Out Requests</CardTitle><Button variant="outline" size="sm" onClick={records.reload}><RefreshCcw className="h-4 w-4" />Refresh</Button></CardHeader>
          <CardContent>
            {records.loading ? <LoadingBlock /> : rows.length ? (
              <div className="space-y-3">
                {rows.map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-black text-slate-950">{item.requestNo}</p><p className="text-sm text-slate-500">{item.containerNo}</p></div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="mt-3 grid gap-1 text-sm text-slate-600 md:grid-cols-2">
                      <p>Release Order: {item.releaseOrderNo || "-"}</p>
                      <p>Customs Clearance: {item.customsClearanceNo || "-"}</p>
                      <p>Payment Ref: {item.paymentReference || "-"}</p>
                      <p>Requested Date: {compactDate(item.requestedReleaseDate)}</p>
                    </div>
                    <div className="mt-3"><ValidationSummary results={item.validationResults} /></div>
                    <div className="mt-3"><DocumentsList documents={item.documents} /></div>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No gate-out requests" description="Your gate-out requests will appear here." />}
          </CardContent>
        </Card>

        {listOnly ? null : (
          <Card className="xl:col-span-2">
            <CardHeader><CardTitle>My Billing</CardTitle><Button variant="outline" size="sm" onClick={billings.reload}>Refresh</Button></CardHeader>
            <CardContent>{billings.loading ? <LoadingBlock /> : invoices.length ? <BillingList invoices={invoices} reload={billings.reload} clientMode /> : <EmptyState title="No invoices" description="Invoices and payment status will appear here." />}</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function BillingList({ invoices, reload, clientMode = false, paymentMode = false }) {
  const [payment, setPayment] = useState({})
  const [busyId, setBusyId] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const submitPayment = async (invoice) => {
    setBusyId(invoice._id)
    setMessage("")
    setError("")
    try {
      const response = clientMode
        ? await api.submitBillingPayment(invoice._id, { paymentReference: payment[invoice._id] || "", paymentMethod: "Manual" })
        : await api.verifyBillingPayment(invoice._id, {})
      setMessage(response.message || "Payment updated.")
      reload?.()
    } catch (err) {
      setError(messageFrom(err, "Unable to update payment."))
    } finally {
      setBusyId("")
    }
  }

  return (
    <div>
      <Notice type="success" message={message} />
      <Notice type="error" message={error} />
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <div key={invoice._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-black text-slate-950">{invoice.invoiceNo}</p>
                <p className="text-sm text-slate-500">{invoice.companyName} • {invoice.containerNo || "No container"}</p>
              </div>
              <div className="flex items-center gap-2"><StatusBadge status={invoice.status} /><span className="font-black text-slate-950">{money(invoice.totalAmount)}</span></div>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
              {(invoice.chargeLines || []).map((line, index) => <p key={index}>{line.description}: {money(line.amount)}</p>)}
            </div>
            {clientMode && invoice.status !== "paid" ? (
              <div className="mt-4 flex flex-col gap-2 md:flex-row">
                <Input placeholder="Payment reference" value={payment[invoice._id] || ""} onChange={(event) => setPayment({ ...payment, [invoice._id]: event.target.value })} />
                <Button onClick={() => submitPayment(invoice)} disabled={busyId === invoice._id}>{busyId === invoice._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Submit Payment</Button>
              </div>
            ) : null}
            {paymentMode && invoice.status === "for-verification" ? (
              <div className="mt-4"><Button onClick={() => submitPayment(invoice)} disabled={busyId === invoice._id}>{busyId === invoice._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Verify Payment</Button></div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function MyBillingsPage({ navigate }) {
  const { user, portal } = useAuth()
  const clientLoggedIn = user?.role === "client" && portal === "client"
  const records = useApiData(() => clientLoggedIn ? api.myBillings() : Promise.resolve({ data: [] }), [clientLoggedIn])
  useRealtimeReload(["billing:created", "billing:updated"], records.reload, clientLoggedIn)
  if (!clientLoggedIn) return <ProtectedClientNotice navigate={navigate} />
  return (
    <div>
      <PageHeader eyebrow="Client module" title="My Billing" description="View invoices, documentation fees, storage charges, and payment verification status." />
      <Card><CardContent className="p-5">{records.loading ? <LoadingBlock /> : (records.data?.data || []).length ? <BillingList invoices={records.data.data} reload={records.reload} clientMode /> : <EmptyState title="No invoices" description="Billing records will appear here." />}</CardContent></Card>
    </div>
  )
}

function InventoryPage() {
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")
  const records = useApiData(() => api.inventories({ status, search }), [status, search])
  useRealtimeReload(["inventory:updated", "gateIn:created", "gateOut:updated"], records.reload)
  const rows = records.data?.data || []
  const summary = records.data?.summary || {}
  return (
    <div>
      <PageHeader eyebrow="Admin module" title="Inventory / Yard Monitoring" description="Monitor container stock, yard location, status, available capacity, and released containers." />
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        {[['Total', summary.total], ['In Yard', summary.inYard], ['Released', summary.released], ['On Hold', summary.onHold]].map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value || 0}</p></CardContent></Card>)}
      </div>
      <Card><CardHeader><CardTitle>Container Inventory</CardTitle><div className="flex gap-2"><Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} /><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option><option value="in-yard">In Yard</option><option value="on-hold">On Hold</option><option value="released">Released</option></Select></div></CardHeader><CardContent>{records.loading ? <LoadingBlock /> : rows.length ? <div className="space-y-3">{rows.map((item) => <div key={item._id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between"><div><p className="font-black text-slate-950">{item.containerNo}</p><p className="text-sm text-slate-500">{item.companyName} • {item.shippingLine || '-'}</p></div><StatusBadge status={item.status} /></div><div className="mt-3 grid gap-1 text-sm text-slate-600 md:grid-cols-4"><p>Location: {item.yardLocation || '-'}</p><p>Size: {item.containerSize || '-'}</p><p>Type: {item.containerType || '-'}</p><p>Gate In: {formatDate(item.gateInAt)}</p></div></div>)}</div> : <EmptyState title="No inventory records" description="Gate-in records will create inventory automatically." />}</CardContent></Card>
    </div>
  )
}

function GateOutAdminPage() {
  const [status, setStatus] = useState("pending")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const records = useApiData(() => api.adminGateOuts(status), [status])
  useRealtimeReload(["gateOut:created", "gateOut:updated", "billing:updated"], records.reload)
  const rows = records.data?.data || []
  const action = async (fn, success) => {
    setMessage(""); setError("")
    try { const response = await fn(); setMessage(response.message || success); records.reload() } catch (err) { setError(messageFrom(err, "Action failed.")) }
  }
  return (
    <div>
      <PageHeader eyebrow="Admin module" title="Gate-Out Module" description="Approve release requests, reject incomplete requests, or mark approved containers as released." />
      <Notice type="success" message={message} /><Notice type="error" message={error} />
      <Card><CardHeader><CardTitle>Gate-Out Requests</CardTitle><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="released">Released</option><option value="rejected">Rejected</option><option value="all">All</option></Select></CardHeader><CardContent>{records.loading ? <LoadingBlock /> : rows.length ? <div className="space-y-3">{rows.map((item) => <div key={item._id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="font-black text-slate-950">{item.requestNo}</p><p className="text-sm text-slate-500">{item.companyName} • {item.containerNo}</p></div><StatusBadge status={item.status} /></div><div className="mt-3 grid gap-1 text-sm text-slate-600 md:grid-cols-3"><p>Release Order: {item.releaseOrderNo || '-'}</p><p>Customs: {item.customsClearanceNo || '-'}</p><p>Payment: {item.paymentReference || '-'}</p></div><div className="mt-3"><ValidationSummary results={item.validationResults} /></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => action(() => api.approveGateOut(item._id), 'Approved')} disabled={item.status !== 'pending'}>Approve</Button><Button size="sm" variant="outline" onClick={() => action(() => api.rejectGateOut(item._id, 'Rejected by admin'), 'Rejected')} disabled={item.status !== 'pending'}>Reject</Button><Button size="sm" variant="outline" onClick={() => action(() => api.releaseGateOut(item._id), 'Released')} disabled={item.status !== 'approved'}>Release</Button></div></div>)}</div> : <EmptyState title="No gate-out records" />}</CardContent></Card>
    </div>
  )
}

function BillingPage({ paymentMode = false }) {
  const [status, setStatus] = useState(paymentMode ? "for-verification" : "all")
  const [form, setForm] = useState({ companyName: "", containerNo: "", storageCharge: "", handlingCharge: "", documentationFee: "", remarks: "" })
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const records = useApiData(() => api.adminBillings(status), [status])
  useRealtimeReload(["billing:created", "billing:updated"], records.reload)
  const rows = records.data?.data || []
  const submit = async (event) => {
    event.preventDefault(); setMessage(""); setError("")
    try { const response = await api.createBilling(form); setMessage(response.message || 'Invoice created.'); setForm({ companyName: "", containerNo: "", storageCharge: "", handlingCharge: "", documentationFee: "", remarks: "" }); records.reload() } catch (err) { setError(messageFrom(err, 'Unable to create invoice.')) }
  }
  return (
    <div>
      <PageHeader eyebrow="Admin module" title={paymentMode ? "Payment Verification" : "Billing Module"} description={paymentMode ? "Verify submitted payment references before gate-out release." : "Create invoices for storage, handling, documentation, and other container yard charges."} />
      <Notice type="success" message={message} /><Notice type="error" message={error} />
      {!paymentMode ? <Card className="mb-5"><CardContent className="p-5"><SectionTitle icon={FileText} title="Create Invoice" description="Add billing charges for a client or container." /><form onSubmit={submit} className="grid gap-4 md:grid-cols-3"><Field label="Company Name" required><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field><Field label="Container Number"><Input value={form.containerNo} onChange={(e) => setForm({ ...form, containerNo: e.target.value.toUpperCase() })} /></Field><Field label="Storage Charge"><Input type="number" value={form.storageCharge} onChange={(e) => setForm({ ...form, storageCharge: e.target.value })} /></Field><Field label="Handling Charge"><Input type="number" value={form.handlingCharge} onChange={(e) => setForm({ ...form, handlingCharge: e.target.value })} /></Field><Field label="Documentation Fee"><Input type="number" value={form.documentationFee} onChange={(e) => setForm({ ...form, documentationFee: e.target.value })} /></Field><Field label="Remarks"><Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field><div className="md:col-span-3"><Button type="submit"><Save className="h-4 w-4" />Create Invoice</Button></div></form></CardContent></Card> : null}
      <Card><CardHeader><CardTitle>{paymentMode ? "Payments For Verification" : "Invoices"}</CardTitle><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option><option value="unpaid">Unpaid</option><option value="for-verification">For Verification</option><option value="paid">Paid</option></Select></CardHeader><CardContent>{records.loading ? <LoadingBlock /> : rows.length ? <BillingList invoices={rows} reload={records.reload} paymentMode={paymentMode} /> : <EmptyState title="No billing records" />}</CardContent></Card>
    </div>
  )
}

function ReportsPage() {
  const records = useApiData(() => api.reportsSummary(), [])
  useRealtimeReload(["gateIn:created", "gateOut:updated", "inventory:updated", "billing:updated"], records.reload)
  const data = records.data?.data || {}
  const cards = [
    ["Total Clients", data.totalClients], ["Pre-Advice Total", data.preAdviceTotal], ["Gate In Today", data.gateInToday], ["Gate Out Today", data.gateOutToday], ["Current Inventory", data.currentInventory], ["Released", data.releasedInventory], ["Unpaid Invoices", data.unpaidInvoices], ["Paid Revenue", money(data.paidRevenue || 0)],
  ]
  return <div><PageHeader eyebrow="Admin module" title="Reports" description="Operational, management, and financial report summary." />{records.loading ? <LoadingBlock /> : <><div className="grid gap-3 md:grid-cols-4">{cards.map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value || 0}</p></CardContent></Card>)}</div><Card className="mt-5"><CardHeader><CardTitle>Containers by Shipping Line</CardTitle></CardHeader><CardContent>{(data.byShippingLine || []).length ? <div className="space-y-2">{data.byShippingLine.map((item, index) => <div key={index} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="font-bold text-slate-700">{item._id || 'Unassigned'}</span><span className="font-black text-slate-950">{item.total}</span></div>)}</div> : <EmptyState title="No report data" />}</CardContent></Card></>}</div>
}

function ValidationRulesPage() {
  const [blacklist, setBlacklist] = useState({ containerNo: "", reason: "" })
  const [charge, setCharge] = useState({ containerNo: "", amount: "", reason: "" })
  const [ownership, setOwnership] = useState({ prefix: "", ownerName: "" })
  const [windowValue, setWindowValue] = useState("08:00-17:00")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const records = useApiData(() => api.validationRules(), [])
  useRealtimeReload(["validationRules:updated"], records.reload)
  useEffect(() => { if (records.data?.data?.settings?.defaultGateAppointmentWindow) setWindowValue(records.data.data.settings.defaultGateAppointmentWindow) }, [records.data])
  const data = records.data?.data || {}
  const run = async (fn, reset) => { setMessage(""); setError(""); try { const response = await fn(); setMessage(response.message || 'Saved.'); reset?.(); records.reload() } catch (err) { setError(messageFrom(err, 'Unable to save.')) } }
  return (
    <div>
      <PageHeader eyebrow="Admin module" title="Validation Rules" description="Manage blacklisted containers, outstanding charges, ownership prefixes, and gate appointment defaults from MongoDB." />
      <Notice type="success" message={message} /><Notice type="error" message={error} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card><CardContent className="p-5"><SectionTitle icon={Shield} title="Blacklisted Containers" /><form onSubmit={(e) => { e.preventDefault(); run(() => api.saveBlacklistedContainer(blacklist), () => setBlacklist({ containerNo: "", reason: "" })) }} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><Input placeholder="Container No." value={blacklist.containerNo} onChange={(e) => setBlacklist({ ...blacklist, containerNo: e.target.value.toUpperCase() })} /><Input placeholder="Reason" value={blacklist.reason} onChange={(e) => setBlacklist({ ...blacklist, reason: e.target.value })} /><Button type="submit">Save</Button></form><RuleList items={data.blacklistedContainers} /></CardContent></Card>
        <Card><CardContent className="p-5"><SectionTitle icon={AlertCircle} title="Outstanding Charges" /><form onSubmit={(e) => { e.preventDefault(); run(() => api.saveOutstandingCharge(charge), () => setCharge({ containerNo: "", amount: "", reason: "" })) }} className="grid gap-3 md:grid-cols-[1fr_120px_1fr_auto]"><Input placeholder="Container No." value={charge.containerNo} onChange={(e) => setCharge({ ...charge, containerNo: e.target.value.toUpperCase() })} /><Input type="number" placeholder="Amount" value={charge.amount} onChange={(e) => setCharge({ ...charge, amount: e.target.value })} /><Input placeholder="Reason" value={charge.reason} onChange={(e) => setCharge({ ...charge, reason: e.target.value })} /><Button type="submit">Save</Button></form><RuleList items={data.outstandingChargeContainers} amount /></CardContent></Card>
        <Card><CardContent className="p-5"><SectionTitle icon={Building2} title="Container Ownership Prefixes" /><form onSubmit={(e) => { e.preventDefault(); run(() => api.saveOwnershipRule(ownership), () => setOwnership({ prefix: "", ownerName: "" })) }} className="grid gap-3 md:grid-cols-[120px_1fr_auto]"><Input placeholder="MSCU" value={ownership.prefix} onChange={(e) => setOwnership({ ...ownership, prefix: e.target.value.toUpperCase() })} /><Input placeholder="Owner / Shipping Line" value={ownership.ownerName} onChange={(e) => setOwnership({ ...ownership, ownerName: e.target.value })} /><Button type="submit">Save</Button></form><RuleList items={data.ownershipRules} ownership /></CardContent></Card>
        <Card><CardContent className="p-5"><SectionTitle icon={Settings} title="Gate Appointment Settings" /><div className="flex gap-3"><Input value={windowValue} onChange={(e) => setWindowValue(e.target.value)} /><Button onClick={() => run(() => api.saveValidationSettings({ defaultGateAppointmentWindow: windowValue }))}>Save</Button></div><p className="mt-3 text-sm text-slate-500">Example: 08:00-17:00</p></CardContent></Card>
      </div>
    </div>
  )
}

function RuleList({ items = [], amount = false, ownership = false }) {
  return <div className="mt-4 space-y-2">{items.length ? items.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="font-black text-slate-950">{ownership ? item.prefix : item.containerNo}</span><span className="text-slate-500"> {ownership ? `= ${item.ownerName}` : item.reason || ''} {amount ? ` ${money(item.amount)}` : ''}</span></div>) : <p className="text-sm text-slate-400">No records yet.</p>}</div>
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
  } else if (activeModule === "inventory") {
    page = <InventoryPage />
  } else if (activeModule === "billing") {
    page = <BillingPage />
  } else if (activeModule === "gate-out") {
    page = <GateOutAdminPage />
  } else if (activeModule === "payment-verification") {
    page = <BillingPage paymentMode />
  } else if (activeModule === "reports") {
    page = <ReportsPage />
  } else if (activeModule === "validation-rules") {
    page = <ValidationRulesPage />
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
  } else if (path === "/gate-out") {
    page = <GateOutPage navigate={navigate} />
  } else if (path === "/my-gate-outs") {
    page = <GateOutPage navigate={navigate} listOnly />
  } else if (path === "/my-billings") {
    page = <MyBillingsPage navigate={navigate} />
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
