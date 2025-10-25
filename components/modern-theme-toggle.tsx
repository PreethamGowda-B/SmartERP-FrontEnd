"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

export function ModernThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 h-8">
        <Sun className="h-5 w-5 text-muted-foreground" />
        <div className="w-12 h-6 bg-muted rounded-full" />
        <Moon className="h-5 w-5 text-muted-foreground" />
      </div>
    )
  }

  const isDark = theme === "dark"

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sun Icon */}
      <Sun
        className={`h-5 w-5 transition-all duration-300 ${
          isDark ? "text-muted-foreground opacity-50" : "text-yellow-500 opacity-100"
        }`}
      />

      {/* Modern Switch */}
      <SwitchPrimitive.Root
        checked={isDark}
        onCheckedChange={handleThemeChange}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
        style={{
          backgroundColor: isDark ? "#7c3aed" : "#e5e7eb",
        }}
        aria-label="Toggle theme"
      >
        <SwitchPrimitive.Thumb
          className={`block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
            isDark ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </SwitchPrimitive.Root>

      {/* Moon Icon */}
      <Moon
        className={`h-5 w-5 transition-all duration-300 ${
          isDark ? "text-blue-400 opacity-100" : "text-muted-foreground opacity-50"
        }`}
      />
    </div>
  )
}
