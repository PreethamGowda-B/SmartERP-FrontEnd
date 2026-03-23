"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLoading } from "@/contexts/loading-context"

/**
 * Ultra-premium Loading Component
 * Features:
 * - Glassmorphism card (backdrop-blur-2xl, subtle white/black translucency)
 * - Thin circular progress ring (Stripe/Apple style)
 * - Pulsing micro-dots
 * - Clean, modern typography with widened tracking
 * - Framer Motion for calm, high-end transitions
 */
export default function PremiumLoader() {
  const { isLoading, message } = useLoading()

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-md"
        >
          {/* Main Glassmorphism Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative flex flex-col items-center justify-center p-12 overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] w-[320px]"
          >
            {/* The Loader Ring */}
            <div className="relative w-16 h-16 mb-8">
              {/* Static Background Ring */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="opacity-10 text-primary"
                />
              </svg>
              
              {/* Rotating Progress Ring */}
              <motion.svg 
                className="absolute inset-0 w-full h-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              >
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="175"
                  strokeDashoffset="120"
                  strokeLinecap="round"
                  className="text-primary"
                />
              </motion.svg>

              {/* Center Micro-animations (Pulsing Dots) */}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                ))}
              </div>
            </div>

            {/* Context-aware Text */}
            <div className="text-center">
              <motion.span 
                key={message}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="block text-sm font-medium tracking-widest uppercase text-foreground/70"
              >
                {message || "Processing"}
              </motion.span>
              <div className="mt-2 flex justify-center gap-0.5">
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                  className="w-1 h-1 rounded-full bg-primary/40"
                />
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-1 h-1 rounded-full bg-primary/40"
                />
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-1 h-1 rounded-full bg-primary/40"
                />
              </div>
            </div>
            
            {/* Subtle Gradient Glow */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 dark:opacity-10 bg-gradient-to-br from-primary via-transparent to-accent" />
          </motion.div>
          
          {/* CINEMA GRAIN OVERLAY (Bonus for texture) */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] animate-pulse-soft z-[-1] bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')]" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
