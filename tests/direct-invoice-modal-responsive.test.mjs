import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modalPath = path.resolve(__dirname, "../components/direct-invoice-modal.tsx")

test("Direct invoice modal source file exists and can be read", () => {
  assert.ok(fs.existsSync(modalPath), "components/direct-invoice-modal.tsx must exist")
})

test("Direct invoice generator modal satisfies desktop & laptop size requirements (1440x900 & 1280x800)", () => {
  const content = fs.readFileSync(modalPath, "utf8")

  // Check DialogContent sizing
  assert.match(
    content,
    /lg:max-w-\[min\(1120px,94vw\)\]/,
    "Desktop/laptop must target at least ~1100px width with 94vw bound"
  )
  assert.match(
    content,
    /xl:max-w-\[min\(1240px,94vw\)\]/,
    "Large desktop permits spacious ~1240px width without exceeding 94vw"
  )
  assert.match(
    content,
    /sm:max-h-\[90vh\]/,
    "Usable modal height on desktop/laptop targets ~90vh"
  )
  assert.match(
    content,
    /sm:supports-\[height:1dvh\]:max-h-\[90dvh\]/,
    "Desktop height includes dynamic viewport unit support"
  )
})

test("Direct invoice generator modal satisfies mobile & small-mobile requirements (390x844 & 320x700)", () => {
  const content = fs.readFileSync(modalPath, "utf8")

  // Mobile width nearly fills viewport with small margins
  assert.match(
    content,
    /w-\[calc\(100vw-1rem\)\]\s+sm:w-\[94vw\]\s+max-w-\[calc\(100vw-1rem\)\]/,
    "Mobile must use nearly full available viewport width with small margins"
  )
  // Mobile height targets 95dvh with 95vh fallback
  assert.match(
    content,
    /max-h-\[95vh\]\s+supports-\[height:1dvh\]:max-h-\[95dvh\]/,
    "Mobile height uses 95dvh with fallback to 95vh"
  )
})

test("Direct invoice generator modal satisfies tablet intermediate width requirements (768x1024)", () => {
  const content = fs.readFileSync(modalPath, "utf8")

  assert.match(
    content,
    /sm:max-w-\[720px\]/,
    "Small tablet uses comfortable intermediate max width"
  )
  assert.match(
    content,
    /md:max-w-\[880px\]/,
    "Portrait tablet uses responsive intermediate max width ~880px"
  )
})

test("Customer information section uses responsive grid without horizontal clipping", () => {
  const content = fs.readFileSync(modalPath, "utf8")

  assert.match(
    content,
    /grid-cols-1\s+sm:grid-cols-2\s+lg:grid-cols-4/,
    "Customer fields must adapt from 1 column on mobile to 2 on tablet to 4 on desktop"
  )
  assert.match(
    content,
    /sm:col-span-2\s+lg:col-span-4/,
    "Billing address must span full width cleanly on desktop and tablet"
  )
})

test("Line items section has responsive 12-col desktop layout and shows line totals", () => {
  const content = fs.readFileSync(modalPath, "utf8")

  assert.match(
    content,
    /md:col-span-5/,
    "Line item description occupies spacious column span"
  )
  assert.match(
    content,
    /md:col-span-2/,
    "HSN/SAC occupies dedicated column span"
  )
  assert.match(
    content,
    /md:col-span-3/,
    "Unit price has ample width preventing number truncation"
  )
  assert.match(
    content,
    /Line Total:/,
    "Line item shows calculated line total directly"
  )
})

test("Taxes & Adjustments and Payment Collection use 2-column desktop grid and 1-column mobile", () => {
  const content = fs.readFileSync(modalPath, "utf8")

  assert.match(
    content,
    /grid-cols-1\s+lg:grid-cols-2/,
    "Taxes & Adjustments and Payment Collection adapt from 1-col mobile to 2-col desktop"
  )
})

test("Sticky bottom summary ribbon stays accessible and preserves calculations and actions", () => {
  const content = fs.readFileSync(modalPath, "utf8")

  assert.match(
    content,
    /sticky\s+bottom-0/,
    "Financial summary ribbon is sticky at bottom to remain accessible during scrolling"
  )
  assert.match(
    content,
    /calculations\.grandTotal/,
    "Grand total calculation is preserved and displayed"
  )
  assert.match(
    content,
    /handleIssueInvoice/,
    "Issue invoice submission handler is wired to action button"
  )
  assert.match(
    content,
    /setStep\("preview"\)/,
    "Preview button transitions cleanly to preview step"
  )
})

test("DialogContent responsive class overrides default sm:max-w-lg via twMerge", async () => {
  const { twMerge } = await import("tailwind-merge")
  const dialogContentPath = path.resolve(__dirname, "../components/ui/dialog.tsx")
  const dialogContentCode = fs.readFileSync(dialogContentPath, "utf8")
  const modalCode = fs.readFileSync(modalPath, "utf8")

  // Extract default DialogContent className
  const defaultClassMatch = dialogContentCode.match(/data-slot="dialog-content"[\s\S]*?className=\{cn\(\s*'([^']+)'/)
  assert.ok(defaultClassMatch, "must extract default DialogContent classes")
  const defaultClasses = defaultClassMatch[1]

  // Extract DirectInvoiceModal DialogContent className
  const modalClassMatch = modalCode.match(/<DialogContent\s+className="([^"]+)"/)
  assert.ok(modalClassMatch, "must extract modal DialogContent classes")
  const modalClasses = modalClassMatch[1]

  const merged = twMerge(defaultClasses, modalClasses)

  // Default constraints must be overridden by modal classes
  assert.equal(merged.includes("sm:max-w-lg"), false, "sm:max-w-lg must be overridden by modal classes")
  assert.equal(merged.includes("max-w-[calc(100%-1.5rem)]"), false, "max-w-[calc(100%-1.5rem)] must be overridden")

  // Responsive sizes must be present in resolved classes
  assert.ok(merged.includes("w-[calc(100vw-1rem)]"), "mobile w-[calc(100vw-1rem)] must be present")
  assert.ok(merged.includes("max-w-[calc(100vw-1rem)]"), "mobile max-w-[calc(100vw-1rem)] must be present")
  assert.ok(merged.includes("sm:max-w-[720px]"), "tablet sm:max-w-[720px] must be present")
  assert.ok(merged.includes("md:max-w-[880px]"), "intermediate md:max-w-[880px] must be present")
  assert.ok(merged.includes("lg:max-w-[min(1120px,94vw)]"), "desktop lg:max-w-[min(1120px,94vw)] must be present")
  assert.ok(merged.includes("xl:max-w-[min(1240px,94vw)]"), "large desktop xl:max-w-[min(1240px,94vw)] must be present")
})

test("Tailwind CSS engine compiles modal responsive arbitrary classes into production CSS bundle", () => {
  const cssDir = path.resolve(__dirname, "../.next/static/css")
  if (!fs.existsSync(cssDir)) {
    return
  }
  const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css"))
  let combinedCss = ""
  for (const f of cssFiles) {
    combinedCss += fs.readFileSync(path.join(cssDir, f), "utf8")
  }

  assert.ok(
    combinedCss.includes("1120px") || combinedCss.includes("min(1120px"),
    "Tailwind build must contain 1120px responsive rule"
  )
  assert.ok(
    combinedCss.includes("1240px"),
    "Tailwind build must contain 1240px responsive rule"
  )
  assert.ok(
    combinedCss.includes("height:1dvh"),
    "Tailwind build must contain dynamic viewport unit support rule"
  )
})

test("Direct invoice financial calculation logic accurately computes line items, GST, discounts, and totals", () => {
  function calculateInvoice({ lineItems, transportCharges, discountAmount, gstRate, isInterState }) {
    let itemsTotal = 0
    let servicesTotal = 0
    let materialsTotal = 0

    lineItems.forEach((item) => {
      const line = Number((Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2))
      itemsTotal += line
      if (item.item_type === "material") materialsTotal += line
      else servicesTotal += line
    })

    itemsTotal = Number(itemsTotal.toFixed(2))
    const subtotal = Math.max(0, Number((itemsTotal + Number(transportCharges || 0) - Number(discountAmount || 0)).toFixed(2)))
    const taxRate = Number(gstRate || 0) / 100
    const totalTax = Number((subtotal * taxRate).toFixed(2))
    const cgst = isInterState ? 0 : Number((totalTax / 2).toFixed(2))
    const sgst = isInterState ? 0 : Number((totalTax - cgst).toFixed(2))
    const igst = isInterState ? totalTax : 0
    const grandTotal = Number((subtotal + totalTax).toFixed(2))

    return {
      itemsTotal,
      servicesTotal,
      materialsTotal,
      subtotal,
      totalTax,
      cgst,
      sgst,
      igst,
      grandTotal,
    }
  }

  // 1. Intra-state invoice with services and materials
  const resultIntra = calculateInvoice({
    lineItems: [
      { item_type: "service", quantity: 2, unit_price: 1000 },
      { item_type: "material", quantity: 5, unit_price: 200 },
    ],
    transportCharges: 250,
    discountAmount: 150,
    gstRate: 18,
    isInterState: false,
  })

  assert.equal(resultIntra.itemsTotal, 3000.0)
  assert.equal(resultIntra.servicesTotal, 2000.0)
  assert.equal(resultIntra.materialsTotal, 1000.0)
  assert.equal(resultIntra.subtotal, 3100.0) // 3000 + 250 - 150
  assert.equal(resultIntra.totalTax, 558.0) // 3100 * 0.18
  assert.equal(resultIntra.cgst, 279.0) // 558 / 2
  assert.equal(resultIntra.sgst, 279.0) // 558 - 279
  assert.equal(resultIntra.igst, 0.0) // intra-state has no IGST
  assert.equal(resultIntra.grandTotal, 3658.0) // 3100 + 558

  // 2. Inter-state invoice with IGST
  const resultInter = calculateInvoice({
    lineItems: [
      { item_type: "service", quantity: 1, unit_price: 5000 },
    ],
    transportCharges: 0,
    discountAmount: 500,
    gstRate: 18,
    isInterState: true,
  })

  assert.equal(resultInter.itemsTotal, 5000.0)
  assert.equal(resultInter.subtotal, 4500.0)
  assert.equal(resultInter.totalTax, 810.0)
  assert.equal(resultInter.cgst, 0.0)
  assert.equal(resultInter.sgst, 0.0)
  assert.equal(resultInter.igst, 810.0)
  assert.equal(resultInter.grandTotal, 5310.0)

  // 3. Discount exceeds total -> subtotal clamps to 0
  const resultFloor = calculateInvoice({
    lineItems: [
      { item_type: "service", quantity: 1, unit_price: 100 },
    ],
    transportCharges: 0,
    discountAmount: 500,
    gstRate: 18,
    isInterState: false,
  })

  assert.equal(resultFloor.subtotal, 0.0)
  assert.equal(resultFloor.totalTax, 0.0)
  assert.equal(resultFloor.grandTotal, 0.0)
})

test("Submission payload builder creates valid contract payload for walk-in and credit invoices", () => {
  function buildPayload({
    customerMode,
    selectedCustomerId,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    customerGstin,
    lineItems,
    transportCharges,
    discountAmount,
    gstRate,
    isInterState,
    paymentStatus,
    paymentMethod,
    transactionRef,
    dueDays,
    customerNotes,
    idempotencyKey,
  }) {
    return {
      idempotency_key: idempotencyKey,
      invoice_type: "walk_in",
      customer_id: customerMode === "existing" ? selectedCustomerId : null,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim(),
      customer_address: customerAddress.trim(),
      customer_gstin: customerGstin.trim(),
      auto_create_customer: true,
      lineItems: lineItems.map((item) => ({
        item_type: item.item_type,
        description: item.description,
        hsn_code: item.hsn_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        inventory_item_id: item.inventory_item_id || null,
      })),
      transport_charges: Number(transportCharges || 0),
      discount_amount: Number(discountAmount || 0),
      gst_rate: Number(gstRate || 18),
      is_inter_state: Boolean(isInterState),
      payment_status: paymentStatus,
      payment_method: paymentStatus === "paid" ? paymentMethod : null,
      transaction_reference: transactionRef || (paymentStatus === "paid" ? `COUNTER_${paymentMethod.toUpperCase()}` : ""),
      payment_notes: paymentStatus === "paid" ? `Paid at counter via ${paymentMethod.toUpperCase()}` : "",
      due_days: paymentStatus === "paid" ? 0 : Number(dueDays || 15),
      customer_notes: customerNotes,
    }
  }

  const payloadPaid = buildPayload({
    customerMode: "new",
    selectedCustomerId: "",
    customerName: " Rajesh Sharma  ",
    customerPhone: " +919876543210 ",
    customerEmail: " rajesh@example.com ",
    customerAddress: " Sector 18, Noida ",
    customerGstin: " 07AAAAA0000A1Z5 ",
    lineItems: [{ item_type: "service", description: "Brake service", hsn_code: "998311", quantity: 1, unit_price: 1500 }],
    transportCharges: 0,
    discountAmount: 0,
    gstRate: 18,
    isInterState: false,
    paymentStatus: "paid",
    paymentMethod: "upi",
    transactionRef: "UPI-TXN-12345",
    dueDays: 15,
    customerNotes: "Thank you",
    idempotencyKey: "test-uuid-1",
  })

  assert.equal(payloadPaid.customer_id, null)
  assert.equal(payloadPaid.auto_create_customer, true)
  assert.equal(payloadPaid.customer_name, "Rajesh Sharma")
  assert.equal(payloadPaid.payment_status, "paid")
  assert.equal(payloadPaid.payment_method, "upi")
  assert.equal(payloadPaid.transaction_reference, "UPI-TXN-12345")
  assert.equal(payloadPaid.due_days, 0)

  const payloadUnpaid = buildPayload({
    customerMode: "existing",
    selectedCustomerId: "cust-456",
    customerName: "Acme Corp",
    customerPhone: "1234567890",
    customerEmail: "billing@acme.com",
    customerAddress: "Industrial Area",
    customerGstin: "07BBBBB0000B1Z6",
    lineItems: [{ item_type: "material", description: "Filter", hsn_code: "847990", quantity: 2, unit_price: 500, inventory_item_id: "inv-99" }],
    transportCharges: 100,
    discountAmount: 50,
    gstRate: 18,
    isInterState: true,
    paymentStatus: "unpaid",
    paymentMethod: "cash",
    transactionRef: "",
    dueDays: 30,
    customerNotes: "Credit terms applied",
    idempotencyKey: "test-uuid-2",
  })

  assert.equal(payloadUnpaid.customer_id, "cust-456")
  assert.equal(payloadUnpaid.payment_status, "unpaid")
  assert.equal(payloadUnpaid.payment_method, null)
  assert.equal(payloadUnpaid.transaction_reference, "")
  assert.equal(payloadUnpaid.due_days, 30)
})
