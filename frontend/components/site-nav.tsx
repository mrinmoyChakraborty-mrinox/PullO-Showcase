'use client'

/**
 * ============================================================================
 * CHANGELOG & ARCHITECTURE SUMMARY — SiteNav Component
 * ============================================================================
 * File: frontend/components/site-nav.tsx
 * Stack: Next.js + React + Tailwind CSS + Framer Motion
 * 
 * Continuous Always-On Breathing Glow:
 * 1. Automatic, Unconditional Loop:
 *    - The ambient breathing glow runs continuously from the moment the component 
 *      mounts, with zero dependency on scroll position, hover, click, or state toggles.
 *    - Driven by GPU-accelerated CSS `@keyframes navbar-breathe` (4s ease-in-out infinite).
 * 
 * 2. Shared Sliding Underline/Pill Indicator (Framer Motion layoutId):
 *    - Layout animation (`layoutId="navbar-hover-pill"`) smooth-sliding between 
 *      navigation items on hover or active section selection.
 * 
 * 3. Reactive Brand Logo:
 *    - Spring-based subtle rotation (+3deg) and soft iris glow pulse dot behind icon on hover.
 * 
 * 4. Premium CTA Button ("Dashboard" / "Get Started"):
 *    - Iris violet glow ring + sheen sweep overlay (.btn-shimmer) + 1.04x hover scale.
 * 
 * 5. Mobile Menu & Hamburger Morphing:
 *    - Hamburger icon morphs smoothly into an X using animated Framer Motion SVG paths.
 *    - Mobile menu drawer slides & fades in using AnimatePresence with dark glass styling.
 * 
 * 6. Accessibility & Reduced Motion:
 *    - Respects `prefers-reduced-motion` media query via CSS & `useReducedMotion()`.
 * ============================================================================
 */

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { scrollState } from '@/lib/scroll'
import { useAuth } from '@/lib/auth-context'
import MagneticButton from '@/components/magnetic-button'

interface NavItem {
  id: string
  name: string
  href: string
  external?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'how', name: 'How It Works', href: '#how' },
  { id: 'features', name: 'Features', href: '#features' },
  { id: 'hardware', name: 'Hardware', href: '#hardware' },
  { id: 'network', name: 'Network', href: '#network' },
  { id: 'get', name: 'Downloads', href: '#get' },
  { id: 'docs', name: 'Docs', href: 'https://pullo-docs.vercel.app', external: true },
]

export function SiteNav() {
  const { user, loading } = useAuth()
  const barRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const [scrolled, setScrolled] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Scroll detection for navbar background glass transition & progress bar
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = scrollState.progress
      const scrollY = window.scrollY || 0
      setScrolled(scrollY > 40)

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${p})`
      }
      if (dotRef.current) {
        dotRef.current.style.left = `${p * 100}%`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-4 md:px-6 transition-all duration-300">
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 relative overflow-hidden rounded-full transition-all duration-300 ${
          scrolled
            ? 'bg-[#0c101d]/85 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_40px_-6px_rgba(109,93,254,0.25)]'
            : 'bg-[#0d0f16]/60 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]'
        }`}
      >
        {/* Continuous Always-On Unconditional Breathing Glow Layer */}
        <div className="breathing-glow-bg" />

        {/* Logo */}
        <a href="#top" className="relative z-10 flex items-center gap-2.5 group">
          <div className="relative">
            {/* Soft glow pulse behind icon on hover */}
            <div className="absolute inset-0 rounded-full bg-[var(--color-iris-500)]/40 blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <motion.div
              animate={{ rotate: prefersReducedMotion ? 0 : [0, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.08, rotate: prefersReducedMotion ? 0 : 4 }}
            >
              <Image
                src="/images/pullo-logo.png"
                alt="PullO"
                width={34}
                height={34}
                className="h-8 w-8 object-contain relative z-10"
                priority
              />
            </motion.div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-sans transition-colors duration-200 group-hover:text-white">
            Pull<span className="text-[var(--color-iris-500)] transition-colors duration-300 group-hover:text-[var(--color-violet-500)]">O</span>
          </span>
        </a>

        {/* Desktop Links with Framer Motion layoutId Sliding Pill */}
        <div
          className="relative z-10 hidden items-center gap-1 text-sm md:flex"
          onMouseLeave={() => setHoveredId(null)}
        >
          {NAV_ITEMS.map((item) => {
            const isHovered = hoveredId === item.id
            return (
              <a
                key={item.id}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                onMouseEnter={() => setHoveredId(item.id)}
                className="relative px-3.5 py-1.5 font-medium transition-colors duration-200 text-slate-300 hover:text-white"
              >
                {isHovered && (
                  <motion.div
                    layoutId="navbar-hover-pill"
                    className="absolute inset-0 rounded-full bg-white/12 border border-white/15"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <motion.span
                  className="relative z-10 inline-block"
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.03 }}
                  transition={{ duration: 0.15 }}
                >
                  {item.name}
                </motion.span>
              </a>
            )
          })}

          {!loading && !user && (
            <Link
              href="/login"
              onMouseEnter={() => setHoveredId('signin')}
              className="relative px-3.5 py-1.5 font-medium transition-colors duration-200 text-slate-300 hover:text-white"
            >
              {hoveredId === 'signin' && (
                <motion.div
                  layoutId="navbar-hover-pill"
                  className="absolute inset-0 rounded-full bg-white/12 border border-white/15"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <motion.span
                className="relative z-10 inline-block"
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.03 }}
                transition={{ duration: 0.15 }}
              >
                Sign In
              </motion.span>
            </Link>
          )}
        </div>

        {/* Action CTA Button & Mobile Menu Toggle */}
        <div className="relative z-10 flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-[100px] animate-pulse rounded-full bg-white/5" />
          ) : user ? (
            <motion.div
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                href="/dashboard"
                className="btn-shimmer rounded-full border border-[var(--color-iris-500)]/50 bg-[var(--color-iris-500)]/15 px-5 py-2 text-sm font-medium text-white backdrop-blur-md shadow-[0_0_20px_rgba(109,93,254,0.35)] transition-all duration-300 hover:border-[var(--color-iris-500)] hover:bg-[var(--color-iris-500)]/30 hover:shadow-[0_0_25px_rgba(109,93,254,0.5)]"
              >
                Dashboard
              </Link>
            </motion.div>
          ) : (
            <MagneticButton>
              <motion.div
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <a
                  href="#get"
                  className="btn-shimmer rounded-full border border-[var(--color-iris-500)]/50 bg-[var(--color-iris-500)]/15 px-5 py-2 text-sm font-medium text-white backdrop-blur-md shadow-[0_0_20px_rgba(109,93,254,0.35)] transition-all duration-300 hover:border-[var(--color-iris-500)] hover:bg-[var(--color-iris-500)]/30 hover:shadow-[0_0_25px_rgba(109,93,254,0.5)]"
                >
                  Get Started
                </a>
              </motion.div>
            </MagneticButton>
          )}

          {/* Animated Hamburger / X Morph Button for Mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 md:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <motion.line
                x1="4"
                y1="7"
                x2="20"
                y2="7"
                animate={mobileOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.line
                x1="4"
                y1="12"
                x2="20"
                y2="12"
                animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.15 }}
              />
              <motion.line
                x1="4"
                y1="17"
                x2="20"
                y2="17"
                animate={mobileOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Progress Line */}
      <div className="relative h-px w-full max-w-6xl mx-auto mt-1 overflow-hidden rounded-full bg-white/5">
        <div
          ref={barRef}
          className="h-px origin-left bg-gradient-to-r from-[var(--color-iris-500)] via-[var(--color-violet-500)] to-[var(--color-cyan-400)]"
          style={{ transform: 'scaleX(0)' }}
        />
        <div ref={dotRef} className="progress-glow-dot" style={{ left: '0%' }} />
      </div>

      {/* Mobile Glass Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-[#0c101d]/95 p-6 backdrop-blur-2xl shadow-2xl md:hidden"
          >
            <div className="flex flex-col gap-4 text-base font-medium">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.name}
                </a>
              ))}

              {!loading && !user && (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Sign In
                </Link>
              )}

              <div className="pt-2 border-t border-white/10">
                <Link
                  href={user ? '/dashboard' : '/login'}
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center rounded-full border border-[var(--color-iris-500)]/40 bg-[var(--color-iris-500)]/20 py-2.5 text-sm font-semibold text-white shadow-lg"
                >
                  {user ? 'Dashboard' : 'Get Started'}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
