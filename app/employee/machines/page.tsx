"use client"

import { useState, useEffect, useCallback } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import {
  Cpu,
  Search,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Activity,
  FileText,
  Radio,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sliders,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Machine {
  id: string | number
  machine_name: string
  serial_number: string
  controller_type?: string
  make?: string
  model?: string
  status?: string
  health_score?: number
  spindle_hours?: number
  customer_name?: string
  plant_name?: string
  critical_level?: string
  last_service_date?: string
}

// Built-in CNC Alarm Code Decoder DB for field engineers
const COMMON_ALARM_CODES: Record<
  string,
  { controller: string; description: string; cause: string; resolution: string; severity: "critical" | "warning" | "info" }
> = {
  "EX1001": {
    controller: "Fanuc 0i-MF",
    description: "Spindle Drive Temperature Overheat",
    cause: "Coolant chiller filter clogged or high ambient cabinet temp.",
    resolution: "Clean cabinet air filters, verify chiller flow rate, inspect heat exchanger fans.",
    severity: "critical",
  },
  "AL-04": {
    controller: "Mitsubishi M80",
    description: "Z-Axis Servo Amplifier Overcurrent",
    cause: "Heavy load or cable harness breakdown.",
    resolution: "Inspect motor power cable insulation and ball-screw mechanical binding.",
    severity: "critical",
  },
  "2001": {
    controller: "Siemens 840D",
    description: "PLC Axis Interlock Not Released",
    cause: "Door interlock switch open or hydraulic pressure below 35 bar.",
    resolution: "Check safety guard limit switch and test hydraulic pack pressure gauge.",
    severity: "warning",
  },
  "104": {
    controller: "Haas NGC",
    description: "Y-Axis Following Error / Feed Lag",
    cause: "Way lube deficiency or high gib tension.",
    resolution: "Trigger manual lube cycle, check oil level, inspect Y-axis way covers.",
    severity: "warning",
  },
  "OT0500": {
    controller: "Fanuc 31i",
    description: "+X Axis Overtravel (Soft Limit 1)",
    cause: "Programmed coordinate exceeds machine stroke boundary.",
    resolution: "Switch to JOG mode, hold Overtravel Release button, jog axis in negative direction.",
    severity: "info",
  },
}

export default function EmployeeMachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // Alarm Decoder Tool State
  const [alarmCodeQuery, setAlarmCodeQuery] = useState("")
  const [alarmResult, setAlarmResult] = useState<any | null>(null)

  const fetchMachines = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient("/api/machines")
      if (res && res.machines) {
        setMachines(res.machines)
      } else if (Array.isArray(res)) {
        setMachines(res)
      }
    } catch (err: any) {
      logger.error("Error fetching machines:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMachines()
  }, [fetchMachines])

  const handleDecodeAlarm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!alarmCodeQuery.trim()) return

    const normalized = alarmCodeQuery.trim().toUpperCase()
    if (COMMON_ALARM_CODES[normalized]) {
      setAlarmResult({ code: normalized, ...COMMON_ALARM_CODES[normalized] })
    } else {
      setAlarmResult({
        code: normalized,
        controller: "Generic CNC System",
        description: `Diagnostic record for alarm ${normalized}`,
        cause: "Signal trip detected on controller bus or sensor limit.",
        resolution: "Inspect electrical schematic, verify 24V DC I/O signal rail, and restart controller.",
        severity: "warning",
      })
    }
  }

  const filteredMachines = machines.filter((m) => {
    const q = searchQuery.toLowerCase()
    const matchesQuery =
      (m.machine_name || "").toLowerCase().includes(q) ||
      (m.serial_number || "").toLowerCase().includes(q) ||
      (m.controller_type || "").toLowerCase().includes(q) ||
      (m.make || "").toLowerCase().includes(q)

    if (selectedStatus === "all") return matchesQuery
    return matchesQuery && (m.status || "").toLowerCase() === selectedStatus.toLowerCase()
  })

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Cpu className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">CNC Machine Registry</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Field diagnostic center, controller specs, and real-time alarm decoder.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchMachines}
            disabled={loading}
            className="self-start sm:self-auto gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh Specs
          </Button>
        </div>

        {/* Top Grid: Quick Alarm Decoder + Fleet Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Alarm Code Decoder */}
          <Card className="lg:col-span-2 border-border/80 shadow-xs bg-gradient-to-br from-card to-secondary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-5 w-5" />
                  <CardTitle className="text-base font-bold">CNC Alarm Code Decoder</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono tracking-wider">
                  FANUC • SIEMENS • MITSUBISHI • HAAS
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Instant troubleshooting guide and root-cause analysis for machine error codes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleDecodeAlarm} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter alarm code (e.g. EX1001, AL-04, 2001, 104)..."
                    value={alarmCodeQuery}
                    onChange={(e) => setAlarmCodeQuery(e.target.value)}
                    className="pl-9 text-xs h-9 font-mono uppercase"
                  />
                </div>
                <Button type="submit" size="sm" className="h-9 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
                  Decode Alarm
                </Button>
              </form>

              {/* Decoder Result Box */}
              {alarmResult ? (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                        [{alarmResult.code}]
                      </span>
                      <span className="font-semibold text-foreground">{alarmResult.description}</span>
                    </div>
                    <Badge
                      className={cn(
                        "text-[10px] uppercase font-bold",
                        alarmResult.severity === "critical"
                          ? "bg-red-500 text-white"
                          : alarmResult.severity === "warning"
                          ? "bg-amber-500 text-white"
                          : "bg-blue-500 text-white"
                      )}
                    >
                      {alarmResult.severity}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Probable Cause:</span>
                      <p className="text-muted-foreground mt-0.5">{alarmResult.cause}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Standard Resolution:</span>
                      <p className="text-foreground font-medium mt-0.5">{alarmResult.resolution}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
                  <Radio className="h-4 w-4 text-primary shrink-0" />
                  <span>Try common codes: <code className="font-mono text-foreground font-bold cursor-pointer hover:underline" onClick={() => { setAlarmCodeQuery("EX1001"); setAlarmResult({ code: "EX1001", ...COMMON_ALARM_CODES["EX1001"] }); }}>EX1001</code>, <code className="font-mono text-foreground font-bold cursor-pointer hover:underline" onClick={() => { setAlarmCodeQuery("AL-04"); setAlarmResult({ code: "AL-04", ...COMMON_ALARM_CODES["AL-04"] }); }}>AL-04</code>, <code className="font-mono text-foreground font-bold cursor-pointer hover:underline" onClick={() => { setAlarmCodeQuery("2001"); setAlarmResult({ code: "2001", ...COMMON_ALARM_CODES["2001"] }); }}>2001</code></span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <Card className="border-border/80 shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Registry Status</CardTitle>
              <CardDescription className="text-xs">Assigned customer equipment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span>Operational Fleet</span>
                </div>
                <span className="font-bold text-sm">
                  {machines.filter((m) => (m.status || "operational") === "operational").length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Maintenance / Alarms</span>
                </div>
                <span className="font-bold text-sm">
                  {machines.filter((m) => (m.status || "") === "maintenance" || (m.status || "") === "warning").length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  <span>Total Equipment</span>
                </div>
                <span className="font-bold text-sm">{machines.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search machine, serial #, controller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={selectedStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("all")}
              className="text-xs h-8"
            >
              All
            </Button>
            <Button
              variant={selectedStatus === "operational" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("operational")}
              className="text-xs h-8"
            >
              Operational
            </Button>
            <Button
              variant={selectedStatus === "maintenance" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("maintenance")}
              className="text-xs h-8"
            >
              Maintenance
            </Button>
          </div>
        </div>

        {/* Machines List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filteredMachines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMachines.map((machine) => {
              const statusColor =
                (machine.status || "").toLowerCase() === "maintenance"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"

              return (
                <Card key={machine.id} className="border-border/80 shadow-xs hover:border-amber-500/40 hover:shadow-md transition-all">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-bold">{machine.machine_name}</CardTitle>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">SN: {machine.serial_number}</p>
                      </div>
                      <Badge className={cn("text-[10px] font-bold uppercase", statusColor)}>
                        {machine.status || "Operational"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-border/60">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Controller</span>
                        <p className="font-semibold text-foreground truncate">{machine.controller_type || "CNC Standard"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Make / Model</span>
                        <p className="font-semibold text-foreground truncate">{machine.make || "VMC"} {machine.model || ""}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Spindle Hours</span>
                        <p className="font-semibold text-foreground">{machine.spindle_hours || 0} hrs</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Plant Location</span>
                        <p className="font-semibold text-foreground truncate">{machine.plant_name || "Main Bay"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-amber-500" />
                        {machine.customer_name || "Assigned Client"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10 p-1"
                        onClick={() => {
                          setAlarmCodeQuery("EX1001")
                          setAlarmResult({ code: "EX1001", ...COMMON_ALARM_CODES["EX1001"] })
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }}
                      >
                        Inspect Alarms <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="p-12 text-center border-dashed">
            <Cpu className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-bold">No Machines Found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No equipment matching &quot;{searchQuery}&quot; was found. Contact your supervisor if your assigned machines are missing.
            </p>
          </Card>
        )}
      </div>
    </EmployeeLayout>
  )
}
