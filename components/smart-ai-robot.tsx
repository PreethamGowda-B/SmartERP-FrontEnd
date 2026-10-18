"use client"

import { useId } from "react"
import Image from "next/image"
import { Mic, Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

export type SmartAIRobotMood = "idle" | "thinking" | "success" | "error" | "listening"

/** Shared SmartERP AI mascot: a 3D full-body figure for launcher/hero and a compact face for avatars. */
export function SmartAIRobot({
  mood = "idle",
  size = "md",
}: {
  mood?: SmartAIRobotMood
  size?: "sm" | "md" | "lg" | "hero"
}) {
  const reduceMotion = useReducedMotion()
  const id = useId().replace(/:/g, "")
  const dimensions = { sm: 38, md: 54, lg: 88, hero: 128 }[size]
  const eyeColor = mood === "error" ? "#fb7185" : mood === "success" ? "#34d399" : "#69d7ff"
  const shouldAnimate = !reduceMotion && (size !== "sm" || mood === "thinking" || mood === "listening")
  const usesFullBodyMascot = size === "lg" || size === "hero"

  return (
    <motion.div
      aria-hidden="true"
      className="relative shrink-0"
      style={{ width: dimensions, height: dimensions }}
      animate={shouldAnimate ? { y: [0, -2, 0] } : undefined}
      transition={shouldAnimate ? { duration: mood === "thinking" ? 0.9 : 3.2, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {usesFullBodyMascot ? (
        <>
          <Image
            src="/ai/smarterp-ai-robot.png"
            alt=""
            aria-hidden="true"
            width={dimensions}
            height={dimensions}
            priority={size === "hero"}
            className="h-full w-full select-none object-contain drop-shadow-[0_10px_12px_rgba(91,75,232,.22)]"
            draggable={false}
          />
          {mood === "thinking" && (
            <motion.span
              className="absolute -right-1 top-1 flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-full border border-violet-200 bg-white/95 px-1.5 shadow-[0_4px_12px_rgba(91,75,232,.2)]"
              aria-hidden="true"
              animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="h-1 w-1 rounded-full bg-violet-500" />
              <span className="h-1 w-1 rounded-full bg-violet-500/70" />
              <span className="h-1 w-1 rounded-full bg-violet-500/45" />
            </motion.span>
          )}
          {mood === "listening" && (
            <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-violet-600 text-white shadow-md" aria-hidden="true">
              <Mic className="h-3.5 w-3.5" />
            </span>
          )}
          {mood === "success" && (
            <span className="absolute right-1 top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-md" aria-hidden="true">
              <Sparkles className="h-3 w-3" />
            </span>
          )}
          {mood === "error" && (
            <span className="absolute right-2 top-2 h-3 w-3 rounded-full border-2 border-white bg-rose-500 shadow-sm" aria-hidden="true" />
          )}
        </>
      ) : (
      <svg viewBox="0 0 80 80" width={dimensions} height={dimensions} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${id}-shell`} x1="16" y1="12" x2="66" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff" />
            <stop offset=".58" stopColor="#f4f1ff" />
            <stop offset="1" stopColor="#d9d3ff" />
          </linearGradient>
          <linearGradient id={`${id}-accent`} x1="15" y1="0" x2="66" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a78bfa" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id={`${id}-face`} x1="24" y1="24" x2="59" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10152f" />
            <stop offset="1" stopColor="#080b1c" />
          </linearGradient>
          <filter id={`${id}-shadow`} x="3" y="8" width="74" height="72" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#5b4be8" floodOpacity=".22" />
          </filter>
        </defs>
        <ellipse cx="40" cy="73" rx="23" ry="4" fill="#7163de" opacity=".13" />
        <path d="M40 13V7" stroke="#7561e8" strokeWidth="2.5" strokeLinecap="round" />
        <motion.circle cx="40" cy="5" r="4" fill="#7c5cff"
          animate={reduceMotion || mood !== "thinking" ? undefined : { opacity: [.55, 1, .55], scale: [1, 1.18, 1] }}
          transition={{ duration: .8, repeat: Infinity }} />
        <g filter={`url(#${id}-shadow)`}>
          <path d="M17 35c0-12.7 10.3-23 23-23s23 10.3 23 23v14c0 12.7-10.3 23-23 23S17 61.7 17 49V35Z" fill={`url(#${id}-shell)`} stroke="#c9c1ff" strokeWidth="1.5" />
          <path d="M16.5 34.5c0-13 10.5-23.5 23.5-23.5s23.5 10.5 23.5 23.5v3H16.5v-3Z" fill={`url(#${id}-accent)`} opacity=".2" />
          <rect x="9" y="32" width="8" height="19" rx="4" fill={`url(#${id}-accent)`} />
          <rect x="63" y="32" width="8" height="19" rx="4" fill={`url(#${id}-accent)`} />
          <rect x="23" y="27" width="34" height="30" rx="12" fill={`url(#${id}-face)`} stroke="#d2caff" strokeWidth="1.5" />
          {mood === "thinking" ? (
            <>
              <circle cx="34" cy="42" r="2.1" fill={eyeColor} />
              <circle cx="47" cy="42" r="2.1" fill={eyeColor} />
              <motion.circle cx="34" cy="42" r="4.4" stroke={eyeColor} strokeWidth="1" opacity=".45" animate={reduceMotion ? undefined : { scale: [1, 1.35, 1], opacity: [.25, .65, .25] }} transition={{ duration: .9, repeat: Infinity }} />
            </>
          ) : mood === "listening" ? (
            <>
              <circle cx="34" cy="42" r="4.2" fill={eyeColor} />
              <circle cx="47" cy="42" r="4.2" fill={eyeColor} />
              <circle cx="34" cy="42" r="1.7" fill="white" />
              <circle cx="47" cy="42" r="1.7" fill="white" />
            </>
          ) : mood === "error" ? (
            <path d="M31 44c2.2-3 4.5-3 6.5 0m5.5 0c2.2-3 4.5-3 6.5 0" stroke={eyeColor} strokeWidth="2.4" strokeLinecap="round" />
          ) : (
            <path d="M30 43c2.4-4.8 6.4-4.8 8.5 0m3 0c2.4-4.8 6.4-4.8 8.5 0" stroke={eyeColor} strokeWidth="2.6" strokeLinecap="round" />
          )}
          <path d="M32 63c2.5 2 5.2 3 8 3s5.5-1 8-3" stroke="#a69afa" strokeWidth="1.7" strokeLinecap="round" opacity=".8" />
        </g>
      </svg>
      )}
      {mood === "thinking" && !usesFullBodyMascot && (
        <motion.span className="absolute -right-0.5 top-2 h-2 w-2 rounded-full bg-violet-500" aria-hidden="true"
          animate={reduceMotion ? undefined : { opacity: [.35, 1, .35], scale: [.8, 1.15, .8] }} transition={{ duration: .9, repeat: Infinity }} />
      )}
    </motion.div>
  )
}
