export interface PaymentIntent {
  invoiceId: string
  amount: number | string
  paymentMethod: string
  transactionReference?: string
  notes?: string
}

export interface PaymentIdempotencyOperation {
  fingerprint: string
  key: string
  storageKey: string | null
}

function normalizedAmount(value: number | string): string {
  const input = String(value).trim()
  const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(input)
  if (!match) throw new Error("A valid positive payment amount is required.")

  const negative = match[1] === "-"
  const fraction = match[3] || ""
  const exponent = Number(match[4] || 0)
  const scale = fraction.length - exponent
  if (!Number.isSafeInteger(scale) || Math.abs(scale) > 100) {
    throw new Error("A valid positive payment amount is required.")
  }
  let digits = BigInt((match[2] + fraction) || "0")
  const powerOfTen = (power: number) => {
    let result = BigInt(1)
    for (let index = 0; index < power; index += 1) result *= BigInt(10)
    return result
  }
  if (scale < 2) {
    digits *= powerOfTen(2 - scale)
  } else if (scale > 2) {
    const divisor = powerOfTen(scale - 2)
    digits = (digits + divisor / BigInt(2)) / divisor
  }
  if (negative) digits = -digits
  if (digits <= BigInt(0)) throw new Error("A valid positive payment amount is required.")
  const cents = digits.toString().replace("-", "").padStart(3, "0")
  const sign = digits < BigInt(0) ? "-" : ""
  return sign + cents.slice(0, -2) + "." + cents.slice(-2)
}

export function paymentIntentFingerprint(intent: PaymentIntent): string {
  return JSON.stringify({
    invoiceId: String(intent.invoiceId),
    amount: normalizedAmount(intent.amount),
    paymentMethod: String(intent.paymentMethod).trim().toLowerCase(),
    transactionReference: String(intent.transactionReference || "").trim(),
    notes: String(intent.notes || "").trim(),
  })
}

async function getStorageKey(fingerprint: string): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle || typeof TextEncoder === "undefined") return null
    const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(fingerprint))
    const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
    return "smarterp.payment-idempotency.v1." + hex
  } catch {
    return null
  }
}

function getSessionStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage
  } catch {
    return null
  }
}

export async function getPaymentIdempotencyKey(
  operation: { current: PaymentIdempotencyOperation | null },
  intent: PaymentIntent,
  createKey: () => string = () => {
    if (!globalThis.crypto?.randomUUID) {
      throw new Error("This browser cannot safely create a payment retry key.")
    }
    return globalThis.crypto.randomUUID()
  },
): Promise<string> {
  const fingerprint = paymentIntentFingerprint(intent)
  if (operation.current?.fingerprint === fingerprint) return operation.current.key

  const storageKey = await getStorageKey(fingerprint)
  const storage = getSessionStorage()
  let key: string | null = null
  if (storage && storageKey) {
    try {
      const stored = storage.getItem(storageKey)
      if (stored && stored.length >= 8 && stored.length <= 128) key = stored
    } catch {
      // Keep working with the in-memory operation when browser storage is unavailable.
    }
  }
  key ||= createKey()
  if (!key || key.length < 8 || key.length > 128) {
    throw new Error("Could not create a valid payment retry key.")
  }
  operation.current = { fingerprint, key, storageKey }
  if (storage && storageKey) {
    try {
      storage.setItem(storageKey, key)
    } catch {
      // The key remains stable while this form is mounted if storage is unavailable.
    }
  }
  return key
}

export function clearPaymentIdempotencyKey(operation: { current: PaymentIdempotencyOperation | null }): void {
  const storage = getSessionStorage()
  if (storage && operation.current?.storageKey) {
    try {
      storage.removeItem(operation.current.storageKey)
    } catch {
      // Clearing browser storage is best effort; the payment result is already confirmed.
    }
  }
  operation.current = null
}
