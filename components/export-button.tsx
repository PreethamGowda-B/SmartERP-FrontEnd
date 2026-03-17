"use client"

import { useState } from "react"
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
}

interface ExportButtonProps {
  filename: string
  title: string
  subtitle?: string
  columns: ExportColumn[]
  data: any[]
  onExportStart?: () => void
  onExportEnd?: () => void
}

export function ExportButton({
  filename,
  title,
  subtitle,
  columns,
  data,
  onExportStart,
  onExportEnd
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: "pdf" | "excel") => {
    if (data.length === 0) {
      toast.error("No data available to export")
      return
    }

    setIsExporting(true)
    onExportStart?.()
    
    // Small delay to show loader and prevent UI freeze
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const options = { filename, title, subtitle, columns, data }
      
      if (type === "pdf") {
        exportToPDF(options)
      } else {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-red-500" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
