export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
  );
}

export function JobCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-4 w-48" />
        <LoadingSkeleton className="h-6 w-20 rounded-full" />
      </div>
      <LoadingSkeleton className="h-3 w-64" />
      <div className="flex items-center gap-3">
        <LoadingSkeleton className="h-3 w-16" />
        <LoadingSkeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
            <LoadingSkeleton className="h-3 w-20 mb-3" />
            <LoadingSkeleton className="h-8 w-12 mb-1" />
            <LoadingSkeleton className="h-3 w-16" />
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

export function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <LoadingSkeleton className="h-5 w-32" />
        <LoadingSkeleton className="h-10 w-full" />
        <LoadingSkeleton className="h-10 w-full" />
        <LoadingSkeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
