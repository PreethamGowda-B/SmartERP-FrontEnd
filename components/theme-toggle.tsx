"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import ThemeSwitch from '@/components/theme-switch'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    console.log("[v0] Theme toggle mounted, current theme:", theme)
  }, [theme])

  if (!mounted) {
    return (
      <div className="flex items-center gap-3 h-8">
        <Sun className="h-5 w-5 flex-none text-muted-foreground" />
        <div className="relative w-16 h-8 bg-muted rounded-full flex-none">
          <div className="absolute left-2 top-1 text-[10px] text-muted-foreground">LIGHT</div>
          <div className="absolute right-2 top-1 text-[10px] text-muted-foreground">DARK</div>
        </div>
        <Moon className="h-5 w-5 flex-none text-muted-foreground" />
      </div>
    )
  }

  const isDark = theme === "dark"

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light"
    console.log("[v0] Changing theme to:", newTheme)
    setTheme(newTheme)
  }

  return (
    <div className="flex items-center gap-3 h-8">
      <Sun
        className={`h-5 w-5 flex-none transition-colors duration-200 ${isDark ? "text-muted-foreground" : "text-yellow-500"}`}
      />
      <ThemeSwitch
        checked={isDark}
        onCheckedChange={handleThemeChange}
        className={`${isDark ? 'bg-slate-800' : 'bg-yellow-400'}`}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      />
      <Moon
        className={`h-5 w-5 flex-none transition-colors duration-200 ${isDark ? "text-blue-400" : "text-muted-foreground"}`}
      />
    </div>
  )
}
