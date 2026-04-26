import { format, formatDistanceToNow } from 'date-fns';
import { CheckCircle, Clock, UserCheck, Play, XCircle, FileText, ShieldCheck, ShieldX, MapPin } from 'lucide-react';
import type { Job } from '@/lib/customerTypes';

interface TimelineEvent {
  label: string;
  description?: string;
  timestamp: string | null;
  icon: React.ElementType;
  iconClass: string;
  lineClass?: string;
  isNegative?: boolean;
}

export function JobTimeline({ job }: { job: Job }) {
  const events: TimelineEvent[] = [];

  // 1. Always: submitted
  events.push({
    label: 'Request submitted',
    description: 'Your service request was received',
    timestamp: job.created_at,
    icon: FileText,
    iconClass: 'text-blue-600',
  });

  // 2. Approval outcome
  if (job.approval_status === 'rejected') {
    events.push({
      label: 'Request not approved',
      description: 'The service team could not approve this request',
      timestamp: job.rejected_at || null,
      icon: ShieldX,
      iconClass: 'text-red-600',
      isNegative: true,
    });
  } else if (job.approval_status === 'approved' && job.approved_at) {
    events.push({
      label: 'Request approved',
      description: 'Your request has been approved by the service team',
      timestamp: job.approved_at,
      icon: ShieldCheck,
      iconClass: 'text-green-600',
    });
  } else if (job.approval_status === 'pending_approval') {
    // Show pending as a future step (no timestamp)
    events.push({
      label: 'Awaiting approval',
      description: 'The service team is reviewing your request',
      timestamp: null,
      icon: Clock,
      iconClass: 'text-amber-500',
    });
  }

  // 3. Employee assigned / accepted
  if (job.accepted_at || job.assigned_at) {
    events.push({
      label: 'Technician assigned',
      description: job.assigned_employee_name ? `Assigned to ${job.assigned_employee_name}` : 'A technician has been assigned',
      timestamp: job.accepted_at || job.assigned_at,
      icon: UserCheck,
      iconClass: 'text-indigo-600',
    });
  }

  // 4. Employee arrived
  if (job.arrived_at) {
    events.push({
      label: 'Technician arrived',
      description: job.assigned_employee_name ? `${job.assigned_employee_name} has arrived at your location` : 'Technician has arrived',
      timestamp: job.arrived_at,
      icon: MapPin,
      iconClass: 'text-purple-600',
    });
  }

  // 5. Work in progress
  if (job.progress > 0 && job.status !== 'completed') {
    events.push({
      label: 'Work in progress',
      description: `${job.progress}% complete`,
      timestamp: job.accepted_at || null,
      icon: Play,
      iconClass: 'text-orange-600',
    });
  }

  // 6. Completed
  if (job.completed_at) {
    events.push({
      label: 'Request completed',
      description: 'Service has been successfully completed',
      timestamp: job.completed_at,
      icon: CheckCircle,
      iconClass: 'text-green-600',
    });
  }

  // 7. Cancelled
  if (job.status === 'cancelled' && !job.completed_at) {
    events.push({
      label: 'Request cancelled',
      timestamp: job.declined_at || null,
      icon: XCircle,
      iconClass: 'text-red-600',
      isNegative: true,
    });
  }

  const completedEvents = events.filter(e => e.timestamp);
  const pendingEvents   = events.filter(e => !e.timestamp);

  if (completedEvents.length === 0 && pendingEvents.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No activity yet</p>
      </div>
    );
  }

  const allEvents = [...completedEvents, ...pendingEvents];

  return (
    <div className="space-y-0">
      {allEvents.map((event, i) => {
        const Icon = event.icon;
        const isLast = i === allEvents.length - 1;
        const isPending = !event.timestamp;

        return (
          <div key={i} className={`flex gap-4 ${isPending ? 'opacity-50' : ''}`}>
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isPending
                  ? 'bg-gray-50 border-2 border-dashed border-gray-300'
                  : event.isNegative
                    ? 'bg-red-50 border-2 border-red-200'
                    : 'bg-white border-2 border-gray-200'
              }`}>
                <Icon className={`h-4 w-4 ${isPending ? 'text-gray-400' : event.iconClass}`} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-[16px]" />}
            </div>

            {/* Content */}
            <div className={`flex-1 ${!isLast ? 'pb-5' : ''}`}>
              <p className={`text-sm font-medium ${isPending ? 'text-gray-400' : event.isNegative ? 'text-red-700' : 'text-gray-900'}`}>
                {event.label}
              </p>
              {event.description && (
                <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
              )}
              {event.timestamp ? (
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(event.timestamp), 'MMM d, yyyy · h:mm a')}
                  <span className="mx-1">·</span>
                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1 italic">Pending</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
