'use client'

import { cn } from '@/lib/utils'

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-gradient-to-r from-white/[0.04] via-white/[0.12] to-white/[0.04] bg-[length:400%_100%]',
        className,
      )}
    />
  )
}

export function ModelCardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(124,58,237,0.05)',
        }}
      >
        <SkeletonBar className="h-12 w-12 rounded-full" />
      </div>

      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SkeletonBar className="h-5 w-3/5" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <SkeletonBar className="h-2 w-2 rounded-full" />
          <SkeletonBar className="h-3 w-16" />
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="h-3 w-16" />
        </div>

        <div style={{ flex: 1 }} />

        <SkeletonBar className="h-9 w-full mt-4" />
      </div>
    </div>
  )
}
