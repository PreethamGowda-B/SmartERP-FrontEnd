"use client"

import { Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import ThemeSwitch from "@/components/theme-switch"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [theme])

  if (!mounted) {
    return (
      <div className="w-full px-4 py-3 rounded-lg bg-muted flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sun className="h-5 w-5 flex-none text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Light Theme</span>
        </div>
        <div className="relative w-12 h-6 bg-muted-foreground/20 rounded-full flex-none" />
      </div>
    )
  }

  const isDark = theme === "dark"

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light"
    setTheme(newTheme)
  }

  return (
    <div className="w-full px-4 py-3 rounded-lg bg-muted flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Sun
          className={`h-5 w-5 flex-none transition-colors duration-200 ${isDark ? "text-muted-foreground" : "text-yellow-500"}`}
        />
        <span className="text-sm font-medium text-foreground">{isDark ? "Dark Theme" : "Light Theme"}</span>
      </div>
      <ThemeSwitch
        checked={isDark}
        onCheckedChange={handleThemeChange}
        className={`${isDark ? "bg-slate-800" : "bg-yellow-400"}`}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      />
    </div>
  )
}
