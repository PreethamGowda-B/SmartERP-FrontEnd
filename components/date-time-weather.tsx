"use client"

import { useEffect, useState } from "react"
import { Cloud, CloudRain, Sun, Compass } from "lucide-react"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"

export function DateTimeWeather() {
  const [dateTime, setDateTime] = useState<{
    date: string
    time: string
    dayName: string
  } | null>(null)
  const [weather, setWeather] = useState<{
    temp: number
    condition: string
    icon: string
    location: string
  } | null>(null)

  useEffect(() => {
    // Update date and time
    const updateDateTime = () => {
      const now = new Date()

      const dayName = now.toLocaleDateString("en-US", { weekday: "long" })
      const date = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })

      setDateTime({ date, time, dayName })
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)

    // Set stable mock weather for demonstration (24°C, Partly Sunny)
    setWeather({
      temp: 24,
      condition: "Partly Sunny",
      icon: "sun",
      location: "Bengaluru, IN",
    })

    return () => clearInterval(interval)
  }, [])

  const getWeatherIcon = (icon: string | undefined) => {
    switch (icon) {
      case "sun":
        return <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
      case "rain":
        return <CloudRain className="w-5 h-5 text-blue-400" />
      case "cloud":
      default:
        return <Cloud className="w-5 h-5 text-indigo-400" />
    }
  }

  if (!dateTime) return null

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-5 px-4 py-3 rounded-2xl bg-card/70 dark:bg-card/80 backdrop-blur-xl border border-border/70 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Date and Time */}
      <div className="flex flex-col gap-0.5 min-w-[120px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {dateTime.dayName}
          </span>
        </div>
        <p className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-indigo-500 to-amber-500 bg-clip-text text-transparent">
          {dateTime.time}
        </p>
        <span className="text-xs font-medium text-muted-foreground">{dateTime.date}</span>
      </div>

      {/* Vertical Divider */}
      <div className="hidden sm:block w-px h-10 bg-border/80" />

      {/* Weather Info */}
      {weather && (
        <div className="flex items-center gap-3 pl-1 sm:pl-0">
          <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
            {getWeatherIcon(weather.icon)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-foreground">{weather.temp}°C</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {weather.condition}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <Compass className="w-3 h-3 text-muted-foreground shrink-0" />
              <span>{weather.location}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
