import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, Clock } from 'lucide-react';
import { JobStatusBadge } from '@/components/customer/ui/JobStatusBadge';
import type { Job } from '@/lib/customerTypes';

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low:    { label: 'Low',    className: 'text-gray-500 bg-gray-100' },
  medium: { label: 'Medium', className: 'text-blue-600 bg-blue-50' },
  high:   { label: 'High',   className: 'text-orange-600 bg-orange-50' },
  urgent: { label: 'Urgent', className: 'text-red-600 bg-red-50' },
};

export function JobCard({ job }: { job: Job }) {
  const priority = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.medium;

  return (
    <Link href={`/customer/job/${job.id}`}>
      <div className="group bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-xl p-5 transition-all cursor-pointer hover:shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 font-medium text-sm truncate group-hover:text-blue-700 transition-colors">
              {job.title}
            </h3>
            {job.description && (
              <p className="text-gray-500 text-xs mt-1 line-clamp-1">{job.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <JobStatusBadge status={job.status} approvalStatus={job.approval_status} />
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${priority.className}`}>
            {priority.label}
          </span>
          {job.assigned_employee_name && (
            <span className="text-xs text-gray-500">
              Assigned to <span className="font-medium text-gray-700">{job.assigned_employee_name}</span>
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </div>
        </div>

        {/* Progress bar */}
        {job.progress > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span className="font-medium">{job.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
