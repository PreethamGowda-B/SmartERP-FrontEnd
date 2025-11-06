"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin } from "lucide-react"

interface DailySummaryProps {
  clockInTime?: string
  clockOutTime?: string
  totalHours?: number
  location?: string
  status?: "present" | "late" | "absent" | "pending"
  date?: string
}

export function DailySummaryCard({
  clockInTime,
  clockOutTime,
  totalHours,
  location,
  status = "pending",
  date,
}: DailySummaryProps) {
  const getStatusColor = () => {
    switch (status) {
      case "present":
        return "default"
      case "late":
        return "secondary"
      case "absent":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card className="hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Daily Summary
          </CardTitle>
          <Badge variant={getStatusColor()}>{status}</Badge>
        </div>
        <CardDescription>{date || new Date().toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Clock In</p>
            <p className="font-semibold">{clockInTime || "—"}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Clock Out</p>
            <p className="font-semibold">{clockOutTime || "—"}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg col-span-2">
            <p className="text-sm text-muted-foreground mb-1">Hours Worked</p>
            <p className="text-2xl font-bold text-blue-600">{totalHours ? `${totalHours}h` : "—"}</p>
          </div>
          {location && (
            <div className="p-3 bg-muted rounded-lg col-span-2 flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Location</p>
                <p className="font-medium">{location}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
