// Extended material request data and utilities
import { type MaterialRequest } from "./data"

export interface MaterialItem {
  id: string
  name: string
  category: string
  unit: string
  standardCost: number
  supplier?: string
  description?: string
}

export interface MaterialRequestWithDetails extends MaterialRequest {
  jobTitle?: string
  totalCost: number
}

// Common construction materials database
export const materialsCatalog: MaterialItem[] = [
  {
    id: "1",
    name: "Steel Beams (I-Beam)",
    category: "Structural Steel",
    unit: "pieces",
    standardCost: 750,
    supplier: "Metro Steel Supply",
    description: "Standard I-beam for structural support",
  },
  {
    id: "2",
    name: "Concrete Mix (Ready Mix)",
    category: "Concrete",
    unit: "cubic yards",
    standardCost: 120,
    supplier: "City Concrete Co.",
    description: "Standard concrete mix for foundations",
  },
  {
    id: "3",
    name: "Rebar (#4)",
    category: "Reinforcement",
    unit: "pieces",
    standardCost: 25,
    supplier: "Metro Steel Supply",
    description: "Grade 60 rebar for concrete reinforcement",
  },
  {
    id: "4",
    name: "Lumber (2x4x8)",
    category: "Wood",
    unit: "pieces",
    standardCost: 8,
    supplier: "BuildMart Lumber",
    description: "Pressure treated lumber",
  },
  {
    id: "5",
    name: "Drywall Sheets (4x8)",
    category: "Drywall",
    unit: "sheets",
    standardCost: 15,
    supplier: "Interior Supply Co.",
    description: "Standard 1/2 inch drywall sheets",
  },
  {
    id: "6",
    name: "Roofing Shingles",
    category: "Roofing",
    unit: "bundles",
    standardCost: 35,
    supplier: "Roof Masters Supply",
    description: "Asphalt shingles, 3-tab",
  },
  {
    id: "7",
    name: "PVC Pipe (4 inch)",
    category: "Plumbing",
    unit: "feet",
    standardCost: 12,
    supplier: "Plumbing Plus",
    description: "Schedule 40 PVC pipe",
  },
  {
    id: "8",
    name: "Electrical Wire (12 AWG)",
    category: "Electrical",
    unit: "feet",
    standardCost: 2,
    supplier: "Electric Supply House",
    description: "THHN copper wire",
  },
]

// Dynamic material requests list - populated from backend
export const generateMockMaterialRequests = (): MaterialRequestWithDetails[] => []
export const mockMaterialRequestsWithDetails: MaterialRequestWithDetails[] = []

export const getMaterialRequestStats = (requests: MaterialRequestWithDetails[]) => {
  const pending = requests.filter((r) => r.status === "pending").length
  const approved = requests.filter((r) => r.status === "approved").length
  const ordered = requests.filter((r) => r.status === "ordered").length
  const delivered = requests.filter((r) => r.status === "delivered").length
  const rejected = requests.filter((r) => r.status === "rejected").length

  const totalValue = requests.reduce((sum, request) => sum + request.totalCost, 0)
  const pendingValue = requests
    .filter((r) => r.status === "pending")
    .reduce((sum, request) => sum + request.totalCost, 0)

  return {
    pending,
    approved,
    ordered,
    delivered,
    rejected,
    totalValue,
    pendingValue,
  }
}
