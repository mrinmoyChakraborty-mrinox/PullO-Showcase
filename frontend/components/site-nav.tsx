'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { scrollState } from '@/lib/scroll'
import { useAuth } from '@/lib/auth-context'
import MagneticButton from '@/components/magnetic-button'

export function SiteNav() {
  const { user, loading } = useAuth()
  const barRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = scrollState.progress
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
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="#top" className="flex items-center gap-2.5">
          <Image
            src="/images/pullo-logo.png"
            alt="PullO"
            width={34}
            height={34}
            className="h-8 w-8 object-contain"
            priority
          />
          <span className="text-lg font-semibold tracking-tight text-white">
            Pull<span className="text-[var(--color-iris-500)]">O</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 text-sm text-[var(--color-text-soft)] md:flex">
          <a href="#how" className="transition-colors hover:text-white">
            How It Works
          </a>
          <a href="#features" className="transition-colors hover:text-white">
            Features
          </a>
          <a href="#hardware" className="transition-colors hover:text-white">
            Hardware
          </a>
          <a href="#network" className="transition-colors hover:text-white">
            Network
          </a>
          <a href="#get" className="transition-colors hover:text-white">
            Downloads
          </a>
          <a href="https://pullo-docs.vercel.app" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
            Docs
          </a>
          {!loading && (
            <Link href={user ? '/dashboard' : '/login'} className="transition-colors hover:text-white">
              {user ? 'Dashboard' : 'Sign In'}
            </Link>
          )}
        </div>

        {loading ? (
          <div className="h-9 w-[100px] animate-pulse rounded-full bg-white/5" />
        ) : user ? (
          <Link
            href="/dashboard"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:border-[var(--color-iris-500)] hover:bg-[var(--color-iris-500)]/15"
          >
            Dashboard
          </Link>
        ) : (
          <MagneticButton>
            <a
              href="#get"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:border-[var(--color-iris-500)] hover:bg-[var(--color-iris-500)]/15"
            >
              Get Started
            </a>
          </MagneticButton>
        )}
      </nav>
      <div className="relative h-px w-full bg-white/5">
        <div
          ref={barRef}
          className="h-px origin-left bg-gradient-to-r from-[var(--color-iris-500)] via-[var(--color-violet-500)] to-[var(--color-cyan-400)]"
          style={{ transform: 'scaleX(0)' }}
        />
        {/* Glow dot at leading edge — positioned outside scaled bar to avoid scaleX collapse */}
        <div ref={dotRef} className="progress-glow-dot" style={{ left: '0%' }} />
      </div>
    </header>
  )
}
