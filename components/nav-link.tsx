"use client"

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useNavLoading } from './nav-loading-context'
import { Loader2 } from 'lucide-react'

export function NavLink({ href, children, id, className }: { href: string; children: React.ReactNode; id?: string; className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const { loadingId, setLoadingId } = useNavLoading()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Already on this route — do nothing to avoid infinite loading
    if (pathname === href) return
    const navId = id || href
    setLoadingId(navId)
    router.push(href)
  }

  const isLoading = loadingId === (id || href)

  return (
    <a href={href} onClick={handleClick} className={className}>
      {isLoading ? (
        <span className="inline-flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> {children}
        </span>
      ) : (
        children
      )}
    </a>
  )
}
