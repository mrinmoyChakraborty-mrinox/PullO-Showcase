'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'

export interface Chapter {
  id: string
  title: string
  description: ReactNode
  meta: ReactNode
}

interface ChapterScrubberProps {
  chapters: Chapter[]
  side?: 'left' | 'right'
  peakLength?: number
  restLength?: number
  rowHeight?: number
  radius?: number
  currentIndex?: number
  onActiveChange?: (chapter: Chapter | null, index: number) => void
  onSelect?: (chapter: Chapter, index: number) => void
  label?: string
  className?: string
}

const HALF_PI = Math.PI / 2

function raisedCos(t: number): number {
  if (t <= -1 || t >= 1) return 0
  return 0.5 * (1 + Math.cos(Math.PI * t))
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

export function ChapterScrubber({
  chapters,
  side = 'right',
  peakLength = 56,
  restLength = 14,
  rowHeight = 10,
  radius = 4,
  currentIndex,
  onActiveChange,
  onSelect,
  label = 'Chapters',
  className = '',
}: ChapterScrubberProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef(0)
  const pointerTargetRef = useRef(0)
  const strengthRef = useRef(0)
  const strengthTargetRef = useRef(0)
  const frameRef = useRef(0)
  const [crestIdx, setCrestIdx] = useState<number | null>(null)
  const reducedRef = useRef(false)
  const activeIdxRef = useRef<number | null>(null)
  const hoveredRef = useRef(false)

  const totalHeight = chapters.length * rowHeight

  const springPointer = useCallback(() => {
    const dt = 0.016
    const damping = 16
    const stiffness = 280

    const dx = pointerTargetRef.current - pointerRef.current
    const accel = stiffness * dx - damping * pointerRef.current
    pointerRef.current += accel * dt * dt

    const sdx = strengthTargetRef.current - strengthRef.current
    const saccel = 180 * sdx - 14 * strengthRef.current
    strengthRef.current += saccel * dt * dt

    const p = pointerRef.current
    const s = strengthRef.current

    const topOffset = railRef.current?.getBoundingClientRect().top ?? 0
    const rawIdx = p !== 0 ? Math.round(p / rowHeight) : -1
    const idx = clamp(rawIdx, 0, chapters.length - 1)

    if (idx !== activeIdxRef.current && s > 0.01) {
      activeIdxRef.current = idx
      setCrestIdx(idx)
    }

    const ticks = railRef.current?.querySelectorAll<HTMLDivElement>('[data-tick]')
    if (ticks) {
      for (let i = 0; i < ticks.length; i++) {
        const tick = ticks[i]
        const dist = (i * rowHeight - p) / (radius * rowHeight)
        const rise = s * raisedCos(dist)
        const length = restLength + (peakLength - restLength) * rise
        const opacity = 0.35 + 0.65 * rise
        tick.style.width = `${length}px`
        tick.style.opacity = `${opacity}`
      }
    }

    const labels = railRef.current?.querySelectorAll<HTMLDivElement>('[data-label]')
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i]
        const dist = (i * rowHeight - p) / (radius * rowHeight)
        const rise = s * raisedCos(dist)
        label.style.opacity = `${rise}`
      }
    }

    const card = railRef.current?.querySelector<HTMLDivElement>('[data-card]')
    if (card) {
      if (idx >= 0 && idx < chapters.length && p !== 0 && hoveredRef.current) {
        card.style.top = `${idx * rowHeight}px`
        card.style.opacity = `${s}`
      } else {
        card.style.opacity = '0'
      }
    }

    frameRef.current = requestAnimationFrame(springPointer)
  }, [chapters.length, rowHeight, radius, restLength, peakLength])

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(springPointer)
    return () => cancelAnimationFrame(frameRef.current)
  }, [springPointer])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    hoveredRef.current = true
    const rect = railRef.current?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    const clamped = clamp(y, 0, totalHeight - 1)
    if (reducedRef.current) {
      pointerRef.current = clamped
      pointerTargetRef.current = clamped
      strengthRef.current = 1
      strengthTargetRef.current = 1
    } else {
      pointerTargetRef.current = clamped
      strengthTargetRef.current = 1
    }
  }, [totalHeight])

  const handlePointerLeave = useCallback(() => {
    hoveredRef.current = false
    if (reducedRef.current) {
      pointerRef.current = 0
      pointerTargetRef.current = 0
      strengthRef.current = 0
      strengthTargetRef.current = 0
    } else {
      pointerTargetRef.current = 0
      strengthTargetRef.current = 0
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const current = activeIdxRef.current ?? 0
    let next = current
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      next = Math.min(current + 1, chapters.length - 1)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      next = Math.max(current - 1, 0)
    } else if (e.key === 'Home') {
      e.preventDefault()
      next = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      next = chapters.length - 1
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const idx = activeIdxRef.current
      if (idx != null && idx >= 0 && idx < chapters.length) {
        onSelect?.(chapters[idx], idx)
      }
      return
    } else {
      return
    }

    const targetY = next * rowHeight
    if (reducedRef.current) {
      pointerRef.current = targetY
      pointerTargetRef.current = targetY
      strengthRef.current = 1
      strengthTargetRef.current = 1
    } else {
      pointerTargetRef.current = targetY
      strengthTargetRef.current = 1
    }
    const btn = railRef.current?.querySelector<HTMLButtonElement>(`[data-idx="${next}"]`)
    btn?.focus()
  }, [chapters, rowHeight, onSelect])

  useEffect(() => {
    if (onActiveChange) {
      const idx = activeIdxRef.current
      if (idx != null && idx >= 0 && idx < chapters.length) {
        onActiveChange(chapters[idx], idx)
      } else {
        onActiveChange(null, -1)
      }
    }
  }, [crestIdx, chapters, onActiveChange])

  const handleSelect = useCallback((chapter: Chapter, idx: number) => {
    onSelect?.(chapter, idx)
  }, [onSelect])

  const visibleCardIdx = useMemo(() => {
    const idx = activeIdxRef.current
    if (idx == null || idx < 0 || idx >= chapters.length) return null
    return idx
  }, [crestIdx, chapters.length])

  return (
    <div className={className} style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
      <div
        ref={railRef}
        role="listbox"
        aria-label={label}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          padding: `${rowHeight / 2}px 0`,
          cursor: 'default',
          touchAction: 'none',
          minHeight: totalHeight,
        }}
      >
        {/* Card */}
        {visibleCardIdx != null && (
          <div
            data-card
            style={{
              position: 'absolute',
              [side === 'right' ? 'right' : 'left']: '100%',
              top: 0,
              transform: 'translateY(-50%)',
              marginLeft: side === 'right' ? 12 : 0,
              marginRight: side === 'left' ? 12 : 0,
              background: 'rgb(12 18 38 / 0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '10px 14px',
              minWidth: 200,
              maxWidth: 280,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {chapters[visibleCardIdx]?.meta && (
              <div style={{
                fontSize: 10,
                  color: 'var(--color-text-soft, #b8c0d4)',
                marginBottom: 2,
                fontWeight: 500,
                letterSpacing: '0.04em',
              }}>
                {chapters[visibleCardIdx].meta}
              </div>
            )}
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-soft, #b8c0d4)',
              marginBottom: 4,
              lineHeight: 1.4,
            }}>
              {chapters[visibleCardIdx]?.title}
            </div>
            <div style={{
              fontSize: 11.5,
              color: 'var(--color-text-soft, #b8c0d4)',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {chapters[visibleCardIdx]?.description}
            </div>
          </div>
        )}

        {/* Ticks */}
        {chapters.map((ch, i) => (
          <button
            key={ch.id}
            role="option"
            aria-selected={i === activeIdxRef.current}
            aria-label={`${ch.title}${ch.meta ? ` — ${ch.meta}` : ''}${ch.description ? `. ${ch.description}` : ''}`}
            tabIndex={i === 0 ? 0 : -1}
            data-idx={i}
            data-tick
            onClick={() => handleSelect(ch, i)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              hoveredRef.current = true
              if (reducedRef.current) {
                pointerRef.current = i * rowHeight
                pointerTargetRef.current = i * rowHeight
                strengthRef.current = 1
                strengthTargetRef.current = 1
              } else {
                pointerTargetRef.current = i * rowHeight
                strengthTargetRef.current = 1
              }
            }}
            onBlur={() => { hoveredRef.current = false }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: rowHeight,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              outline: 'none',
              position: 'relative',
            }}
          >
            <div
              data-tick
              style={{
                height: 2,
                borderRadius: 1,
                background: i === currentIndex
                  ? '#FF6B35'
                  : 'var(--color-text-soft, #b8c0d4)',
                width: restLength,
                opacity: i === currentIndex ? 1 : 0.35,
                transition: reducedRef.current ? 'none' : undefined,
                flexShrink: 0,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
