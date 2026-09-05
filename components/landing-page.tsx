"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AntigravityBackground } from "@/components/ui/antigravity-background"
import {
  Building2,
  Users,
  Clock,
  DollarSign,
  MessageSquare,
  MapPin,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  UserCheck,
  Sparkles,
  ExternalLink,
  Smartphone,
  ChevronRight,
  Mail,
  Phone,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"

export function LandingPage() {
  const router = useRouter()
  const [counters, setCounters] = useState({ users: 1500, jobs: 12500, teams: 450 })
  const [navigatingTarget, setNavigatingTarget] = useState<string | null>(null)

  // Demo Video Controls
  const demoVideoRef = useRef<HTMLVideoElement | null>(null)
  const [isDemoPlaying, setIsDemoPlaying] = useState(false)
  const [isDemoMuted, setIsDemoMuted] = useState(true)

  // Hero Video Controls
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)
  const [isHeroMuted, setIsHeroMuted] = useState(true)

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const setSectionRef = (key: string) => (el: HTMLDivElement | null) => {
    if (el) sectionRefs.current[key] = el
  }

  // Pre-warm router cache for instant navigation on button clicks
  useEffect(() => {
    try {
      router.prefetch("/auth/login?mode=signup")
      router.prefetch("/auth/login?mode=login")
      router.prefetch("/customer/landing")
      router.prefetch("/pricing")
      router.prefetch("/features")
    } catch (_) {}
  }, [router])

  // Lazy load product demo video ONLY when scrolled near viewport (saves 2.7MB initial download)
  useEffect(() => {
    const videoEl = demoVideoRef.current
    if (!videoEl || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!videoEl.src || videoEl.src === window.location.href) {
              videoEl.src = "/videos/product-demo.mp4"
              videoEl.load()
            }
            videoEl.play().catch(() => {})
            setIsDemoPlaying(true)
          } else {
            if (videoEl.src) {
              videoEl.pause()
              setIsDemoPlaying(false)
            }
          }
        })
      },
      { rootMargin: "300px" }
    )

    observer.observe(videoEl)
    return () => observer.disconnect()
  }, [])

  // Smooth counter animation on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setCounters((prev) => ({
        users: prev.users < 5000 ? prev.users + 200 : 5000,
        jobs: prev.jobs < 50000 ? prev.jobs + 2000 : 50000,
        teams: prev.teams < 1200 ? prev.teams + 50 : 1200,
      }))
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const toggleDemoPlay = () => {
    if (!demoVideoRef.current) return
    if (isDemoPlaying) {
      demoVideoRef.current.pause()
      setIsDemoPlaying(false)
    } else {
      demoVideoRef.current.play()
      setIsDemoPlaying(true)
    }
  }

  const toggleDemoMute = () => {
    if (!demoVideoRef.current) return
    demoVideoRef.current.muted = !isDemoMuted
    setIsDemoMuted(!isDemoMuted)
  }

  const toggleHeroMute = () => {
    if (!heroVideoRef.current) return
    heroVideoRef.current.muted = !isHeroMuted
    setIsHeroMuted(!isHeroMuted)
  }

  const features = [
    { icon: Users, title: "Crew Management", description: "Real-time workforce scheduling, role permissions, and active job dispatching." },
    { icon: Building2, title: "Job Tracking", description: "Monitor progress, material requests, and field status live from start to finish." },
    { icon: Clock, title: "GPS Time Tracking", description: "Geofenced clock-in/out, automatic overtime logging, and break audits." },
    { icon: DollarSign, title: "Automated Payroll", description: "Seamless earnings computation, direct tax deductions, and wage summaries." },
    { icon: MessageSquare, title: "Smart AI Copilot", description: "Instant answers for crew policies, schedule queries, and task updates." },
    { icon: MapPin, title: "Live Field Telemetry", description: "Real-time map tracking for field teams with smart geofencing alerts." },
    { icon: ShieldCheck, title: "Enterprise Security", description: "Multi-tenant RBAC, end-to-end encryption, and compliant audit trails." },
    { icon: Zap, title: "Work Flow Automation", description: "Automate recurring jobs, SMS alerts, and client notifications." },
  ]

  const benefits = [
    "Reduce operational downtime & manual overhead by up to 40%",
    "Live GPS location and job status sync across field teams",
    "Dedicated Client Portal for real-time customer service tracking",
    "Automated payroll processing with detailed audit compliance",
    "Mobile-optimized web PWA for on-site field technicians",
    "24/7 Priority enterprise support & onboarding guidance",
  ]

  return (
    <div className="min-h-screen relative bg-background text-foreground">
      <AntigravityBackground />

      {/* Main content wrapper — must be above z-0 background */}
      <div className="relative z-10">

      {/* ── 1. Navigation Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="p-2 bg-linear-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground">
              SmartERP<span className="text-blue-500">.</span>
            </span>
          </Link>

          {/* Navigation items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#demo" className="hover:text-foreground transition-colors">Product Demo</a>
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <a href="#benefits" className="hover:text-foreground transition-colors">Why SmartERP</a>
            <Link
              href="/customer/landing"
              className="hover:text-blue-500 transition-colors flex items-center gap-1.5 font-semibold text-blue-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Customer Portal
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Customer Portal Quick Action */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex items-center gap-2 border-border bg-card text-foreground hover:bg-muted hover:border-primary/40 transition-all font-semibold shadow-xs"
            >
              <Link href="/customer/landing" prefetch={true}>
                <UserCheck className="h-4 w-4 text-primary" />
                Customer Portal
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="font-semibold hover:bg-muted text-foreground"
            >
              <Link href="/auth/login?mode=login" prefetch={true}>
                Sign In
              </Link>
            </Button>
            
            <Button
              asChild
              size="sm"
              className="font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
            >
              <Link href="/auth/login?mode=signup" prefetch={true}>
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section ──────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col justify-center items-center overflow-hidden pt-10 pb-16">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-xs font-semibold mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            Next-Gen ERP & Field Workforce Intelligence
          </div>

          <h1 className="text-4xl sm:text-7xl font-extrabold text-foreground mb-6 tracking-tight leading-tight max-w-4xl mx-auto">
            Streamline Field Crews & Operations{" "}
            <span className="bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              With Precision.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            The unified platform for construction, service, and field teams. Track real-time jobs, automate payroll, and deliver live status visibility to your customers.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto text-base font-bold px-8 py-6 bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 group cursor-pointer"
            >
              <Link href="/auth/login?mode=signup" prefetch={true}>
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base font-semibold px-8 py-6 border-border bg-card hover:bg-muted hover:border-primary/50 text-foreground shadow-sm cursor-pointer"
            >
              <Link href="/customer/landing" prefetch={true}>
                <UserCheck className="mr-2 h-5 w-5 text-primary" />
                Access Customer Portal
                <ExternalLink className="ml-2 h-4 w-4 opacity-70" />
              </Link>
            </Button>
          </div>

          {/* Hero Video Showcase Frame */}
          <div className="relative max-w-5xl mx-auto rounded-2xl border border-border shadow-2xl overflow-hidden bg-slate-950/90 backdrop-blur-xl group">
            {/* Glass Header Bar */}
            <div className="bg-slate-900 border-b border-border/80 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-md border border-white/10">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                smarterp.in/platform-overview
              </div>
              <button
                onClick={toggleHeroMute}
                className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
              >
                {isHeroMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-blue-400" />}
                {isHeroMuted ? "Unmute" : "Sound On"}
              </button>
            </div>

            {/* Video Element */}
            <div className="relative aspect-video w-full bg-black">
              <video
                ref={heroVideoRef}
                src="/videos/hero-showcase.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto mt-12">
            <div className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border hover:border-blue-500/40 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-500 mb-1" suppressHydrationWarning>
                {counters.users.toLocaleString()}+
              </div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Crews</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border hover:border-indigo-500/40 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-500 mb-1" suppressHydrationWarning>
                {counters.jobs.toLocaleString()}+
              </div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Jobs Dispatched</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border hover:border-purple-500/40 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-500 mb-1" suppressHydrationWarning>
                {counters.teams.toLocaleString()}+
              </div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Enterprise Teams</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Product Demo Section ─────────────────────────────────────── */}
      <section id="demo" ref={setSectionRef("demo")} className="py-20 px-4 sm:px-6 lg:px-8 relative bg-muted/30 border-y border-border/60">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Interactive Product Demo
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
            See SmartERP in Action
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Watch how SmartERP connects owners, HR, field crews, and customers into one seamless real-time workflow.
          </p>

          {/* Browser Device Mockup Frame */}
          <div className="relative max-w-4xl mx-auto rounded-2xl border border-border bg-slate-900 shadow-2xl overflow-hidden group">
            {/* Top Bar */}
            <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-border/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs font-mono text-slate-400 bg-slate-900 px-4 py-1 rounded-md border border-white/10">
                app.smarterp.in/live-demo
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleDemoMute}
                  className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                  title={isDemoMuted ? "Unmute" : "Mute"}
                >
                  {isDemoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-indigo-400" />}
                </button>
                <button
                  onClick={toggleDemoPlay}
                  className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                  title={isDemoPlaying ? "Pause" : "Play"}
                >
                  {isDemoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-indigo-400" />}
                </button>
              </div>
            </div>

            {/* Video Content */}
            <div className="relative aspect-video bg-black">
              <video
                ref={demoVideoRef}
                preload="none"
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              <button
                onClick={toggleDemoPlay}
                className="absolute bottom-4 left-4 flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-medium backdrop-blur-md transition-all border border-white/10"
              >
                {isDemoPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                {isDemoPlaying ? "Pause Video" : "Play Video"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Customer Portal Highlight Banner ─────────────────────────── */}
      <section id="customer-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                For Service Clients & Homeowners
              </div>
              <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                Track Your Service Requests Live
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Are you a customer of a company powered by SmartERP? Access your dedicated client portal to view technician updates, live map tracking, and job status in real-time.
              </p>
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Live Map Location
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Instant Status Alerts
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  No App Download Required
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="w-full text-sm font-bold px-6 py-6 bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 cursor-pointer"
              >
                <Link href="/customer/landing">
                  <UserCheck className="mr-2 h-5 w-5" />
                  Access Customer Portal
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full text-sm font-semibold px-6 py-6 border-white/20 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <Link href="/customer/login">
                  Customer Sign In
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Features Grid Section ───────────────────────────────────── */}
      <section ref={setSectionRef("features")} id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Built for Field Operations & Scalability
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to command field crews, manage jobs, process payroll, and delight customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm hover:border-blue-500/40 hover:shadow-xl transition-all duration-300"
              >
                <div className="mb-4 p-3 bg-blue-500/10 rounded-xl w-fit group-hover:bg-blue-500/20 transition-colors">
                  <Icon className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 6. Benefits Section ───────────────────────────────────────── */}
      <section ref={setSectionRef("benefits")} id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Why Industry Leaders Choose SmartERP
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-foreground font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border shadow-2xl">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-blue-500" />
              Mobile-First Field PWA
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6">
              Field technicians and supervisors get instant access on any smartphone without app store friction. Clock-in with GPS, update job progress, request materials, and view schedules on-the-go.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Offline Sync</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Push Notifications</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Web & APK Bridge</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Primary CTA Section ──────────────────────────────────────── */}
      <section ref={setSectionRef("cta")} id="cta" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center shadow-2xl border border-blue-500/30">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to Modernize Your Operations?</h2>
            <p className="text-sm sm:text-base mb-8 text-blue-100/90 leading-relaxed">
              Join field service and construction teams managing their crews efficiently with SmartERP.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="text-sm font-bold px-8 py-6 bg-white hover:bg-slate-100 text-slate-900 shadow-xl cursor-pointer"
              >
                <Link href="/auth/login?mode=signup" prefetch={true}>
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-sm font-semibold px-8 py-6 border-white/20 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <Link href="/customer/landing" prefetch={true}>
                  <UserCheck className="mr-2 h-5 w-5" />
                  Access Customer Portal
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Contact Info Bar ─────────────────────────────────────────── */}
      <section className="border-t border-border bg-card/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Enterprise Inquiries & Support</h3>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-foreground text-xs sm:text-sm font-medium">
            <a href="mailto:prozyncinnovations@gmail.com" className="flex items-center gap-2 hover:text-blue-500 transition-colors">
              <Mail className="h-4 w-4 text-blue-500" />
              <span>prozyncinnovations@gmail.com</span>
            </a>
            <a href="tel:+919535134351" className="flex items-center gap-2 hover:text-blue-500 transition-colors">
              <Phone className="h-4 w-4 text-blue-500" />
              <span>+91 9535134351</span>
            </a>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>Bangalore, India</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left mb-10">
            <div className="space-y-3 md:col-span-1">
              <Link href="/" className="flex items-center justify-center md:justify-start gap-2 cursor-pointer">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="font-extrabold text-xl">SmartERP</span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enterprise field workforce management and real-time customer service tracking.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-foreground mb-3">Portals</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/customer/landing" className="hover:text-blue-500 transition-colors flex items-center gap-1.5 justify-center md:justify-start">
                    <UserCheck className="h-3.5 w-3.5 text-blue-500" /> Customer Portal
                  </Link>
                </li>
                <li><Link href="/customer/login" className="hover:text-foreground transition-colors">Customer Sign In</Link></li>
                <li><Link href="/auth/login" className="hover:text-foreground transition-colors">Staff & Crew Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#demo" className="hover:text-foreground transition-colors">Interactive Demo</a></li>
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing Plans</Link></li>
                <li><a href="#benefits" className="hover:text-foreground transition-colors">Why SmartERP</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-foreground mb-3">Company & Legal</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Support</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-border text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} SmartERP. All rights reserved. Prozync Innovations.</p>
          </div>
        </div>
      </footer>
      </div>{/* end z-10 content wrapper */}
    </div>
  )
}
