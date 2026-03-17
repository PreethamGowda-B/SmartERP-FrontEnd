import { SkeletonCard } from "@/components/skeleton-components"

export default function Loading() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-muted/20 animate-pulse rounded-md" />
        <div className="h-10 w-32 bg-muted/20 animate-pulse rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
