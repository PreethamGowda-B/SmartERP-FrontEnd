"use client"

import { useState, useRef } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function InventoryForm({
  role,
  onItemAdded,
}: {
  role: "owner" | "employee"
  onItemAdded?: () => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState<number | string>(0)
  const [category, setCategory] = useState("Uncategorized")
  const [unit, setUnit] = useState("pieces")
  const [minQuantity, setMinQuantity] = useState<number | string>(0)
  const [supplierName, setSupplierName] = useState("")
  const [supplierContact, setSupplierContact] = useState("")
  const [supplierEmail, setSupplierEmail] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const api = process.env.NEXT_PUBLIC_API_URL || ""

  const categories = ['Raw Materials', 'Finished Goods', 'Tools', 'Supplies', 'Uncategorized']
  const units = ['bags', 'kg', 'pieces', 'liters', 'boxes', 'meters', 'units']

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert("Please enter an item name")
      return
    }

    setLoading(true)
    try {
      // Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

      const formData = new FormData()
      formData.append("name", name)
      formData.append("description", description)
      formData.append("quantity", String(quantity))
      formData.append("category", category)
      formData.append("unit", unit)
      formData.append("min_quantity", String(minQuantity))
      formData.append("supplier_name", supplierName)
      formData.append("supplier_contact", supplierContact)
      formData.append("supplier_email", supplierEmail)
      if (imageFile) {
        formData.append("image", imageFile)
      }

      const res = await fetch(api + "/api/inventory", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to submit")

      alert(role === "owner" ? "Item added successfully" : "Item added successfully")
      setName("")
      setDescription("")
      setQuantity(0)
      setCategory("Uncategorized")
      setUnit("pieces")
      setMinQuantity(0)
      setSupplierName("")
      setSupplierContact("")
      setSupplierEmail("")
      setImagePreview(null)
      setImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      onItemAdded?.()
    } catch (err) {
      console.error(err)
      alert("Error submitting form")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Stock</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-6">
          {/* Name and Description Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="item-name"
                placeholder="e.g., Cement Bags"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Input
                id="description"
                placeholder="e.g., High quality cement for site A"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Quantity and Upload Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? 0 : Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm font-medium">
                Upload Image
              </Label>
              <input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                {imagePreview && (
                  <div className="h-10 w-10 rounded border overflow-hidden">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-3 py-2 border rounded-md text-sm hover:bg-accent/5 transition text-foreground"
                >
                  {imageFile ? `Choose File ${imageFile.name}` : "Choose File"}
                </button>
              </div>
            </div>
          </div>

          {/* Category and Unit Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category
              </Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm font-medium">
                Unit
              </Label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Minimum Quantity */}
          <div className="space-y-2">
            <Label htmlFor="min-quantity" className="text-sm font-medium">
              Minimum Quantity (Low Stock Alert)
            </Label>
            <Input
              id="min-quantity"
              type="number"
              placeholder="0"
              min="0"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value === "" ? 0 : Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              You'll be alerted when stock falls below this level
            </p>
          </div>

          {/* Supplier Information (Optional) */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">Supplier Information (Optional)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-name" className="text-sm font-medium">
                  Supplier Name
                </Label>
                <Input
                  id="supplier-name"
                  placeholder="e.g., ABC Suppliers"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-contact" className="text-sm font-medium">
                  Contact Number
                </Label>
                <Input
                  id="supplier-contact"
                  placeholder="e.g., +91 98765 43210"
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-email" className="text-sm font-medium">
                Supplier Email
              </Label>
              <Input
                id="supplier-email"
                type="email"
                placeholder="e.g., supplier@example.com"
                value={supplierEmail}
                onChange={(e) => setSupplierEmail(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Item"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
