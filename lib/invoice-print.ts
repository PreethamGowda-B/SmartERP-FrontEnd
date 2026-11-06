/**
 * lib/invoice-print.ts
 *
 * Enterprise-grade, premium printable Tax Invoice generator.
 * Produces crisp, professional, A4-compliant invoices with zero clutter.
 * Used across DirectInvoiceModal, InvoiceViewModal, and Customer portals.
 */

export interface InvoicePrintData {
  invoice: {
    id?: string | number
    invoice_number: string
    created_at?: string
    due_date?: string | null
    status?: string
    invoice_type?: string
    total_amount: number | string
    subtotal?: number | string
    discount_amount?: number | string
    total_tax?: number | string
    cgst?: number | string
    sgst?: number | string
    igst?: number | string
    gst_rate?: number
    is_inter_state?: boolean
    amount_paid?: number | string
    amount_due?: number | string
    customer_name?: string
    customer_company?: string
    customer_address?: string
    customer_phone?: string
    customer_email?: string
    customer_gstin?: string
    payment_terms?: string
    payment_method?: string
    transport_charges?: number | string
    customer_notes?: string
  }
  company?: {
    legal_name?: string
    name?: string
    logo_url?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    gstin?: string
    pan?: string
    phone?: string
    email?: string
    contact_email?: string
    website?: string
    bank_name?: string
    account_number?: string
    ifsc_code?: string
    upi_id?: string
    authorized_signatory_name?: string
    stamp_url?: string
    terms_and_conditions?: string
  }
  lineItems: Array<{
    id?: string | number
    description: string
    hsn_code?: string
    item_type?: string
    quantity: number | string
    unit_price: number | string
    total_amount?: number | string
  }>
}

let activePrintIframe: HTMLIFrameElement | null = null

export function printInvoiceDocument(data: InvoicePrintData) {
  if (typeof window === "undefined" || !data?.invoice) return

  const { invoice, lineItems = [] } = data
  const company = data.company || {}

  const fmtD = (s?: string | null) => {
    if (!s) return "On Receipt"
    try {
      const d = new Date(s)
      if (isNaN(d.getTime())) return s
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    } catch {
      return s
    }
  }

  const fmtAmt = (v: any) =>
    Number(v || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const companyName = company.legal_name || company.name || "BUSINESS ENTERPRISE"
  const companyAddr = [company.address, company.city, company.state, company.pincode].filter(Boolean).join(", ")

  const status = String(invoice.status || "issued").toLowerCase()
  const statusColor =
    status === "paid" ? "#15803d" : status === "partially_paid" ? "#d97706" : status === "disputed" ? "#dc2626" : "#1d4ed8"
  const statusBg =
    status === "paid" ? "#dcfce7" : status === "partially_paid" ? "#fef3c7" : status === "disputed" ? "#fee2e2" : "#dbeafe"
  const statusLabel = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const upiQrUrl = company.upi_id
    ? `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
        `upi://pay?pa=${company.upi_id}&pn=${companyName}&am=${invoice.total_amount}&cu=INR`
      )}`
    : null

  const itemsRows = lineItems
    .map((item, idx) => {
      const lineTotal = Number(item.total_amount ?? Number(item.quantity || 0) * Number(item.unit_price || 0))
      return `
      <tr class="${idx % 2 === 0 ? "row-even" : "row-odd"}">
        <td class="tc num">${idx + 1}</td>
        <td class="tl desc">
          <span class="item-name">${item.description || "Service Scope / Item"}</span>
          <span class="item-meta">HSN/SAC: ${item.hsn_code || "998311"} ${item.item_type ? `· ${String(item.item_type).toUpperCase()}` : ""}</span>
        </td>
        <td class="tc num font-semibold">${Number(item.quantity || 1).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
        <td class="tr num">₹${fmtAmt(item.unit_price)}</td>
        <td class="tr num bold text-dark">₹${fmtAmt(lineTotal)}</td>
      </tr>
    `
    })
    .join("")

  const taxRate = Number(invoice.gst_rate || 18)
  const taxRows = invoice.is_inter_state
    ? `<tr><td class="tl lbl">Integrated GST (IGST ${taxRate}%)</td><td class="tr val">₹${fmtAmt(invoice.igst || invoice.total_tax)}</td></tr>`
    : `<tr><td class="tl lbl">Central GST (CGST ${taxRate / 2}%)</td><td class="tr val">₹${fmtAmt(invoice.cgst || Number(invoice.total_tax || 0) / 2)}</td></tr>
       <tr><td class="tl lbl">State GST (SGST ${taxRate / 2}%)</td><td class="tr val">₹${fmtAmt(invoice.sgst || Number(invoice.total_tax || 0) / 2)}</td></tr>`

  const discountRow =
    Number(invoice.discount_amount || 0) > 0
      ? `<tr><td class="tl lbl text-green">Special Discount</td><td class="tr val text-green">−₹${fmtAmt(invoice.discount_amount)}</td></tr>`
      : ""

  const transportRow =
    Number(invoice.transport_charges || 0) > 0
      ? `<tr><td class="tl lbl">Transportation & Handling</td><td class="tr val">₹${fmtAmt(invoice.transport_charges)}</td></tr>`
      : ""

  const bankSection = company.bank_name
    ? `
    <div class="card-box">
      <div class="box-title">Bank Transfer Details</div>
      <div class="bank-row"><span>Bank Name</span><strong>${company.bank_name}</strong></div>
      ${company.account_number ? `<div class="bank-row"><span>Account No</span><strong class="mono">${company.account_number}</strong></div>` : ""}
      ${company.ifsc_code ? `<div class="bank-row"><span>IFSC Code</span><strong class="mono">${company.ifsc_code}</strong></div>` : ""}
      ${company.upi_id ? `<div class="bank-row"><span>UPI ID</span><strong class="mono">${company.upi_id}</strong></div>` : ""}
    </div>
  `
    : ""

  const qrSection = upiQrUrl
    ? `
    <div class="card-box qr-center">
      <div class="box-title">Instant UPI Settlement</div>
      <img src="${upiQrUrl}" alt="UPI QR" width="96" height="96" style="display:inline-block;border-radius:6px;border:1px solid #cbd5e1;padding:3px;background:#fff;" />
      <div class="qr-label">${company.upi_id}</div>
    </div>
  `
    : ""

  const printHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>TAX INVOICE — ${invoice.invoice_number}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.45;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Container */
    .invoice-container {
      max-width: 820px;
      margin: 0 auto;
    }

    /* Top branding banner */
    .header-banner {
      background: linear-gradient(135deg, #0f2850 0%, #1e3a8a 100%);
      color: #ffffff;
      padding: 18px 22px 14px;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #3b82f6;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .brand-meta {
      font-size: 10px;
      color: #cbd5e1;
      margin-top: 3px;
    }
    .brand-contact {
      font-size: 9.5px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
    }
    .invoice-title {
      font-size: 20px;
      font-weight: 900;
      color: #93c5fd;
      letter-spacing: 1.2px;
    }
    .invoice-no {
      font-size: 14px;
      font-weight: 800;
      font-family: "Courier New", monospace;
      color: #ffffff;
      margin-top: 3px;
    }
    .invoice-dates {
      font-size: 9.5px;
      color: #cbd5e1;
      margin-top: 3px;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 9999px;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-top: 6px;
      background: ${statusBg};
      color: ${statusColor};
      border: 1px solid ${statusColor};
    }

    /* Parties Section */
    .parties-grid {
      display: flex;
      border-left: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      background: #ffffff;
    }
    .party-col {
      flex: 1;
      padding: 14px 18px;
    }
    .party-col + .party-col {
      border-left: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .section-label {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #2563eb;
      margin-bottom: 4px;
    }
    .party-name {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .party-detail {
      font-size: 10px;
      color: #475569;
      margin-top: 2px;
    }
    .gstin-tag {
      display: inline-block;
      margin-top: 4px;
      font-size: 10px;
      font-weight: 700;
      font-family: monospace;
      color: #1e40af;
      background: #eff6ff;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid #bfdbfe;
    }

    /* Line items table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .items-table thead tr {
      background: #0f2850;
      color: #ffffff;
    }
    .items-table th {
      padding: 9px 10px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .items-table td {
      padding: 9px 10px;
      font-size: 10.5px;
      vertical-align: middle;
      border-bottom: 1px solid #f1f5f9;
    }
    .row-even { background: #ffffff; }
    .row-odd  { background: #f8fafc; }
    .item-name {
      font-weight: 700;
      color: #0f172a;
      display: block;
      font-size: 11px;
    }
    .item-meta {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
      display: block;
      font-family: monospace;
    }
    .tl { text-align: left; }
    .tc { text-align: center; }
    .tr { text-align: right; }
    .num { font-family: "Courier New", monospace; }
    .bold { font-weight: 700; }
    .text-dark { color: #0f172a; }
    .desc { width: 44%; }

    /* Bottom summary grid */
    .bottom-layout {
      display: flex;
      gap: 14px;
      margin-top: 14px;
      align-items: flex-start;
    }
    .payment-area {
      flex: 1;
      display: flex;
      gap: 10px;
    }
    .totals-area {
      width: 280px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
    }

    .card-box {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .qr-center {
      width: 130px;
      flex: 0 0 130px;
      text-align: center;
    }
    .box-title {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #475569;
      margin-bottom: 6px;
    }
    .bank-row {
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #475569;
      padding: 2.5px 0;
    }
    .bank-row strong {
      color: #0f172a;
    }
    .qr-label {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 4px;
      font-family: monospace;
      word-break: break-all;
    }
    .mono { font-family: monospace; }

    /* Totals table */
    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 3.5px 2px;
      font-size: 10.5px;
    }
    .lbl { color: #64748b; }
    .val { font-weight: 600; color: #0f172a; font-family: "Courier New", monospace; }
    .text-green { color: #16a34a !important; font-weight: 700; }
    .text-red { color: #dc2626 !important; font-weight: 800; font-size: 12px; }

    .grand-total-row td {
      border-top: 2px solid #0f2850;
      border-bottom: 1px solid #cbd5e1;
      padding: 7px 2px;
      font-size: 14px;
      font-weight: 900;
    }
    .grand-total-val {
      color: #1d4ed8;
      font-family: "Courier New", monospace;
      font-size: 16px;
      font-weight: 900;
    }

    /* Notes section */
    .notes-box {
      margin-top: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #f8fafc;
      padding: 10px 14px;
      font-size: 9.5px;
      color: #475569;
    }
    .notes-heading {
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3px;
    }

    /* Footer & Signatory */
    .footer-section {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 8.5px;
      color: #94a3b8;
    }
    .signatory-box {
      text-align: right;
    }
    .signatory-line {
      border-top: 1px solid #0f172a;
      width: 170px;
      margin-left: auto;
      margin-top: 24px;
      padding-top: 4px;
      font-size: 9.5px;
      font-weight: 700;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="invoice-container">

    <!-- Top Banner Header -->
    <div class="header-banner">
      <div>
        <div class="brand-title">${companyName}</div>
        ${company.gstin ? `<div class="brand-meta">GSTIN: <span class="mono">${company.gstin}</span> ${company.pan ? `· PAN: <span class="mono">${company.pan}</span>` : ""}</div>` : ""}
        ${companyAddr ? `<div class="brand-contact">${companyAddr}</div>` : ""}
        <div class="brand-contact">
          ${company.phone ? `Phone: ${company.phone}` : ""}
          ${company.phone && (company.email || company.contact_email) ? " · " : ""}
          ${company.email || company.contact_email ? `Email: ${company.email || company.contact_email}` : ""}
        </div>
      </div>
      <div class="header-right">
        <div class="invoice-title">TAX INVOICE</div>
        <div class="invoice-no">${invoice.invoice_number}</div>
        <div class="invoice-dates">Date: ${fmtD(invoice.created_at)} | Due: ${fmtD(invoice.due_date)}</div>
        <div><span class="status-badge">${statusLabel}</span></div>
      </div>
    </div>

    <!-- Parties Details -->
    <div class="parties-grid">
      <div class="party-col">
        <div class="section-label">Billed To (Client / Customer)</div>
        <div class="party-name">${invoice.customer_name || "Walk-in Counter Client"}</div>
        ${invoice.customer_company ? `<div class="party-detail"><strong>Company:</strong> ${invoice.customer_company}</div>` : ""}
        ${invoice.customer_address ? `<div class="party-detail">${invoice.customer_address}</div>` : ""}
        ${invoice.customer_phone ? `<div class="party-detail">Phone: ${invoice.customer_phone}</div>` : ""}
        ${invoice.customer_email ? `<div class="party-detail">Email: ${invoice.customer_email}</div>` : ""}
        ${invoice.customer_gstin ? `<div><span class="gstin-tag">GSTIN: ${invoice.customer_gstin}</span></div>` : ""}
      </div>
      <div class="party-col">
        <div class="section-label">Billing & Terms Information</div>
        <div class="party-detail"><strong>Invoice Number:</strong> <span class="mono">${invoice.invoice_number}</span></div>
        <div class="party-detail"><strong>Invoice Date:</strong> ${fmtD(invoice.created_at)}</div>
        <div class="party-detail"><strong>Payment Due:</strong> ${fmtD(invoice.due_date)}</div>
        <div class="party-detail"><strong>Terms:</strong> ${invoice.payment_terms || "Due on Receipt"}</div>
        ${invoice.payment_method ? `<div class="party-detail"><strong>Payment Method:</strong> ${String(invoice.payment_method).toUpperCase()}</div>` : ""}
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="tc" style="width: 36px;">#</th>
          <th class="tl desc">Item / Service Description</th>
          <th class="tc" style="width: 50px;">Qty</th>
          <th class="tr" style="width: 105px;">Unit Rate</th>
          <th class="tr" style="width: 115px;">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Bottom Layout: Payment & Totals -->
    <div class="bottom-layout">
      <div class="payment-area">
        ${bankSection}
        ${qrSection}
      </div>

      <div class="totals-area">
        <table class="totals-table">
          <tr>
            <td class="tl lbl">Subtotal</td>
            <td class="tr val">₹${fmtAmt(invoice.subtotal ?? invoice.total_amount)}</td>
          </tr>
          ${discountRow}
          ${transportRow}
          ${taxRows}
          <tr class="grand-total-row">
            <td class="tl bold" style="color: #0f172a;">Grand Total</td>
            <td class="tr grand-total-val">₹${fmtAmt(invoice.total_amount)}</td>
          </tr>
          <tr>
            <td class="tl text-green">Amount Paid</td>
            <td class="tr text-green">₹${fmtAmt(invoice.amount_paid)}</td>
          </tr>
          <tr>
            <td class="tl text-red">Balance Due</td>
            <td class="tr text-red">₹${fmtAmt(invoice.amount_due)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Notes & Terms -->
    ${
      invoice.customer_notes || company.terms_and_conditions
        ? `
    <div class="notes-box">
      ${invoice.customer_notes ? `<div class="notes-heading">Customer Notes / Work Summary</div><div>${invoice.customer_notes}</div>` : ""}
      ${
        company.terms_and_conditions
          ? `<div class="notes-heading" style="margin-top: 6px;">Terms & Conditions</div><div>${company.terms_and_conditions}</div>`
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- Footer & Signatory -->
    <div class="footer-section">
      <div>
        <div>This is a computer-generated tax invoice verified under GST compliance.</div>
        <div>Generated by SmartERP® — Powered by Prozync Innovations</div>
      </div>
      <div class="signatory-box">
        <div class="signatory-line">
          ${company.authorized_signatory_name ? `For ${company.authorized_signatory_name}` : `For ${companyName}`}
        </div>
        <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Authorised Signatory</div>
      </div>
    </div>

  </div>
</body>
</html>`

  // Print using invisible iframe
  let iframe = activePrintIframe
  if (!iframe || !document.body.contains(iframe)) {
    iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "none"
    iframe.style.visibility = "hidden"
    document.body.appendChild(iframe)
    activePrintIframe = iframe
  }

  const doc = iframe.contentWindow?.document
  if (doc) {
    doc.open()
    doc.write(printHtml)
    doc.close()
    setTimeout(() => {
      try {
        iframe?.contentWindow?.focus()
        iframe?.contentWindow?.print()
      } catch (err) {
        console.error("[invoice-print] Print failed:", err)
      }
    }, 400)
  }
}
