import * as React from "react"
import { cn } from "@/lib/utils"

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"

const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClass, className)} {...props} />
))
Input.displayName = "Input"

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
      className
    )}
    {...props}
  />
))
Textarea.displayName = "Textarea"

const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(inputClass, className)} {...props}>
    {children}
  </select>
))
Select.displayName = "Select"

export { Input, Textarea, Select }
