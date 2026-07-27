'use client'

import { useEffect, useRef, useState } from 'react'
import { scrollState, BEATS } from '@/lib/scroll'
import { lenisRef } from '@/components/smooth-scroll'
import {
  ChapterScrubber,
  type Chapter,
} from '@/components/ruixen/chapter-scrubber'

type BeatKey = keyof typeof BEATS

const CHAPTERS: { key: BeatKey; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'terminal', label: 'Connect Ollama' },
  { key: 'ollama', label: 'Endpoints' },
  { key: 'pullo', label: 'PullO' },
  { key: 'inside', label: 'Hardware' },
  { key: 'chrome', label: 'Everywhere' },
  { key: 'connected', label: 'Connected' },
  { key: 'network', label: 'Network' },
  { key: 'contact', label: 'Contact Us' },
]

const SCRUBBER_CHAPTERS: Chapter[] = CHAPTERS.map((ch) => ({
  id: ch.key,
  title: ch.label,
  description: `Navigate to the ${ch.label} section`,
  meta: '',
}))

export function ChapterRail() {
  const [activeIdx, setActiveIdx] = useState(-1)
  const [visible, setVisible] = useState(false)
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)
  const visibleRef = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (isDesktop === false) return
    let raf = 0

    const tick = () => {
      const p = scrollState.progress
      const nextVisible = p > 0 && p < 0.999
      if (nextVisible !== visibleRef.current) {
        visibleRef.current = nextVisible
        setVisible(nextVisible)
      }

      let activeIdx = -1
      for (let i = 0; i < CHAPTERS.length; i++) {
        const [start, end] = BEATS[CHAPTERS[i].key]
        if (p >= start && p < end) { activeIdx = i; break }
      }
      if (activeIdx === -1) {
        for (let i = 0; i < CHAPTERS.length; i++) {
          const [start] = BEATS[CHAPTERS[i].key]
          if (p < start) { activeIdx = Math.max(0, i - 1); break }
        }
        if (activeIdx === -1) activeIdx = CHAPTERS.length - 1
      }

      setActiveIdx(activeIdx)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isDesktop])

  const scrollToBeat = (chapter: Chapter) => {
    const lenis = lenisRef.current
    if (chapter.id === 'contact') {
      const contactEl = document.getElementById('contact')
      if (contactEl) {
        if (lenis) lenis.scrollTo(contactEl, { immediate: false })
        else contactEl.scrollIntoView({ behavior: 'smooth' })
      }
      return
    }
    const idx = SCRUBBER_CHAPTERS.indexOf(chapter)
    if (idx < 0) return
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight
    const fraction = idx / (SCRUBBER_CHAPTERS.length - 1)
    const target = Math.round(fraction * totalScroll)
    if (lenis) {
      lenis.scrollTo(target, { immediate: false })
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' })
    }
  }

  if (isDesktop === false) return null

  return (
    <div
      className="fixed right-6 top-1/2 z-40 -translate-y-1/2 transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div className="rounded-full border border-white/20 bg-[#0c101d]/85 px-3.5 py-4 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/50 hover:bg-[#0c101d]/95 hover:shadow-indigo-500/20">
        <ChapterScrubber
          chapters={SCRUBBER_CHAPTERS}
          currentIndex={activeIdx >= 0 ? activeIdx : undefined}
          onSelect={scrollToBeat}
          peakLength={44}
          restLength={18}
          rowHeight={12}
        />
      </div>
    </div>
  )
}
