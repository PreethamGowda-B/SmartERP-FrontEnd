import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { JobStatusBadge } from '@/components/customer/ui/JobStatusBadge';
import type { Job } from '@/lib/customerTypes';

const PRIORITY_COLORS: Record<string, string> = {
  low:    'text-slate-400',
  medium: 'text-blue-400',
  high:   'text-orange-400',
  urgent: 'text-red-400',
};

export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/customer/job/${job.id}`}>
      <div className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-indigo-500/30 rounded-2xl p-5 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm truncate group-hover:text-indigo-300 transition-colors">
              {job.title}
            </h3>
            {job.description && (
              <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{job.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <JobStatusBadge status={job.status} />
            <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-indigo-400 transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className={`text-xs font-medium capitalize ${PRIORITY_COLORS[job.priority] || 'text-slate-400'}`}>
            {job.priority}
          </span>
          {job.assigned_employee_name && (
            <span className="text-xs text-white/40">
              → {job.assigned_employee_name}
            </span>
          )}
          <span className="text-xs text-white/30 ml-auto">
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Progress bar */}
        {job.progress > 0 && (
          <div className="mt-3">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
