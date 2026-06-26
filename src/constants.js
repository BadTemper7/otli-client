import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  Code2,
  FileCheck2,
  Grid2X2,
  Settings,
  ShieldCheck,
  Truck,
  UserCheck,
} from "lucide-react"

export const MODULE_LABELS = {
  dashboard: "Dashboard",
  "account-approval": "Account Approval",
  "pre-advice-approval": "Pre-Advice Approval",
  "booking-approval": "Booking Approval",
  "gate-in": "Gate In Module",
  users: "Users and Module Access",
  "api-logs": "API Logs",
  "audit-logs": "Audit Logs",
  settings: "Settings",
}

export const ALL_ADMIN_MODULES = Object.keys(MODULE_LABELS)

export const ADMIN_NAV_ITEMS = [
  { id: "dashboard", label: MODULE_LABELS.dashboard, path: "/admin", icon: Grid2X2 },
  { id: "account-approval", label: MODULE_LABELS["account-approval"], path: "/admin/account-approval", icon: UserCheck },
  { id: "pre-advice-approval", label: MODULE_LABELS["pre-advice-approval"], path: "/admin/pre-advice-approval", icon: FileCheck2 },
  { id: "booking-approval", label: MODULE_LABELS["booking-approval"], path: "/admin/booking-approval", icon: CalendarCheck },
  { id: "gate-in", label: MODULE_LABELS["gate-in"], path: "/admin/gate-in", icon: Truck },
  { id: "users", label: MODULE_LABELS.users, path: "/admin/users", icon: ShieldCheck },
  { id: "api-logs", label: MODULE_LABELS["api-logs"], path: "/admin/api-logs", icon: Code2 },
  { id: "audit-logs", label: MODULE_LABELS["audit-logs"], path: "/admin/audit-logs", icon: ClipboardList },
  { id: "settings", label: MODULE_LABELS.settings, path: "/admin/settings", icon: Settings },
]

export const CLIENT_NAV_ITEMS = [
  { label: "Login", path: "/" },
  { label: "Create Account", path: "/register" },
  { label: "My Profile", path: "/profile" },
  { label: "Pre-Advice", path: "/pre-advice" },
  { label: "Booking", path: "/booking" },
]

export const DASHBOARD_CHART = [
  { name: "Accounts", value: 0, icon: UserCheck },
  { name: "Pre-Advice", value: 0, icon: ClipboardCheck },
  { name: "Bookings", value: 0, icon: CalendarCheck },
  { name: "Gate In", value: 0, icon: BarChart3 },
]
