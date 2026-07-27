'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFoundContent() {
  const router = useRouter()
  const starsRef = useRef<HTMLDivElement>(null)
  const [autoRedirect, setAutoRedirect] = useState(false)
  const [toggleLabel, setToggleLabel] = useState('Go Home')

  useEffect(() => {
    const el = starsRef.current
    if (!el) return
    const stars: HTMLDivElement[] = []
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('div')
      s.className = 'star'
      const size = Math.random() * 2 + 1
      s.style.width = size + 'px'
      s.style.height = size + 'px'
      s.style.left = Math.random() * 100 + '%'
      s.style.top = Math.random() * 70 + '%'
      s.style.animationDelay = (Math.random() * 3) + 's'
      el.appendChild(s)
      stars.push(s)
    }
    const shootingStars: HTMLDivElement[] = []
    for (let i = 0; i < 2; i++) {
      const sh = document.createElement('div')
      sh.className = 'shoot'
      sh.style.left = (60 + Math.random() * 30) + '%'
      sh.style.top = (10 + Math.random() * 20) + '%'
      sh.style.animationDelay = (i * 3 + Math.random() * 2) + 's'
      el.appendChild(sh)
      shootingStars.push(sh)
    }
    return () => {
      stars.forEach(s => s.remove())
      shootingStars.forEach(s => s.remove())
    }
  }, [])

  const goHome = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/dashboard')
  }, [router])

  const toggleGoHome = useCallback(() => {
    const next = !autoRedirect
    setAutoRedirect(next)
    if (next) {
      setToggleLabel('Redirecting…')
      setTimeout(() => { router.push('/dashboard') }, 900)
    } else {
      setToggleLabel('Go Home')
    }
  }, [autoRedirect, router])

  return (
    <>
      <div className="stars" ref={starsRef}></div>
      <div className="clouds">
        <div className="cloud" style={{ width: 220, height: 140, left: -40 }}></div>
        <div className="cloud" style={{ width: 160, height: 100, left: 100, bottom: -60 }}></div>
        <div className="cloud" style={{ width: 240, height: 150, right: -50 }}></div>
        <div className="cloud" style={{ width: 170, height: 110, right: 120, bottom: -60 }}></div>
      </div>

      <header>
        <div className="brand">
          <img src="/images/pullo-logo.png" alt="PullO Logo" style={{ height: 34, width: 'auto' }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em' }}>PullO</span>
        </div>
        <div className="toggle-wrap">
          <span>{toggleLabel}</span>
          <div className={'switch' + (autoRedirect ? ' on' : '')} onClick={toggleGoHome}></div>
        </div>
      </header>

      <div className="wrap">
        <div className="scene">
          <div className="glow"></div>

          <div className="bubble">?</div>

          <svg className="astro" width="150" height="150" viewBox="0 0 150 150" fill="none">
            <rect x="55" y="70" width="14" height="26" rx="5" fill="#1a2e3d" stroke="#2dd4c8" strokeWidth="1.5" />
            <path d="M60 72c0-14 8-22 15-22s15 8 15 22v20c0 10-7 16-15 16s-15-6-15-16z" fill="#e9f2f5" stroke="#c3d4da" strokeWidth="1.5" />
            <rect x="68" y="80" width="14" height="10" rx="2" fill="#2dd4c8" opacity="0.85" />
            <path d="M64 106c-2 8-3 16-1 22" stroke="#e9f2f5" strokeWidth="9" strokeLinecap="round" />
            <path d="M86 106c2 8 3 16 1 22" stroke="#e9f2f5" strokeWidth="9" strokeLinecap="round" />
            <ellipse cx="62" cy="130" rx="8" ry="5" fill="#c3d4da" />
            <ellipse cx="88" cy="130" rx="8" ry="5" fill="#c3d4da" />
            <path d="M60 78c-8 2-14 8-15 16" stroke="#e9f2f5" strokeWidth="8" strokeLinecap="round" />
            <path d="M90 78c8 2 13 8 15 15" stroke="#e9f2f5" strokeWidth="8" strokeLinecap="round" />
            <circle cx="44" cy="96" r="5.5" fill="#c3d4da" />
            <circle cx="106" cy="94" r="5.5" fill="#c3d4da" />
            <circle cx="75" cy="48" r="27" fill="#e9f2f5" stroke="#c3d4da" strokeWidth="1.5" />
            <circle cx="75" cy="48" r="19" fill="#0c1a24" />
            <circle cx="69" cy="42" r="4.5" fill="rgba(255,255,255,0.35)" />
            <path d="M60 30c3-5 9-8 15-8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </svg>

          <div className="moon-wrap">
            <div className="ring"></div>
            <div className="moon">
              <div className="crater" style={{ width: 26, height: 26, top: 24, left: 26 }}></div>
              <div className="crater" style={{ width: 18, height: 18, top: 70, left: 110 }}></div>
              <div className="crater" style={{ width: 34, height: 34, top: 100, left: 34 }}></div>
              <div className="crater" style={{ width: 14, height: 14, top: 40, left: 120 }}></div>
              <div className="crater" style={{ width: 20, height: 20, top: 130, left: 100 }}></div>
            </div>
          </div>
        </div>

        <h1 className="code">404</h1>
        <h2 className="msg">Oops! Page not found.</h2>
        <p className="sub">The page you&apos;re looking for doesn&apos;t exist or may have been moved.</p>

        <a href="#" className="go-home" onClick={goHome}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M3 11l9-8 9 8" /><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" /></svg>
          Go Home
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12h14" /><path d="M13 5l7 7-7 7" /></svg>
        </a>
      </div>
    </>
  )
}
