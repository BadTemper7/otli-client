import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-slate-50 text-slate-700 ring-slate-200",
        pending: "bg-amber-50 text-amber-700 ring-amber-200",
        verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        rejected: "bg-rose-50 text-rose-700 ring-rose-200",
        suspended: "bg-rose-50 text-rose-700 ring-rose-200",
        cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
        blue: "bg-blue-50 text-blue-700 ring-blue-200",
        purple: "bg-violet-50 text-violet-700 ring-violet-200",
        green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        orange: "bg-orange-50 text-orange-700 ring-orange-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
