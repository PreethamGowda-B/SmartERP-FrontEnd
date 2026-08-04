"use client"

import { useState, useEffect } from "react"
import { HRLayout } from "@/components/hr-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/apiClient"
import { Laptop, Phone, ShieldCheck, CheckCircle2, Search, Plus } from "lucide-react"

export default function HRAssetsPage() {
  const { toast } = useToast()
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [assetName, setAssetName] = useState("")
  const [assetTag, setAssetTag] = useState("")
  const [category, setCategory] = useState("laptop")

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const res = await apiClient("/api/hr/assets")
      if (Array.isArray(res?.assets)) setAssets(res.assets)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const handleAddAsset = async () => {
    if (!assetName || !assetTag) {
      toast({ title: "Required", description: "Asset name and tag are required.", variant: "destructive" })
      return
    }
    try {
      await apiClient("/api/hr/assets", {
        method: "POST",
        body: JSON.stringify({ asset_name: assetName, asset_tag: assetTag, category })
      })
      toast({ title: "Asset Added", description: `${assetName} registered into inventory.` })
      setIsAddOpen(false)
      setAssetName("")
      setAssetTag("")
      fetchAssets()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add asset.", variant: "destructive" })
    }
  }

  const filtered = assets.filter(a => 
    a.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <HRLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">IT & Field Asset Management</h1>
            <p className="text-xs text-muted-foreground mt-1">Track laptops, mobile phones, vehicles, uniforms, & safety equipment allocations.</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="h-9 text-xs font-bold rounded-xl bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1.5" /> Add New Asset
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by asset tag or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        {/* Assets Table */}
        <Card className="border shadow-xs">
          <CardContent className="p-0 overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Laptop className="h-10 w-10 mx-auto mb-2 opacity-30 text-primary" />
                <p className="text-sm font-bold text-foreground">No registered hardware assets</p>
                <p className="text-xs mt-0.5">Click "Add New Asset" to track laptops, SIM cards, & field gear.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4">Asset Tag</th>
                    <th className="p-4">Item Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Assigned Employee</th>
                    <th className="p-4">Condition</th>
                    <th className="p-4">Return Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-primary">{a.asset_tag}</td>
                      <td className="p-4 font-bold text-foreground">{a.asset_name}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="uppercase text-[9px] font-extrabold">{a.category}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{a.assigned_employee_name || "Unassigned (In Stock)"}</td>
                      <td className="p-4 capitalize">{a.condition || "Good"}</td>
                      <td className="p-4">
                        <Badge className={`font-bold px-2 py-0.5 uppercase text-[9px] ${
                          a.return_status === 'assigned' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {a.return_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Asset Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Register Hardware Asset</DialogTitle>
            <DialogDescription className="text-xs">Add a laptop, phone, or field kit to HR asset inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-bold">Asset Name</Label>
              <Input placeholder="MacBook Pro 14 / Safety Kit" value={assetName} onChange={(e) => setAssetName(e.target.value)} className="h-9 text-xs rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-bold">Asset Tag / Serial Number</Label>
              <Input placeholder="AST-2026-9902" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} className="h-9 text-xs rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="h-9 text-xs font-bold rounded-xl">Cancel</Button>
            <Button onClick={handleAddAsset} className="h-9 text-xs font-bold rounded-xl bg-primary text-primary-foreground">Save Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HRLayout>
  )
}
