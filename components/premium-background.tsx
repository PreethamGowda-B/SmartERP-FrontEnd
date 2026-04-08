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

  if (!mounted) return <div className="absolute inset-0 bg-background z-0" />

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-background">
      {/* Optimized Background Motion Layers */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ willChange: "transform" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-slate-200 dark:bg-slate-700 blur-[60px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            y: [0, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 1 }}
          style={{ willChange: "transform" }}
          className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-[80px]"
        />
      </div>

      {/* Simplified Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.2 + 0.1,
              backgroundColor: '#3b82f6',
              willChange: "transform"
            }}
            animate={{
              y: [0, -60],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Lightweight Grid Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #000000 0.5px, transparent 0.5px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Performance-tuned Cursor Spotlight */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[50px] pointer-events-none"
        animate={{
          x: `calc(-50% + ${mousePosition.x * 1.2}px)`,
          y: `calc(-50% + ${mousePosition.y * 1.2}px)`,
        }}
        transition={{ type: "spring", damping: 60, stiffness: 60 }}
        style={{ willChange: "transform" }}
      />
      
      {/* Soft focus vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.05)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
    </div>
  )
}
