"use client"

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

export default function ThemeSwitch({ checked, onCheckedChange, className, ...props }: any) {
  const darkBg = '#2b2b2b'
  const lightBg = '#f3f3f3'

  return (
    <SwitchPrimitive.Root
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 shadow-sm focus-visible:outline-none ${className || ''}`}
      checked={checked}
      onCheckedChange={onCheckedChange}
      {...props}
      style={{ background: checked ? darkBg : lightBg }}
    >
      <style>{`
        @keyframes thumbBounce {
          0% { transform: translateY(0) scale(1) }
          40% { transform: translateY(-6px) scale(1.05) }
          100% { transform: translateY(0) scale(1) }
        }
        .thumb-gloss { position: absolute; inset: 0; border-radius: 9999px; pointer-events: none; }
        .thumb-gloss::after { content: ''; position: absolute; left: 6px; right: 6px; top: 2px; height: 8px; border-radius: 9999px; background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.15)); mix-blend-mode: overlay; }
        @media (prefers-reduced-motion: reduce) {
          .theme-thumb { transition: none !important; animation: none !important; }
          .theme-root { transition: none !important; }
        }
      `}</style>

      <span className={`absolute left-2 text-[10px] font-semibold select-none ${checked ? 'text-white' : 'text-gray-600'}`}>LIGHT</span>
      <span className={`absolute right-2 text-[10px] font-semibold select-none ${checked ? 'text-gray-600' : 'text-black'}`}>DARK</span>

      <SwitchPrimitive.Thumb
        className={`theme-thumb relative z-10 block h-6 w-6 rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out transform ${checked ? 'translate-x-8' : 'translate-x-0'}`}
        style={ checked ? { background: '#000' } : { background: '#fff' } }
        onAnimationEnd={() => { /* no-op; kept for potential future hooks */ }}
      >
        <span className="thumb-gloss" aria-hidden />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}
