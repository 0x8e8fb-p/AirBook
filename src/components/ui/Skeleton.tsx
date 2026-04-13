"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--bg-subtle)] via-[var(--bg-elevated)] to-[var(--bg-subtle)]",
            "bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]",
            className
          )}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

/** Skeleton for a fare card */
export function FareCardSkeleton() {
  return (
    <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-[var(--radius-md)]" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-[var(--radius-full)]" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-24" />
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
