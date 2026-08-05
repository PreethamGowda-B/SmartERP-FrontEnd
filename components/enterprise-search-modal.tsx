"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/apiClient"
import { Search, Cpu, Wrench, Calculator, User, ArrowRight } from "lucide-react"

export function EnterpriseSearchModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await apiClient<{ success: boolean; results: any[] }>(`/api/search/global?q=${encodeURIComponent(query)}`)
        if (res?.results) setResults(res.results)
      } catch (err) {
        console.warn("Search error:", err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (url: string) => {
    setIsOpen(false)
    setQuery("")
    router.push(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-slate-700 bg-slate-900 text-white shadow-2xl">
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <Search className="h-5 w-5 text-amber-400" />
          <Input
            placeholder="Search Machines, Customers, Jobs, Alarm Codes, Quotes, Invoices... (Esc to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-none bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0 text-base font-medium"
            autoFocus
          />
          <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700 font-mono">Ctrl+K</Badge>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Searching enterprise data...</div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              {query ? "No matching entities found" : "Type at least 2 characters to search"}
            </div>
          ) : (
            results.map((r, i) => (
              <div
                key={i}
                onClick={() => handleSelect(r.url)}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-700 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                    {r.category === "machine" ? <Cpu className="h-4 w-4" /> : r.category === "job" ? <Wrench className="h-4 w-4" /> : <Calculator className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300">{r.title}</h4>
                    <p className="text-xs text-slate-400">{r.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-700 text-slate-300 uppercase text-[9px] font-mono">{r.category}</Badge>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
