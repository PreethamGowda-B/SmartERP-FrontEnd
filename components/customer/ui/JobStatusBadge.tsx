import type { JobStatus } from '@/lib/customerTypes';

const STATUS_CONFIG: Record<JobStatus, { label: string; className: string }> = {
  open:        { label: 'Open',        className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  pending:     { label: 'Pending',     className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  in_progress: { label: 'In Progress', className: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  active:      { label: 'Active',      className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  completed:   { label: 'Completed',   className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  closed:      { label: 'Closed',      className: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  cancelled:   { label: 'Cancelled',   className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
