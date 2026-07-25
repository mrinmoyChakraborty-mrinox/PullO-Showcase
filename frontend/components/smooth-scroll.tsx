'use client'

import Lenis from 'lenis'
import { useEffect, useRef, useState } from 'react'
import { ScrollContext, scrollState } from '@/lib/scroll'

export const lenisRef = { current: null as Lenis | null }

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const lenis = new Lenis({
      duration: reduce ? 0 : 1.15,
      smoothWheel: !reduce,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    })
    lenisRef.current = lenis

    let lastProgress = 0

    function update() {
      const scrollTop = window.scrollY
      const cinematicEnd = document.getElementById('cinematic-end')
      const max = cinematicEnd
        ? cinematicEnd.getBoundingClientRect().top + scrollTop
        : document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, scrollTop / max) : 0
      scrollState.velocity = p - lastProgress
      lastProgress = p
      scrollState.progress = p
      setProgress(p)
    }

    lenis.on('scroll', update)

    function raf(time: number) {
      lenis.raf(time)
      rafRef.current = requestAnimationFrame(raf)
    }
    rafRef.current = requestAnimationFrame(raf)
    update()

    return () => {
      cancelAnimationFrame(rafRef.current)
      lenis.destroy()
    }
  }, [])

  return (
    <ScrollContext.Provider value={{ progress }}>
      {children}
    </ScrollContext.Provider>
  )
}
