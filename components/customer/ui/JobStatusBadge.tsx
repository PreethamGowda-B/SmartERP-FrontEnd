import type { JobStatus } from '@/lib/customerTypes';

// approval_status values shown to customers
const APPROVAL_STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  pending_approval: { label: 'Pending Review', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', dot: 'bg-amber-500' },
  approved:         { label: 'Approved',        className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',   dot: 'bg-blue-500' },
  rejected:         { label: 'Not Approved',    className: 'bg-red-50 text-red-700 ring-1 ring-red-200',      dot: 'bg-red-500' },
};

// job execution status values
const STATUS_CONFIG: Record<JobStatus, { label: string; className: string; dot: string }> = {
  open:        { label: 'Open',        className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',    dot: 'bg-blue-500' },
  pending:     { label: 'Pending',     className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', dot: 'bg-amber-500' },
  in_progress: { label: 'In Progress', className: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200', dot: 'bg-orange-500' },
  active:      { label: 'Active',      className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', dot: 'bg-amber-500' },
  completed:   { label: 'Completed',   className: 'bg-green-50 text-green-700 ring-1 ring-green-200', dot: 'bg-green-500' },
  closed:      { label: 'Closed',      className: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',   dot: 'bg-gray-400' },
  cancelled:   { label: 'Cancelled',   className: 'bg-red-50 text-red-700 ring-1 ring-red-200',       dot: 'bg-red-500' },
};

interface JobStatusBadgeProps {
  status: JobStatus;
  approvalStatus?: string;
}

export function JobStatusBadge({ status, approvalStatus }: JobStatusBadgeProps) {
  // Show approval status for customer-submitted jobs that are pending or rejected
  if (approvalStatus && approvalStatus !== 'approved') {
    const config = APPROVAL_STATUS_CONFIG[approvalStatus];
    if (config) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      );
    }
  }

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
