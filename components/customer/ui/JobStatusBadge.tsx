import type { JobStatus, EmployeeStatus } from '@/lib/customerTypes';

interface JobStatusBadgeProps {
  status: JobStatus;
  approvalStatus?: string;
  employeeStatus?: EmployeeStatus | string;
  size?: 'sm' | 'md';
}

/**
 * JobStatusBadge — Premium SaaS Status Indicator
 *
 * Evaluation order (MUST match backend exactly):
 * 1. status = 'completed'          → "Completed"
 * 2. status = 'in_progress'        → "In Progress"
 * 3. employee_status = 'arrived'   → "Technician Arrived"
 * 4. employee_status = 'accepted'  → "Technician Assigned"
 * 5. employee_status = 'assigned'  → "Assigning Technician"
 * 6. approval_status = 'approved'  → "Approved"
 * 7. approval_status = 'rejected'  → "Not Approved"
 * 8. status = 'cancelled'          → "Cancelled"
 * 9. default                       → "Pending Review"
 */
export function JobStatusBadge({ status, approvalStatus, employeeStatus, size = 'sm' }: JobStatusBadgeProps) {
  let label: string;
  let className: string;
  let dot: string;

  // 1. COMPLETED
  if (status === 'completed') {
    label = 'Completed';
    className = 'bg-green-50 text-green-700 ring-1 ring-green-200';
    dot = 'bg-green-500';
  }
  // 2. IN PROGRESS / ACTIVE
  else if (status === 'in_progress' || status === 'active') {
    label = 'In Progress';
    className = 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
    dot = 'bg-orange-500 animate-pulse';
  }
  // 3. ARRIVED ON SITE
  else if (employeeStatus === 'arrived') {
    label = 'Arrived On Site';
    className = 'bg-teal-50 text-teal-700 ring-1 ring-teal-200';
    dot = 'bg-teal-500 animate-pulse';
  }
  // 4. TECHNICIAN ACCEPTED
  else if (employeeStatus === 'accepted') {
    label = 'Tech Assigned';
    className = 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200';
    dot = 'bg-indigo-500';
  }
  // 5. AWAITING EMPLOYEE ACCEPTANCE
  else if (employeeStatus === 'assigned' || employeeStatus === 'pending') {
    label = 'Assigning Tech';
    className = 'bg-purple-50 text-purple-700 ring-1 ring-purple-200';
    dot = 'bg-purple-400 animate-pulse';
  }
  // 6. APPROVED — awaiting employee dispatch
  else if (approvalStatus === 'approved') {
    label = 'Approved';
    className = 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    dot = 'bg-blue-500';
  }
  // 7. REJECTED
  else if (approvalStatus === 'rejected') {
    label = 'Not Approved';
    className = 'bg-red-50 text-red-700 ring-1 ring-red-200';
    dot = 'bg-red-500';
  }
  // 8. CANCELLED
  else if (status === 'cancelled') {
    label = 'Cancelled';
    className = 'bg-gray-100 text-gray-500 ring-1 ring-gray-200';
    dot = 'bg-gray-400';
  }
  // 9. Default: pending approval
  else {
    label = 'Pending Review';
    className = 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    dot = 'bg-amber-500 animate-pulse';
  }

  const sizeClass = size === 'md'
    ? 'px-3 py-1.5 text-xs'
    : 'px-2.5 py-1 text-[11px]';

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClass} rounded-full font-semibold whitespace-nowrap ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}
