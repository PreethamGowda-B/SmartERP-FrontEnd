"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient, getAccessToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ArrowLeft, Upload, FileText, Download, Trash2, 
  Eye, Loader2, Calendar, Shield, ExternalLink,
  Plus, CheckCircle2, AlertTriangle, ZoomIn, FileCheck
} from "lucide-react"
import { toast } from "sonner"

interface Document {
  id: string
  document_type: string
  file_url: string
  notes: string | null
  created_at: string
}

interface Employee {
  id: string
  name: string
  email: string
  position: string
}

const DOCUMENT_TYPES = [
  "PAN Card",
  "Aadhaar Card",
  "Resume",
  "Offer Letter",
  "Certificates",
  "Experience Letter",
  "Other"
]

export default function EmployeeDocumentsPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.employeeId as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedType, setSelectedType] = useState("")
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preview State
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch employee info
      const employees = await apiClient("/api/documents")
      const found = employees.find((e: Employee) => e.id === employeeId)
      if (found) setEmployee(found)

      // Fetch documents
      const docs = await apiClient(`/api/documents/employee/${employeeId}`)
      setDocuments(Array.isArray(docs) ? docs : [])
    } catch (err) {
      logger.error("Failed to fetch documents:", err)
      toast.error("Could not load documents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [employeeId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Invalid file type. Only PDF and JPG/PNG images are allowed.")
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File is too large. Max size is 10MB.")
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file || !selectedType) {
      toast.error("Please select a file and document type")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('employee_id', employeeId)
    formData.append('document_type', selectedType)
    formData.append('notes', notes)

    try {
      await apiClient("/api/documents", {
        method: 'POST',
        body: formData
      })

      toast.success("Document uploaded successfully")
      setIsUploadOpen(false)
      resetUpload()
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document")
    } finally {
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setSelectedType("")
    setNotes("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return

    try {
      await apiClient(`/api/documents/${id}`, { method: 'DELETE' })
      toast.success("Document deleted")
      fetchData()
    } catch (err) {
      toast.error("Failed to delete document")
    }
  }

  const getFullUrl = (path: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`
  }

  const isImage = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png'].includes(ext || '')
  }

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Back and Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/owner/documents")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{employee?.name || "Employee"} Documents</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Shield className="h-3 w-3" /> Secure Company Storage
              </p>
            </div>
          </div>
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2 shadow-sm font-semibold">
            <Plus className="h-4 w-4" /> Upload Document
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Fetching records...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-accent/10 rounded-3xl border-2 border-dashed border-border/50">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <h3 className="font-semibold text-lg">No documents yet</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                  Click the upload button to start securely storing documents for {employee?.name}.
                </p>
              </div>
            ) : (
              documents.map((doc) => (
                <Card key={doc.id} className="overflow-hidden group hover:shadow-md transition-all">
                  <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden relative border-b border-border/50">
                    {isImage(doc.file_url) ? (
                      <Image 
                        src={getFullUrl(doc.file_url)} 
                        alt={doc.document_type} 
                        fill
                        unoptimized
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText className="h-12 w-12" />
                        <span className="text-xs font-semibold">PDF Document</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <Button size="sm" variant="secondary" onClick={() => setPreviewDoc(doc)}>
                        <Eye className="h-4 w-4 mr-2" /> Preview
                      </Button>
                    </div>
                  </div>
                  <CardHeader className="p-4 bg-card">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{doc.document_type}</CardTitle>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex items-center justify-between border-t border-border/50 gap-2">
                    <a href={getFullUrl(doc.file_url)} download target="_blank" className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8">
                        <Download className="h-3 w-3 mr-2" /> Download
                      </Button>
                    </a>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent className="sm:max-w-[450px] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Upload New Document
              </DialogTitle>
              <DialogDescription>
                Files will be securely stored and linked to {employee?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  File (PDF, PNG, JPG)
                </Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileCheck className="h-10 w-10 text-primary" />
                      <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                      <Upload className="h-10 w-10 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">Click or drop file here</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input 
                  placeholder="Additional information..." 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={uploading}>Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading || !file || !selectedType}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? "Uploading..." : "Start Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
          <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col bg-black/95">
            <div className="p-4 flex items-center justify-between text-white border-b border-white/10 shrink-0">
              <div>
                <h3 className="font-semibold">{previewDoc?.document_type}</h3>
                <p className="text-xs text-white/60">Uploaded on {previewDoc && new Date(previewDoc.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={previewDoc ? getFullUrl(previewDoc.file_url) : "#"} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                    <ExternalLink className="h-5 w-5" />
                  </Button>
                </a>
                <Button size="icon" variant="ghost" onClick={() => setPreviewDoc(null)} className="text-white hover:bg-white/10">
                  <CheckCircle2 className="h-5 w-5 rotate-45" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              {previewDoc && (
                isImage(previewDoc.file_url) ? (
                  <div className="relative w-full h-full min-h-[400px]">
                    <Image src={getFullUrl(previewDoc.file_url)} fill unoptimized className="object-contain shadow-2xl" alt="Preview" />
                  </div>
                ) : (
                  <iframe 
                    src={getFullUrl(previewDoc.file_url)} 
                    className="w-full h-full rounded-lg bg-white" 
                    title="PDF Preview"
                  />
                )
              )}
            </div>
            <div className="p-4 bg-black/50 text-white/80 text-center text-sm italic py-3 border-t border-white/10 shrink-0">
              {previewDoc?.notes || "No additional notes provided for this document."}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
