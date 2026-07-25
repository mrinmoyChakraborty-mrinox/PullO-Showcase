'use client'

import { useEffect, useState } from 'react'
import { AmbientBackground } from '@/components/ambient-background'
import { EntrySequence } from '@/components/entry-sequence'
import { SmoothScroll } from '@/components/smooth-scroll'
import { SiteNav } from '@/components/site-nav'
import { StoryOverlays } from '@/components/story-overlays'
import { StoryOverlaysTwo } from '@/components/story-overlays-two'
import { TerminalInput } from '@/components/terminal-input'
import { ChapterRail } from '@/components/chapter-rail'
import { ClosingSections } from '@/components/closing-sections'
export function ClientPage() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return (
    <>
      <EntrySequence />
      <SmoothScroll>
        <div id="top" className="relative">
          <AmbientBackground />

          <div className="pointer-events-none fixed inset-y-0 left-0 z-[-1] w-1/2 bg-[linear-gradient(to_right,rgba(5,8,22,0.45),transparent)]" />

          {hasMounted && <SceneClient />}

          <SiteNav />
          <StoryOverlays />
          <StoryOverlaysTwo />
          <TerminalInput />
          <ChapterRail />

          <div className="pointer-events-none fixed inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,8,22,0.65)_100%)]" />

          <div aria-hidden className="h-[760vh]" />
          <div id="cinematic-end" aria-hidden />

          <div id="hardware" className="pointer-events-none absolute top-[400vh]" />
          <div id="network" className="pointer-events-none absolute top-[640vh]" />

          <ClosingSections />
        </div>
      </SmoothScroll>
    </>
  )
}

function SceneClient() {
  const Scene = require('@/components/three/scene').Scene as React.ComponentType<{}>
  return <Scene />
}
