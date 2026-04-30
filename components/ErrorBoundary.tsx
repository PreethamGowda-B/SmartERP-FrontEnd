"use client"

import React, { ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCcw } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              An unexpected error occurred. We've been notified and are looking into it.
            </p>
          </div>
          <Button onClick={this.handleReload} variant="outline" className="mt-4">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
