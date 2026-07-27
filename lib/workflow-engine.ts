/**
 * SmartERP Workflow Automation Engine
 * Plugin-ready, rule-based trigger/action processing engine.
 */

export interface WorkflowRule {
  id: string
  name: string
  trigger: "inventory_low" | "employee_absent" | "payroll_pending" | "job_overdue"
  condition: (payload: any) => boolean
  action: (payload: any) => void
  isEnabled: boolean
}

export class WorkflowEngine {
  private static instance: WorkflowEngine
  private rules: Map<string, WorkflowRule> = new Map()

  private constructor() {
    // Register default system automation rules
    this.registerRule({
      id: "rule-1",
      name: "Low Inventory Notification Alert",
      trigger: "inventory_low",
      condition: (payload) => payload.quantity < payload.minQuantity,
      action: (payload) => {
        console.log(`[Workflow Engine] Triggering low stock notification for ${payload.itemName}`)
      },
      isEnabled: true,
    })

    this.registerRule({
      id: "rule-2",
      name: "Employee Absence HR Alert",
      trigger: "employee_absent",
      condition: (payload) => payload.status === "absent",
      action: (payload) => {
        console.log(`[Workflow Engine] Notifying HR of absence for ${payload.employeeName}`)
      },
      isEnabled: true,
    })
  }

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine()
    }
    return WorkflowEngine.instance
  }

  public registerRule(rule: WorkflowRule): void {
    this.rules.set(rule.id, rule)
  }

  public evaluateTrigger(
    trigger: "inventory_low" | "employee_absent" | "payroll_pending" | "job_overdue",
    payload: any
  ): void {
    this.rules.forEach((rule) => {
      if (rule.isEnabled && rule.trigger === trigger) {
        if (rule.condition(payload)) {
          rule.action(payload)
        }
      }
    })
  }

  public getRules(): WorkflowRule[] {
    return Array.from(this.rules.values())
  }
}

export const workflowEngine = WorkflowEngine.getInstance()
