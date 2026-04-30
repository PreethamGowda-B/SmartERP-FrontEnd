"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("premium-card animate-pulse", className)}>
      <CardHeader className="space-y-2 pb-4">
        <div className="h-5 w-1/3 bg-muted rounded-md" />
        <div className="h-3 w-2/3 bg-muted/60 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-24 w-full bg-muted/40 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-8 flex-1 bg-muted/50 rounded-md" />
          <div className="h-8 flex-1 bg-muted/50 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
