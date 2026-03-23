"use client"

import { useState, useEffect } from "react"
import { HRLayout } from "@/components/hr-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Files, Search, Loader2, ChevronRight, FileCheck } from "lucide-react"
import { useRouter } from "next/navigation"

interface EmployeeDocSummary {
  id: string
  name: string
  email: string
  position: string
  document_count: string
}

export default function HRDocumentsPage() {
  const [employees, setEmployees] = useState<EmployeeDocSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await apiClient("/api/documents")
        setEmployees(Array.isArray(data) ? data : [])
      } catch (err) {
        logger.error("Failed to fetch employees for documents:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <HRLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Verification</h1>
          <p className="text-muted-foreground mt-1">Review and verify employee identification and onboarding files.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-xl shadow-sm border-none bg-muted/50 focus-visible:ring-primary"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((employee) => (
              <Card 
                key={employee.id} 
                className="group hover:shadow-xl transition-all cursor-pointer rounded-2xl border-none shadow-sm overflow-hidden"
                onClick={() => router.push(`/hr/documents/${employee.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/5 shadow-sm">
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {employee.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                        {employee.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{employee.position}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Uploaded Files</span>
                      <Badge variant="secondary" className="px-2 py-0.5 rounded-md font-bold">
                        {employee.document_count}
                      </Badge>
                    </div>
                    <div className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 ${parseInt(employee.document_count) > 0 ? "text-green-500" : "text-orange-500"}`}>
                       <FileCheck className="h-3 w-3" />
                       {parseInt(employee.document_count) > 0 ? "Verified" : "Pending Upload"}
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 px-6 py-3 flex items-center justify-between text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                   View Documentation
                   <ChevronRight className="h-3 w-3" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </HRLayout>
  )
}
