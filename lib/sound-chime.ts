"use client"

// Web Audio API Enterprise Chime Synthesizer
// Generates a crisp, pleasant 2-tone notification sound (523.25 Hz [C5] -> 659.25 Hz [E5])

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

// User interaction listener to resume AudioContext if browser suspended it
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {})
    }
    window.removeEventListener("click", unlockAudio)
    window.removeEventListener("keydown", unlockAudio)
    window.removeEventListener("touchstart", unlockAudio)
  }
  window.addEventListener("click", unlockAudio, { once: true })
  window.addEventListener("keydown", unlockAudio, { once: true })
  window.addEventListener("touchstart", unlockAudio, { once: true })
}

export function playEnterpriseChime() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // First Tone: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(523.25, now)
    gain1.gain.setValueAtTime(0.15, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.25)

    // Second Tone: E5 (659.25 Hz) — 0.08s offset for pleasant dual chime
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = "sine"
    osc2.frequency.setValueAtTime(659.25, now + 0.08)
    gain2.gain.setValueAtTime(0.2, now + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.45)
  } catch (e) {
    // Audio synthesis fallback (silent fail if unsupported)
  }
}
