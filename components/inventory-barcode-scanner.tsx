"use client"

import { useState } from "react"
import { QrCode, Scan, Camera, Search, CheckCircle2, PackageCheck } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface InventoryBarcodeScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanResult: (sku: string) => void
}

export function InventoryBarcodeScanner({
  open,
  onOpenChange,
  onScanResult,
}: InventoryBarcodeScannerProps) {
  const { toast } = useToast()
  const [barcodeInput, setBarcodeInput] = useState("")
  const [isScanning, setIsScanning] = useState(false)

  const handleSimulateScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      const simulatedSkus = ["SKU-9921", "SKU-4402", "SKU-1084", "SKU-8831"]
      const randomSku = simulatedSkus[Math.floor(Math.random() * simulatedSkus.length)]
      setBarcodeInput(randomSku)
      setIsScanning(false)
      toast({
        title: "Barcode Scanned! 📷",
        description: `Found Item: ${randomSku}`,
      })
    }, 1200)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput) return
    onScanResult(barcodeInput)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border border-border shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <QrCode className="h-4 w-4" />
            <span>Mobile Inventory Scanner</span>
          </div>
          <DialogTitle className="text-xl font-bold">Barcode & QR Scanner</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Scan inventory barcodes using your device camera or handheld scanner.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Simulated Camera Scanner Viewport */}
          <div className="relative h-48 bg-zinc-950 rounded-2xl border border-border flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-4 border-2 border-dashed border-primary/50 rounded-xl pointer-events-none animate-pulse" />
            <Scan className="h-12 w-12 text-primary animate-bounce mb-2" />
            <p className="text-xs text-zinc-400 font-mono">Align Barcode / QR Code within frame</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSimulateScan}
              disabled={isScanning}
              className="mt-3 text-xs bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              {isScanning ? "Scanning..." : "Simulate Camera Scan"}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="text-xs font-semibold text-foreground">Or Enter SKU / Barcode Manually</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. SKU-9921 or 890102930492"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="text-xs h-10 font-mono"
              />
              <Button type="submit" className="text-xs font-bold btn-premium px-4">
                Lookup
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
