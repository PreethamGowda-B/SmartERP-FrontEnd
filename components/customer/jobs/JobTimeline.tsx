import { formatDistanceToNow, format } from 'date-fns';
import { CheckCircle, Clock, UserCheck, Play, XCircle } from 'lucide-react';
import type { Job } from '@/lib/customerTypes';

interface TimelineEvent {
  label: string;
  timestamp: string | null;
  icon: React.ElementType;
  color: string;
}

export function JobTimeline({ job }: { job: Job }) {
  const events: TimelineEvent[] = [
    {
      label: 'Job submitted',
      timestamp: job.created_at,
      icon: Clock,
      color: 'text-blue-400 bg-blue-500/10',
    },
    {
      label: 'Employee accepted',
      timestamp: job.accepted_at,
      icon: UserCheck,
      color: 'text-yellow-400 bg-yellow-500/10',
    },
    {
      label: 'Work in progress',
      timestamp: job.accepted_at && job.progress > 0 ? job.accepted_at : null,
      icon: Play,
      color: 'text-orange-400 bg-orange-500/10',
    },
    {
      label: 'Job completed',
      timestamp: job.completed_at,
      icon: CheckCircle,
      color: 'text-green-400 bg-green-500/10',
    },
  ];

  if (job.status === 'cancelled') {
    events.push({
      label: 'Job cancelled',
      timestamp: job.declined_at,
      icon: XCircle,
      color: 'text-red-400 bg-red-500/10',
    });
  }

  const completedEvents = events.filter((e) => e.timestamp);

  return (
    <div className="space-y-3">
      {completedEvents.map((event, i) => {
        const Icon = event.icon;
        return (
          <div key={i} className="flex items-start gap-3">
            <div className={`mt-0.5 p-1.5 rounded-lg ${event.color.split(' ')[1]}`}>
              <Icon className={`h-3.5 w-3.5 ${event.color.split(' ')[0]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">{event.label}</p>
              {event.timestamp && (
                <p className="text-xs text-white/40 mt-0.5">
                  {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                  {' · '}
                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {completedEvents.length === 0 && (
        <p className="text-sm text-white/30">No events yet</p>
      )}
    </div>
  );
}
