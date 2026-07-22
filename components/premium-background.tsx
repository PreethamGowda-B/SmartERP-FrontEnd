"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function PremiumBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) * 0.04,
        y: (e.clientY - window.innerHeight / 2) * 0.04,
      })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  if (!mounted) return <div className="absolute inset-0 bg-slate-950 z-0" />

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
      {/* 🔮 Deep Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 opacity-90" />

      {/* 🌊 Glowing Ambient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 40, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-blue-600/25 blur-[120px] pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -40, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[140px] pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[110px] pointer-events-none"
      />

      {/* ✨ Floating Subtle Micro-particles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-400/40"
            style={{
              width: (i % 3 + 1) * 2 + "px",
              height: (i % 3 + 1) * 2 + "px",
              top: (i * 4.2) % 100 + "%",
              left: (i * 7.3) % 100 + "%",
            }}
            animate={{
              y: [0, -80],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: 10 + (i % 5) * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* 📐 Modern Tech Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* 🎯 Interactive Dynamic Mouse Spotlight */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none"
        animate={{
          x: `calc(-50% + ${mousePosition.x * 1.5}px)`,
          y: `calc(-50% + ${mousePosition.y * 1.5}px)`,
        }}
        transition={{ type: "spring", damping: 50, stiffness: 50 }}
      />

      {/* Soft Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.6)_100%)] pointer-events-none" />
    </div>
  )
}
