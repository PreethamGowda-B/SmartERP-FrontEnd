"use client"

import { Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import ThemeSwitch from "@/components/theme-switch"
import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
  compact?: boolean
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [theme])

  if (!mounted) {
    if (compact) {
      return (
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0">
          <Sun className="h-4 w-4 text-muted-foreground" />
        </Button>
      )
    }

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

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="h-9 w-9 rounded-full shrink-0 relative transition-colors hover:bg-accent"
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-indigo-400 transition-transform duration-200 rotate-0 scale-100" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500 transition-transform duration-200 rotate-0 scale-100" />
        )}
      </Button>
    )
  }

  return (
    <div className="w-full px-4 py-3 rounded-lg bg-muted flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isDark ? (
          <Moon className="h-5 w-5 flex-none text-indigo-400 transition-colors duration-200" />
        ) : (
          <Sun className="h-5 w-5 flex-none text-amber-500 transition-colors duration-200" />
        )}
        <span className="text-sm font-medium text-foreground">{isDark ? "Dark Theme" : "Light Theme"}</span>
      </div>
      <ThemeSwitch
        checked={isDark}
        onCheckedChange={handleThemeChange}
        className={`${isDark ? "bg-slate-800" : "bg-amber-400"}`}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      />
    </div>
  )
}
