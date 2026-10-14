"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, AlertTriangle, CheckCircle, Package, ArrowRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/apiClient"
import { cn } from "@/lib/utils"

interface LowStockItem {
  id: number
  name: string
  quantity: number
  min_quantity: number
  unit?: string
  category?: string
}

export function ProactiveAIInsights() {
  const router = useRouter()
  const [lowStockItems, setLowStockItems] = React.useState<LowStockItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchStockAlerts = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient<LowStockItem[]>("/api/inventory/low-stock")
      if (Array.isArray(data)) {
        setLowStockItems(data)
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchStockAlerts()
  }, [fetchStockAlerts])

  if (loading) {
    return null
  }

  const hasBreach = lowStockItems.length > 0
  const criticalItems = lowStockItems.filter(i => Number(i.quantity) <= 0)
  const isCritical = criticalItems.length > 0
  const primaryItem = isCritical ? criticalItems[0] : lowStockItems[0]

  return (
    <Card className={cn(
      "border shadow-xs overflow-hidden transition-all",
      isCritical 
        ? "border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20"
        : hasBreach
        ? "border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20"
        : "border-border/60 bg-muted/20"
    )}>
      <CardContent className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "p-1.5 rounded-lg shrink-0",
            isCritical
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : hasBreach
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          )}>
            {isCritical ? (
              <ShieldAlert className="h-4 w-4" />
            ) : hasBreach ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            {hasBreach ? (
              <>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase font-bold tracking-wider px-2 py-0",
                    isCritical 
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/30" 
                      : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  )}
                >
                  {isCritical ? "Critical Stockout" : "Low Stock Alert"}
                </Badge>
                <span className="font-bold text-foreground text-xs">
                  {primaryItem.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({primaryItem.quantity} / {primaryItem.min_quantity} {primaryItem.unit || "units"} remaining)
                  {lowStockItems.length > 1 && (
                    <span className="font-semibold text-foreground/80 ml-1">
                      +{lowStockItems.length - 1} other item{lowStockItems.length > 2 ? "s" : ""}
                    </span>
                  )}
                </span>
              </>
            ) : (
              <>
                <Badge variant="outline" className="text-[10px] uppercase font-bold px-2 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  Optimal
                </Badge>
                <span className="font-semibold text-foreground text-xs">
                  Inventory Stock Healthy
                </span>
                <span className="text-muted-foreground text-xs">
                  All active SKUs meet safe operational buffer thresholds.
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            size="sm"
            variant={hasBreach ? (isCritical ? "destructive" : "default") : "outline"}
            className="h-7 text-xs font-semibold px-3 rounded-lg gap-1.5"
            onClick={() => router.push(hasBreach ? "/owner/inventory?tab=forecasts" : "/owner/inventory")}
          >
            <span>{hasBreach ? "Reorder Materials" : "View Inventory"}</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
