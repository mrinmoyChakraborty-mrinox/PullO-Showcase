'use client'

import { useRef, useCallback, useEffect, useState, useMemo } from 'react'

interface ScrollPaginationProps {
  totalPages: number
  currentPage?: number
  onPageChange?: (page: number) => void
}

export function ScrollPagination({ totalPages, currentPage: externalPage, onPageChange }: ScrollPaginationProps) {
  const [internalPage, setInternalPage] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLButtonElement | null)[]>([])

  const currentPage = externalPage ?? internalPage

  const goTo = useCallback((page: number) => {
    const p = Math.max(1, Math.min(page, totalPages))
    if (onPageChange) {
      onPageChange(p)
    } else {
      setInternalPage(p)
    }
  }, [totalPages, onPageChange])

  useEffect(() => {
    const el = pageRefs.current[currentPage - 1]
    if (el && scrollRef.current) {
      const container = scrollRef.current
      const offset = el.offsetLeft - container.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2
      container.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }, [currentPage])

  const visible = useMemo(() => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }, [totalPages, currentPage])

  if (totalPages <= 1) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '4px 0',
    }}>
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: currentPage <= 1 ? 'var(--text-lo)' : 'var(--text-md)',
          cursor: currentPage <= 1 ? 'default' : 'pointer',
          opacity: currentPage <= 1 ? 0.35 : 1,
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
        aria-label="Previous page"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      <div
        ref={scrollRef}
        style={{
          display: 'flex', alignItems: 'center', gap: 3,
          overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
          flex: 1, justifyContent: 'center',
        }}
        className="scroll-pagination-track"
      >
        {visible.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} style={{ width: 20, textAlign: 'center', fontSize: 11, color: 'var(--text-lo)', letterSpacing: 1, flexShrink: 0 }}>
              …
            </span>
          ) : (
            <button
              key={p}
              ref={(el) => { pageRefs.current[p - 1] = el }}
              onClick={() => goTo(p)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 28, height: 28, padding: '0 4px', borderRadius: 6,
                border: 'none',
                background: p === currentPage ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.15))' : 'transparent',
                color: p === currentPage ? '#C4B5FD' : 'var(--text-md)',
                fontSize: 12, fontWeight: p === currentPage ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                fontFamily: "'Geist Mono','Geist Mono Fallback',monospace",
                outline: p === currentPage ? '1px solid rgba(124,58,237,0.35)' : 'none',
              }}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: currentPage >= totalPages ? 'var(--text-lo)' : 'var(--text-md)',
          cursor: currentPage >= totalPages ? 'default' : 'pointer',
          opacity: currentPage >= totalPages ? 0.35 : 1,
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
        aria-label="Next page"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  )
}
