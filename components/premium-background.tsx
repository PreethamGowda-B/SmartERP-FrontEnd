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
        x: (e.clientX - window.innerWidth / 2) * 0.05,
        y: (e.clientY - window.innerHeight / 2) * 0.05,
      })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  if (!mounted) return <div className="absolute inset-0 bg-white z-0" />

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-white">
      {/* Cinematic Video-style Background Motion (White Theme) */}
      <div className="absolute inset-0 opacity-40">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-slate-200 blur-[130px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[150px]"
        />
      </div>

      {/* Floating Particles (Refined for Light Theme) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.3 + 0.1,
              backgroundColor: '#3b82f6', // subtle primary blue
              boxShadow: '0 0 4px rgba(59, 130, 246, 0.2)'
            }}
            animate={{
              y: [0, -Math.random() * 80 - 40],
              x: [0, (Math.random() - 0.5) * 40],
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 12 + 8,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Modern Grid Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #000000 0.5px, transparent 0.5px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Interactive Cursor "Spotlight" Animation */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px] pointer-events-none"
        animate={{
          x: `calc(-50% + ${mousePosition.x * 2}px)`,
          y: `calc(-50% + ${mousePosition.y * 2}px)`,
        }}
        transition={{ type: "spring", damping: 50, stiffness: 80 }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[70px] pointer-events-none"
        animate={{
          x: `calc(-50% - ${mousePosition.x}px)`,
          y: `calc(-50% - ${mousePosition.y}px)`,
        }}
        transition={{ type: "spring", damping: 60, stiffness: 70 }}
      />

      {/* Soft Vignette for focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.4)_120%)] pointer-events-none" />
    </div>
  )
}
