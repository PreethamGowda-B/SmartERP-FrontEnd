"use client"

import { Check, X, ShieldAlert, ShieldCheck } from "lucide-react"

interface PasswordStrengthMeterProps {
  password?: string
}

export function PasswordStrengthMeter({ password = "" }: PasswordStrengthMeterProps) {
  const requirements = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Uppercase letter (A-Z)", valid: /[A-Z]/.test(password) },
    { label: "Number (0-9)", valid: /[0-9]/.test(password) },
    { label: "Special character (!@#$)", valid: /[^A-Za-z0-9]/.test(password) },
  ]

  const validCount = requirements.filter((r) => r.valid).length
  const strengthPct = (validCount / requirements.length) * 100

  let colorClass = "bg-rose-500"
  let label = "Weak"
  if (validCount >= 4) {
    colorClass = "bg-emerald-500"
    label = "Strong"
  } else if (validCount >= 2) {
    colorClass = "bg-amber-500"
    label = "Fair"
  }

  if (!password) return null

  return (
    <div className="space-y-2 text-xs pt-1">
      <div className="flex items-center justify-between font-semibold">
        <span className="text-muted-foreground flex items-center gap-1">
          {validCount >= 4 ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
          )}
          Password Strength:
        </span>
        <span className={validCount >= 4 ? "text-emerald-500" : "text-amber-500"}>{label}</span>
      </div>

      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-300`}
          style={{ width: `${strengthPct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {requirements.map((req, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            {req.valid ? (
              <Check className="h-3 w-3 text-emerald-500 shrink-0" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            )}
            <span className={req.valid ? "text-foreground font-medium" : "text-muted-foreground"}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
