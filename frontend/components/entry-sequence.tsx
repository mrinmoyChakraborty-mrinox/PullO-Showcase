'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useProgress } from '@react-three/drei'

const LETTERS = ['P', 'u', 'l', 'l', 'O']
const GLYPHS = '!@#$%^&*()<>?/;:[]{}|~`'
const FADE_DURATION_MS = 400

// ─── Sub-component: AssetLoader ──────────────────────────────────────────────
// Isolated so that useProgress re-renders never propagate to the parent.
// Passes the raw progress value to the parent via onProgress callback.
function AssetLoader({
  onProgress,
  onComplete,
}: {
  onProgress: (p: number) => void
  onComplete: () => void
}) {
  const { progress } = useProgress()

  useEffect(() => {
    onProgress(progress)
    if (progress >= 100) {
      onComplete()
    }
  }, [progress, onProgress, onComplete])

  return (
    <div className="mt-10 flex flex-col items-center">
      <div className="h-px w-52 rounded-full bg-white/10 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-[var(--color-iris-500)] to-[var(--color-cyan-400)]"
          style={{ width: `${progress}%`, transition: 'width 0.3s linear' }}
        />
      </div>
      <span className="mt-3.5 text-xs text-white/30 font-mono tracking-widest uppercase">
        {Math.round(progress)}%
      </span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EntrySequence() {
  const [live, setLive] = useState<'hidden' | 'visible'>('hidden')
  const [overlayOpacity, setOverlayOpacity] = useState(1)
  const [showLoader, setShowLoader] = useState(false)

  // letterRefs: spans whose .textContent the rAF loop writes directly.
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([])

  const skipRef       = useRef(false)
  const frameRef      = useRef(0)
  const fadeTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneRef       = useRef(false)
  
  // Track raw and smoothly interpolated progress
  const progressRef       = useRef(0)
  const smoothProgressRef = useRef(0)
  const assetsLoaded      = useRef(false)
  const resolvedMask      = useRef<boolean[]>([false, false, false, false, false])

  const handleProgress = useCallback((p: number) => {
    progressRef.current = p
  }, [])

  const handleLoaderComplete = useCallback(() => {
    assetsLoaded.current = true
  }, [])

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    cancelAnimationFrame(frameRef.current)
    clearTimeout(fadeTimerRef.current ?? undefined)
    setLive('hidden')
  }, [])

  // Settle all letters immediately and start fade if assets ready
  const skipToReveal = useCallback(() => {
    if (skipRef.current) return
    skipRef.current = true
    resolvedMask.current = [true, true, true, true, true]
    smoothProgressRef.current = 100

    for (let i = 0; i < 5; i++) {
      const el = letterRefs.current[i]
      if (el) {
        el.textContent = LETTERS[i]
        el.style.color = '#ffffff'
        el.style.transform = 'scale(1)'
      }
    }

    if (assetsLoaded.current) {
      cancelAnimationFrame(frameRef.current)
      clearTimeout(fadeTimerRef.current ?? undefined)
      setOverlayOpacity(0)
      fadeTimerRef.current = setTimeout(finish, FADE_DURATION_MS)
    }
  }, [finish])

  // ── Mount effect: runs exactly once ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isPlayed     = !!sessionStorage.getItem('pullo_entry_played')
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Check loading progress synchronously. If already complete at mount, mark it.
    const currentProgress = useProgress.getState().progress
    if (currentProgress >= 100) {
      assetsLoaded.current = true
      progressRef.current = 100
    }

    // Always mark as played for subsequent visits
    sessionStorage.setItem('pullo_entry_played', 'true')

    // If reduced-motion or already played AND assets are already loaded: bypass overlay
    if (prefersReduced || (isPlayed && assetsLoaded.current)) {
      setLive('hidden')
      return
    }

    setLive('visible')

    // If assets not fully loaded, show loader UI
    if (!assetsLoaded.current) {
      setShowLoader(true)
    } else {
      // If assets already loaded, start smoothProgress animation towards 100 immediately
      progressRef.current = 100
    }

    function tick() {
      // Smoothly interpolate progress to create a beautiful, unscrambling timeline
      // even if assets load extremely quickly.
      const target = progressRef.current
      smoothProgressRef.current += (target - smoothProgressRef.current) * 0.08

      const currentSmooth = smoothProgressRef.current
      const mask = resolvedMask.current

      if (!skipRef.current) {
        // Settle letters sequentially driven by smoothProgress milestones
        // P: 20%, u: 40%, l: 60%, l: 80%, O: 98%
        const thresholds = [20, 40, 60, 80, 98]

        for (let i = 0; i < 5; i++) {
          if (!mask[i] && currentSmooth >= thresholds[i]) {
            mask[i] = true
            const el = letterRefs.current[i]
            if (el) {
              el.textContent = LETTERS[i]
              el.style.color = '#ffffff'
              el.style.transform = 'scale(1)'
            }
          }
        }

        // Scramble remaining active letters (direct DOM mutations)
        for (let i = 0; i < 5; i++) {
          if (!mask[i]) {
            const el = letterRefs.current[i]
            if (el) {
              el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            }
          }
        }
      }

      // Handoff / Dismissal condition:
      // 1. Letters finished resolving (smoothProgress has reached 98% milestone) or skipped
      // 2. Assets fully loaded
      const lettersFinished = skipRef.current || currentSmooth >= 98
      const assetsFinished  = assetsLoaded.current

      if (lettersFinished && assetsFinished) {
        setOverlayOpacity(0)
        fadeTimerRef.current = setTimeout(finish, FADE_DURATION_MS)
        return
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameRef.current)
      clearTimeout(fadeTimerRef.current ?? undefined)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Skip event handlers ────────────────────────────────────────────────────
  useEffect(() => {
    if (live !== 'visible') return
    const handler = () => skipToReveal()
    window.addEventListener('keydown',     handler)
    window.addEventListener('wheel',       handler, { passive: true })
    window.addEventListener('touchstart',  handler, { passive: true })
    return () => {
      window.removeEventListener('keydown',    handler)
      window.removeEventListener('wheel',      handler)
      window.removeEventListener('touchstart', handler)
    }
  }, [live, skipToReveal])

  if (live !== 'visible') return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center select-none bg-[#050816]"
      style={{
        opacity: overlayOpacity,
        transition: overlayOpacity === 0
          ? `opacity ${FADE_DURATION_MS}ms ease-out`
          : 'none',
      }}
      onClick={skipToReveal}
      role="presentation"
    >
      <div className="flex flex-col items-center">
        <Image
          src="/images/pullo-logo.png"
          alt="PullO"
          width={72}
          height={72}
          className="h-16 w-16 object-contain mb-8 opacity-80"
          priority
        />

        <div className="flex items-center gap-1.5 sm:gap-3">
          {LETTERS.map((_, i) => (
            <span
              key={i}
              ref={(el) => { letterRefs.current[i] = el }}
              className="inline-block text-[clamp(2.5rem,10vw,5.5rem)] font-bold font-sans tracking-tight"
              style={{
                color: '#6d5dfe',
                transform: 'scale(1.08)',
                transition: 'color 0.3s ease-out, transform 0.3s ease-out',
              }}
            >
              {/* Empty: rAF tick() is the sole writer of textContent for this span */}
            </span>
          ))}
        </div>

        {/* Isolated progress sub-component — its re-renders never reach parent */}
        {showLoader && (
          <AssetLoader
            onProgress={handleProgress}
            onComplete={handleLoaderComplete}
          />
        )}
      </div>

      <span className="fixed bottom-10 left-1/2 -translate-x-1/2 text-xs text-white/25 font-mono tracking-wider uppercase">
        Click or scroll to skip
      </span>
    </div>
  )
}
