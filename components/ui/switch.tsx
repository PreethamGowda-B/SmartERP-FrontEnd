'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

type SwitchSize = 'default' | 'compact' | 'theme'

export type SwitchProps = Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, 'children'> & {
  /** Keeps track and thumb dimensions paired so their travel is always calculated correctly. */
  size?: SwitchSize
  /** Adds the decorative L/D marks used by the theme control. */
  showThemeLabels?: boolean
}

const switchMetrics: Record<SwitchSize, { track: number; thumb: number; inset: number }> = {
  default: { track: 44, thumb: 16, inset: 3 },
  compact: { track: 36, thumb: 14, inset: 3 },
  theme: { track: 54, thumb: 20, inset: 4 },
}

function Switch({
  className,
  size = 'default',
  showThemeLabels = false,
  style,
  ...props
}: SwitchProps) {
  const metrics = switchMetrics[size]
  const switchStyle = {
    ...style,
    '--switch-track-width': `${metrics.track}px`,
    '--switch-thumb-size': `${metrics.thumb}px`,
    '--switch-inset': `${metrics.inset}px`,
    '--switch-travel': `${metrics.track - (2 * metrics.inset) - metrics.thumb}px`,
  } as React.CSSProperties

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-0 bg-slate-200 shadow-sm outline-none transition-colors duration-200 hover:bg-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:hover:bg-blue-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:hover:bg-blue-400 motion-reduce:transition-none',
        size === 'default' && 'h-6 w-11',
        size === 'compact' && 'h-5 w-9',
        size === 'theme' && 'h-7 w-[54px]',
        className,
      )}
      style={switchStyle}
      {...props}
    >
      {showThemeLabels && (
        <>
          <span aria-hidden="true" className="pointer-events-none absolute left-[7px] z-0 text-[9px] font-bold text-slate-500 dark:text-slate-300">L</span>
          <span aria-hidden="true" className="pointer-events-none absolute right-[7px] z-0 text-[9px] font-bold text-slate-500 dark:text-slate-300">D</span>
        </>
      )}
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none absolute left-[var(--switch-inset)] top-1/2 z-10 block -translate-y-1/2 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-[translate] duration-200 ease-out data-[state=checked]:translate-x-[var(--switch-travel)] data-[state=unchecked]:translate-x-0 dark:bg-slate-100 motion-reduce:transition-none',
          size === 'default' && 'h-4 w-4',
          size === 'compact' && 'h-3.5 w-3.5',
          size === 'theme' && 'h-5 w-5',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
