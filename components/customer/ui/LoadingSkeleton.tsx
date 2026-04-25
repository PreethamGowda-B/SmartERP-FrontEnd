export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />
  );
}

export function JobCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-4 w-48" />
        <LoadingSkeleton className="h-5 w-16 rounded-full" />
      </div>
      <LoadingSkeleton className="h-3 w-32" />
      <LoadingSkeleton className="h-3 w-24" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse">
            <LoadingSkeleton className="h-3 w-16 mb-2" />
            <LoadingSkeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      {/* Job list */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
