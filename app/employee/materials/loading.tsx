import { SkeletonTable } from "@/components/skeleton-components"

export default function Loading() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-muted/20 animate-pulse rounded-md" />
        <div className="h-4 w-64 bg-muted/20 animate-pulse rounded-md" />
      </div>
      <SkeletonTable rows={8} cols={4} />
    </div>
  )
}
