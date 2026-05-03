import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { logger } from "./logger"

// ── Brand constants ────────────────────────────────────────────────────────────
const BRAND = {
  // Deep navy - main brand colour
  navy:     [15,  40,  80]  as [number, number, number],
  // Lighter accent blue for header bg
  blue:     [37,  99, 235]  as [number, number, number],
  // Table header bg (subtle slate)
  headerBg: [241, 245, 249] as [number, number, number],
  // Alt row zebra
  zebraBg:  [248, 250, 252] as [number, number, number],
  // Separator line colour
  divider:  [203, 213, 225] as [number, number, number],
  // Body text
  body:     [30,  41,  59]  as [number, number, number],
  // Muted text
  muted:    [100, 116, 139] as [number, number, number],
  // White
  white:    [255, 255, 255] as [number, number, number],
  // Status colours (text)
  green:    [22,  163, 74]  as [number, number, number],
  orange:   [234, 88,  12]  as [number, number, number],
  red:      [220, 38,  38]  as [number, number, number],
  amber:    [202, 138, 4]   as [number, number, number],
  slate:    [71,  85,  105] as [number, number, number],
}

// ── Column interface ───────────────────────────────────────────────────────────
export interface ExportColumn {
  header: string
  dataKey: string
  type?: "text" | "number" | "currency" | "date" | "status" | "priority"
}

// ── Options interface ──────────────────────────────────────────────────────────
export interface ExportOptions {
  filename: string
  title: string
  subtitle?: string
  columns: ExportColumn[]
  data: any[]
  /** Optional pre-computed summary key-value pairs shown below the header */
  summary?: { label: string; value: string | number }[]
  /** Name of the user generating the report */
  generatedBy?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Format a date string as "DD MMM YYYY" */
const fmtDate = (v: string) => {
  try {
    return new Date(v).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    })
  } catch { return v }
}

/** Format a date+time string as "DD MMM YYYY, HH:MM" */
const fmtDateTime = (v: string) => {
  try {
    return new Date(v).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch { return v }
}

/** Format currency as ₹1,23,456.00 */
const fmtCurrency = (v: any) =>
  `\u20B9${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

/** Normalise a raw cell value for display */
const formatExportValue = (value: any, type?: string): string => {
  if (value === null || value === undefined || value === "") return "—"

  switch (type) {
    case "currency": return fmtCurrency(value)
    case "number":   return Number(value).toLocaleString("en-IN")
    case "date":     return fmtDate(String(value))
    // status / priority rendered as plain text with readable formatting
    case "status":
    case "priority": {
      const s = String(value).toLowerCase()
      if (!s || s === "null" || s === "undefined") return "—"
      if (s === "in_progress" || s === "inprogress") return "In Progress"
      if (s === "pending_approval") return "Pending Approval"
      return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")
    }
    default:
      return String(value)
  }
}

/**
 * Map a status string to a [r,g,b] colour for PDF cell text.
 */
function statusColour(val: string): [number, number, number] {
  const v = (val || "").toLowerCase()
  if (v === "completed" || v === "accepted" || v === "approved" || v === "active")
    return BRAND.green
  if (v === "in_progress" || v === "in progress" || v === "inprogress")
    return BRAND.blue
  if (v === "pending" || v === "open")
    return BRAND.amber
  if (v === "cancelled" || v === "declined" || v === "rejected" || v === "inactive")
    return BRAND.red
  return BRAND.body
}

/**
 * Map a priority string to a [r,g,b] colour for PDF cell text.
 */
function priorityColour(val: string): [number, number, number] {
  const v = (val || "").toLowerCase()
  if (v === "urgent" || v === "high") return BRAND.red
  if (v === "medium")                  return BRAND.orange
  return BRAND.slate
}

// ── PDF generation ─────────────────────────────────────────────────────────────

/**
 * Draws the premium enterprise header on the current page.
 * Returns the Y position immediately after the header.
 */
function drawHeader(doc: jsPDF, title: string, now: string, generatedBy?: string): number {
  const pageW = doc.internal.pageSize.getWidth()

  // ── Solid navy top bar ────────────────────────────────────────────────────
  doc.setFillColor(...BRAND.navy)
  doc.rect(0, 0, pageW, 28, "F")

  // Company name — large, white, centre
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(...BRAND.white)
  doc.text("PROZYNC INNOVATIONS", pageW / 2, 12, { align: "center" })

  // Tagline — smaller, lighter
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(203, 213, 225)
  doc.text("SmartERP — Enterprise Solutions", pageW / 2, 19, { align: "center" })
  doc.text("Confidential — For Authorised Personnel Only", pageW / 2, 24.5, { align: "center" })

  // ── Light grey info band ──────────────────────────────────────────────────
  doc.setFillColor(...BRAND.headerBg)
  doc.rect(0, 28, pageW, 16, "F")

  // Left: report name
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...BRAND.navy)
  doc.text(`Report: ${title}`, 14, 37)

  // Right: timestamp + author
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...BRAND.muted)
  doc.text(`Generated: ${now}`, pageW - 14, 33, { align: "right" })
  if (generatedBy) {
    doc.text(`By: ${generatedBy}`, pageW - 14, 39, { align: "right" })
  }

  // ── Thin navy accent line under info band ─────────────────────────────────
  doc.setDrawColor(...BRAND.navy)
  doc.setLineWidth(0.4)
  doc.line(0, 44, pageW, 44)

  return 48
}

/**
 * Draws a summary block — small 2-column grid of key/value pairs.
 * Returns the Y position immediately after the block.
 */
function drawSummary(
  doc: jsPDF,
  summary: { label: string; value: string | number }[],
  startY: number,
  subtitle?: string
): number {
  const pageW = doc.internal.pageSize.getWidth()
  let y = startY

  // Optional subtitle / context line
  if (subtitle) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(...BRAND.navy)
    doc.text(subtitle, 14, y)
    y += 6
  }

  if (summary.length === 0) return y

  // Section label
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(...BRAND.muted)
  doc.text("REPORT SUMMARY", 14, y)
  y += 4

  // Thin divider
  doc.setDrawColor(...BRAND.divider)
  doc.setLineWidth(0.2)
  doc.line(14, y, pageW - 14, y)
  y += 4

  // Render as inline pills — 4 per row
  const cellW   = (pageW - 28) / 4
  const cellH   = 12
  const cols    = 4
  const padding = 3

  summary.forEach((item, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const x   = 14 + col * cellW
    const cy  = y + row * (cellH + 2)

    // Pill background
    doc.setFillColor(...BRAND.zebraBg)
    doc.roundedRect(x, cy, cellW - 2, cellH, 1, 1, "F")

    // Label
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.muted)
    doc.text(item.label.toUpperCase(), x + padding, cy + 4)

    // Value
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(...BRAND.navy)
    doc.text(String(item.value), x + padding, cy + 9.5)
  })

  const rows = Math.ceil(summary.length / cols)
  y += rows * (cellH + 2) + 6 // Added extra spacing after summary

  // Bottom separator
  doc.setDrawColor(...BRAND.divider)
  doc.setLineWidth(0.2)
  doc.line(14, y, pageW - 14, y)
  y += 6

  return y
}

/**
 * Draws the per-page footer with "Page X of Y" and branding.
 */
function drawFooter(doc: jsPDF, pageNumber: number, totalPages?: number): void {
  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const footerY = pageH - 8

  // Footer separator
  doc.setDrawColor(...BRAND.divider)
  doc.setLineWidth(0.2)
  doc.line(14, footerY - 4, pageW - 14, footerY - 4)

  doc.setFont("helvetica", "italic")
  doc.setFontSize(7.5)
  doc.setTextColor(...BRAND.muted)

  // Left: branding
  doc.text("Generated by SmartERP  |  Prozync Innovations  |  Confidential", 14, footerY)

  // Right: page number
  const pageStr = totalPages
    ? `Page ${pageNumber} of ${totalPages}`
    : `Page ${pageNumber}`
  doc.text(pageStr, pageW - 14, footerY, { align: "right" })
}

// ── Public export function ─────────────────────────────────────────────────────

/**
 * Generate and download a premium enterprise PDF report.
 * Signature is fully backward-compatible — subtitle is the only new optional field
 * that callers may also not pass.
 */
export const exportToPDF = ({
  filename,
  title,
  subtitle,
  columns,
  data,
  summary,
  generatedBy,
}: ExportOptions) => {
  logger.log(`[export-utils] Starting PDF Export: ${filename}`, {
    title, columnsCount: columns.length, dataCount: data.length,
  })

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()

  const now = fmtDateTime(new Date().toISOString())

  // ── First-page header ─────────────────────────────────────────────────────
  let contentY = drawHeader(doc, title, now, generatedBy)

  // ── Build auto summary if caller didn't pass one ──────────────────────────
  const effectiveSummary: { label: string; value: string | number }[] = summary ?? []

  // ── Summary block ─────────────────────────────────────────────────────────
  contentY = drawSummary(doc, effectiveSummary, contentY, subtitle)

  // ── Determine column alignments & colour hooks ────────────────────────────
  const colStyles: Record<number, any> = {}
  columns.forEach((col, i) => {
    colStyles[i] = {}
    
    if (col.type === "number" || col.type === "currency") {
      colStyles[i].halign = "right"
    } else if (col.type === "status" || col.type === "priority") {
      colStyles[i].halign = "left"
      colStyles[i].fontStyle = "bold"
      colStyles[i].cellWidth = 18 // small
    }
    
    // Auto column widths based on headers for Jobs Report rules
    const headerStr = col.header.toLowerCase()
    if (headerStr.includes("title")) {
      colStyles[i].minCellWidth = 40 // wide (30-35%)
    } else if (headerStr === "status" || headerStr === "priority" || headerStr === "progress") {
      // no forced small width, let it auto-size to prevent wrapping
    } else if (headerStr.includes("assigned to") || headerStr.includes("client") || headerStr.includes("location") || headerStr.includes("employee")) {
      colStyles[i].minCellWidth = 20 // medium
    } else if (headerStr.includes("date") || headerStr.includes("created")) {
      colStyles[i].minCellWidth = 16 // compact
    }
  })

  // ── Main table ────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: contentY,
    head: [columns.map(c => c.header)],
    body: data.map(row =>
      columns.map(col => formatExportValue(row[col.dataKey], col.type))
    ),

    // ── Head styles ──────────────────────────────────────────────────────────
    headStyles: {
      fillColor: BRAND.headerBg, // slight background color
      textColor: BRAND.navy,
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "left",
      cellPadding: { top: 6, bottom: 6, left: 4, right: 4 }, // proper padding
    },

    // ── Body styles ──────────────────────────────────────────────────────────
    bodyStyles: {
      fontSize: 8,
      textColor: BRAND.body,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 }, // Increase row height/padding
      lineColor: BRAND.divider,
      lineWidth: 0.1,
    },

    // ── Alternating row colour ───────────────────────────────────────────────
    alternateRowStyles: {
      fillColor: BRAND.zebraBg,
    },

    columnStyles: colStyles,
    margin: { left: 14, right: 14 },
    tableLineColor: BRAND.divider,
    tableLineWidth: 0.1,

    // ── Per-cell colour overrides for status / priority and header widths ────
    didParseCell: (hookData) => {
      // Prevent header text wrapping by enforcing a minimum width based on char count
      if (hookData.section === "head") {
        const textLen = hookData.cell.text[0]?.length || 10
        hookData.cell.styles.minCellWidth = textLen * 1.6 + 8
        return
      }

      if (hookData.section !== "body") return
      const colIndex = hookData.column.index
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

    // ── Per-page header + footer ─────────────────────────────────────────────
    didDrawPage: (hookData) => {
      // Draw header on pages after the first
      if (hookData.pageNumber > 1) {
        drawHeader(doc, title, now, generatedBy)
      }
      // Draw footer on every page
      drawFooter(doc, hookData.pageNumber)
    },
  })

  logger.log("[export-utils] PDF structure completed. Saving file...")
  doc.save(`${filename}.pdf`)
  logger.log("[export-utils] PDF doc.save() called.")
}

// ── Excel export (unchanged logic, cleaner column widths) ─────────────────────

/**
 * Generate and download an Excel spreadsheet.
 * No changes to logic — only column width improvements.
 */
export const exportToExcel = ({
  filename,
  title,
  columns,
  data,
}: ExportOptions) => {
  logger.log(`[export-utils] Starting Excel Export: ${filename}`, {
    title, columnsCount: columns.length, dataCount: data.length,
  })

  const worksheetData = data.map(item => {
    const row: any = {}
    columns.forEach(col => {
      row[col.header] = formatExportValue(item[col.dataKey], col.type)
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(worksheetData)

  // Wider column widths
  worksheet["!cols"] = columns.map(col => ({
    wch: Math.max(col.header.length + 4, 18),
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31))

  logger.log("[export-utils] Excel structure completed. Saving file...")
  XLSX.writeFile(workbook, `${filename}.xlsx`)
  logger.log("[export-utils] Excel XLSX.writeFile() called.")
}
