import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

interface ExportColumn {
  header: string
  dataKey: string
}

interface ExportOptions {
  filename: string
  title: string
  subtitle?: string
  columns: ExportColumn[]
  data: any[]
}

/**
 * Generate and download a PDF report
 */
export const exportToPDF = ({ filename, title, subtitle, columns, data }: ExportOptions) => {
  const doc = new jsPDF()
  const now = new Date().toLocaleString()

  // Company Header
  doc.setFontSize(22)
  doc.setTextColor(0, 102, 204) // Professional Blue
  doc.setFont("helvetica", "bold")
  doc.text("SmartERP / Prozync", 105, 20, { align: "center" })

  // Module Title
  doc.setFontSize(16)
  doc.setTextColor(50, 50, 50)
  doc.text(title, 105, 30, { align: "center" })

  if (subtitle) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(subtitle, 105, 38, { align: "center" })
  }

  // Export Date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Exported on: ${now}`, 190, 45, { align: "right" })

  // Horizontal separator
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 48, 190, 48)

  // Table
  autoTable(doc, {
    startY: 55,
    head: [columns.map(col => col.header)],
    body: data.map(item => columns.map(col => {
      const val = item[col.dataKey]
      return val === null || val === undefined ? "" : val.toString()
    })),
    headStyles: {
      fillColor: [0, 102, 204],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      halign: "left"
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 55 },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} - SmartERP Confidential`,
        105,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      )
    }
  })

  doc.save(`${filename}.pdf`)
}

/**
 * Generate and download an Excel spreadsheet
 */
export const exportToExcel = ({ filename, columns, data }: ExportOptions) => {
  // Map data to match headers
  const worksheetData = data.map(item => {
    const row: any = {}
    columns.forEach(col => {
      row[col.header] = item[col.dataKey]
    })
    return row
  })

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  
  // Set column widths
  const wscols = columns.map(() => ({ wch: 20 }))
  worksheet["!cols"] = wscols

  // Create workbook and append sheet
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report")

  // Generate and download
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
