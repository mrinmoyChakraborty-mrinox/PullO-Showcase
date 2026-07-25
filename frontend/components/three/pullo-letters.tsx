'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState, mapRange, BEATS, getBeatFadeRange } from '@/lib/scroll'

const LETTERS = ['P', 'U', 'L', 'L']

// Pre-compute beat edges once at module level
const PULLO_START     = BEATS.pullo[0]
const PULLO_END       = BEATS.pullo[1]
const INSIDE_START    = BEATS.inside[0]
const INSIDE_FADE_IN  = getBeatFadeRange(BEATS.inside).fadeInStart
// PulloLetters must complete their fade-out BEFORE inside's card starts
// becoming visible (which is at INSIDE_FADE_IN, not raw INSIDE_START,
// because BeatOverlay applies a fade-span buffer before the official start).
const PULLO_FADE_END  = INSIDE_FADE_IN
const PULLO_FADE_START = INSIDE_FADE_IN - 0.02

// Small buffer so we start work slightly before the beat is visible
const BEAT_ENTER_BUF = PULLO_START - 0.01
// Exit buffer: allow update loop until well after fade-out completes
const BEAT_EXIT_BUF  = PULLO_FADE_END + 0.03

export function PulloLetters() {
  const group = useRef<THREE.Group>(null)
  const refs  = useRef<(THREE.Group | null)[]>([])

  // Cached flat arrays of material references — built once on first valid frame.
  // Avoids walking lg.children[] every frame inside the hot loop.
  const matCache  = useRef<(THREE.Material | null)[]>([])
  const cacheBuilt = useRef(false)

  const logoTexture = useTexture('/images/pullo-logo.png')

  useFrame(() => {
    const p = scrollState.progress
    const g = group.current
    if (!g) return

    // ── Fast early exit: do nothing outside this beat's range ─────────────────
    if (p < BEAT_ENTER_BUF || p > BEAT_EXIT_BUF) {
      if (g.visible) g.visible = false
      return
    }

    const vis =
      mapRange(p, PULLO_START, PULLO_START + 0.02, 0, 1) *
      // Fade-out aligned to inside overlay's ACTUAL fade-in start point
      // (INSIDE_FADE_IN = BEATS.inside[0] - fadeSpan), not raw INSIDE_START.
      // BeatOverlay applies a symmetric fade-span buffer on both edges, so
      // using the raw boundary causes the card to already be visible while
      // PulloLetters are still at full opacity. Fade-out completes 0.02
      // before the card's first visible pixel.
      mapRange(p, PULLO_FADE_START, PULLO_FADE_END, 1, 0)

    const shouldBeVisible = vis > 0.01
    g.visible = shouldBeVisible

    // If invisible, skip all per-letter work (Math.sin, lerps, material writes)
    if (!shouldBeVisible) return

    const time = performance.now() * 0.002

    // ── Build material cache on first visible frame ────────────────────────────
    // Walk children[] ONCE, cache the material ref, set transparent=true once.
    if (!cacheBuilt.current) {
      for (let i = 0; i < 5; i++) {
        const lg = refs.current[i]
        if (!lg) { matCache.current[i] = null; continue }
        const child = lg.children[0] as THREE.Mesh | undefined
        const mat = child?.material as THREE.Material | undefined ?? null
        matCache.current[i] = mat
        if (mat) {
          // Set transparent once — never again inside the hot loop
          (mat as any).transparent = true
        }
      }
      cacheBuilt.current = true
    }

    // ── Per-letter update (no children[] traversal, uses cached refs) ──────────
    for (let i = 0; i < 5; i++) {
      const lg = refs.current[i]
      if (!lg) continue

      // emissiveIntensity pulse — uses cached material, avoids children[] walk
      const mat = matCache.current[i] as any
      if (mat) {
        mat.emissiveIntensity = 1.6 + Math.sin(time + i * 0.5) * 0.5
        mat.opacity = (i < 4
          ? mapRange(p, PULLO_START + 0.005 + i * 0.012, PULLO_START + 0.005 + i * 0.012 + 0.03, 0, 1)
          : mapRange(p, PULLO_START + 0.005 + 4 * 0.012, PULLO_START + 0.005 + 4 * 0.012 + 0.03, 0, 1)
        ) * vis
      }

      const start = PULLO_START + 0.005 + i * 0.012
      const rise  = mapRange(p, start, start + 0.03, 0, 1)

      lg.position.y = THREE.MathUtils.lerp(-0.6, 1.9, rise)
      lg.position.x = (i - 2) * 1.15
      lg.scale.setScalar(THREE.MathUtils.lerp(0.4, 1, rise))
    }
  })

  return (
    <group ref={group} visible={false} position={[0, 0, 0.5]}>
      {LETTERS.map((ch, i) => (
        <group
          key={i}
          ref={(el) => { refs.current[i] = el }}
        >
          <Text fontSize={1.5} anchorX="center" anchorY="middle">
            {ch}
            <meshStandardMaterial
              color="#ffffff"
              emissive="#6d5dfe"
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </Text>
        </group>
      ))}

      {/* PullO Logo replacing O */}
      <group
        position={[2.3, -0.6, 0]}
        ref={(el) => { refs.current[4] = el }}
      >
        <sprite scale={[2.2, 2.2, 1]}>
          <spriteMaterial
            map={logoTexture}
            color="#ffffff"
            transparent
          />
          <pointLight
            position={[0, 0, 1]}
            color="#6d5dfe"
            intensity={4}
            distance={8}
          />
        </sprite>
      </group>

      <pointLight
        position={[0, 1.9, 2]}
        color="#6d5dfe"
        intensity={3}
        distance={12}
      />
    </group>
  )
}
