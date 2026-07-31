import { apiClient } from "@/lib/apiClient"

export interface CrmLead {
  id: string
  company_id: string
  assigned_to?: string
  assigned_user_name?: string
  lead_name: string
  company_name?: string
  email: string
  phone?: string
  deal_value: number | string
  lead_score: number
  priority: "cold" | "warm" | "hot"
  stage: "new_lead" | "contacted" | "proposal_sent" | "negotiation" | "closed_won" | "closed_lost"
  ai_proposal_text?: string
  last_contacted_at: string
  created_at: string
}

export interface CrmPipelineSummary {
  success: boolean
  count: number
  pipeline: Record<string, CrmLead[]>
}

export const crmSalesApi = {
  getPipeline: async (): Promise<CrmPipelineSummary> => {
    return await apiClient("/api/v1/crm-sales/pipeline")
  },

  createLead: async (data: {
    leadName: string
    companyName?: string
    email: string
    phone?: string
    dealValue?: number
    stage?: string
  }) => {
    return await apiClient("/api/v1/crm-sales/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  },

  updateLeadStage: async (leadId: string, stage: string) => {
    return await apiClient(`/api/v1/crm-sales/leads/${leadId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    })
  },

  generateAiProposal: async (leadId: string) => {
    return await apiClient(`/api/v1/crm-sales/leads/${leadId}/generate-proposal`, {
      method: "POST",
    })
  },
}
