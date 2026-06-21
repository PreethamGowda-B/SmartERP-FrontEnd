import type { JobStatus, EmployeeStatus } from '@/lib/customerTypes';

interface JobStatusBadgeProps {
  status: JobStatus;
  approvalStatus?: string;
  employeeStatus?: EmployeeStatus | string;
}

/**
 * JobStatusBadge — Strict Priority Engine
 *
 * Evaluation order (MUST match backend exactly):
 * 1. status = 'completed'         → "Completed"
 * 2. status = 'in_progress'       → "In Progress"
 * 3. employee_status = 'accepted' → "Technician Assigned"
 * 4. employee_status = 'assigned' → "Assigning Technician"
 * 5. approval_status = 'approved' → "Approved"
 * 6. approval_status = 'rejected' → "Not Approved"
 * 7. default                      → "Pending Review"
 */
export function JobStatusBadge({ status, approvalStatus, employeeStatus }: JobStatusBadgeProps) {
  let label: string;
  let className: string;
  let dot: string;

  // 1. COMPLETED — highest priority, ignores all other fields
  if (status === 'completed') {
    label = 'Completed'; className = 'bg-green-50 text-green-700 ring-1 ring-green-200'; dot = 'bg-green-500';
  }
  // 2. IN PROGRESS
  else if (status === 'in_progress') {
    label = 'In Progress'; className = 'bg-orange-50 text-orange-700 ring-1 ring-orange-200'; dot = 'bg-orange-500 animate-pulse';
  }
  // 3. TECHNICIAN ACCEPTED
  else if (employeeStatus === 'accepted') {
    label = 'Technician Assigned'; className = 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'; dot = 'bg-indigo-500';
  }
  // 4. AWAITING EMPLOYEE ACCEPTANCE
  else if (employeeStatus === 'assigned' || employeeStatus === 'pending') {
    label = 'Assigning Technician'; className = 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'; dot = 'bg-purple-400 animate-pulse';
  }
  // 5. APPROVED — awaiting employee dispatch
  else if (approvalStatus === 'approved') {
    label = 'Approved'; className = 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'; dot = 'bg-blue-500';
  }
  // 6. REJECTED
  else if (approvalStatus === 'rejected') {
    label = 'Not Approved'; className = 'bg-red-50 text-red-700 ring-1 ring-red-200'; dot = 'bg-red-500';
  }
  // 7. CANCELLED
  else if (status === 'cancelled') {
    label = 'Cancelled'; className = 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'; dot = 'bg-gray-400';
  }
  // 8. Default: pending approval  
  else {
    label = 'Pending Review'; className = 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'; dot = 'bg-amber-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
