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
      checked={checked}
      onCheckedChange={onCheckedChange}
      {...props}
      className={`relative inline-flex items-center justify-between h-[28px] w-[54px] rounded-full transition-colors duration-300 shadow-sm focus-visible:outline-none ${className || ''}`}
      style={{ background: checked ? darkBg : lightBg, padding: '0 4px' }}
    >
      <style>{`
        @keyframes thumbBounce {
          0% { transform: translateY(0) scale(1) }
          40% { transform: translateY(-4px) scale(1.05) }
          100% { transform: translateY(0) scale(1) }
        }
        .thumb-gloss { position: absolute; inset: 0; border-radius: 9999px; pointer-events: none; }
        .thumb-gloss::after {
          content: '';
          position: absolute;
          left: 3px;
          right: 3px;
          top: 1px;
          height: 5px;
          border-radius: 9999px;
          background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.15));
          mix-blend-mode: overlay;
        }
        @media (prefers-reduced-motion: reduce) {
          .theme-thumb { transition: none !important; animation: none !important; }
          .theme-root { transition: none !important; }
        }
      `}</style>

      {/* Labels */}
      <span
        className={`absolute left-[6px] text-[9px] font-semibold select-none ${
          checked ? 'text-white opacity-60' : 'text-gray-700'
        }`}
      >
        L
      </span>
      <span
        className={`absolute right-[6px] text-[9px] font-semibold select-none ${
          checked ? 'text-gray-400' : 'text-black opacity-70'
        }`}
      >
        D
      </span>

      {/* Thumb */}
      <SwitchPrimitive.Thumb
        className={`theme-thumb relative z-10 block h-[20px] w-[20px] rounded-full shadow-md ring-0 transition-transform duration-300 ease-in-out transform ${
          checked ? 'translate-x-[26px]' : 'translate-x-0'
        }`}
        style={{
          background: checked ? '#000' : '#fff',
        }}
      >
        <span className="thumb-gloss" aria-hidden />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}
