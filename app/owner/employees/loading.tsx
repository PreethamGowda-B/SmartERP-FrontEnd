import { SkeletonTable } from "@/components/skeleton-components"

export default function Loading() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-muted/20 animate-pulse rounded-md mb-2" />
          <div className="h-4 w-64 bg-muted/20 animate-pulse rounded-md" />
        </div>
        <div className="h-10 w-32 bg-muted/20 animate-pulse rounded-md" />
      </div>
      <SkeletonTable rows={10} cols={5} />
    </div>
  )
}
