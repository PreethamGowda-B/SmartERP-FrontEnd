"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Building2, Mail, Phone, MapPin, ArrowRight, UserCheck, Send, CheckCircle2 } from "lucide-react"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    const subject = encodeURIComponent(`SmartERP Inquiry from ${name.trim()}`)
    const body = encodeURIComponent(`Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`)
    window.location.href = `mailto:prozyncinnovations@gmail.com?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="p-2 bg-blue-600 rounded-xl shadow-md">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              SmartERP<span className="text-blue-500">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login?mode=login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
              <Link href="/auth/login?mode=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4">Contact Enterprise Support & Sales</h1>
        <p className="text-muted-foreground text-base">Have questions about SmartERP or need a custom solution? Reach out to our team.</p>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-card border border-border text-center">
            <Mail className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-bold text-foreground text-sm mb-1">Email Us</h3>
            <a href="mailto:prozyncinnovations@gmail.com" className="text-xs text-blue-600 hover:underline">prozyncinnovations@gmail.com</a>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border text-center">
            <Phone className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-bold text-foreground text-sm mb-1">Call Us</h3>
            <a href="tel:+919535134351" className="text-xs text-blue-600 hover:underline">+91 9535134351</a>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border text-center">
            <MapPin className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-bold text-foreground text-sm mb-1">Headquarters</h3>
            <p className="text-xs text-muted-foreground">Bangalore, India</p>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-card border border-border shadow-xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">Send an Inquiry</h2>
          {submitted ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-foreground">Email client opened</p>
              <p className="text-xs text-muted-foreground">Your inquiry was prepared for prozyncinnovations@gmail.com.</p>
              <Button variant="outline" size="sm" onClick={() => setSubmitted(false)} className="mt-2">Send another inquiry</Button>
            </div>
          ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Your Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="John Doe" className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="john@company.com" className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Message</label>
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="How can we help your business?" className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold">
              <Send className="mr-2 h-4 w-4" /> Send Message
            </Button>
          </form>
          )}
        </div>
      </section>
    </div>
  )
}
