"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-border/50",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6 text-primary animate-float">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2 shadow-lg shadow-primary/20 btn-premium">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
