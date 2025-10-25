"use client"

import { useState, useEffect } from "react"
import { Cloud, CloudRain, Sun, Droplets } from "lucide-react"

interface WeatherData {
  temp: number
  condition: "sunny" | "cloudy" | "rainy"
  humidity: number
  windSpeed: number
}

export function ClockWeatherWidget() {
  const [time, setTime] = useState<string>("")
  const [weather, setWeather] = useState<WeatherData>({
    temp: 24,
    condition: "sunny",
    humidity: 65,
    windSpeed: 12,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Update time every second
    const updateTime = () => {
      const now = new Date()
      const hours12 = now.getHours() % 12 || 12
      const minutes = String(now.getMinutes()).padStart(2, "0")
      const ampm = now.getHours() >= 12 ? "PM" : "AM"
      setTime(`${hours12}:${minutes} ${ampm}`)
    }

    updateTime()
    const timeInterval = setInterval(updateTime, 1000)

    // Simulate weather updates (in real app, fetch from API)
    const updateWeather = () => {
      const conditions: Array<"sunny" | "cloudy" | "rainy"> = ["sunny", "cloudy", "rainy"]
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)]
      setWeather((prev) => ({
        ...prev,
        condition: randomCondition,
        temp: Math.floor(Math.random() * 15) + 18,
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 20) + 5,
      }))
    }

    const weatherInterval = setInterval(updateWeather, 30000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(weatherInterval)
    }
  }, [])

  if (!mounted) return null

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case "sunny":
        return <Sun className="h-4 w-4 text-yellow-500" />
      case "cloudy":
        return <Cloud className="h-4 w-4 text-gray-400" />
      case "rainy":
        return <CloudRain className="h-4 w-4 text-blue-400" />
      default:
        return <Sun className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
      {/* Clock */}
      <div className="flex items-center gap-2 min-w-fit">
        <div className="text-sm font-semibold text-foreground">{time}</div>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border/50"></div>

      {/* Weather */}
      <div className="flex items-center gap-2 min-w-fit">
        {getWeatherIcon()}
        <div className="text-sm font-medium text-foreground">{weather.temp}°C</div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <Droplets className="h-3 w-3" />
          <span>{weather.humidity}%</span>
        </div>
      </div>
    </div>
  )
}
