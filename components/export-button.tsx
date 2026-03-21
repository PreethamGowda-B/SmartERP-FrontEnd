"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { exportToPDF } from "@/lib/export-utils"
import { toast } from "sonner"
import { logger } from "@/lib/logger"

interface ExportColumn {
  header: string
  dataKey: string
  type?: "text" | "number" | "currency" | "date"
}

interface ExportButtonProps {
  filename: string
  title: string
  subtitle?: string
  columns: ExportColumn[]
  data?: any[] // Optional if onExport is provided
  onExport?: () => Promise<any[]> // Async fetch for full dataset
  onExportStart?: () => void
  onExportEnd?: () => void
}

export function ExportButton({
  filename,
  title,
  subtitle,
  columns,
  data,
  onExport,
  onExportStart,
  onExportEnd
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  
  useEffect(() => {
    logger.log(`[v0] [${title}] ExportButton Mounted`, { filename, isExporting });
  }, [title, filename, isExporting]);

  const handleExport = async () => {
    logger.log(`[v0] [ExportButton] handleExport triggered! state.isExporting: ${isExporting}`);
    if (isExporting) {
      logger.warn("[v0] [ExportButton] Already exporting, skipping click.");
      return;
    }
    setIsExporting(true)
    onExportStart?.()
    
    try {
      // Fetch dynamic data if onExport is provided, otherwise use data prop
      let exportData = data || []
      
      if (onExport) {
        logger.log("[ExportButton] Calling onExport to fetch data...");
        toast.info("Preparing full report data...")
        exportData = await onExport()
        logger.log(`[ExportButton] Data fetched. Count: ${exportData?.length || 0}`);
      }

      if (!exportData || exportData.length === 0) {
        logger.log("[v0] [ExportButton] No data returned from onExport!");
        toast.error("No data available to export")
        setIsExporting(false)
        return
      }

      // Small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 500))

      const options = { filename, title, subtitle, columns, data: exportData }
      
      logger.log("[ExportButton] Triggering PDF generation...");
      exportToPDF(options)
      
      toast.success(`PDF Export completed successfully`)
    } catch (error) {
      logger.error("Export failed:", error)
      toast.error("Something went wrong while exporting. Please try again.")
    } finally {
      setIsExporting(false)
      onExportEnd?.()
    }
  }

  return (
    <Button 
      variant="outline" 
      className="gap-2 shadow-sm border-primary/20 hover:border-primary/50 transition-all font-semibold" 
      disabled={isExporting}
      onClick={() => handleExport()}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <Download className="h-4 w-4 text-primary" />
      )}
      {isExporting ? "Exporting PDF..." : "Export to PDF"}
    </Button>
  )
}

