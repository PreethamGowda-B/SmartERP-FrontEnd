"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, CheckCircle2, Signature } from "lucide-react"

interface CustomerSignaturePadProps {
  onSaveSignature: (signatureDataUrl: string) => void
  disabled?: boolean
}

export function CustomerSignaturePad({ onSaveSignature, disabled = false }: CustomerSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 400
    canvas.height = 180

    // Canvas line style
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#0f172a" // Slate-900
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return
    setIsDrawing(true)
    setIsEmpty(false)
    draw(e)
  }

  const stopDrawing = () => {
    if (disabled) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      ctx?.beginPath()
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let clientX = 0
    let clientY = 0

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const handleConfirm = () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return
    const dataUrl = canvas.toDataURL("image/png")
    onSaveSignature(dataUrl)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
        <span className="flex items-center gap-1.5 text-foreground">
          <Signature className="h-4 w-4 text-primary" />
          Customer Digital E-Signature Pad
        </span>
        <span>Draw signature below using finger or mouse</span>
      </div>

      <div className="relative border-2 border-dashed border-primary/30 rounded-2xl bg-background overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="w-full touch-none cursor-crosshair"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/40 font-bold text-sm">
            Sign Here
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={isEmpty || disabled}
          className="h-8 text-xs font-bold rounded-xl"
        >
          <Eraser className="h-3.5 w-3.5 mr-1.5" /> Clear Signature
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          disabled={isEmpty || disabled}
          className="h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Save E-Signature
        </Button>
      </div>
    </div>
  )
}
