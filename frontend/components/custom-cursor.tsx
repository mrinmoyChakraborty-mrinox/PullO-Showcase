'use client'

import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 })
  const dotPos = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })
  const currentRing = useRef(32)
  const targetRing = useRef(32)
  const currentOpacity = useRef(0)
  const targetOpacity = useRef(0)
  const raf = useRef(0)
  const hasMoved = useRef(false)

  useEffect(() => {
    const isFine = window.matchMedia('(pointer: fine)').matches
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!isFine) return

    document.body.classList.add('cursor-custom')

    // Initialize dot/ring opacity = 0; first mousemove fades in + snaps to
    // current position so there is no (0,0) flash near the logo.
    const onMouse = (e: MouseEvent) => {
      pos.current.x = e.clientX
      pos.current.y = e.clientY

      if (!hasMoved.current) {
        hasMoved.current = true
        // Snap to real position instantly
        dotPos.current.x = e.clientX
        dotPos.current.y = e.clientY
        ringPos.current.x = e.clientX
        ringPos.current.y = e.clientY
        // Fade in
        if (dotRef.current) dotRef.current.style.opacity = '1'
        if (ringRef.current) {
          ringRef.current.style.opacity = '0.4'
          currentOpacity.current = 0.4
        }
      }
    }

    const updateHover = () => {
      if (!hasMoved.current) {
        targetRing.current = 32
        targetOpacity.current = 0
        return
      }
      const el = document.elementFromPoint(pos.current.x, pos.current.y)
      if (!el) {
        targetRing.current = 32
        targetOpacity.current = 0.4
        return
      }
      const interactive = (el as HTMLElement).closest?.(
        'a, button, [data-cursor="pointer"]',
      )
      if (interactive) {
        targetRing.current = 48
        targetOpacity.current = 0.7
        return
      }
      const textEl = (el as HTMLElement).closest?.(
        'p, h1, h2, h3, h4, h5, h6, span',
      )
      if (textEl && textEl.textContent?.trim()) {
        targetRing.current = 32
        targetOpacity.current = 0
        return
      }
      targetRing.current = 32
      targetOpacity.current = 0.4
    }

    const tick = () => {
      if (!dotRef.current || !ringRef.current) {
        raf.current = requestAnimationFrame(tick)
        return
      }

      const lerp = prefersReduced ? 1 : 0.35
      const ringLerp = prefersReduced ? 1 : 0.12
      const sizeLerp = prefersReduced ? 1 : 0.2

      dotPos.current.x += (pos.current.x - dotPos.current.x) * lerp
      dotPos.current.y += (pos.current.y - dotPos.current.y) * lerp
      ringPos.current.x += (pos.current.x - ringPos.current.x) * ringLerp
      ringPos.current.y += (pos.current.y - ringPos.current.y) * ringLerp

      currentRing.current +=
        (targetRing.current - currentRing.current) * sizeLerp
      currentOpacity.current +=
        (targetOpacity.current - currentOpacity.current) * sizeLerp

      dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`
      ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`
      ringRef.current.style.width = `${currentRing.current}px`
      ringRef.current.style.height = `${currentRing.current}px`
      ringRef.current.style.opacity = String(currentOpacity.current)

      updateHover()
      raf.current = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMouse)
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMouse)
      cancelAnimationFrame(raf.current)
      document.body.classList.remove('cursor-custom')
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--color-iris-500)',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0,
          transform: 'translate3d(0, 0, 0) translate(-50%, -50%)',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1.5px solid var(--color-iris-500)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 9998,
          transform: 'translate3d(0, 0, 0) translate(-50%, -50%)',
        }}
      />
    </>
  )
}
