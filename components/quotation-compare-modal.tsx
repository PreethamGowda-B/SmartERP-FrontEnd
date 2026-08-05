"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calculator, ArrowRight, TrendingUp } from "lucide-react"

interface QuotationCompareModalProps {
  isOpen: boolean
  onClose: () => void
  quotation: any
}

export function QuotationCompareModal({ isOpen, onClose, quotation }: QuotationCompareModalProps) {
  if (!quotation) return null

  // Mock V1 vs V2 baseline values for side-by-side comparison
  const v1Labor = Number(quotation.labor_amount || 5000) * 0.85
  const v2Labor = Number(quotation.labor_amount || 5000)
  const v1Spares = Number(quotation.spares_amount || 12000) * 0.90
  const v2Spares = Number(quotation.spares_amount || 12000)
  const v1Travel = Number(quotation.travel_amount || 2500)
  const v2Travel = Number(quotation.travel_amount || 2500)

  const v1Total = v1Labor + v1Spares + v1Travel
  const v2Total = v2Labor + v2Spares + v2Travel

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-amber-500" /> Quotation Revision Side-by-Side Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border">
            <div>
              <p className="text-sm font-bold">{quotation.title}</p>
              <p className="text-xs text-slate-500 font-mono">Quotation #{quotation.quotation_number}</p>
            </div>
            <Badge className="bg-amber-100 text-amber-800 font-bold">V1 ➔ V2 Revised</Badge>
          </div>

          <Table className="border rounded-xl">
            <TableHeader className="bg-slate-100 dark:bg-slate-800">
              <TableRow>
                <TableHead className="font-bold">Cost Item</TableHead>
                <TableHead className="font-bold">Version V1</TableHead>
                <TableHead className="font-bold">Version V2 (Current)</TableHead>
                <TableHead className="font-bold text-right">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Engineer Labor</TableCell>
                <TableCell>₹{v1Labor.toLocaleString()}</TableCell>
                <TableCell className="font-bold">₹{v2Labor.toLocaleString()}</TableCell>
                <TableCell className="text-right text-emerald-600 font-bold">
                  +₹{(v2Labor - v1Labor).toLocaleString()}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Spare Parts</TableCell>
                <TableCell>₹{v1Spares.toLocaleString()}</TableCell>
                <TableCell className="font-bold">₹{v2Spares.toLocaleString()}</TableCell>
                <TableCell className="text-right text-emerald-600 font-bold">
                  +₹{(v2Spares - v1Spares).toLocaleString()}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Travel & Conveyance</TableCell>
                <TableCell>₹{v1Travel.toLocaleString()}</TableCell>
                <TableCell className="font-bold">₹{v2Travel.toLocaleString()}</TableCell>
                <TableCell className="text-right text-slate-400 font-bold">—</TableCell>
              </TableRow>

              <TableRow className="bg-amber-50 dark:bg-amber-950/40 font-black">
                <TableCell className="text-amber-900 dark:text-amber-300">TOTAL ESTIMATE</TableCell>
                <TableCell>₹{v1Total.toLocaleString()}</TableCell>
                <TableCell className="text-amber-600 dark:text-amber-400">₹{v2Total.toLocaleString()}</TableCell>
                <TableCell className="text-right text-emerald-600 font-bold">
                  +₹{(v2Total - v1Total).toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
