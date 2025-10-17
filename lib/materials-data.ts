// Extended material request data and utilities
import { type MaterialRequest, mockJobs } from "./data"

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

// Generate more comprehensive mock material requests
export const generateMockMaterialRequests = (): MaterialRequestWithDetails[] => {
  const baseRequests: MaterialRequest[] = [
    {
      id: "1",
      jobId: "1",
      requestedBy: "Sarah Johnson",
      items: [
        { name: "Steel Beams (I-Beam)", quantity: 20, unit: "pieces", estimatedCost: 15000 },
        { name: "Concrete Mix (Ready Mix)", quantity: 50, unit: "cubic yards", estimatedCost: 6000 },
        { name: "Rebar (#4)", quantity: 100, unit: "pieces", estimatedCost: 2500 },
      ],
      status: "pending",
      requestDate: "2024-01-14",
      urgency: "high",
      notes: "Needed for foundation work by end of week. Please expedite delivery.",
    },
    {
      id: "2",
      jobId: "2",
      requestedBy: "Mike Rodriguez",
      items: [
        { name: "Lumber (2x4x8)", quantity: 200, unit: "pieces", estimatedCost: 1600 },
        { name: "Drywall Sheets (4x8)", quantity: 150, unit: "sheets", estimatedCost: 2250 },
      ],
      status: "approved",
      requestDate: "2024-01-12",
      urgency: "medium",
      notes: "For framing phase of residential units 1-3",
    },
    {
      id: "3",
      jobId: "1",
      requestedBy: "Emily Chen",
      items: [
        { name: "Roofing Shingles", quantity: 80, unit: "bundles", estimatedCost: 2800 },
        { name: "PVC Pipe (4 inch)", quantity: 500, unit: "feet", estimatedCost: 6000 },
      ],
      status: "ordered",
      requestDate: "2024-01-10",
      urgency: "low",
      notes: "Roofing materials for final phase",
    },
    {
      id: "4",
      jobId: "2",
      requestedBy: "David Wilson",
      items: [{ name: "Electrical Wire (12 AWG)", quantity: 1000, unit: "feet", estimatedCost: 2000 }],
      status: "delivered",
      requestDate: "2024-01-08",
      urgency: "medium",
      notes: "Electrical rough-in for units 4-6",
    },
    {
      id: "5",
      jobId: "1",
      requestedBy: "Sarah Johnson",
      items: [{ name: "Steel Beams (I-Beam)", quantity: 10, unit: "pieces", estimatedCost: 7500 }],
      status: "rejected",
      requestDate: "2024-01-06",
      urgency: "low",
      notes: "Additional beams - rejected due to budget constraints",
    },
  ]

  return baseRequests.map((request) => {
    const job = mockJobs.find((j) => j.id === request.jobId)
    const totalCost = request.items.reduce((sum, item) => sum + item.estimatedCost, 0)
    return {
      ...request,
      jobTitle: job?.title,
      totalCost,
    }
  })
}

export const mockMaterialRequestsWithDetails = generateMockMaterialRequests()

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
