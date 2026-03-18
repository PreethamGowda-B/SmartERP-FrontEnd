"use client"

import { useState, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Files, Search, Loader2, User, ChevronRight, FileCheck } from "lucide-react"
import { useRouter } from "next/navigation"

interface EmployeeDocSummary {
  id: string
  name: string
  email: string
  position: string
  department: string
  document_count: string
}

export default function DocumentsPage() {
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
    e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Documents Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage personal files and identification for your team.</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Loading employee directory...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((employee) => (
              <Card 
                key={employee.id} 
                className="group hover:shadow-lg transition-all cursor-pointer border-transparent hover:border-primary/20"
                onClick={() => router.push(`/owner/documents/${employee.id}`)}
              >
                <CardHeader className="pb-3 flex flex-row items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {employee.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                      {employee.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">{employee.position}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm py-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Files className="h-4 w-4" />
                      <span>Documents</span>
                    </div>
                    <Badge variant={parseInt(employee.document_count) > 0 ? "secondary" : "outline"} className="font-semibold">
                      {employee.document_count}
                    </Badge>
                  </div>
                  {parseInt(employee.document_count) > 0 ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600 font-medium">
                      <FileCheck className="h-3 w-3" />
                      <span>Status: Registered</span>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2 text-xs text-orange-500 font-medium">
                      <Files className="h-3 w-3" />
                      <span>No documents uploaded</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 bg-accent/20 rounded-2xl border-2 border-dashed border-border/50">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-semibold mb-1">No employees found</h3>
            <p className="text-muted-foreground">Adjust your search or add employees to manage their documents.</p>
          </div>
        )}
      </div>
    </OwnerLayout>
  )
}
