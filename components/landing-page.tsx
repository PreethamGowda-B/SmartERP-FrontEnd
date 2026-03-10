"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AntigravityBackground } from "@/components/ui/antigravity-background"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
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
} from "lucide-react"
import { useState, useEffect, useRef } from "react"

export function LandingPage() {
  const router = useRouter()
  const [counters, setCounters] = useState({ users: 0, jobs: 0, teams: 0 })
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({})

  // Advanced scroll tracking for parallax
  const { scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  const opacity = useTransform(smoothProgress, [0, 0.2], [1, 0])
  const scale = useTransform(smoothProgress, [0, 0.2], [1, 0.95])

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCounters((prev) => ({
        users: prev.users < 5000 ? prev.users + 100 : 5000,
        jobs: prev.jobs < 50000 ? prev.jobs + 1000 : 50000,
        teams: prev.teams < 1200 ? prev.teams + 25 : 1200,
      }))
    }, 30)

    return () => clearInterval(interval)
  }, [])

  const features = [
    { icon: Users, title: "Team Management", description: "Manage your crew with role-based access, employee profiles, and team assignments." },
    { icon: Building2, title: "Job Tracking", description: "Track jobs from start to finish with real-time updates and progress monitoring." },
    { icon: Clock, title: "Time Tracking", description: "GPS-enabled time tracking with automatic overtime calculation and break management." },
    { icon: DollarSign, title: "Payroll", description: "Automated payroll processing with tax calculations and direct deposit integration." },
    { icon: MessageSquare, title: "AI Assistant", description: "Smart chatbot for instant answers about schedules, policies, and job information." },
    { icon: MapPin, title: "GPS Tracking", description: "Real-time location tracking for field teams with geofencing and route optimization." },
    { icon: Shield, title: "Security", description: "Enterprise-grade security with role-based permissions and data encryption." },
    { icon: Zap, title: "Automation", description: "Automate repetitive tasks like scheduling, notifications, and report generation." },
  ]

  const benefits = [
    "Reduce operational costs by up to 40%",
    "Increase team productivity and efficiency",
    "Real-time visibility across all operations",
    "Automated compliance and reporting",
    "Mobile-first design for field teams",
    "24/7 customer support included",
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AntigravityBackground />

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="p-2 bg-primary rounded-xl shadow-2xl shadow-primary/20">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tighter text-foreground">SmartERP</span>
          </motion.div>
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/auth/login")}
              className="text-foreground/80 hover:text-foreground hover:bg-white/5 transition-all font-semibold"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push("/auth/login")}
              className="bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all font-bold rounded-xl px-6"
            >
              Get Started
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        style={{ opacity, scale }}
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20"
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-6xl sm:text-8xl font-black text-foreground mb-10 tracking-tighter leading-[0.9] text-balance">
              <span className="bg-gradient-to-r from-primary via-blue-400 to-accent bg-clip-text text-transparent inline-block">
                Streamline Your
              </span>
              <br />
              <span className="text-foreground drop-shadow-sm">Crew Management</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light leading-relaxed text-balance"
          >
            Complete ERP solution for construction and field service businesses. Manage jobs, track attendance, process payroll, and more.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-24"
          >
            <Button
              size="lg"
              onClick={() => router.push("/auth/login")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-10 py-8 rounded-2xl shadow-2xl shadow-primary/40 transition-all hover:scale-105 active:scale-95 group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/auth/login")}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-lg px-10 py-8 rounded-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
            >
              Learn More
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Counters */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {[
              { label: "Active Users", val: counters.users, color: "text-primary" },
              { label: "Jobs Tracked", val: counters.jobs, color: "text-accent" },
              { label: "Teams", val: counters.teams, color: "text-primary" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10, backgroundColor: "rgba(255,255,255,0.05)" }}
                className="p-10 rounded-[2.5rem] premium-glass transition-all duration-500 group border-white/5"
              >
                <div className={`text-5xl font-black mb-3 ${stat.color} tracking-tighter`}>
                  {stat.val.toLocaleString()}+
                </div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl sm:text-6xl font-black text-foreground mb-6 tracking-tighter">
            Everything in One Orbit
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            A multi-tenant architecture designed for massive scale and tactical precision.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group p-8 rounded-[2rem] premium-glass premium-glass-hover"
              >
                <div className="mb-8 p-5 bg-primary/10 rounded-2xl w-fit group-hover:bg-primary/20 transition-all duration-500 group-hover:rotate-[15deg]">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-5xl font-black text-foreground mb-12 tracking-tighter">
              Modernized For <br />The Field Hub
            </h2>
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="p-1 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xl text-foreground font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[500px] rounded-[3rem] overflow-hidden premium-glass border-white/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="text-center">
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-8xl font-black text-white/10 mb-6 tracking-tighter"
                >
                  SmartERP
                </motion.div>
                <p className="text-xl text-muted-foreground font-light tracking-widest uppercase">Professional Intelligence</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden bg-white text-black rounded-[3rem] p-16 sm:p-24 text-center shadow-2xl shadow-white/10"
        >
          <div className="relative z-10">
            <h2 className="text-5xl sm:text-7xl font-black mb-8 tracking-tighter">Ready to Get Started?</h2>
            <p className="text-xl sm:text-2xl mb-12 font-medium opacity-70 max-w-2xl mx-auto">
              Join thousands of businesses already using SmartERP to manage their crews efficiently.
            </p>
            <Button
              size="lg"
              variant="default"
              onClick={() => router.push("/auth/login")}
              className="bg-black text-white hover:bg-black/90 font-black text-xl px-12 py-10 rounded-[2rem] transition-all hover:scale-105 group shadow-2xl"
            >
              Start Your Free Trial
              <ArrowRight className="ml-3 h-8 w-8 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Contact Info Section */}
      <section className="border-t border-border/50 bg-card/20 backdrop-blur-sm py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h3 className="text-xl font-bold text-foreground mb-4">Contact Us</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-6 text-foreground text-sm">
            <div className="flex items-center gap-2 hover:text-primary transition-colors">
              <span>📧</span>
              <span>prozyncinnovations@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 hover:text-primary transition-colors">
              <span>📞</span>
              <span>+91 9535134351</span>
            </div>
            <div className="flex items-center gap-2 hover:text-primary transition-colors">
              <span>📍</span>
              <span>Bangalore</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/20 backdrop-blur-sm py-8 animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© 2025 SmartERP. All rights reserved. Professional crew management made simple. Mr Preethu Gowda</p>
        </div>
      </footer>
    </div>
  )
}
