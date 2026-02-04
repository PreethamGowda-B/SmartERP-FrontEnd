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
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const api = process.env.NEXT_PUBLIC_API_URL || ""

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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Item"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
