"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLoading } from '@/contexts/loading-context'

export function NavLink({ href, children, id, className, onClick }: { href: string; children: React.ReactNode; id?: string; className?: string; onClick?: (e?: React.MouseEvent) => void }) {
  const pathname = usePathname()
  const { showLoading } = useLoading()

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick(e)

    // Keep native link behavior for a new tab/window and let Next handle the
    // actual transition. The previous implementation prevented every anchor
    // click and waited for router.push(), leaving the old dashboard visible
    // while a slow route request was in flight.
    if (pathname === href) {
      e.preventDefault()
      return
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return

    const message = id ? `Opening ${id}...` : "Loading page..."
    showLoading(message)
  }

  return (
    <Link href={href} prefetch onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}
