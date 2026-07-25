'use client'

import { useState, useCallback, useRef, type ReactNode } from 'react'
import { motion, useSpring, type SpringOptions } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface AvatarSpringStackItem {
  src?: string
  alt?: string
  label?: string
}

interface AvatarSpringStackProps {
  avatars: AvatarSpringStackItem[]
  maxVisible?: number
  size?: number
  className?: string
}

const springConfig: SpringOptions = { stiffness: 420, damping: 22, mass: 0.3 }
const repulsionRadius = 60

function AvatarSpringStack({
  avatars,
  maxVisible = 5,
  size = 44,
  className,
}: AvatarSpringStackProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const step = size * 0.65
  const totalWidth = Math.min(avatars.length, maxVisible) * step + (avatars.length > maxVisible ? size * 0.6 : 0)

  const xOffsets = useRef<Record<number, ReturnType<typeof useSpring>>>({})

  const getXOffset = useCallback((i: number) => {
    if (!xOffsets.current[i]) {
      xOffsets.current[i] = useSpring(0, springConfig)
    }
    return xOffsets.current[i]
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const visibleCount = Math.min(avatars.length, maxVisible)
    for (let i = 0; i < visibleCount; i++) {
      const el = itemRefs.current[i]
      if (!el) continue
      const elRect = el.getBoundingClientRect()
      const cx = el.offsetLeft + elRect.width / 2
      const cy = elRect.height / 2
      const dx = mouseX - cx
      const dy = mouseY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < repulsionRadius && dist > 0) {
        const force = (repulsionRadius - dist) / repulsionRadius
        const pushX = (dx / dist) * force * step * 0.7
        getXOffset(i).set(pushX)
      } else {
        getXOffset(i).set(0)
      }
    }
  }, [avatars.length, maxVisible, step, getXOffset])

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null)
    const visibleCount = Math.min(avatars.length, maxVisible)
    for (let i = 0; i < visibleCount; i++) {
      getXOffset(i).set(0)
    }
  }, [avatars.length, maxVisible, getXOffset])

  return (
    <div
      ref={containerRef}
      className={cn('relative flex items-center', className)}
      style={{ width: totalWidth, height: size + 12 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {avatars.slice(0, maxVisible).map((avatar, i) => {
        const isActive = activeIndex === i
        return (
          <motion.div
            key={i}
            ref={(el) => { itemRefs.current[i] = el }}
            className="absolute top-1/2 cursor-pointer"
            style={{
              zIndex: isActive ? 20 : avatars.length - i,
              transform: 'translateY(-50%)',
              left: i * step,
            }}
            animate={{
              x: activeIndex !== null ? (xOffsets.current[i]?.get() ?? 0) : 0,
              scale: isActive ? 1.08 : 1,
              y: isActive ? -6 : 0,
              opacity: activeIndex !== null && !isActive ? 0.65 : 1,
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            onMouseEnter={() => setActiveIndex(i)}
          >
            <div
              style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--bg)', position: 'relative', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}
            >
              {avatar.src ? (
                <img
                  src={avatar.src}
                  alt={avatar.alt ?? avatar.label ?? ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                    const parent = (e.target as HTMLImageElement).parentElement
                    if (parent) {
                      const fallback = document.createElement('span')
                      fallback.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#fff;font-size:' + (size * 0.4) + 'px;font-weight:700'
                      fallback.textContent = (avatar.label ?? '?').charAt(0).toUpperCase()
                      parent.appendChild(fallback)
                    }
                  }}
                />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#fff', fontSize: size * 0.4, fontWeight: 700 }}>
                  {(avatar.label ?? '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {isActive && avatar.label && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 4, whiteSpace: 'nowrap', fontSize: 11, fontWeight: 600, color: 'var(--text)', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', pointerEvents: 'none' }}>
                {avatar.label}
              </div>
            )}
          </motion.div>
        )
      })}

      {avatars.length > maxVisible && (
        <div
          className="absolute top-1/2 flex items-center justify-center rounded-full border-2 border-[var(--bg)] text-xs font-semibold text-[var(--text-mid)] bg-[var(--bg-panel)]"
          style={{
            width: size,
            height: size,
            left: maxVisible * step,
            transform: 'translateY(-50%)',
          }}
        >
          +{avatars.length - maxVisible}
        </div>
      )}
    </div>
  )
}

export { AvatarSpringStack }
export default AvatarSpringStack
