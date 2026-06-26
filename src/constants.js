import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  Code2,
  CreditCard,
  Database,
  FileCheck2,
  Grid2X2,
  PackageCheck,
  Settings,
  ShieldCheck,
  Truck,
  UserCheck,
} from "lucide-react"

export const MODULE_LABELS = {
  dashboard: "Dashboard",
  "account-approval": "Account Approval",
  "pre-advice-approval": "Pre-Advice Approval",
  "booking-approval": "Booking / Gate Appointment Approval",
  "gate-in": "Gate In Module",
  inventory: "Inventory / Yard Monitoring",
  billing: "Billing Module",
  "gate-out": "Gate Out Module",
  "payment-verification": "Payment Verification",
  reports: "Reports",
  "validation-rules": "Validation Rules",
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
  { id: "inventory", label: MODULE_LABELS.inventory, path: "/admin/inventory", icon: Database },
  { id: "billing", label: MODULE_LABELS.billing, path: "/admin/billing", icon: CreditCard },
  { id: "gate-out", label: MODULE_LABELS["gate-out"], path: "/admin/gate-out", icon: PackageCheck },
  { id: "payment-verification", label: MODULE_LABELS["payment-verification"], path: "/admin/payment-verification", icon: ShieldCheck },
  { id: "reports", label: MODULE_LABELS.reports, path: "/admin/reports", icon: BarChart3 },
  { id: "validation-rules", label: MODULE_LABELS["validation-rules"], path: "/admin/validation-rules", icon: ClipboardCheck },
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
  { label: "Gate Appointment", path: "/booking" },
  { label: "Gate-Out", path: "/gate-out" },
]

export const DASHBOARD_CHART = [
  { name: "Accounts", value: 0, icon: UserCheck },
  { name: "Pre-Advice", value: 0, icon: ClipboardCheck },
  { name: "Bookings", value: 0, icon: CalendarCheck },
  { name: "Gate In", value: 0, icon: BarChart3 },
]
