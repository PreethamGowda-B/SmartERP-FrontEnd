"use client"

import { useState, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { inventoryForecastApi, InventoryForecast, InventorySupplier, PurchaseOrder } from "@/lib/inventoryForecastApi"
import { 
  TrendingUp, 
  AlertCircle, 
  PackageCheck, 
  ShoppingCart, 
  RefreshCcw, 
  Plus, 
  CheckCircle2, 
  Truck, 
  Search,
  Bot
} from "lucide-react"

export default function InventoryForecastsPage() {
  const { toast } = useToast()
  const [forecasts, setForecasts] = useState<InventoryForecast[]>([])
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState<boolean>(false)
  const [isPoModalOpen, setIsPoModalOpen] = useState<boolean>(false)
  const [isPoListModalOpen, setIsPoListModalOpen] = useState<boolean>(false)

  // Supplier Form
  const [supplierName, setSupplierName] = useState<string>("")
  const [supplierEmail, setSupplierEmail] = useState<string>("")
  const [supplierPhone, setSupplierPhone] = useState<string>("")
  const [supplierGstin, setSupplierGstin] = useState<string>("")

  // PO Form
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
  const [selectedItemForPo, setSelectedItemForPo] = useState<InventoryForecast | null>(null)
  const [reorderQty, setReorderQty] = useState<number>(10)
  const [unitPrice, setUnitPrice] = useState<number>(100)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const forecastData = await inventoryForecastApi.getForecasts()
      const supplierData = await inventoryForecastApi.getSuppliers()
      const poData = await inventoryForecastApi.getPurchaseOrders()

      if (forecastData.success) setForecasts(forecastData.forecasts || [])
      if (supplierData.success) setSuppliers(supplierData.suppliers || [])
      if (poData.success) setPurchaseOrders(poData.purchaseOrders || [])
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load inventory demand forecasts.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculate = async () => {
    try {
      setLoading(true)
      const data = await inventoryForecastApi.recalculateForecasts()
      toast({ title: "Recalculated Forecasts", description: data.message })
      fetchData()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to recalculate forecasts.", variant: "destructive" })
      setLoading(false)
    }
  }

  const handleCreateSupplier = async () => {
    if (!supplierName || !supplierEmail) {
      toast({ title: "Validation Error", description: "Supplier name and email are required.", variant: "destructive" })
      return
    }
    try {
      await inventoryForecastApi.createSupplier({
        supplierName,
        email: supplierEmail,
        phone: supplierPhone,
        gstin: supplierGstin,
      })
      toast({ title: "Supplier Created", description: "Supplier added to directory." })
      setIsSupplierModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create supplier.", variant: "destructive" })
    }
  }

  const handleCreateAgenticPo = async () => {
    if (!selectedSupplierId || !selectedItemForPo) {
      toast({ title: "Validation Error", description: "Please select a supplier.", variant: "destructive" })
      return
    }
    try {
      const res = await inventoryForecastApi.createAgenticDraftPO({
        supplierId: selectedSupplierId,
        itemsToReorder: [
          {
            itemId: selectedItemForPo.item_id,
            quantity: reorderQty,
            unitPrice: unitPrice,
          },
        ],
      })
      toast({
        title: "Agentic PO Generated",
        description: `Draft Purchase Order ${res.purchaseOrder.poNumber} created.`,
      })
      setIsPoModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate PO.", variant: "destructive" })
    }
  }

  const handleApprovePo = async (poId: string) => {
    try {
      await inventoryForecastApi.approvePurchaseOrder(poId)
      toast({ title: "PO Approved & Sent", description: "Purchase order status updated to Sent to Supplier." })
      fetchData()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to approve PO.", variant: "destructive" })
    }
  }

  const ropBreachedCount = forecasts.filter((f) => f.is_rop_breached).length

  const filteredForecasts = forecasts.filter((f) =>
    f.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <OwnerLayout>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-primary" />
              Agentic Inventory Reordering & Demand Forecasting
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dynamic Reorder Points (ROP), Economic Order Quantity (EOQ), and AI-generated Purchase Orders.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsSupplierModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsPoListModalOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              View POs ({purchaseOrders.length})
            </Button>
            <Button size="sm" onClick={handleRecalculate}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Recalculate ROP
            </Button>
          </div>
        </div>

        {/* KPI Header Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Active SKUs</CardTitle>
              <PackageCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forecasts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Monitored Inventory Items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ROP Stock Breaches</CardTitle>
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{ropBreachedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Items Below Dynamic ROP</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">30-Day Demand Forecast</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {forecasts.reduce((acc, f) => acc + Number(f.predicted_30d_demand), 0)} Units
              </div>
              <p className="text-xs text-muted-foreground mt-1">Holt-Winters Velocity Projection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered Suppliers Directory</p>
            </CardContent>
          </Card>
        </div>

        {/* Forecasts & Reorder Table Container */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>SKU Demand Forecasts & Dynamic Reorder Points</CardTitle>
              <CardDescription>
                Calculated based on daily usage velocity, lead times, and safety stock requirements
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-72">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SKU or Category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">SKU Name / Category</th>
                    <th className="px-4 py-3">Current Stock</th>
                    <th className="px-4 py-3">Safety Stock</th>
                    <th className="px-4 py-3">Dynamic ROP</th>
                    <th className="px-4 py-3">Economic Order Qty (EOQ)</th>
                    <th className="px-4 py-3">30-Day Demand</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        Loading SKU demand forecasts...
                      </td>
                    </tr>
                  ) : filteredForecasts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No inventory forecasts available. Add inventory items or click "Recalculate ROP".
                      </td>
                    </tr>
                  ) : (
                    filteredForecasts.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.item_name}</div>
                          <div className="text-xs text-muted-foreground">{item.category}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {item.current_quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.safety_stock} {item.unit}</td>
                        <td className="px-4 py-3 font-mono font-medium">{item.reorder_point} {item.unit}</td>
                        <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {item.economic_order_quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3">{item.predicted_30d_demand} {item.unit}</td>
                        <td className="px-4 py-3">
                          {item.is_rop_breached ? (
                            <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30">ROP Breached</Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Stock Optimal</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant={item.is_rop_breached ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedItemForPo(item)
                              setReorderQty(Number(item.economic_order_quantity) || 10)
                              setIsPoModalOpen(true)
                            }}
                          >
                            <Bot className="mr-1.5 h-3.5 w-3.5" />
                            Draft PO
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add Supplier Modal */}
        <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>Register a supplier into the SmartERP inventory directory.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Supplier Name</Label>
                <Input placeholder="Acme Industrial Corp" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="orders@acmeindustrial.com" value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input placeholder="+91 9876543210" value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} />
              </div>
              <div>
                <Label>GSTIN (Optional)</Label>
                <Input placeholder="27AAAAA0000A1Z5" value={supplierGstin} onChange={(e) => setSupplierGstin(e.target.value.toUpperCase())} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSupplier}>Save Supplier</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate AI Agent Draft PO Modal */}
        <Dialog open={isPoModalOpen} onOpenChange={setIsPoModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Generate Agentic Draft Purchase Order
              </DialogTitle>
              <DialogDescription>
                AI will draft a Purchase Order for SKU <strong>{selectedItemForPo?.item_name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Select Supplier</Label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full h-9 mt-1 rounded-md border bg-background px-3 text-xs"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplier_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reorder Quantity (EOQ Recommended)</Label>
                  <Input type="number" value={reorderQty} onChange={(e) => setReorderQty(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Estimated Unit Price (₹)</Label>
                  <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} />
                </div>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3 text-xs">
                <p className="font-semibold">Calculated Order Total: ₹{(reorderQty * unitPrice).toLocaleString()}</p>
                <p className="text-muted-foreground mt-1">Status will be set to <code>draft</code> requiring owner single-click approval before sending.</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateAgenticPo}>Generate Draft PO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Purchase Orders List Modal */}
        <Dialog open={isPoListModalOpen} onOpenChange={setIsPoListModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Company Purchase Orders</DialogTitle>
              <DialogDescription>Review and approve AI-generated draft purchase orders.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto py-2">
              {purchaseOrders.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">No purchase orders generated yet.</p>
              ) : (
                purchaseOrders.map((po) => (
                  <div key={po.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {po.po_number}
                        {po.is_ai_generated && <Badge variant="secondary" className="text-[10px]">AI Generated</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Supplier: {po.supplier_name} • Total: ₹{Number(po.total_amount).toLocaleString()}
                      </div>
                      {po.ai_generation_reasoning && (
                        <p className="text-xs italic text-muted-foreground mt-1">"{po.ai_generation_reasoning}"</p>
                      )}
                    </div>
                    <div>
                      {po.status === "draft" ? (
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprovePo(po.id)}>
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve & Send
                        </Button>
                      ) : (
                        <Badge className="bg-blue-500/10 text-blue-600">{po.status}</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
