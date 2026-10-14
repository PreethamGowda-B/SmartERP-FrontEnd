"use client"

import { useEffect, useState } from "react"
import { Cloud, CloudRain, Sun, Clock, Calendar } from "lucide-react"

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
    const updateDateTime = () => {
      const now = new Date()

      const dayName = now.toLocaleDateString("en-US", { weekday: "short" })
      const date = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })

      setDateTime({ date, time, dayName })
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 30000)

    const currentHour = new Date().getHours()
    const isDay = currentHour >= 6 && currentHour < 19
    const shiftStatus = currentHour >= 8 && currentHour < 18 
      ? "General Shift" 
      : currentHour >= 18 && currentHour < 22 
        ? "Evening Shift" 
        : "Standby"

    setWeather({
      temp: isDay ? 26 : 21,
      condition: shiftStatus,
      icon: isDay ? "sun" : "cloud",
      location: "Enterprise Hub",
    })

    return () => clearInterval(interval)
  }, [])

  const getWeatherIcon = (icon: string | undefined) => {
    switch (icon) {
      case "sun":
        return <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      case "rain":
        return <CloudRain className="w-3.5 h-3.5 text-blue-400 shrink-0" />
      case "cloud":
      default:
        return <Cloud className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
    }
  }

  if (!dateTime) return null

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-card border border-border/70 shadow-xs text-xs">
      {/* Date & Time */}
      <div className="flex items-center gap-2 font-mono">
        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-extrabold text-foreground text-xs sm:text-sm tracking-tight">{dateTime.time}</span>
      </div>

      <div className="w-px h-3.5 bg-border/80 shrink-0" />

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Calendar className="w-3 h-3 shrink-0" />
        <span className="font-medium whitespace-nowrap">{dateTime.dayName}, {dateTime.date}</span>
      </div>

      {weather && (
        <>
          <div className="hidden sm:block w-px h-3.5 bg-border/80 shrink-0" />
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            {getWeatherIcon(weather.icon)}
            <span className="font-bold text-foreground">{weather.temp}°C</span>
            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
              {weather.condition}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
