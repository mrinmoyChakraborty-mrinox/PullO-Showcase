'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState, mapRange, BEATS } from '@/lib/scroll'

// Pre-compute beat edges once at module level — avoids BEATS property
// lookups inside the hot useFrame path.
const INSIDE_START    = BEATS.inside[0]
const CONNECTED_START = BEATS.connected[0]
const CONNECTED_END   = BEATS.connected[1]
const GPU_END         = BEATS.gpu[1]
// Small buffer so we start work a tiny bit before the chip becomes visible
const BEAT_ENTER_BUF = INSIDE_START - 0.01
const BEAT_EXIT_BUF  = CONNECTED_END + 0.01

// Minimum change in vis before we bother re-writing opacity to every material.
// Prevents flushing dozens of material writes per frame during steady-state.
const VIS_EPSILON = 0.002

export function Hardware() {
  const group = useRef<THREE.Group>(null)
  const { scene: glbScene } = useGLTF('/models/hardware.glb')

  // Clone to avoid shared cache side effects on hot-reloads and remounts
  const scene = useMemo(() => {
    return glbScene ? glbScene.clone() : null
  }, [glbScene])

  // Auto-center and scale the hardware model to fill view dramatically
  const { scaleFactor, offset } = useMemo(() => {
    if (!scene) return { scaleFactor: 1, offset: new THREE.Vector3() }
    scene.updateWorldMatrix(true, true)
    const box    = new THREE.Box3().setFromObject(scene)
    const size   = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    const maxDim     = Math.max(size.x, size.y)
    const desiredSize = 2.5
    const sf         = maxDim > 0 ? desiredSize / maxDim : 1
    console.log('[Hardware] GLB size:', size.x.toFixed(3), size.y.toFixed(3), size.z.toFixed(3))
    console.log('[Hardware] scaleFactor:', sf.toFixed(3))
    return { scaleFactor: sf, offset: center.clone().negate() }
  }, [scene])

  // ── KEY OPTIMIZATION: cache all mesh materials into a flat array ONCE ────────
  // Instead of calling g.traverse() inside useFrame every frame (which walks the
  // full scene graph tree on every tick), we collect all material refs here in
  // useMemo, set transparent=true once, and then in useFrame we just iterate a
  // flat array — O(n) with no tree traversal overhead.
  const matCache = useMemo<THREE.MeshStandardMaterial[]>(() => {
    if (!scene) return []
    const mats: THREE.MeshStandardMaterial[] = []
    scene.traverse((node) => {
      const mesh = node as THREE.Mesh
      if (!mesh.isMesh) return
      const arr = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      arr.forEach((mat) => {
        if (!mat) return
        const m = mat as THREE.MeshStandardMaterial
        if (!('opacity' in m)) return
        // Set transparent ONCE here — never inside useFrame
        m.transparent = true
        mats.push(m)
      })
    })
    return mats
  }, [scene])

  // Enhance materials for dramatic tech aesthetic
  useMemo(() => {
    if (!scene) return
    scene.traverse((node) => {
      const mesh = node as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((mat) => {
        if (!mat) return
        const m = mat as THREE.MeshStandardMaterial
        if (!m.isMeshStandardMaterial) return
        if (m.name?.includes('Chiplet')) {
          m.emissive          = new THREE.Color('#6d5dfe')
          m.emissiveIntensity = 1.2
          m.roughness         = 0.1
          m.metalness         = 1.0
        } else if (m.name?.includes('SoC_top')) {
          m.emissive          = new THREE.Color('#22d3ee')
          m.emissiveIntensity = 0.4
          m.roughness         = 0.2
          m.metalness         = 0.9
        } else if (m.name?.includes('Chip_nvidia')) {
          m.roughness = 0.3
          m.metalness = 0.9
        } else {
          m.roughness = 0.5
          m.metalness = 0.7
        }
        m.needsUpdate = true
      })
    })
  }, [scene])

  // Track previous vis to skip material writes when opacity hasn't changed
  const prevVis = useRef(-1)

  useFrame((_, delta) => {
    const p = scrollState.progress
    const g = group.current
    if (!g) return

    // ── Fast early exit: zero per-frame work outside this beat ───────────────
    if (p < BEAT_ENTER_BUF || p > BEAT_EXIT_BUF) {
      if (g.visible) g.visible = false
      prevVis.current = -1   // Reset so opacity is re-written when re-entering
      return
    }

    const visIn  = mapRange(p, INSIDE_START, INSIDE_START + 0.04, 0, 1)
    const visOut = mapRange(p, CONNECTED_START, CONNECTED_END, 1, 0)
    const vis    = Math.min(visIn, visOut)

    g.visible = vis > 0.01
    if (!g.visible) return

    // ── Opacity write — only when vis has meaningfully changed ────────────────
    // This eliminates the g.traverse() call (and all its tree-walk overhead)
    // on the ~majority of frames where vis is stable (fully faded in, mid-beat).
    const visDelta = Math.abs(vis - prevVis.current)
    if (visDelta > VIS_EPSILON) {
      prevVis.current = vis
      // Iterate flat cached array — no tree traversal, just sequential writes
      for (let i = 0; i < matCache.length; i++) {
        matCache[i].opacity = vis
      }
    }

    // Scroll-driven reveal: chip rises up from below and tilts to face camera
    const dive   = mapRange(p, INSIDE_START, GPU_END, 0, 1)
    g.position.y = THREE.MathUtils.lerp(-2.5, -0.8, dive)
    g.position.z = THREE.MathUtils.lerp(-1.0, 0.6, dive)
    // Tilt the chip so its top face (where all the detail is) faces the camera
    g.rotation.x = THREE.MathUtils.lerp(-0.3, -0.9, dive)
    // Slow spin to show all sides
    g.rotation.y = Math.sin(performance.now() * 0.0003) * 0.25
  })

  return (
    <group ref={group} visible={false}>
      {/* Purple die glow — the GPU chiplets */}
      <pointLight position={[0, 2, 2]}  color="#6d5dfe" intensity={12} distance={12} />
      {/* Cyan edge lighting */}
      <pointLight position={[-2, 1, 1]} color="#22d3ee" intensity={6}  distance={8}  />
      {/* Warm fill from below */}
      <pointLight position={[0, -2, 1]} color="#ff9f43" intensity={4}  distance={8}  />
      {/* White top fill for the chip surface texture */}
      <pointLight position={[0, 4, 0]}  color="#ffffff"  intensity={8}  distance={10} />

      {scene && (
        <group
          position={[offset.x * scaleFactor, offset.y * scaleFactor, offset.z * scaleFactor]}
        >
          <group scale={[scaleFactor, scaleFactor, scaleFactor]}>
            <primitive object={scene} />
          </group>
        </group>
      )}
    </group>
  )
}

useGLTF.preload('/models/hardware.glb')
