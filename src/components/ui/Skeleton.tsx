import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

export function Skeleton({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden="true" {...props} />
}

export function RoomCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <Skeleton className="h-2 w-32 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  )
}

export function ParticipantSkeleton() {
  return (
    <li className="flex items-center gap-3 py-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </li>
  )
}
