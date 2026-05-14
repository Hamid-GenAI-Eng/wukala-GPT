import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function HeroSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6 p-6 lg:p-12', className)}>
      <Skeleton className="h-12 w-3/4 mx-auto" />
      <Skeleton className="h-6 w-1/2 mx-auto" />
      <div className="flex justify-center gap-4 mt-8">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-32" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 lg:p-6 rounded-xl border border-border bg-card">
          <Skeleton className="h-40 w-full rounded-lg mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar skeleton */}
      <div className="hidden sm:flex flex-col w-72 border-r border-border p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
      {/* Chat area skeleton */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <Skeleton className="h-20 w-2/3 rounded-2xl" />
          </div>
          <div className="flex gap-3 justify-end">
            <Skeleton className="h-16 w-1/2 rounded-2xl" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <Skeleton className="h-24 w-3/4 rounded-2xl" />
          </div>
        </div>
        <Skeleton className="h-14 w-full mt-4" />
      </div>
    </div>
  );
}

export function ProfileSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('max-w-4xl mx-auto p-6 space-y-6', className)}>
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, className }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn('rounded-xl border border-border overflow-hidden', className)}>
      <div className="bg-muted/50 p-4 flex gap-4">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4 border-t border-border">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function DocumentSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Skeleton className="h-10 w-full sm:w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      {/* Upload area */}
      <Skeleton className="h-40 w-full rounded-xl" />
      {/* Grid */}
      <CardGridSkeleton count={6} />
    </div>
  );
}
