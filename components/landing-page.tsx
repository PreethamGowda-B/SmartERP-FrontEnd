"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
  const [scrollY, setScrollY] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({})

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const setSectionRef = (key: string) => (el: HTMLDivElement | null) => {
    if (el) sectionRefs.current[key] = el
  }

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 animate-fade-in-left">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SmartERP</span>
          </div>
          <div className="flex items-center gap-4 animate-fade-in-right">
            <Button variant="ghost" onClick={() => router.push("/auth/login")} className="hover-lift">
              Sign In
            </Button>
            <Button onClick={() => router.push("/auth/login")} className="hover-lift hover-scale animate-button-glow">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-6xl sm:text-7xl font-bold text-foreground mb-6 text-balance leading-tight">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent animate-text-shimmer">
                Streamline Your
              </span>
              <br />
              <span className="text-foreground animate-fade-in-up stagger-1">Crew Management</span>
            </h1>
          </div>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance animate-fade-in-up stagger-1">
            Complete ERP solution for construction and field service businesses. Manage jobs, track attendance, process payroll, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up stagger-2">
            <Button
              size="lg"
              onClick={() => router.push("/auth/login")}
              className="hover-lift hover-scale animate-press text-lg px-8 py-6 group animate-button-glow"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/auth/login")}
              className="hover-lift hover-scale animate-press text-lg px-8 py-6 group"
            >
              Learn More
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in-up stagger-3">
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur border border-border/50 hover:border-primary/50 transition-all duration-300 hover-lift group animate-stat-card">
              <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                {counters.users.toLocaleString()}+
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div
              className="p-6 rounded-lg bg-card/50 backdrop-blur border border-border/50 hover:border-accent/50 transition-all duration-300 hover-lift group animate-stat-card"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="text-3xl font-bold text-accent mb-2 group-hover:scale-110 transition-transform">
                {counters.jobs.toLocaleString()}+
              </div>
              <div className="text-sm text-muted-foreground">Jobs Tracked</div>
            </div>
            <div
              className="p-6 rounded-lg bg-card/50 backdrop-blur border border-border/50 hover:border-primary/50 transition-all duration-300 hover-lift group animate-stat-card"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                {counters.teams.toLocaleString()}+
              </div>
              <div className="text-sm text-muted-foreground">Teams</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={setSectionRef("features")} id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="text-center mb-16">
          <h2
            className={`text-4xl font-bold text-foreground mb-4 transition-all duration-700 ${
              visibleSections["features"] ? "animate-fade-in-up" : "opacity-0 translate-y-10"
            }`}
          >
            Everything You Need
          </h2>
          <p
            className={`text-lg text-muted-foreground transition-all duration-700 delay-100 ${
              visibleSections["features"] ? "animate-fade-in-up" : "opacity-0 translate-y-10"
            }`}
          >
            Powerful features designed for modern businesses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group p-6 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover-lift animate-feature-card ${
                  visibleSections["features"] ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  animationDelay: visibleSections["features"] ? `${index * 50}ms` : "0ms",
                  transitionDelay: visibleSections["features"] ? `${index * 50}ms` : "0ms",
                }}
              >
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors duration-300 group-hover:scale-110 transform group-hover:rotate-6">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={setSectionRef("benefits")} id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2
              className={`text-4xl font-bold text-foreground mb-8 transition-all duration-700 ${
                visibleSections["benefits"] ? "animate-fade-in-left" : "opacity-0 -translate-x-10"
              }`}
            >
              Why Choose SmartERP?
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 transition-all duration-700 ${
                    visibleSections["benefits"] ? "animate-fade-in-left" : "opacity-0 -translate-x-10"
                  }`}
                  style={{
                    transitionDelay: visibleSections["benefits"] ? `${index * 100}ms` : "0ms",
                  }}
                >
                  <CheckCircle
                    className="h-6 w-6 text-primary flex-shrink-0 mt-1 animate-check-bounce"
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                  <span className="text-lg text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            className={`relative h-96 rounded-lg overflow-hidden transition-all duration-700 ${
              visibleSections["benefits"] ? "animate-fade-in-right" : "opacity-0 translate-x-10"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary/20 mb-4">SmartERP</div>
                <p className="text-muted-foreground">Professional crew management platform</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={setSectionRef("cta")} id="cta" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div
          className={`relative overflow-hidden bg-foreground text-background rounded-2xl p-12 text-center transition-all duration-700 ${
            visibleSections["cta"] ? "animate-fade-in-up" : "opacity-0 translate-y-10"
          }`}
        >
          <div
            className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          />
          <div
            className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
            style={{ animationDelay: "2s", transform: `translateY(${scrollY * 0.4}px)` }}
          />

          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4 animate-fade-in-up">Ready to Get Started?</h2>
            <p className="text-lg mb-8 opacity-90 animate-fade-in-up stagger-1">
              Join thousands of businesses already using SmartERP to manage their crews efficiently.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => router.push("/auth/login")}
              className="hover-lift hover-scale animate-press group animate-button-glow"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="border-t border-border bg-card/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h3 className="text-xl font-bold text-foreground mb-4">Contact Us</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-6 text-foreground text-sm">
            <div className="flex items-center gap-2 hover:text-primary transition-colors">
              <span>📧</span>
              <span>thepreethu01@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 hover:text-primary transition-colors">
              <span>📞</span>
              <span>+91 8310982308</span>
            </div>
            <div className="flex items-center gap-2 hover:text-primary transition-colors">
              <span>📍</span>
              <span>Bangalore</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© 2025 SmartERP. Professional crew management made simple. Mr Preethu Gowda</p>
        </div>
      </footer>
    </div>
  )
}
