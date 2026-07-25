'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

function ErrorState({
  title = 'Something went wrong',
  message = 'Failed to load API keys. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center backdrop-blur-sm',
        className,
      )}
    >
      <div className="mb-5 flex size-14 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FB7185"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-xs text-sm text-white/50">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23,4 23,10 17,10" />
            <path d="M20.49,15a9,9,0,1,1-2.12-9.36L23,10" />
          </svg>
          Retry
        </Button>
      )}
    </div>
  )
}

export { ErrorState }
