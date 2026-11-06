import type jsPDF from "jspdf"
import { logger } from "./logger"

// ── Brand constants ────────────────────────────────────────────────────────────
const BRAND = {
  navy:      [15,  40,  80]  as [number, number, number],
  navyLight: [30,  58, 110]  as [number, number, number],
  blue:      [37,  99, 235]  as [number, number, number],
  headerBg:  [241, 245, 249] as [number, number, number],
  zebraBg:   [248, 250, 252] as [number, number, number],
  divider:   [203, 213, 225] as [number, number, number],
  body:      [30,  41,  59]  as [number, number, number],
  muted:     [100, 116, 139] as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  green:     [22,  163, 74]  as [number, number, number],
  orange:    [234, 88,  12]  as [number, number, number],
  red:       [220, 38,  38]  as [number, number, number],
  amber:     [202, 138, 4]   as [number, number, number],
  slate:     [71,  85,  105] as [number, number, number],
}

// ── Column interface ───────────────────────────────────────────────────────────
export interface ExportColumn {
  header: string
  dataKey: string
  type?: "text" | "number" | "currency" | "date" | "datetime" | "time" | "status" | "priority"
}

export interface ExportOptions {
  filename: string
  title: string
  subtitle?: string
  companyName?: string
  logoUrl?: string
  columns: ExportColumn[]
  data: any[]
  /** Optional pre-computed summary key-value pairs shown below the header */
  summary?: { label: string; value: string | number }[]
  /** Name of the user generating the report */
  generatedBy?: string
  /** PDF Page orientation ("portrait" or "landscape"). Defaults to auto-detected based on column count. */
  orientation?: "portrait" | "landscape"
}

// ── Company Branding Helper ──────────────────────────────────────────────────

export function getCompanyBranding(providedName?: string): { name: string; logo_url?: string } {
  const isGeneric = (str?: string) => {
    if (!str || !str.trim()) return true
    const s = str.trim().toLowerCase()
    return s === "business enterprise" || s === "enterprise" || s === "prozync innovations" || s === "smarterp" || s === "company report"
  }

  if (providedName && !isGeneric(providedName)) {
    return { name: providedName.trim() }
  }

  if (typeof window !== "undefined") {
    try {
      const keys = [
        "company_info",
        "smarterp-company-profile",
        "smarterp_company_settings",
        "company_name",
        "smarterp_user",
        "smarterp_admin_user",
        "smarterp_user_company"
      ]

      for (const key of keys) {
        const raw = localStorage.getItem(key)
        if (!raw) continue

        let name = ""
        let logo_url = ""

        if (raw.startsWith("{")) {
          const parsed = JSON.parse(raw)
          name = parsed.legal_name || parsed.company_name || parsed.companyName || parsed.name || parsed.company?.name || ""
          logo_url = parsed.logo_url || ""
        } else {
          name = raw
        }

        if (name && !isGeneric(name)) {
          return { name: name.trim(), logo_url }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return { name: (providedName && !isGeneric(providedName) ? providedName.trim() : "") || "OFFICIAL COMPANY REPORT" }
}

// ── Value Formatter Helpers ───────────────────────────────────────────────────

/** Format a date string as "DD MMM YYYY" */
const fmtDate = (v: string) => {
  if (!v || v === "—") return "—"
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return v
    return d.toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    })
  } catch { return v }
}

/** Format a time or datetime cleanly */
const fmtTime = (v: string) => {
  if (!v || v === "—") return "—"
  try {
    // If it's already HH:MM or similar short time
    if (/^\d{1,2}:\d{2}(:\d{2})?(\s*[AaPp][Mm])?$/.test(v.trim())) {
      return v.trim()
    }
    const d = new Date(v)
    if (isNaN(d.getTime())) return v
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", hour12: true
    })
  } catch { return v }
}

/** Format a date+time string as "DD MMM YYYY, HH:MM" */
const fmtDateTime = (v: string) => {
  if (!v || v === "—") return "—"
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return v
    return d.toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch { return v }
}

/** Format currency with non-breaking space between currency and amount */
const fmtCurrency = (v: any) => {
  const num = Number(v)
  if (isNaN(num)) return "Rs. 0.00"
  return `Rs. ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Normalise a raw cell value for display */
const formatExportValue = (value: any, type?: string): string => {
  if (value === null || value === undefined || value === "") return "—"

  switch (type) {
    case "currency": return fmtCurrency(value)
    case "number":   return Number(value).toLocaleString("en-IN")
    case "date":     return fmtDate(String(value))
    case "time":     return fmtTime(String(value))
    case "datetime": return fmtDateTime(String(value))
    case "status":
    case "priority": {
      const s = String(value).toLowerCase().trim()
      if (!s || s === "null" || s === "undefined" || s === "—") return "—"
      if (s === "in_progress" || s === "inprogress") return "In Progress"
      if (s === "pending_approval") return "Pending Approval"
      if (s === "half_day") return "Half Day"
      if (s === "low stock" || s === "low_stock") return "Low Stock"
      return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")
    }
    default: {
      const str = String(value).trim()
      // If it looks like an ISO date string and type wasn't given, format nicely
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
        return fmtDate(str)
      }
      return str
    }
  }
}

function statusColour(val: string): [number, number, number] {
  const v = (val || "").toLowerCase().trim()
  if (v === "completed" || v === "accepted" || v === "approved" || v === "active" || v === "available" || v === "present")
    return BRAND.green
  if (v === "in_progress" || v === "in progress" || v === "inprogress" || v === "open")
    return BRAND.blue
  if (v === "pending" || v === "low stock" || v === "half_day" || v === "partially_paid")
    return BRAND.amber
  if (v === "cancelled" || v === "declined" || v === "rejected" || v === "inactive" || v === "absent" || v === "disputed")
    return BRAND.red
  return BRAND.body
}

function priorityColour(val: string): [number, number, number] {
  const v = (val || "").toLowerCase().trim()
  if (v === "urgent" || v === "high") return BRAND.red
  if (v === "medium")                  return BRAND.orange
  return BRAND.slate
}

/**
 * Auto-detect optimal orientation:
 * 5 or more columns need Landscape (297mm) to avoid column squashing or truncation.
 * 1-4 columns look best in Portrait (210mm).
 */
function detectOrientation(columns: ExportColumn[], explicit?: "portrait" | "landscape"): "portrait" | "landscape" {
  if (explicit) return explicit
  return columns.length >= 5 ? "landscape" : "portrait"
}

// ── Header & Summary Drawer ───────────────────────────────────────────────────

function drawHeader(
  doc: jsPDF,
  title: string,
  now: string,
  generatedBy?: string,
  companyName?: string,
  _logoUrl?: string
): number {
  const pageW = doc.internal.pageSize.getWidth()
  const branding = getCompanyBranding(companyName)

  // 1. Top brand bar (solid navy)
  doc.setFillColor(...BRAND.navy)
  doc.rect(0, 0, pageW, 26, "F")

  // Company Name
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(...BRAND.white)
  doc.text(branding.name.toUpperCase(), pageW / 2, 10.5, { align: "center" })

  // Subtitle / Tagline
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(203, 213, 225)
  doc.text("SmartERP — Enterprise Solutions", pageW / 2, 17, { align: "center" })
  doc.text("Confidential — For Authorised Personnel Only", pageW / 2, 22.5, { align: "center" })

  // 2. Info sub-band
  doc.setFillColor(...BRAND.headerBg)
  doc.rect(0, 26, pageW, 14, "F")

  // Left: Report Title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9.5)
  doc.setTextColor(...BRAND.navy)
  doc.text(`Report: ${title}`, 14, 35)

  // Right: Date & Generated By
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...BRAND.muted)
  doc.text(`Generated: ${now}`, pageW - 14, 32, { align: "right" })
  if (generatedBy) {
    doc.text(`By: ${generatedBy}`, pageW - 14, 37.5, { align: "right" })
  }

  // Accent divider line
  doc.setDrawColor(...BRAND.blue)
  doc.setLineWidth(0.4)
  doc.line(0, 40, pageW, 40)

  return 45
}

function drawSummary(
  doc: jsPDF,
  summary: { label: string; value: string | number }[],
  startY: number,
  subtitle?: string
): number {
  const pageW = doc.internal.pageSize.getWidth()
  let y = startY

  if (subtitle) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9.5)
    doc.setTextColor(...BRAND.navy)
    doc.text(subtitle, 14, y)
    y += 5.5
  }

  if (summary.length === 0) return y

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...BRAND.muted)
  doc.text("REPORT SUMMARY", 14, y)
  y += 3.5

  doc.setDrawColor(...BRAND.divider)
  doc.setLineWidth(0.2)
  doc.line(14, y, pageW - 14, y)
  y += 3.5

  const cols = summary.length <= 4 ? summary.length : 4
  const cellW = (pageW - 28) / cols
  const cellH = 11
  const padding = 3

  summary.forEach((item, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const x = 14 + col * cellW
    const cy = y + row * (cellH + 2)

    doc.setFillColor(...BRAND.zebraBg)
    doc.roundedRect(x, cy, cellW - 2, cellH, 1, 1, "F")

    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.5)
    doc.setTextColor(...BRAND.muted)
    doc.text(String(item.label).toUpperCase(), x + padding, cy + 3.8)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(...BRAND.navy)
    doc.text(String(item.value), x + padding, cy + 8.8)
  })

  const rows = Math.ceil(summary.length / cols)
  y += rows * (cellH + 2) + 5

  doc.setDrawColor(...BRAND.divider)
  doc.setLineWidth(0.2)
  doc.line(14, y, pageW - 14, y)
  y += 5

  return y
}

function drawFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const footerY = pageH - 7

  doc.setDrawColor(...BRAND.divider)
  doc.setLineWidth(0.2)
  doc.line(14, footerY - 3.5, pageW - 14, footerY - 3.5)

  doc.setFont("helvetica", "italic")
  doc.setFontSize(7)
  doc.setTextColor(...BRAND.muted)

  doc.text("Generated by SmartERP® | Powered by Prozync Innovations | Confidential", 14, footerY)
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageW - 14, footerY, { align: "right" })
}

// ── Public Export Functions ────────────────────────────────────────────────────

export const exportToPDF = async ({
  filename,
  title,
  subtitle,
  companyName,
  logoUrl,
  columns,
  data,
  summary,
  generatedBy,
  orientation,
}: ExportOptions) => {
  logger.log(`[export-utils] Starting PDF Export: ${filename}`, {
    title, columnsCount: columns.length, dataCount: data.length,
  })

  const { default: jsPDFClass } = await import("jspdf")
  const autoTableModule = await import("jspdf-autotable")
  const autoTable = (autoTableModule.default || autoTableModule) as any

  // Auto-detect orientation: 5+ columns => landscape
  const finalOrientation = detectOrientation(columns, orientation)

  const doc = new jsPDFClass({ orientation: finalOrientation, unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()

  const now = fmtDateTime(new Date().toISOString())

  // Draw header and optional summary block
  let contentY = drawHeader(doc, title, now, generatedBy, companyName, logoUrl)
  contentY = drawSummary(doc, summary ?? [], contentY, subtitle)

  // ── Column formatting & alignments ─────────────────────────────────────────
  const colStyles: Record<number, any> = {}

  columns.forEach((col, i) => {
    colStyles[i] = {}

    // 1. Determine cell alignment based on column type
    if (col.type === "number") {
      colStyles[i].halign = "right"
    } else if (col.type === "currency") {
      colStyles[i].halign = "right"
      colStyles[i].fontStyle = "bold"
    } else if (col.type === "date" || col.type === "datetime" || col.type === "time") {
      colStyles[i].halign = "center"
    } else if (col.type === "status" || col.type === "priority") {
      colStyles[i].halign = "center"
      colStyles[i].fontStyle = "bold"
    } else {
      colStyles[i].halign = "left"
    }

    // 2. Minimum column width to ensure header words NEVER split awkwardly
    const headerLen = col.header.length
    const minHeaderWidth = Math.max(16, (headerLen * 2.0) + 6)

    // Currency columns need room for "Rs. 20,00,000.00"
    if (col.type === "currency") {
      colStyles[i].minCellWidth = Math.max(minHeaderWidth, 27)
    } else if (col.type === "date") {
      colStyles[i].minCellWidth = Math.max(minHeaderWidth, 22)
    } else if (col.type === "time") {
      colStyles[i].minCellWidth = Math.max(minHeaderWidth, 18)
    } else if (col.type === "datetime") {
      colStyles[i].minCellWidth = Math.max(minHeaderWidth, 28)
    } else if (col.type === "status" || col.type === "priority") {
      colStyles[i].minCellWidth = Math.max(minHeaderWidth, 22)
    } else {
      colStyles[i].minCellWidth = minHeaderWidth
    }

    // Specific field adjustments
    const h = col.header.toLowerCase()
    if (h.includes("email")) {
      colStyles[i].minCellWidth = Math.max(colStyles[i].minCellWidth, 36)
    } else if (h.includes("description")) {
      colStyles[i].minCellWidth = Math.max(colStyles[i].minCellWidth, 38)
    } else if (h === "item name" || h === "name" || h === "employee name") {
      colStyles[i].minCellWidth = Math.max(colStyles[i].minCellWidth, 30)
    }
  })

  // Main table generation
  autoTable(doc, {
    startY: contentY,
    head: [columns.map((c) => c.header)],
    body: data.map((row) =>
      columns.map((col) => formatExportValue(row[col.dataKey], col.type))
    ),

    headStyles: {
      fillColor: BRAND.navy,
      textColor: BRAND.white,
      fontSize: 8,
      fontStyle: "bold",
      halign: "left",
      cellPadding: { top: 4.5, bottom: 4.5, left: 3.5, right: 3.5 },
    },

    bodyStyles: {
      fontSize: 7.5,
      textColor: BRAND.body,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3.5, right: 3.5 },
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      overflow: "linebreak",
    },

    alternateRowStyles: {
      fillColor: BRAND.zebraBg,
    },

    columnStyles: colStyles,

    // Margins: top margin accommodates continuation page header
    margin: { top: 46, bottom: 15, left: 14, right: 14 },
    tableLineColor: BRAND.divider,
    tableLineWidth: 0.1,
    rowPageBreak: "avoid",

    // Align header cells with their respective body alignment & style statuses
    didParseCell: (hookData: any) => {
      const colIndex = hookData.column.index
      const colStyle = colStyles[colIndex]

      if (hookData.section === "head") {
        if (colStyle?.halign) {
          hookData.cell.styles.halign = colStyle.halign
        }
        return
      }

      if (hookData.section !== "body") return
      const col = columns[colIndex]
      if (!col) return

      const rawVal = hookData.row.raw as string[]
      const cellVal = Array.isArray(rawVal) ? rawVal[colIndex] : ""

      if (col.type === "status") {
        hookData.cell.styles.textColor = statusColour(cellVal)
      } else if (col.type === "priority") {
        hookData.cell.styles.textColor = priorityColour(cellVal)
      }
    },

    // Header redraw on subsequent pages
    didDrawPage: (hookData: any) => {
      if (hookData.pageNumber > 1) {
        drawHeader(doc, title, now, generatedBy, companyName, logoUrl)
      }
    },
  })

  // Multi-pass footer injection for accurate total page count
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg)
    drawFooter(doc, pg, totalPages)
  }

  logger.log("[export-utils] PDF structure completed. Saving file...")
  doc.save(`${filename}.pdf`)
  logger.log("[export-utils] PDF doc.save() called.")
}

// ── Excel export ──────────────────────────────────────────────────────────────

export const exportToExcel = async ({
  filename,
  title,
  columns,
  data,
}: ExportOptions) => {
  logger.log(`[export-utils] Starting Excel Export: ${filename}`, {
    title, columnsCount: columns.length, dataCount: data.length,
  })

  const XLSX = await import("xlsx")

  const worksheetData = data.map((item) => {
    const row: any = {}
    columns.forEach((col) => {
      row[col.header] = formatExportValue(item[col.dataKey], col.type)
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(worksheetData)

  worksheet["!cols"] = columns.map((col) => ({
    wch: Math.max(col.header.length + 4, 18),
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31))

  logger.log("[export-utils] Excel structure completed. Saving file...")
  XLSX.writeFile(workbook, `${filename}.xlsx`)
  logger.log("[export-utils] Excel XLSX.writeFile() called.")
}
