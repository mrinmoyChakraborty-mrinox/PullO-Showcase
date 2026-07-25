'use client'

import { useEffect, useRef } from 'react'
import { scrollState } from '@/lib/scroll'

export function ParallaxStars() {
  const farRef = useRef<HTMLDivElement>(null)
  const nearRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = scrollState.progress
      // Far layer drifts slowly, near layer faster
      if (farRef.current) {
        farRef.current.style.transform = `translateY(${p * -30}px)`
      }
      if (nearRef.current) {
        nearRef.current.style.transform = `translateY(${p * -60}px)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="parallax-stars" aria-hidden>
      <div ref={farRef} className="parallax-stars-layer parallax-stars-far" />
      <div ref={nearRef} className="parallax-stars-layer parallax-stars-near" />
    </div>
  )
}
