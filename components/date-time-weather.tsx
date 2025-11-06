"use client"

import { useEffect, useState } from "react"
import { Cloud, CloudRain, Sun } from "lucide-react"

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

    // Fetch weather data
    const fetchWeather = async () => {
      try {
        // Use a free weather API - we'll use mock data as fallback
        // In production, you'd use a real API like OpenWeatherMap
        const mockWeatherData = {
          temp: Math.round(Math.random() * 15 + 18), // 18-33°C
          condition: ["Sunny", "Cloudy", "Rainy"][Math.floor(Math.random() * 3)],
          icon: ["sun", "cloud", "rain"][Math.floor(Math.random() * 3)],
        }
        setWeather(mockWeatherData)
      } catch (error) {
        console.error("[v0] Failed to fetch weather:", error)
        // Fallback weather
        setWeather({ temp: 22, condition: "Partly Cloudy", icon: "cloud" })
      }
    }

    fetchWeather()
  }, [])

  const getWeatherIcon = (icon: string | undefined) => {
    switch (icon) {
      case "sun":
        return <Sun className="w-5 h-5 text-yellow-500" />
      case "rain":
        return <CloudRain className="w-5 h-5 text-blue-500" />
      case "cloud":
      default:
        return <Cloud className="w-5 h-5 text-gray-400" />
    }
  }

  if (!dateTime) return null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 rounded-lg bg-gradient-to-br from-white/50 via-white/30 to-transparent backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up">
      {/* Date and Time */}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground font-medium">{dateTime.dayName}</p>
        <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {dateTime.time}
        </p>
        <p className="text-sm text-muted-foreground">{dateTime.date}</p>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent" />

      {/* Weather */}
      {weather && (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-white/50 backdrop-blur-sm border border-white/20">
            {getWeatherIcon(weather.icon)}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-primary">{weather.temp}°C</p>
            <p className="text-xs text-muted-foreground">{weather.condition}</p>
          </div>
        </div>
      )}
    </div>
  )
}
