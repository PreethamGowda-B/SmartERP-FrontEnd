"use client"

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLoading } from '@/contexts/loading-context'

export function NavLink({ href, children, id, className }: { href: string; children: React.ReactNode; id?: string; className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const { showLoading } = useLoading()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Already on this route — do nothing
    if (pathname === href) return
    
    // Trigger global premium loader with context-aware message
    const message = id ? `Opening ${id}...` : "Loading page..."
    showLoading(message)
    
    // Navigate
    router.push(href)
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
