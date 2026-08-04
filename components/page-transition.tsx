"use client"
import { useNavLoading } from "./nav-loading-context"

export default function PageTransition() {
  const { loadingId } = useNavLoading()

  if (!loadingId) return null

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-primary/20 overflow-hidden"
    >
      <div className="h-full bg-primary animate-pulse w-2/3 transition-all duration-300" />
    </div>
  )
}
