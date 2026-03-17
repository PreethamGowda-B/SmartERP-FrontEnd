"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, Loader2, ChevronDown } from "lucide-react"
import { exportToPDF, exportToExcel } from "@/lib/export-utils"
import { toast } from "sonner"

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
    console.log(`[v0] [${title}] ExportButton Mounted`, { filename, isExporting });
  }, [title, filename, isExporting]);

  const onOpenChange = (open: boolean) => {
    console.log(`[v0] [${title}] DropdownMenu onOpenChange: ${open}`);
  };

  const handleExport = async (type: "pdf" | "excel") => {
    console.log(`[v0] [ExportButton] handleExport triggered! Type: ${type}, state.isExporting: ${isExporting}`);
    if (isExporting) {
      console.warn("[v0] [ExportButton] Already exporting, skipping click.");
      return;
    }
    setIsExporting(true)
    onExportStart?.()
    
    try {
      // Fetch dynamic data if onExport is provided, otherwise use data prop
      let exportData = data || []
      
      if (onExport) {
        console.log("[ExportButton] Calling onExport to fetch data...");
        toast.info("Preparing full report data...")
        exportData = await onExport()
        console.log(`[ExportButton] Data fetched. Count: ${exportData?.length || 0}`);
      }

      if (!exportData || exportData.length === 0) {
        console.error("[v0] [ExportButton] No data returned from onExport!");
        toast.error("No data available to export")
        setIsExporting(false)
        return
      }

      // Small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 500))

      const options = { filename, title, subtitle, columns, data: exportData }
      
      if (type === "pdf") {
        console.log("[ExportButton] Triggering PDF generation...");
        exportToPDF(options)
      } else {
        console.log("[ExportButton] Triggering Excel generation...");
        exportToExcel(options)
      }
      
      toast.success(`${type.toUpperCase()} Export completed successfully`)
    } catch (error) {
      console.error("Export failed:", error)
      toast.error("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
      onExportEnd?.()
    }
  }

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 shadow-sm border-primary/20 hover:border-primary/50 transition-all font-semibold" 
          disabled={isExporting}
          onClick={(e) => {
            console.log(`[v0] [${title}] Button onClick`);
          }}
          onPointerDown={(e) => {
            console.log(`[v0] [${title}] Button onPointerDown - Position: ${e.clientX}, ${e.clientY}`);
          }}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Download className="h-4 w-4 text-primary" />
          )}
          {isExporting ? "Exporting..." : "Export"}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[190px] p-2">
        <DropdownMenuItem 
          onSelect={() => {
            console.log(`[v0] [${title}] PDF onSelect`);
            handleExport("pdf");
          }} 
          onClick={(e) => {
            console.log(`[v0] [${title}] PDF onClick`);
            handleExport("pdf");
          }}
          onPointerDown={(e) => {
            console.log(`[v0] [${title}] PDF onPointerDown`);
          }}
          className="gap-3 cursor-pointer py-2 px-3 rounded-md hover:bg-red-50 focus:bg-red-50 transition-colors"
        >
          <div className="bg-red-100 p-1.5 rounded-md">
            <FileText className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">Export as PDF</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Report Format</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onSelect={() => {
            console.log(`[v0] [${title}] Excel onSelect`);
            handleExport("excel");
          }} 
          onClick={(e) => {
            console.log(`[v0] [${title}] Excel onClick`);
            handleExport("excel");
          }}
          onPointerDown={(e) => {
            console.log(`[v0] [${title}] Excel onPointerDown`);
          }}
          className="gap-3 cursor-pointer mt-1 py-2 px-3 rounded-md hover:bg-green-50 focus:bg-green-50 transition-colors"
        >
          <div className="bg-green-100 p-1.5 rounded-md">
            <FileSpreadsheet className="h-4 w-4 text-green-700" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">Export as Excel</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Data Sheet</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
      {/* TEMPORARY DEBUG BUTTONS */}
      <div className="hidden">
        <button onClick={() => handleExport("pdf")} id="debug-pdf">PDF</button>
        <button onClick={() => handleExport("excel")} id="debug-excel">Excel</button>
      </div>
    </DropdownMenu>
  )
}
