'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Clock, User, AlertCircle, MapPin, MessageSquare, Zap,
  Play, CheckCircle, ChevronRight, Timer, Eye,
  ArrowUpCircle, Minus, ArrowDownCircle, Wifi, WifiOff,
  CalendarClock, Hash, Users,
} from 'lucide-react';
import { JobStatusBadge } from '@/components/customer/ui/JobStatusBadge';
import type { Job } from '@/lib/customerTypes';

// ── Priority config ────────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<string, {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
  strip: string;
}> = {
  low:    { label: 'Low',    className: 'text-gray-500 bg-gray-100 ring-1 ring-gray-200',          icon: ArrowDownCircle, strip: 'bg-gray-300' },
  medium: { label: 'Medium', className: 'text-blue-600 bg-blue-50 ring-1 ring-blue-200',            icon: Minus,           strip: 'bg-blue-400' },
  high:   { label: 'High',   className: 'text-orange-600 bg-orange-50 ring-1 ring-orange-200',      icon: ArrowUpCircle,   strip: 'bg-orange-500' },
  urgent: { label: 'Urgent', className: 'text-red-600 bg-red-50 ring-1 ring-red-200',               icon: Zap,             strip: 'bg-red-500' },
};

// ── Status color strip ─────────────────────────────────────────────────────────
function getStatusStrip(job: Job): string {
  if (job.status === 'completed')          return 'bg-green-500';
  if (job.status === 'in_progress')        return 'bg-orange-500';
  if (job.status === 'cancelled')          return 'bg-gray-400';
  if (job.sla_accept_breached || job.sla_completion_breached) return 'bg-red-500';
  if (job.approval_status === 'rejected')  return 'bg-red-400';
  if (job.employee_status === 'accepted')  return 'bg-indigo-500';
  if (job.employee_status === 'assigned')  return 'bg-purple-400';
  if (job.approval_status === 'approved')  return 'bg-blue-400';
  return 'bg-amber-400';
}

// ── Assignment type badge ──────────────────────────────────────────────────────
function AssignmentBadge({ job }: { job: Job }) {
  if (job.assigned_to) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-indigo-700 bg-indigo-50 ring-1 ring-indigo-200">
        <User className="h-2.5 w-2.5" />
        Assigned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-gray-500 bg-gray-100 ring-1 ring-gray-200">
      <Users className="h-2.5 w-2.5" />
      Open
    </span>
  );
}

// ── Employee online indicator ──────────────────────────────────────────────────
function OnlineIndicator({ job }: { job: Job }) {
  const isActive = job.status === 'in_progress' || job.employee_status === 'accepted';
  if (!job.assigned_to) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ring-1 ${
        isActive
          ? 'text-green-700 bg-green-50 ring-green-200'
          : 'text-gray-500 bg-gray-100 ring-gray-200'
      }`}
      title={isActive ? 'Technician is live on this job' : 'Technician offline'}
    >
      {isActive ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
      {isActive ? 'Live' : 'Offline'}
    </span>
  );
}

// ── Get last activity ──────────────────────────────────────────────────────────
function getLastActivity(job: Job): string {
  const timestamps = [
    job.completed_at,
    job.arrived_at,
    job.accepted_at,
    job.started_at,
    job.assigned_at,
    job.approved_at,
    job.created_at,
  ].filter(Boolean) as string[];

  if (timestamps.length === 0) return 'No activity';
  try {
    return formatDistanceToNow(new Date(timestamps[0]), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

// ── SLA due time ───────────────────────────────────────────────────────────────
function SLALabel({ job }: { job: Job }) {
  if (job.scheduled_at) {
    const due = new Date(job.scheduled_at);
    const isPast = due < new Date();
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
        isPast ? 'text-red-600' : 'text-gray-500'
      }`}>
        <CalendarClock className="h-3 w-3" />
        {isPast ? 'Overdue · ' : 'Due · '}
        {format(due, 'MMM d, h:mm a')}
      </span>
    );
  }
  return null;
}

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  if (progress <= 0) return null;
  const color =
    progress === 100 ? 'bg-green-500' :
    progress >= 70  ? 'bg-blue-500' :
    progress >= 40  ? 'bg-orange-400' : 'bg-amber-400';

  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
        <span className="font-medium text-gray-500">Progress</span>
        <span className={`font-bold ${progress === 100 ? 'text-green-600' : 'text-blue-600'}`}>{progress}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ── Action buttons ─────────────────────────────────────────────────────────────
function ActionButtons({ job, compact = false }: { job: Job; compact?: boolean }) {
  const router = useRouter();
  const isActive       = job.status === 'in_progress' || job.status === 'active';
  const isOpen         = job.status === 'open' || job.approval_status === 'approved';
  const isCompleted    = job.status === 'completed';
  const canChat        = !!job.assigned_to;
  const canTrack       = job.employee_status === 'accepted' || job.employee_status === 'arrived';
  const hasSLABreach   = job.sla_accept_breached || job.sla_completion_breached;

  const btnBase = compact
    ? 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all'
    : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Primary CTA */}
      {isCompleted ? (
        <Link
          href={`/customer/job/${job.id}`}
          onClick={e => e.stopPropagation()}
          className={`${btnBase} bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100`}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          View Summary
        </Link>
      ) : isActive ? (
        <Link
          href={`/customer/job/${job.id}`}
          onClick={e => e.stopPropagation()}
          className={`${btnBase} bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200`}
        >
          <Play className="h-3 w-3 fill-current" />
          Continue
        </Link>
      ) : isOpen ? (
        <Link
          href={`/customer/job/${job.id}`}
          onClick={e => e.stopPropagation()}
          className={`${btnBase} bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200`}
        >
          <Play className="h-3 w-3 fill-current" />
          Track
        </Link>
      ) : (
        <Link
          href={`/customer/job/${job.id}`}
          onClick={e => e.stopPropagation()}
          className={`${btnBase} bg-gray-100 text-gray-700 hover:bg-gray-200`}
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Link>
      )}

      {/* Chat */}
      {canChat && (
        <Link
          href={`/customer/job/${job.id}#chat`}
          onClick={e => e.stopPropagation()}
          className={`${btnBase} bg-gray-100 text-gray-700 hover:bg-gray-200 relative`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </Link>
      )}

      {/* Live Location */}
      {canTrack && (
        <Link
          href={`/customer/job/${job.id}#tracking`}
          onClick={e => e.stopPropagation()}
          className={`${btnBase} bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100`}
        >
          <MapPin className="h-3.5 w-3.5" />
          Live Map
        </Link>
      )}

      {/* SLA breach alert */}
      {hasSLABreach && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 ring-1 ring-red-200 text-red-600 text-[10px] font-bold">
          <AlertCircle className="h-3 w-3" />
          SLA Breach
        </span>
      )}
    </div>
  );
}

// ── Main JobCard ───────────────────────────────────────────────────────────────
export function JobCard({ job, showActions = true }: { job: Job; showActions?: boolean }) {
  const priority   = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.medium;
  const PriorityIcon = priority.icon;
  const strip      = getStatusStrip(job);
  const lastActivity = getLastActivity(job);

  return (
    <div className="group relative bg-white border border-gray-200 hover:border-blue-300 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] cursor-pointer">

      {/* ── Top color strip (status-driven) ────────────────────────────────── */}
      <div className={`h-0.5 w-full ${strip}`} />

      <div className="p-5">

        {/* ── Row 1: Title + Status badge ──────────────────────────────────── */}
        <Link href={`/customer/job/${job.id}`} className="block">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              {/* Job ID + assignment type */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-gray-400">
                  <Hash className="h-2.5 w-2.5" />
                  {job.id.slice(-6).toUpperCase()}
                </span>
                <AssignmentBadge job={job} />
                <OnlineIndicator job={job} />
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-900 leading-tight truncate group-hover:text-blue-700 transition-colors">
                {job.title}
              </h3>

              {/* Description */}
              {job.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 leading-relaxed">
                  {job.description}
                </p>
              )}
            </div>

            {/* Status badge */}
            <div className="shrink-0">
              <JobStatusBadge
                status={job.status}
                approvalStatus={job.approval_status}
                employeeStatus={job.employee_status}
              />
            </div>
          </div>

          {/* ── Row 2: Priority + SLA + Employee + Location ──────────────── */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {/* Priority */}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${priority.className}`}>
              <PriorityIcon className="h-2.5 w-2.5" />
              {priority.label}
            </span>

            {/* SLA / due time */}
            <SLALabel job={job} />

            {/* Assigned employee */}
            {job.assigned_employee_name && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                <User className="h-2.5 w-2.5 text-gray-400" />
                <span className="font-medium text-gray-700">{job.assigned_employee_name}</span>
              </span>
            )}
          </div>

          {/* ── Row 3: Progress bar ───────────────────────────────────────── */}
          {Number(job.progress || 0) > 0 && (
            <div className="mb-3">
              <ProgressBar progress={Number(job.progress || 0)} />
            </div>
          )}
        </Link>

        {/* ── Row 4: Actions ───────────────────────────────────────────────── */}
        {showActions && (
          <div className="mb-3">
            <ActionButtons job={job} />
          </div>
        )}

        {/* ── Row 5: Footer metrics ────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
          {/* Mini metrics */}
          <div className="flex items-center gap-3">
            {/* Created */}
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </span>

            {/* Source */}
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
              <Timer className="h-3 w-3" />
              {job.source === 'customer' ? 'Self-submitted' : 'Owner-created'}
            </span>
          </div>

          {/* Last activity */}
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <span>Updated {lastActivity}</span>
            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
}
