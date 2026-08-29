"use client"

import { useState } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BookOpen,
  Search,
  FileText,
  ShieldCheck,
  Zap,
  Wrench,
  Cpu,
  Layers,
  ChevronRight,
  Download,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ManualArticle {
  id: string
  title: string
  category: "Safety & ISO" | "Controller SOPs" | "Hydraulics & Chiller" | "Preventive Maintenance"
  controller?: string
  readTime: string
  summary: string
  steps: string[]
  downloadsCount: number
}

const SOP_ARTICLES: ManualArticle[] = [
  {
    id: "sop-01",
    title: "Fanuc 0i-MF & 31i Spindle Chiller & Drive Overheat Standard Operating Procedure",
    category: "Controller SOPs",
    controller: "Fanuc",
    readTime: "4 min read",
    summary: "Step-by-step resolution for spindle drive temperature trip, thermistor wiring check, and cooling loop flow rate calibration.",
    steps: [
      "Isolate main 415V 3-phase supply and apply LOTO (Lockout/Tagout) safety padlocks.",
      "Check cabinet intake dust filters; clean using compressed air at max 3.5 bar.",
      "Verify chiller reservoir fluid level and ethylene glycol concentration ratio (70:30 mix).",
      "Inspect Fanuc amplifier thermistor sensor resistance (nominal 10kΩ at 25°C).",
      "Power cycle controller in test mode and record spindle motor surface temperature."
    ],
    downloadsCount: 142
  },
  {
    id: "sop-02",
    title: "High-Pressure Hydraulic Pack Pressure Calibration & Accumulator Pre-charge",
    category: "Hydraulics & Chiller",
    controller: "Universal CNC",
    readTime: "6 min read",
    summary: "Calibration protocol for hydraulic chuck clamping, tool changer cylinder actuators, and nitrogen accumulator bladder charging.",
    steps: [
      "Attach calibrated digital pressure transducer to primary gauge test port #1.",
      "Start hydraulic pump motor and verify system relief valve set-point at 45 ± 2 bar.",
      "Check nitrogen pre-charge pressure in accumulator bladder (standard 25 bar N2).",
      "Inspect proportional directional control valves for spool stickiness or seal leakage.",
      "Test chuck unclamp/clamp cycle timing (must actuate within < 0.6 seconds)."
    ],
    downloadsCount: 98
  },
  {
    id: "sop-03",
    title: "VMC 3-Axis Ball-Screw Backlash Compensation & Pitch Error Mapping",
    category: "Preventive Maintenance",
    controller: "Siemens & Fanuc",
    readTime: "8 min read",
    summary: "Measurement protocol using digital dial indicator and Renishaw laser interferometer for precision ball-screw tuning.",
    steps: [
      "Mount 0.001mm precision dial test indicator to spindle nose against fixed reference block.",
      "Command incremental 10µm jog steps in +X direction, then reverse to -X direction.",
      "Calculate mechanical lost motion (backlash = dial delta vs commanded coordinate).",
      "Enter measured value into Parameter #1851 (Fanuc) or MD32450 (Siemens).",
      "Perform circular interpolation test (test cut / ball-bar test) to verify roundness."
    ],
    downloadsCount: 215
  },
  {
    id: "sop-04",
    title: "Plant Electrical Safety, 24V DC Signal Rail Isolation, & Earth Grounding Protocol",
    category: "Safety & ISO",
    controller: "ISO 45001 / IEC",
    readTime: "5 min read",
    summary: "Standard plant safety guidelines for CNC machine installations, grounding resistance testing (< 2Ω), and 24V DC control rail protection.",
    steps: [
      "Measure machine frame earth ground resistance using 4-terminal fall-of-potential tester.",
      "Ensure earth resistance is strictly under 2.0 Ohms to prevent ground loop noise on sensor cables.",
      "Verify 24V DC switch mode power supply (SMPS) ripple voltage is under 50mV peak-to-peak.",
      "Verify emergency stop (E-STOP) circuit dual-channel safety relay trip response.",
      "Record test values in the digital ISO compliance certificate logbook."
    ],
    downloadsCount: 320
  },
]

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [activeArticle, setActiveArticle] = useState<ManualArticle | null>(SOP_ARTICLES[0])

  const categories = ["All", "Controller SOPs", "Hydraulics & Chiller", "Preventive Maintenance", "Safety & ISO"]

  const filteredArticles = SOP_ARTICLES.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.controller || "").toLowerCase().includes(searchQuery.toLowerCase())

    if (selectedCategory === "All") return matchesSearch
    return matchesSearch && art.category === selectedCategory
  })

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Technical Knowledge Base</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Field manuals, standard operating procedures (SOPs), and controller troubleshooting guides.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold py-1 px-3 bg-card gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              ISO 9001 &amp; CNC Certified
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search SOPs, manuals, Fanuc/Siemens error guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="text-xs h-8 whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* 2-Column Layout: Article List + Reader Pane */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Article Selector List */}
          <div className="lg:col-span-5 space-y-3">
            {filteredArticles.map((article) => {
              const isSelected = activeArticle?.id === article.id
              return (
                <div
                  key={article.id}
                  onClick={() => setActiveArticle(article)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer select-none space-y-2",
                    isSelected
                      ? "bg-amber-500/10 border-amber-500/40 shadow-xs ring-1 ring-amber-500/20"
                      : "bg-card border-border/80 hover:bg-secondary/40 hover:border-border"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {article.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{article.readTime}</span>
                  </div>

                  <h3 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                      {article.controller || "Standard"}
                    </span>
                    <span className="font-semibold">{article.downloadsCount} engineers viewed</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detailed Reader Pane */}
          <div className="lg:col-span-7">
            {activeArticle ? (
              <Card className="border-border/80 shadow-xs h-full flex flex-col justify-between">
                <CardHeader className="pb-4 border-b border-border/60">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-primary text-primary-foreground text-xs font-bold">
                      {activeArticle.category}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => alert("SOP guide ready for offline mobile access.")}>
                        <Download className="h-3.5 w-3.5" /> Save Offline
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold leading-snug">{activeArticle.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">{activeArticle.summary}</CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6 flex-1">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Wrench className="h-4 w-4 text-amber-500" />
                      Execution Checklist &amp; Technical Steps:
                    </h4>
                    <ol className="space-y-3">
                      {activeArticle.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed p-3 rounded-lg bg-secondary/30 border border-border/40">
                          <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-foreground font-medium">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                      <Sparkles className="h-4 w-4" />
                      Field Safety Verification
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      Always verify de-energization using a calibrated CAT-IV multimeter prior to touching live controller busbars.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center border rounded-2xl border-dashed p-12 text-center text-muted-foreground text-xs">
                Select an SOP article to review standard operating procedures.
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}
