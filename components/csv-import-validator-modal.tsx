"use client"

import { useState } from "react"
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle2, Download, AlertTriangle, X, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface CsvRow {
  id: number
  name: string
  email: string
  role: string
  department: string
  isValid: boolean
  errors: string[]
}

interface CsvImportValidatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportConfirmed: (validRows: CsvRow[]) => void
  title?: string
}

export function CsvImportValidatorModal({
  open,
  onOpenChange,
  onImportConfirmed,
  title = "Bulk CSV Import Validator",
}: CsvImportValidatorModalProps) {
  const { toast } = useToast()
  const [rows, setRows] = useState<CsvRow[]>([])
  const [uploaded, setUploaded] = useState(false)

  // Demo sample loader for client verification
  const handleSimulateFileSelect = () => {
    const sampleRows: CsvRow[] = [
      { id: 1, name: "Sarah Jenkins", email: "sarah.j@company.com", role: "employee", department: "Engineering", isValid: true, errors: [] },
      { id: 2, name: "Alex Rivera", email: "invalid-email-format", role: "hr", department: "HR", isValid: false, errors: ["Invalid email format"] },
      { id: 3, name: "David Chen", email: "david.c@company.com", role: "employee", department: "", isValid: false, errors: ["Missing department"] },
      { id: 4, name: "Maria Garcia", email: "maria.g@company.com", role: "owner", department: "Executive", isValid: true, errors: [] },
    ]

    setRows(sampleRows)
    setUploaded(true)
  }

  const validRows = rows.filter((r) => r.isValid)
  const invalidRows = rows.filter((r) => !r.isValid)

  const handleConfirmImport = () => {
    if (validRows.length === 0) {
      toast({
        title: "No Valid Records",
        description: "Please fix error rows before importing.",
        variant: "destructive",
      })
      return
    }

    onImportConfirmed(validRows)
    toast({
      title: "Bulk Import Successful! 🎉",
      description: `Successfully imported ${validRows.length} valid records.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border border-border shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Data Ingestion Protection</span>
          </div>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            {title}
            {uploaded && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  {validRows.length} Valid
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-600 border-rose-500/20">
                    {invalidRows.length} Errors
                  </Badge>
                )}
              </div>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Preview, validate, and isolate invalid rows before committing records to SmartERP.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {!uploaded ? (
            <div
              onClick={handleSimulateFileSelect}
              className="border-2 border-dashed border-border/80 hover:border-primary rounded-2xl p-10 text-center cursor-pointer transition-colors space-y-3 bg-muted/20"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Click to upload CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .csv and .xlsx formats up to 10MB</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs mt-2">
                Simulate CSV Validation Preview
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Department</TableHead>
                      <TableHead className="text-xs text-right">Validation Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} className={!row.isValid ? "bg-rose-500/5" : ""}>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-rose-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">{row.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.department || "N/A"}</TableCell>
                        <TableCell className="text-xs text-right">
                          {row.isValid ? (
                            <span className="text-emerald-600 font-medium">Ready</span>
                          ) : (
                            <span className="text-rose-600 font-medium">{row.errors.join(", ")}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {invalidRows.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Invalid rows will be skipped during import.
                  </span>
                  <Button size="sm" variant="ghost" className="text-xs h-7 hover:bg-amber-500/20">
                    Download Error CSV
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/70 bg-muted/20 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          {uploaded && (
            <Button size="sm" onClick={handleConfirmImport} className="text-xs font-semibold btn-premium gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Import {validRows.length} Valid Records
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
