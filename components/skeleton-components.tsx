"use client"

import React from "react"
import { motion } from "framer-motion"

const shimmer = {
  initial: { x: "-100%" },
  animate: { x: "100%" },
  transition: {
    repeat: Infinity,
    duration: 1.5,
    ease: "linear",
  },
}

export function SkeletonBase({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden bg-muted/20 rounded-md ${className}`}>
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent w-full h-full"
      />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-4 p-4 border border-border/50 rounded-xl bg-card/10 backdrop-blur-sm">
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b border-border/20">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBase key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonBase key={j} className={`h-8 flex-1 ${j === 0 ? "w-1/4" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="p-6 space-y-4 border border-border/50 rounded-2xl bg-card/10 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <SkeletonBase className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <SkeletonBase className="h-4 w-[150px]" />
          <SkeletonBase className="h-4 w-[100px]" />
        </div>
      </div>
      <SkeletonBase className="h-32 w-full" />
      <div className="flex justify-between">
        <SkeletonBase className="h-10 w-24" />
        <SkeletonBase className="h-10 w-24" />
      </div>
    </div>
  )
}
