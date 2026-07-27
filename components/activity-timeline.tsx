"use client"

import * as React from "react"
import {
  Activity,
  User,
  Package,
  Clock,
  CreditCard,
  Briefcase,
  FileText,
  Search,
  Filter,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export interface TimelineActivity {
  id: string
  user: string
  action: string
  target: string
  category: "employee" | "inventory" | "attendance" | "payroll" | "job"
  timestamp: string
}

export function ActivityTimeline() {
  const [activities] = React.useState<TimelineActivity[]>([
    {
      id: "act-1",
      user: "Preetham Gowda",
      action: "authorized disbursement for",
      target: "July Staff Payroll (₹4,85,000)",
      category: "payroll",
      timestamp: "12 mins ago",
    },
    {
      id: "act-2",
      user: "John Doe",
      action: "updated inventory quantity for",
      target: "Raw Steel Beams (+50 units)",
      category: "inventory",
      timestamp: "45 mins ago",
    },
    {
      id: "act-3",
      user: "Sarah Smith",
      action: "clocked in at",
      target: "Main Site Location (On-time)",
      category: "attendance",
      timestamp: "2 hours ago",
    },
    {
      id: "act-4",
      user: "Mike Johnson",
      action: "completed job assignment",
      target: "Task #104: Electrical Wiring",
      category: "job",
      timestamp: "4 hours ago",
    },
    {
      id: "act-5",
      user: "Admin System",
      action: "added new employee profile",
      target: "Alex Turner (Field Inspector)",
      category: "employee",
      timestamp: "Yesterday",
    },
  ])

  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredActivities = activities.filter((act) => {
    const matchesCat = categoryFilter === "all" || act.category === categoryFilter
    const matchesQuery =
      act.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.target.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesQuery
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "inventory":
        return <Package className="h-3.5 w-3.5 text-amber-500" />
      case "attendance":
        return <Clock className="h-3.5 w-3.5 text-blue-500" />
      case "payroll":
        return <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
      case "job":
        return <Briefcase className="h-3.5 w-3.5 text-purple-500" />
      default:
        return <User className="h-3.5 w-3.5 text-primary" />
    }
  }

  return (
    <Card className="border border-border/70 shadow-xs">
      <CardHeader className="p-4 border-b border-border/70 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">Company Activity Stream</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search stream..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs w-44"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto text-xs pt-2">
          {["all", "employee", "inventory", "attendance", "payroll", "job"].map((cat) => (
            <Badge
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              className="cursor-pointer capitalize text-[10px] px-2 py-0.5"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="relative border-l border-border/70 ml-3 pl-6 space-y-6">
          {filteredActivities.map((act) => (
            <div key={act.id} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-[31px] top-0.5 p-1 rounded-full bg-background border border-border shadow-xs">
                {getCategoryIcon(act.category)}
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">{act.user}</span>{" "}
                    <span className="text-muted-foreground">{act.action}</span>{" "}
                    <span className="font-medium text-primary">{act.target}</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {act.timestamp}
                  </span>
                </div>
                <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 font-normal">
                  {act.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
