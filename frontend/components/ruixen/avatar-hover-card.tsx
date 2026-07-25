'use client'

import { useState, useRef, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatItem {
  label: string
  value: string
}

interface AvatarHoverCardProps {
  imageSrc: string
  imageAlt?: string
  name: string
  username?: string
  description?: string
  stats?: StatItem[]
  actions?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end'
  className?: string
  fallbackInitials?: string
}

const sizeMap = { sm: 32, md: 40, lg: 48 }
const cardWidth = 300

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export function AvatarHoverCard({
  imageSrc,
  imageAlt,
  name,
  username,
  description,
  stats,
  actions,
  size = 'md',
  align = 'start',
  className,
  fallbackInitials,
}: AvatarHoverCardProps) {
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const px = sizeMap[size]

  const cancelTimers = useCallback(() => {
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null }
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }, [])

  const handleMouseEnter = useCallback(() => {
    cancelTimers()
    openTimer.current = setTimeout(() => setOpen(true), 80)
  }, [cancelTimers])

  const handleMouseLeave = useCallback(() => {
    cancelTimers()
    closeTimer.current = setTimeout(() => setOpen(false), 100)
  }, [cancelTimers])

  const cardX = align === 'center' ? -(cardWidth / 2 - px / 2) : align === 'end' ? -(cardWidth - px) : 0
  const originX = align === 'center' ? '50%' : align === 'end' ? '100%' : '0%'

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={triggerRef}
    >
      <div
        className="cursor-pointer overflow-hidden rounded-full border-2 border-[var(--border)] shrink-0"
        style={{ width: px, height: px, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}
      >
        {!imgError ? (
          <img
            src={imageSrc}
            alt={imageAlt ?? name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#fff', fontSize: px * 0.42, fontWeight: 700 }}>
            {fallbackInitials ?? initials(name)}
          </span>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
              position: 'absolute',
              left: cardX,
              top: px + 10,
              width: cardWidth,
              transformOrigin: `top ${originX}`,
              zIndex: 100,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                className="overflow-hidden rounded-full shrink-0"
                style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}
              >
                {!imgError ? (
                  <img src={imageSrc} alt={imageAlt ?? name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#fff', fontSize: 14, fontWeight: 700 }}>
                    {fallbackInitials ?? initials(name)}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                {username && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 1 }}>@{username}</div>}
              </div>
            </div>

            {description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.04 }}
                style={{ fontSize: 12.5, color: 'var(--text-mid)', lineHeight: 1.5, margin: '0 0 14px' }}
              >
                {description}
              </motion.p>
            )}

            {stats && stats.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08 }}
                style={{ display: 'flex', gap: 24, marginBottom: actions ? 14 : 0 }}
              >
                {stats.map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-lo)' }}>{s.label}</div>
                  </div>
                ))}
              </motion.div>
            )}

            {actions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12 }}
              >
                {actions}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AvatarHoverCard
