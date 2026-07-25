'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { scrollState, smoothstep } from '@/lib/scroll'

type BeatOverlayProps = {
  range: readonly [number, number]
  /** Fraction of the range used for the fade in/out at each edge. */
  fade?: number
  children: ReactNode
  className?: string
  /** Translate distance (px) applied during entrance/exit. */
  travel?: number
  pin?: boolean
}

/**
 * Renders fixed, full-screen DOM content whose opacity + transform are driven
 * by the global scroll progress. Reads scrollState every frame via rAF to stay
 * in sync with the 3D canvas without triggering React re-renders on the hot path.
 */
export function BeatOverlay({
  range,
  fade = 0.25,
  children,
  className = '',
  travel = 40,
  pin = false,
}: BeatOverlayProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    let raf = 0
    const [start, end] = range
    const span     = end - start
    const fadeSpan = span * fade

    // Pre-compute the outer range so we can skip the entire tick early
    const outerStart = start - fadeSpan
    const outerEnd   = end   + fadeSpan

    // Track last-written values so we only touch the DOM when something changes
    let lastOpacity = -1
    let lastOffset  = travel + 1   // deliberately invalid so first frame always writes
    let lastVisible = false
    let lastPointer = false

    const tick = () => {
      const p = scrollState.progress
      const el = ref.current
      if (el) {

        // ── Fast early exit: do ZERO DOM work when far outside this beat ────
        // This is the key fix: previously, all 10 overlays ran smoothstep +
        // 4 style writes every frame regardless of scroll position.
        if (p < outerStart || p > outerEnd || p >= 0.999) {
          // Ensure hidden state is written ONCE when first exiting, then skip
          if (lastOpacity !== 0) {
            el.style.opacity        = '0'
            el.style.visibility     = 'hidden'
            el.style.pointerEvents  = 'none'
            el.style.transform      = pin ? 'translate3d(0,0,0)' : `translate3d(0,${travel}px,0)`
            lastOpacity = 0
            lastVisible = false
            lastPointer = false
            lastOffset  = travel
          }
          raf = requestAnimationFrame(tick)
          return
        }

        // ── Active range: compute opacity and offset ─────────────────────────
        const fadeIn  = smoothstep(outerStart, start + fadeSpan, p)
        const fadeOut = 1 - smoothstep(end - fadeSpan, outerEnd, p)
        const opacity = Math.min(fadeIn, fadeOut)
        const mid     = (p - start) / span
        const offset  = pin ? 0 : (0.5 - mid) * travel * 2

        // ── Only write to DOM when values have actually changed ───────────────
        // Each style write can trigger a style recalculation in the browser.
        // Skipping identical writes is effectively free and avoids that cost.
        if (Math.abs(opacity - lastOpacity) > 0.002) {
          el.style.opacity = opacity.toFixed(4)
          lastOpacity = opacity
        }
        if (!pin && Math.abs(offset - lastOffset) > 0.1) {
          el.style.transform = `translate3d(0,${offset.toFixed(2)}px,0)`
          lastOffset = offset
        }
        const shouldBeVisible = opacity > 0.01
        if (shouldBeVisible !== lastVisible) {
          el.style.visibility = shouldBeVisible ? 'visible' : 'hidden'
          lastVisible = shouldBeVisible
        }
        const shouldReceivePointer = opacity > 0.5
        if (shouldReceivePointer !== lastPointer) {
          el.style.pointerEvents = shouldReceivePointer ? 'auto' : 'none'
          lastPointer = shouldReceivePointer
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [range, fade, travel, pin])

  return (
    <div
      ref={ref}
      aria-hidden={!mounted}
      // Removed permanent will-change on ALL instances: it was promoting
      // all 10 overlays to compositor layers at all times, even when invisible.
      // will-change is now only applied during the active range via JS (see tick).
      className={`pointer-events-none fixed inset-0 z-10 flex items-center justify-center px-6 ${className}`}
      style={{ opacity: 0 }}
    >
      {children}
    </div>
  )
}
