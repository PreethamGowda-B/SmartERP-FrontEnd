"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { getAvailableSupportChannels, formatSupportResponseTarget } from "@/lib/support-policy"
import { ArrowRight, Mail, MessageCircle, ShieldCheck, TicketCheck } from "lucide-react"

type SupportTicket = {
  id: number
  subject: string
  status: string
  support_channel: "email" | "whatsapp"
  support_first_response_due_at: string
  support_first_responded_at: string | null
  created_at: string
}

const SUPPORT_EMAIL = "prozyncinnovations@gmail.com"
const SUPPORT_WHATSAPP = "918310982308"

export function SupportView() {
  const [policy, setPolicy] = useState<{ channels: Array<"email" | "whatsapp">; firstResponseBusinessHours: number } | null>(null)
  const [planName, setPlanName] = useState("your plan")
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [channel, setChannel] = useState<"email" | "whatsapp">("email")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<{ ticket: SupportTicket; responseTarget: string } | null>(null)

  const availableChannels: Array<"email" | "whatsapp"> = useMemo(() => getAvailableSupportChannels(policy), [policy])
  const responseTarget = formatSupportResponseTarget(policy)

  const loadSupport = useCallback(async () => {
    try {
      const [policyResponse, ticketResponse] = await Promise.all([
        apiClient("/api/support/policy"),
        apiClient("/api/support/tickets"),
      ])
      setPolicy(policyResponse.policy)
      setPlanName(policyResponse.plan_name || "your plan")
      setTickets(Array.isArray(ticketResponse) ? ticketResponse : [])
      if (!policyResponse.policy?.channels?.includes(channel)) {
        setChannel(policyResponse.policy?.channels?.[0] || "email")
      }
    } catch (err) {
      logger.error("Failed to load support policy", err)
      setError("Support details are temporarily unavailable. Refresh the page and try again.")
    } finally {
      setLoading(false)
    }
  }, [channel])

  useEffect(() => { void loadSupport() }, [loadSupport])

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccess(null)
    try {
      const result = await apiClient("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, channel }),
      })
      setSuccess({ ticket: result.ticket, responseTarget: result.response_target })
      setSubject("")
      setMessage("")
      await loadSupport()
    } catch (err: any) {
      setError(err?.message || "Could not submit your request. Please retry.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex h-[40vh] items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  const whatsappLink = success?.ticket
    ? `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`SmartERP support ticket #${success.ticket.id}: ${success.ticket.subject}`)}`
    : null

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-8">
      <section className="rounded-3xl border bg-linear-to-br from-slate-50 via-white to-indigo-50/50 p-6 md:p-10 text-slate-900">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-6 w-6 text-indigo-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{planName} support</p>
            <h2 className="mt-1 text-2xl md:text-3xl font-extrabold">How can we help?</h2>
            <p className="mt-2 text-sm text-slate-600">First human response {responseTarget}, Monday–Friday, 9:00 AM–6:00 PM IST. This is a response target, not a resolution-time guarantee.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {availableChannels.map((item: "email" | "whatsapp") => item === "email"
            ? <a key={item} href={`mailto:${SUPPORT_EMAIL}?subject=SmartERP%20Support%20Request`} className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-800 underline">Email · {SUPPORT_EMAIL}</a>
            : <span key={item} className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-800">WhatsApp</span>)}
        </div>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Request #{success.ticket.id} submitted. Target: {success.responseTarget}.</p>
          {success.ticket.support_channel === "whatsapp" && whatsappLink && <a className="mt-2 inline-flex items-center gap-2 font-semibold underline" href={whatsappLink} target="_blank" rel="noopener noreferrer">Continue in WhatsApp <ArrowRight className="h-4 w-4" /></a>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form onSubmit={submitRequest} className="space-y-4 rounded-3xl border bg-card p-6 shadow-xs">
          <h3 className="text-lg font-bold">Create a support request</h3>
          <p className="text-sm text-muted-foreground">Submitting here records the request and starts the response-time target.</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose support channel">
            {availableChannels.map((item: "email" | "whatsapp") => {
              const Icon = item === "email" ? Mail : MessageCircle
              return <button key={item} type="button" onClick={() => setChannel(item)} aria-pressed={channel === item} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${channel === item ? "border-primary bg-primary/10 font-semibold" : "border-border"}`}><Icon className="h-4 w-4" />{item === "email" ? "Email" : "WhatsApp"}</button>
            })}
          </div>
          <label className="block text-sm font-medium">Subject<input required maxLength={255} value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 w-full rounded-xl border bg-background px-3 py-2" /></label>
          <label className="block text-sm font-medium">How can we help?<textarea required maxLength={5000} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 w-full resize-y rounded-xl border bg-background px-3 py-2" /></label>
          <button type="submit" disabled={submitting || !policy} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{submitting ? "Submitting…" : "Submit request"}<ArrowRight className="h-4 w-4" /></button>
        </form>

        <section className="rounded-3xl border bg-card p-6 shadow-xs">
          <h3 className="flex items-center gap-2 text-lg font-bold"><TicketCheck className="h-5 w-5 text-primary" />Recent requests</h3>
          {tickets.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No support requests yet.</p> : <ul className="mt-4 space-y-3">{tickets.map((ticket) => <li key={ticket.id} className="rounded-xl border p-3"><div className="flex items-start justify-between gap-2"><p className="font-semibold">#{ticket.id} · {ticket.subject}</p><span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{ticket.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{ticket.support_channel} · {ticket.support_first_responded_at ? `First response ${new Date(ticket.support_first_responded_at).toLocaleString()}` : `Target ${new Date(ticket.support_first_response_due_at).toLocaleString()}`}</p></li>)}</ul>}
        </section>
      </div>
    </div>
  )
}
