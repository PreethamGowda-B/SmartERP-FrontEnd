"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ErrorViewProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorView({ 
  title = "Something went wrong", 
  message = "We encountered an error while fetching the data. Please try again.", 
  onRetry 
}: ErrorViewProps) {
  return (
    <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {message}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 btn-premium">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
