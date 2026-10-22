"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const Module = require("node:module")
const ts = require("typescript")

const sourcePath = path.join(__dirname, "..", "lib", "paymentIdempotency.ts")
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const helperModule = new Module(sourcePath, module)
helperModule.filename = sourcePath
helperModule.paths = Module._nodeModulePaths(path.dirname(sourcePath))
helperModule._compile(compiled, sourcePath)
const { clearPaymentIdempotencyKey, getPaymentIdempotencyKey, paymentIntentFingerprint } = helperModule.exports

test("unchanged normalized intent reuses one operation key across retries", async () => {
  const operation = { current: null }
  let generated = 0
  const createKey = () => "payment-operation-" + (++generated)
  const first = await getPaymentIdempotencyKey(operation, {
    invoiceId: "invoice-1", amount: "10.005", paymentMethod: " Cash ", transactionReference: " receipt ", notes: " paid ",
  }, createKey)
  const retry = await getPaymentIdempotencyKey(operation, {
    invoiceId: "invoice-1", amount: 10.01, paymentMethod: "cash", transactionReference: "receipt", notes: "paid",
  }, createKey)
  assert.equal(first, retry)
  assert.equal(generated, 1)
})

test("changed payment details start a new intentional operation", async () => {
  const operation = { current: null }
  let generated = 0
  const createKey = () => "payment-operation-" + (++generated)
  const base = { invoiceId: "invoice-1", amount: 10, paymentMethod: "cash", transactionReference: "r1", notes: "n1" }
  const first = await getPaymentIdempotencyKey(operation, base, createKey)
  for (const changed of [
    { invoiceId: "invoice-2" }, { amount: 11 }, { paymentMethod: "upi" },
    { transactionReference: "r2" }, { notes: "n2" },
  ]) {
    assert.notEqual(await getPaymentIdempotencyKey(operation, { ...base, ...changed }, createKey), first)
  }
  assert.equal(generated, 6)
})

test("uncertain payment retry after page reload recovers its session key and success clears it", async () => {
  const previousWindow = global.window
  const entries = new Map()
  global.window = {
    sessionStorage: {
      getItem: (key) => entries.get(key) || null,
      setItem: (key, value) => entries.set(key, value),
      removeItem: (key) => entries.delete(key),
    },
  }
  try {
    let generated = 0
    const createKey = () => "payment-operation-" + (++generated)
    const intent = {
      invoiceId: "invoice-1", amount: 125.5, paymentMethod: "upi", transactionReference: "utr-1", notes: "deposit",
    }
    const firstPage = { current: null }
    const first = await getPaymentIdempotencyKey(firstPage, intent, createKey)
    const reloadedPage = { current: null }
    const retry = await getPaymentIdempotencyKey(reloadedPage, intent, createKey)
    assert.equal(first, retry)
    assert.equal(generated, 1)

    clearPaymentIdempotencyKey(reloadedPage)
    const newOperation = await getPaymentIdempotencyKey({ current: null }, intent, createKey)
    assert.notEqual(newOperation, first)
    assert.equal(generated, 2)
  } finally {
    if (previousWindow === undefined) delete global.window
    else global.window = previousWindow
  }
})

test("payment fingerprint uses exact paise rounding and rejects invalid values", () => {
  assert.match(paymentIntentFingerprint({
    invoiceId: "invoice-1", amount: "1.005", paymentMethod: "cash",
  }), /"amount":"1\.01"/)
  assert.throws(() => paymentIntentFingerprint({
    invoiceId: "invoice-1", amount: "0.001", paymentMethod: "cash",
  }))
})

test("both payment entry points send the idempotency header", () => {
  const modal = fs.readFileSync(path.join(__dirname, "..", "components", "record-payment-modal.tsx"), "utf8")
  const ledger = fs.readFileSync(path.join(__dirname, "..", "components", "payments-view.tsx"), "utf8")
  assert.match(modal, /Idempotency-Key["']:\s*idempotencyKey/)
  assert.match(ledger, /Idempotency-Key["']:\s*idempotencyKey/)
})

test("transaction references such as COUNTER_CASH are never used as idempotency keys", async () => {
  const operation1 = { current: null }
  const operation2 = { current: null }
  const key1 = await getPaymentIdempotencyKey(operation1, {
    invoiceId: "invoice-1",
    amount: "500",
    paymentMethod: "cash",
    transactionReference: "COUNTER_CASH",
  })
  const key2 = await getPaymentIdempotencyKey(operation2, {
    invoiceId: "invoice-2",
    amount: "500",
    paymentMethod: "cash",
    transactionReference: "COUNTER_CASH",
  })
  assert.notEqual(key1, "COUNTER_CASH")
  assert.notEqual(key2, "COUNTER_CASH")
  assert.notEqual(key1, key2)
  assert.match(key1, /^[0-9a-f-]{36}$/i)
})

test("the client does not clear the key before confirmed success", async () => {
  const operation = { current: null }
  const intent = { invoiceId: "inv-10", amount: 100, paymentMethod: "cash" }
  const keyFirst = await getPaymentIdempotencyKey(operation, intent)
  // Simulate an error or timeout during request: operation.current is retained
  assert.ok(operation.current)
  assert.equal(operation.current.key, keyFirst)

  // Subsequent retry reuses the same key
  const keyRetry = await getPaymentIdempotencyKey(operation, intent)
  assert.equal(keyRetry, keyFirst)

  // Only upon confirmed success is clearPaymentIdempotencyKey invoked
  clearPaymentIdempotencyKey(operation)
  assert.equal(operation.current, null)
})

test("modal and ledger preserve entered intent on error or timeout without mutating parameters", () => {
  const modal = fs.readFileSync(path.join(__dirname, "..", "components", "record-payment-modal.tsx"), "utf8")
  const ledger = fs.readFileSync(path.join(__dirname, "..", "components", "payments-view.tsx"), "utf8")

  // Verify catch blocks do NOT reset form fields or clear idempotency key
  assert.match(modal, /catch\s*\([^{]*\)\s*\{[^}]*toast\(/)
  assert.doesNotMatch(modal, /catch\s*\([^{]*\)\s*\{[^}]*clearPaymentIdempotencyKey/)
  assert.doesNotMatch(modal, /catch\s*\([^{]*\)\s*\{[^}]*setAmount\(/)

  assert.match(ledger, /catch\s*\([^{]*\)\s*\{[^}]*toast\(/)
  assert.doesNotMatch(ledger, /catch\s*\([^{]*\)\s*\{[^}]*clearPaymentIdempotencyKey/)
  assert.doesNotMatch(ledger, /catch\s*\([^{]*\)\s*\{[^}]*setAmount\(/)
})
