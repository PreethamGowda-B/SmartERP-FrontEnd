import { format, formatDistanceToNow } from 'date-fns';
import { CheckCircle, Clock, UserCheck, Play, XCircle, FileText } from 'lucide-react';
import type { Job } from '@/lib/customerTypes';

interface TimelineEvent {
  label: string;
  description?: string;
  timestamp: string | null;
  icon: React.ElementType;
  iconClass: string;
  dotClass: string;
}

export function JobTimeline({ job }: { job: Job }) {
  const events: TimelineEvent[] = [
    {
      label: 'Request submitted',
      description: 'Your service request was created',
      timestamp: job.created_at,
      icon: FileText,
      iconClass: 'text-blue-600',
      dotClass: 'bg-blue-600',
    },
    {
      label: 'Technician assigned',
      description: job.assigned_employee_name ? `Assigned to ${job.assigned_employee_name}` : undefined,
      timestamp: job.accepted_at,
      icon: UserCheck,
      iconClass: 'text-amber-600',
      dotClass: 'bg-amber-500',
    },
    {
      label: 'Work in progress',
      description: job.progress > 0 ? `${job.progress}% complete` : undefined,
      timestamp: job.accepted_at && job.progress > 0 ? job.accepted_at : null,
      icon: Play,
      iconClass: 'text-orange-600',
      dotClass: 'bg-orange-500',
    },
    {
      label: 'Request completed',
      description: 'Service has been completed',
      timestamp: job.completed_at,
      icon: CheckCircle,
      iconClass: 'text-green-600',
      dotClass: 'bg-green-500',
    },
  ];

  if (job.status === 'cancelled') {
    events.push({
      label: 'Request cancelled',
      timestamp: job.declined_at || null,
      icon: XCircle,
      iconClass: 'text-red-600',
      dotClass: 'bg-red-500',
    });
  }

  const completedEvents = events.filter((e) => e.timestamp);

  if (completedEvents.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {completedEvents.map((event, i) => {
        const Icon = event.icon;
        const isLast = i === completedEvents.length - 1;
        return (
          <div key={i} className="flex gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 shrink-0`}>
                <Icon className={`h-4 w-4 ${event.iconClass}`} />
              </div>
              {!isLast && <div className="w-0.5 h-full bg-gray-200 my-1" />}
            </div>

            {/* Content */}
            <div className={`flex-1 ${!isLast ? 'pb-6' : ''}`}>
              <p className="text-sm font-medium text-gray-900">{event.label}</p>
              {event.description && (
                <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
              )}
              {event.timestamp && (
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(event.timestamp), 'MMM d, yyyy · h:mm a')}
                  <span className="mx-1">·</span>
                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
