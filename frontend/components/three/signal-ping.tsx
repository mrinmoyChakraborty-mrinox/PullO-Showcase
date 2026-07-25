'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, BEATS } from '@/lib/scroll'

const PING_DURATION = 1.8
const INTERVAL_MIN = 10
const INTERVAL_MAX = 20

function createRingTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const cx = 64, cy = 64

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 64)
  gradient.addColorStop(0, 'rgba(109,93,254,0)')
  gradient.addColorStop(0.35, 'rgba(109,93,254,0)')
  gradient.addColorStop(0.42, 'rgba(109,93,254,0.4)')
  gradient.addColorStop(0.50, 'rgba(109,93,254,0.4)')
  gradient.addColorStop(0.58, 'rgba(109,93,254,0)')
  gradient.addColorStop(1, 'rgba(109,93,254,0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

export function SignalPing() {
  const ref = useRef<THREE.Sprite>(null)
  const prefersReduced = useRef(false)
  const active = useRef(false)
  const timer = useRef(0)
  const elapsed = useRef(0)
  const cooldown = useRef(8 + Math.random() * 7)
  const spawnPos = useRef(new THREE.Vector3())

  const texture = useMemo(() => createRingTexture(), [])

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useFrame((_, delta) => {
    if (prefersReduced.current) return
    if (!ref.current) return

    const p = scrollState.progress
    const inPullo = p >= BEATS.pullo[0] && p < BEATS.pullo[1]
    const inNetwork = p >= BEATS.network[0] && p < BEATS.network[1]

    if (!active.current) {
      timer.current += delta
      if (timer.current >= cooldown.current && !inPullo && !inNetwork) {
        active.current = true
        elapsed.current = 0
        timer.current = 0
        cooldown.current = INTERVAL_MIN + Math.random() * (INTERVAL_MAX - INTERVAL_MIN)

        spawnPos.current.set(
          (Math.random() - 0.5) * 36,
          (Math.random() - 0.5) * 28,
          -6 + (Math.random() - 0.5) * 18,
        )
        ref.current.position.copy(spawnPos.current)
        ref.current.scale.setScalar(0.1)
        ref.current.visible = true
        if (ref.current.material) {
          ref.current.material.opacity = 0
        }
      }
      return
    }

    elapsed.current += delta
    const t = Math.min(1, elapsed.current / PING_DURATION)

    const ease = 1 - (1 - t) * (1 - t)
    const scale = 0.1 + ease * 3.9
    const opacity = (1 - ease) * 0.4

    ref.current.scale.setScalar(scale)
    if (ref.current.material) {
      ref.current.material.opacity = opacity
    }

    if (t >= 1) {
      active.current = false
      ref.current.visible = false
    }
  })

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null
  }

  return (
    <sprite ref={ref} visible={false} scale={[0.1, 0.1, 0.1]}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  )
}
