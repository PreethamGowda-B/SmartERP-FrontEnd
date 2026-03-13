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

  if (!mounted) return <div className="absolute inset-0 bg-[#060913] z-0" />

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#060913]">
      {/* Deep Animated Gradient Mesh */}
      <div className="absolute inset-0 opacity-60">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/60 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/40 blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-blue-900/50 blur-[130px]"
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 1 + "px",
              height: Math.random() * 4 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 + 0.1,
              backgroundColor: Math.random() > 0.5 ? '#818cf8' : '#22d3ee', // mix of indigo and cyan
              boxShadow: '0 0 10px 2px rgba(255,255,255,0.2)'
            }}
            animate={{
              y: [0, -Math.random() * 120 - 60],
              x: [0, (Math.random() - 0.5) * 60],
              opacity: [0.1, 0.8, 0.1],
              scale: [1, Math.random() + 1, 1],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
          />
        ))}
      </div>

      {/* Subtle Grid / Texture for Tech Feel */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Center Glassmorphism Glow for depth behind the card */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none"
        animate={{
          x: `calc(-50% + ${mousePosition.x}px)`,
          y: `calc(-50% + ${mousePosition.y}px)`,
        }}
        transition={{ type: "spring", damping: 40, stiffness: 100 }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-[90px] pointer-events-none mix-blend-screen"
        animate={{
          x: `calc(-50% - ${mousePosition.x * 1.5}px)`,
          y: `calc(-50% - ${mousePosition.y * 1.5}px)`,
        }}
        transition={{ type: "spring", damping: 40, stiffness: 100 }}
      />

      {/* Ambient Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#060913_120%)] pointer-events-none" />
    </div>
  )
}
