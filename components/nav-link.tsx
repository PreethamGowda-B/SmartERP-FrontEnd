"use client"

import Link from 'next/link'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useNavLoading } from './nav-loading-context'
import { Loader2 } from 'lucide-react'

export function NavLink({ href, children, id, className }: { href: string; children: React.ReactNode; id?: string; className?: string }) {
  const router = useRouter()
  const { loadingId, setLoadingId } = useNavLoading()

  const handleClick = async (e: React.MouseEvent) => {
    // prevent default to show loading state
    e.preventDefault()
    const navId = id || href
    setLoadingId(navId)
    // navigate immediately; NavLoadingProvider will keep overlay up until page is ready
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
