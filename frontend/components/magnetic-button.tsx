'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function MagneticButton({ children, className }: Props) {
  const [mounted, setMounted] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const raf = useRef(0)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    setMounted(true)

    const isFine = window.matchMedia('(pointer: fine)').matches
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!isFine || prefersReduced) return

    const onMouse = (e: MouseEvent) => {
      const el = wrapperRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const pad = 40
      const zoneLeft = rect.left - pad
      const zoneRight = rect.right + pad
      const zoneTop = rect.top - pad
      const zoneBottom = rect.bottom + pad

      const inZone = e.clientX >= zoneLeft && e.clientX <= zoneRight && e.clientY >= zoneTop && e.clientY <= zoneBottom

      if (inZone) {
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        const strength = 0.3
        target.current.x = Math.max(-10, Math.min(10, dx * strength))
        target.current.y = Math.max(-10, Math.min(10, dy * strength))
      } else {
        target.current.x = 0
        target.current.y = 0
      }
    }

    const tick = () => {
      if (!wrapperRef.current) {
        raf.current = requestAnimationFrame(tick)
        return
      }
      current.current.x += (target.current.x - current.current.x) * 0.15
      current.current.y += (target.current.y - current.current.y) * 0.15

      wrapperRef.current.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`

      raf.current = requestAnimationFrame(tick)
    }

    document.addEventListener('mousemove', onMouse)
    raf.current = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMouse)
      cancelAnimationFrame(raf.current)
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = ''
      }
    }
  }, [])

  const isFine = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const shouldWrap = mounted && isFine && !prefersReduced

  if (!shouldWrap) return <>{children}</>

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        transform: 'translate(0, 0)',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}
