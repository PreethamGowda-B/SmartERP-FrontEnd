"use client"

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
  Shield,
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
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Mail,
  Phone,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"

const STAGES = [
  "Connecting to SmartERP Hub...",
  "Authenticating Field Data...",
  "Synchronizing Project Assets...",
  "Finalizing Interface...",
  "Welcome to SmartERP."
]

export function LandingPage() {
  const router = useRouter()
  const [counters, setCounters] = useState({ users: 0, jobs: 0, teams: 0 })
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)
  const [shutterOpen, setShutterOpen] = useState(false)
  const [contentVisible, setContentVisible] = useState(false)

  // Demo Video Controls
  const demoVideoRef = useRef<HTMLVideoElement | null>(null)
  const [isDemoPlaying, setIsDemoPlaying] = useState(true)
  const [isDemoMuted, setIsDemoMuted] = useState(true)

  // Hero Video Controls
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)
  const [isHeroMuted, setIsHeroMuted] = useState(true)

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const setSectionRef = (key: string) => (el: HTMLDivElement | null) => {
    if (el) sectionRefs.current[key] = el
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }))
          }
        })
      },
      { threshold: 0.1 }
    )

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  // Cinematic Loader Logic
  useEffect(() => {
    let currentProgress = 0
    const interval = setInterval(() => {
      if (currentProgress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          setShutterOpen(true)
          setTimeout(() => {
            setContentVisible(true)
            setLoading(false)
          }, 800)
        }, 1000)
      } else {
        const increment = (100 - currentProgress) * (Math.random() * 0.15 + 0.05)
        currentProgress += Math.max(increment, 1)
        setProgress(Math.min(currentProgress, 100))
        setStatusIndex(Math.floor((currentProgress / 101) * STAGES.length))
      }
    }, 120)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        setCounters((prev) => ({
          users: prev.users < 5000 ? prev.users + 100 : 5000,
          jobs: prev.jobs < 50000 ? prev.jobs + 1000 : 50000,
          teams: prev.teams < 1200 ? prev.teams + 25 : 1200,
        }))
      }, 30)
      return () => clearInterval(interval)
    }
  }, [loading])

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
    <>
      {loading && (
        <div className={`flagship-loader ${shutterOpen ? "shutter-open" : ""}`}>
          <div className="loader-content">
            <div className="loader-logo">SmartERP<span>™</span></div>
            <div className="flagship-status">{STAGES[statusIndex]}</div>
            <div className="flagship-bar">
              <div className="flagship-progress" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      <div className={`min-h-screen relative overflow-hidden entrance-content ${contentVisible ? "visible" : ""}`}>
        <div className="cinema-grain"></div>
        <AntigravityBackground />

        {/* ── 1. Navigation Header ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-foreground">
                SmartERP<span className="text-blue-500">.</span>
              </span>
            </div>

            {/* Navigation items */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
              <a href="#demo" className="hover:text-foreground transition-colors">Product Demo</a>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#benefits" className="hover:text-foreground transition-colors">Why SmartERP</a>
              <a href="#customer-portal" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                Customer Portal
              </a>
            </nav>

            <div className="flex items-center gap-3">
              {/* Customer Portal Quick Action */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/customer/landing")}
                className="hidden sm:inline-flex items-center gap-2 border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-white transition-all shadow-xs"
              >
                <UserCheck className="h-4 w-4" />
                Customer Portal
              </Button>

              <Button variant="ghost" size="sm" onClick={() => router.push("/auth/login?mode=login")} className="hover-lift">
                Sign In
              </Button>
              <Button size="sm" onClick={() => router.push("/auth/login?mode=signup")} className="hover-lift hover-scale bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30">
                Get Started
              </Button>
            </div>
          </div>
        </header>

        {/* ── 2. Hero Section with Integrated Showcase Video ──────────────── */}
        <section className="relative min-h-[90vh] flex flex-col justify-center items-center overflow-hidden pt-12 pb-20">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8 backdrop-blur-md animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Next-Gen ERP & Field Workforce Intelligence
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold text-foreground mb-6 tracking-tight leading-tight max-w-4xl mx-auto">
              Streamline Field Crews & Operations{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                With Precision.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The unified platform for construction, service, and field teams. Track real-time jobs, automate payroll, and deliver live status visibility to your customers.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button
                size="lg"
                onClick={() => router.push("/auth/login?mode=signup")}
                className="w-full sm:w-auto text-base font-semibold px-8 py-6 bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 group hover-lift"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/customer/landing")}
                className="w-full sm:w-auto text-base font-semibold px-8 py-6 border-blue-500/30 bg-blue-950/20 text-blue-300 hover:bg-blue-900/40 hover:text-white backdrop-blur-md group hover-lift"
              >
                <UserCheck className="mr-2 h-5 w-5 text-blue-400" />
                Access Customer Portal
                <ExternalLink className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>

            {/* Hero Video Showcase Frame */}
            <div className="relative max-w-5xl mx-auto rounded-2xl border border-white/10 shadow-2xl shadow-blue-900/20 overflow-hidden bg-slate-950/80 backdrop-blur-xl group">
              {/* Glass Header Bar */}
              <div className="bg-slate-900/90 border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="text-xs text-slate-400 font-mono flex items-center gap-2 bg-slate-950/60 px-3 py-1 rounded-md border border-white/5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                  prozync.in/platform-overview
                </div>
                <button
                  onClick={toggleHeroMute}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
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
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40 pointer-events-none" />
              </div>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mt-16">
              <div className="p-5 rounded-2xl bg-card/30 backdrop-blur-md border border-border/40 hover:border-blue-500/40 transition-all">
                <div className="text-3xl font-extrabold text-blue-400 mb-1">
                  {counters.users.toLocaleString()}+
                </div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Crews</div>
              </div>
              <div className="p-5 rounded-2xl bg-card/30 backdrop-blur-md border border-border/40 hover:border-indigo-500/40 transition-all">
                <div className="text-3xl font-extrabold text-indigo-400 mb-1">
                  {counters.jobs.toLocaleString()}+
                </div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Jobs Dispatched</div>
              </div>
              <div className="p-5 rounded-2xl bg-card/30 backdrop-blur-md border border-border/40 hover:border-purple-500/40 transition-all">
                <div className="text-3xl font-extrabold text-purple-400 mb-1">
                  {counters.teams.toLocaleString()}+
                </div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Enterprise Teams</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Product Showcase Video Section ("See SmartERP in Action") ── */}
        <section id="demo" ref={setSectionRef("demo")} className="py-24 px-4 sm:px-6 lg:px-8 relative bg-slate-950/40 border-y border-border/40">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Interactive Product Demo
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
              See SmartERP in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-14">
              Watch how SmartERP connects owners, HR, field crews, and customers into one seamless real-time workflow.
            </p>

            {/* Browser Device Mockup Frame */}
            <div className="relative max-w-4xl mx-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-indigo-950/40 overflow-hidden group">
              {/* Top Bar */}
              <div className="bg-slate-950/90 px-4 py-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="text-xs font-mono text-slate-400 bg-slate-900 px-4 py-1 rounded-md border border-white/5">
                  app.prozync.in/live-demo
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleDemoMute}
                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                    title={isDemoMuted ? "Unmute" : "Mute"}
                  >
                    {isDemoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-indigo-400" />}
                  </button>
                  <button
                    onClick={toggleDemoPlay}
                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
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
                  src="/videos/product-demo.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Overlaid Play/Pause Control Button */}
                <button
                  onClick={toggleDemoPlay}
                  className="absolute bottom-4 left-4 flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-md transition-all border border-white/10"
                >
                  {isDemoPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  {isDemoPlaying ? "Pause Video" : "Play Video"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Customer Portal Highlight Banner ─────────────────────────── */}
        <section id="customer-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/90 border border-blue-500/30 p-8 sm:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                  <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                  For Service Clients & Homeowners
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Track Your Service Requests Live
                </h3>
                <p className="text-slate-300 text-base leading-relaxed">
                  Are you a customer of a company powered by Prozync SmartERP? Access your dedicated client portal to view technician updates, live map tracking, and job status in real-time.
                </p>
                <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-300 font-medium">
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

              <div className="flex flex-col sm:flex-row lg:flex-col gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => router.push("/customer/landing")}
                  className="w-full text-base font-semibold px-6 py-6 bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 hover-lift"
                >
                  <UserCheck className="mr-2 h-5 w-5" />
                  Access Customer Portal
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/customer/login")}
                  className="w-full text-base font-semibold px-6 py-6 border-white/20 bg-white/5 hover:bg-white/10 text-white hover-lift"
                >
                  Customer Sign In
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Features Grid Section ───────────────────────────────────── */}
        <section ref={setSectionRef("features")} id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Built for Field Operations & Scalability
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to command field crews, manage jobs, process payroll, and delight customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-950/10 transition-all duration-300 hover-lift"
                >
                  <div className="mb-4 p-3 bg-blue-500/10 rounded-xl w-fit group-hover:bg-blue-500/20 transition-colors duration-300">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── 6. Benefits & Comparison ───────────────────────────────────── */}
        <section ref={setSectionRef("benefits")} id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-8">
                Why Industry Leaders Choose SmartERP
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-lg text-foreground font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-card/60 to-card/20 border border-border/50 backdrop-blur-md shadow-2xl">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Smartphone className="h-6 w-6 text-blue-400" />
                Mobile-First Field PWA
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Field technicians and supervisors get instant access on any smartphone without app store friction. Clock-in with GPS, update job progress, request materials, and view schedules on-the-go.
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-border/40 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-green-400" /> Offline Sync</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-green-400" /> Push Notifications</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-green-400" /> Web & APK Bridge</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. Primary CTA Section ──────────────────────────────────────── */}
        <section ref={setSectionRef("cta")} id="cta" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-12 text-center shadow-2xl border border-blue-500/30">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl font-extrabold mb-4">Ready to Modernize Your Operations?</h2>
              <p className="text-lg mb-8 text-blue-100/90 leading-relaxed">
                Join field service and construction teams managing their crews efficiently with SmartERP.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => router.push("/auth/login?mode=signup")}
                  className="text-base font-semibold px-8 py-6 bg-white hover:bg-slate-100 text-slate-900 shadow-xl hover-lift"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/customer/landing")}
                  className="text-base font-semibold px-8 py-6 border-white/20 bg-white/10 hover:bg-white/20 text-white hover-lift"
                >
                  <UserCheck className="mr-2 h-5 w-5" />
                  Access Customer Portal
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. Contact Info Bar ─────────────────────────────────────────── */}
        <section className="border-t border-border/50 bg-card/20 backdrop-blur-sm py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Enterprise Inquiries & Support</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-foreground text-sm font-medium">
              <a href="mailto:prozyncinnovations@gmail.com" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>prozyncinnovations@gmail.com</span>
              </a>
              <a href="tel:+919535134351" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                <Phone className="h-4 w-4 text-blue-400" />
                <span>+91 9535134351</span>
              </a>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>Bangalore, India</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 9. Footer ───────────────────────────────────────────────────── */}
        <footer className="border-t border-border/50 bg-card/30 backdrop-blur-md py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left mb-10">
              <div className="space-y-4 md:col-span-1">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <div className="p-2 bg-blue-600 rounded-xl">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-extrabold text-xl">SmartERP</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enterprise field workforce management and real-time customer service tracking.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">Portals</h4>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li>
                    <button onClick={() => router.push("/customer/landing")} className="hover:text-blue-400 transition-colors flex items-center gap-1.5 mx-auto md:mx-0">
                      <UserCheck className="h-3.5 w-3.5 text-blue-400" /> Customer Portal
                    </button>
                  </li>
                  <li><button onClick={() => router.push("/customer/login")} className="hover:text-foreground transition-colors">Customer Sign In</button></li>
                  <li><button onClick={() => router.push("/auth/login")} className="hover:text-foreground transition-colors">Staff & Crew Sign In</button></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">Product</h4>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li><a href="#demo" className="hover:text-foreground transition-colors">Interactive Demo</a></li>
                  <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                  <li><a href="#benefits" className="hover:text-foreground transition-colors">Why SmartERP</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">Legal</h4>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li><button onClick={() => router.push("/terms")} className="hover:text-foreground transition-colors">Terms of Service</button></li>
                  <li><button onClick={() => router.push("/privacy")} className="hover:text-foreground transition-colors">Privacy Policy</button></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} SmartERP. All rights reserved. Prozync Innovations.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

