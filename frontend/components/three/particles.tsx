'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, mapRange, BEATS } from '@/lib/scroll'

// ─── Constants ───────────────────────────────────────────────────────────────
const COUNT = 1400
const ATTRACT_RADIUS = 8
const ATTRACT_RADIUS_SQ = ATTRACT_RADIUS * ATTRACT_RADIUS
const ABSORB_DIST = 0.3
const ATTRACTOR_X = 0
const ATTRACTOR_Y = 1.0
const ATTRACTOR_Z = 0.5
const MAX_FLASHES = 3
const FLASH_DURATION = 200
const BIG_FLASH_DURATION = 400

const NORMAL = 0
const RESOLVING = 1
const RESPAWNING = 2
const RESOLVE_MS = 200
const RESPAWN_MS = 200

const MIN_DIST = 0.8
const MAX_DV = 0.25
const MAX_DV_SQ = MAX_DV * MAX_DV
const VEL_DIRTY_THRESHOLD_SQ = 1e-8
const BEAT_BUFFER = 0.02

// How many near-field candidates to pre-select on beat-entry.
// Particles beyond this sorted cutoff are statistically unable to reach
// ABSORB_DIST (0.3) within the beat's scroll range given their start distance.
// 300 covers all particles within radius 8 comfortably, skipping the
// ~1100 far-field particles that will never participate.
const NEAR_CANDIDATES = 300

const BEAT_START = BEATS.pullo[0]
const BEAT_END = BEATS.pullo[1]
const BEAT_START_BUF = BEAT_START - BEAT_BUFFER
const BEAT_END_BUF = BEAT_END + BEAT_BUFFER

// ─── Vertex / Fragment shaders ────────────────────────────────────────────────
const VS = `
attribute float aAlpha;
attribute vec3 aColor;
varying float vAlpha;
varying vec3 vColor;
uniform float uPixelScale;
void main(){
  vAlpha=aAlpha; vColor=aColor;
  vec4 mv=modelViewMatrix*vec4(position,1.);
  gl_PointSize=0.12*uPixelScale*(300./-mv.z);
  gl_Position=projectionMatrix*mv;
}`

const FS = `
varying float vAlpha;
varying vec3 vColor;
uniform float uOpacity;
void main(){
  vec2 c=gl_PointCoord-vec2(.5);
  if(length(c)>.5)discard;
  gl_FragColor=vec4(vColor,vAlpha*uOpacity);
}`

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomFarFieldPos(out: Float32Array, offset: number) {
  const r = 6 + Math.random() * 26
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  out[offset]     = r * Math.sin(phi) * Math.cos(theta)
  out[offset + 1] = (Math.random() - 0.5) * 30
  out[offset + 2] = r * Math.cos(phi) - 6
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Particles() {
  const ref = useRef<THREE.Points>(null)
  const { scene, gl } = useThree()
  const prefersReduced = useRef(false)

  const sim = useRef<{
    pos: Float32Array
    vel: Float32Array
    entryPos: Float32Array
    state: Uint8Array
    stateTimer: Float32Array
    alpha: Float32Array
    colors: Float32Array
    flashed: Uint8Array
  }>(null!)

  const particleMat = useMemo(() => {
    const pr = gl.getPixelRatio()
    return new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0.9 }, uPixelScale: { value: pr } },
      vertexShader: VS,
      fragmentShader: FS,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [gl])

  const prevP             = useRef(0)
  const didSave           = useRef(false)
  const maxPInBeat        = useRef(0)
  const bigFlashTriggered = useRef(false)
  const anyPosDirty       = useRef(false)
  const anyAlphaDirty     = useRef(false)

  // ── Pre-sorted near-field candidate index list ────────────────────────────
  // Built once when entering BEATS.pullo. Contains the NEAR_CANDIDATES indices
  // closest to the attractor at beat-entry, sorted ascending by distSq.
  // The active-pull loop iterates ONLY this list instead of all 1400 particles.
  // Particles respawning (RESOLVING/RESPAWNING state) still need full iteration
  // for their state machine, but their attractor math is skipped by state check.
  const nearIdx    = useRef<Int32Array>(new Int32Array(NEAR_CANDIDATES))
  const nearCount  = useRef(0)

  // ── Light pool: MAX_FLASHES lights pre-created at mount, never disposed ────
  // Always-present in the scene with intensity=0. On absorption, we pick an
  // idle pool slot, set position+intensity, track its timer. When the flash
  // expires we set intensity=0 (frees the slot). Never new/dispose mid-scene.
  //
  // CRITICAL WHY: Three.js recompiles the WebGL shader program whenever the
  // active light COUNT changes. new THREE.PointLight() + scene.add() on one
  // frame, then dispose() + scene.remove() on another = TWO shader recompiles
  // per absorption cycle. Pre-pooling holds the light count constant.
  const flashPool = useRef<{
    light: THREE.PointLight
    start: number   // performance.now() when activated, -1 = idle
  }[]>([])

  // One permanent big-flash light, intensity driven to 0 when inactive
  const bigFlashLight = useRef<THREE.PointLight>(null!)
  const bigFlashStart = useRef(-1)

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // ── Mount: create all lights once, add to scene, never remove ─────────────
  useEffect(() => {
    // Small absorption flash pool
    const pool: typeof flashPool.current = []
    for (let i = 0; i < MAX_FLASHES; i++) {
      const light = new THREE.PointLight('#22d3ee', 0, 4)
      scene.add(light)
      pool.push({ light, start: -1 })
    }
    flashPool.current = pool

    // Big formation flash — single permanent light
    const big = new THREE.PointLight('#ffffff', 0, 12)
    big.position.set(0, 1.2, 2.5)
    scene.add(big)
    bigFlashLight.current = big

    return () => {
      for (const f of pool) { scene.remove(f.light); f.light.dispose() }
      scene.remove(big); big.dispose()
    }
  }, [scene])

  useMemo(() => {
    const pos       = new Float32Array(COUNT * 3)
    const vel       = new Float32Array(COUNT * 3)
    const entryPos  = new Float32Array(COUNT * 3)
    const state     = new Uint8Array(COUNT)
    const stateTimer = new Float32Array(COUNT)
    const alpha     = new Float32Array(COUNT)
    const colors    = new Float32Array(COUNT * 3)
    const flashed   = new Uint8Array(COUNT)

    const palette = [
      new THREE.Color('#6d5dfe'),
      new THREE.Color('#22d3ee'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#ffffff'),
    ]

    for (let i = 0; i < COUNT; i++) {
      randomFarFieldPos(pos, i * 3)
      vel[i * 3] = 0; vel[i * 3 + 1] = 0; vel[i * 3 + 2] = 0
      state[i] = NORMAL; stateTimer[i] = 0; alpha[i] = 1; flashed[i] = 0
      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }

    sim.current = { pos, vel, entryPos, state, stateTimer, alpha, colors, flashed }
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return

    const p    = scrollState.progress
    const time = performance.now()
    const geo  = ref.current.geometry

    // ── Always-on cheap updates ──────────────────────────────────────────────
    ref.current.rotation.y  += delta * 0.02
    ref.current.position.z   = -p * 6
    particleMat.uniforms.uOpacity.value = 0.5 + Math.sin(time * 0.0005) * 0.1

    // ── Pool-based flash updates (no create/dispose) ─────────────────────────
    const pool = flashPool.current
    for (let i = 0; i < pool.length; i++) {
      const f = pool[i]
      if (f.start < 0) continue   // idle slot
      const age = time - f.start
      if (age >= FLASH_DURATION) {
        f.light.intensity = 0
        f.start = -1              // return to pool
      } else {
        f.light.intensity = 3 * (1 - age / FLASH_DURATION)
      }
    }

    // ── Big snap flash (pool-based) ──────────────────────────────────────────
    if (bigFlashStart.current >= 0) {
      const age = time - bigFlashStart.current
      if (age >= BIG_FLASH_DURATION) {
        bigFlashLight.current.intensity = 0
        bigFlashStart.current = -1
      } else {
        const bt = age / BIG_FLASH_DURATION
        const s  = Math.sin(bt * Math.PI)
        bigFlashLight.current.intensity = 7 * s
        bigFlashLight.current.distance  = 12 + 10 * s
      }
    }

    // ── Fast early exit outside BEATS.pullo ──────────────────────────────────
    if (p < BEAT_START_BUF || p > BEAT_END_BUF) {
      if (p < BEAT_START_BUF) {
        didSave.current = false
        maxPInBeat.current = 0
        bigFlashTriggered.current = false
        nearCount.current = 0
      }
      prevP.current = p
      return
    }

    // ── Beat-range work ──────────────────────────────────────────────────────
    const inBeat = p >= BEAT_START && p < BEAT_END
    const attractStrength =
      mapRange(p, BEAT_START, BEAT_START + 0.025, 0, 1) *
      mapRange(p, BEAT_END,   BEAT_END   + 0.025, 1, 0)

    // ── Beat entry: save positions AND build near-field candidate list ────────
    // This is where we pay the one-time O(COUNT) cost of sorting by distance.
    // Every subsequent active frame only iterates nearCount.current particles.
    if (inBeat && !didSave.current) {
      sim.current.entryPos.set(sim.current.pos)
      didSave.current = true
      maxPInBeat.current = p
      bigFlashTriggered.current = false

      // Compute distSq for all particles, collect indices, partial-sort to
      // find the NEAR_CANDIDATES closest ones. We use a simple insertion into
      // a fixed-size max-heap (array of [distSq, index] pairs) to avoid a
      // full sort of 1400 elements — O(COUNT * log(NEAR_CANDIDATES)).
      const pos = sim.current.pos
      // Reuse nearIdx buffer as scratch for the heap (store indices directly,
      // use a parallel distSq scratch array)
      const heapDist = new Float32Array(NEAR_CANDIDATES)
      const heapIdx  = nearIdx.current
      let   heapSize = 0

      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3
        const dx = ATTRACTOR_X - pos[i3]
        const dy = ATTRACTOR_Y - pos[i3 + 1]
        const dz = ATTRACTOR_Z - pos[i3 + 2]
        const dSq = dx * dx + dy * dy + dz * dz

        // Only consider particles within a generous extended radius
        if (dSq >= ATTRACT_RADIUS_SQ) continue

        if (heapSize < NEAR_CANDIDATES) {
          // Heap not full — insert directly (simple unsorted fill for first N)
          heapDist[heapSize] = dSq
          heapIdx[heapSize]  = i
          heapSize++
          // Sift up to maintain max-heap property
          let ci = heapSize - 1
          while (ci > 0) {
            const pi = (ci - 1) >> 1
            if (heapDist[pi] >= heapDist[ci]) break
            // swap
            const td = heapDist[pi]; heapDist[pi] = heapDist[ci]; heapDist[ci] = td
            const ti = heapIdx[pi];  heapIdx[pi]  = heapIdx[ci];  heapIdx[ci]  = ti
            ci = pi
          }
        } else if (dSq < heapDist[0]) {
          // New particle closer than the furthest in heap — replace root
          heapDist[0] = dSq
          heapIdx[0]  = i
          // Sift down
          let ci = 0
          while (true) {
            const l = 2 * ci + 1
            const r = 2 * ci + 2
            let largest = ci
            if (l < heapSize && heapDist[l] > heapDist[largest]) largest = l
            if (r < heapSize && heapDist[r] > heapDist[largest]) largest = r
            if (largest === ci) break
            const td = heapDist[ci]; heapDist[ci] = heapDist[largest]; heapDist[largest] = td
            const ti = heapIdx[ci];  heapIdx[ci]  = heapIdx[largest];  heapIdx[largest]  = ti
            ci = largest
          }
        }
      }
      nearCount.current = heapSize
    }

    if (inBeat && p > maxPInBeat.current) maxPInBeat.current = p

    // Trigger big flash (pool-based — no new PointLight)
    if (!bigFlashTriggered.current && p >= BEAT_START + 0.08 && p < BEAT_END) {
      bigFlashTriggered.current = true
      bigFlashLight.current.position.set(0, 1.2, 2.5)
      bigFlashLight.current.intensity = 7
      bigFlashLight.current.distance  = 12
      bigFlashStart.current = time
    }

    const goingForward = p > prevP.current
    prevP.current = p

    const physicsInert = !inBeat || attractStrength < 0.01
    if (physicsInert && !goingForward) return

    const posAttr   = geo.attributes.position as THREE.BufferAttribute
    const alphaAttr = geo.attributes.aAlpha   as THREE.BufferAttribute | undefined

    anyPosDirty.current   = false
    anyAlphaDirty.current = false

    const dtMs = delta * 1000
    const { pos, vel, entryPos, state, stateTimer, alpha, flashed } = sim.current
    const nc   = nearCount.current
    const nIdx = nearIdx.current

    // ── PASS 1: State machine — only over near-field candidates ──────────────
    // RESOLVING/RESPAWNING particles are guaranteed to be in the near list
    // (they were absorbed from within ATTRACT_RADIUS), so this covers them.
    for (let ni = 0; ni < nc; ni++) {
      const i  = nIdx[ni]
      const i3 = i * 3

      if (state[i] === RESOLVING) {
        stateTimer[i] += dtMs
        const t = Math.min(1, stateTimer[i] / RESOLVE_MS)
        alpha[i] = 1 - t
        anyAlphaDirty.current = true
        if (t >= 1) {
          randomFarFieldPos(pos, i3)
          state[i] = RESPAWNING
          stateTimer[i] = 0
          vel[i3] = 0; vel[i3 + 1] = 0; vel[i3 + 2] = 0
          flashed[i] = 0
          anyPosDirty.current = true
        }
      } else if (state[i] === RESPAWNING) {
        stateTimer[i] += dtMs
        const t = Math.min(1, stateTimer[i] / RESPAWN_MS)
        alpha[i] = t
        anyAlphaDirty.current = true
        if (t >= 1) {
          state[i] = NORMAL
          alpha[i] = 1
        }
      }
    }

    // ── PASS 2: Backward scroll — near-field candidates only ─────────────────
    if (!goingForward && inBeat && didSave.current) {
      const blend = mapRange(p, BEAT_START, maxPInBeat.current, 0, 1)
      const t = Math.max(0, Math.min(1, blend))
      for (let ni = 0; ni < nc; ni++) {
        const i  = nIdx[ni]
        const i3 = i * 3
        pos[i3]     = entryPos[i3]     + (pos[i3]     - entryPos[i3])     * t
        pos[i3 + 1] = entryPos[i3 + 1] + (pos[i3 + 1] - entryPos[i3 + 1]) * t
        pos[i3 + 2] = entryPos[i3 + 2] + (pos[i3 + 2] - entryPos[i3 + 2]) * t
        vel[i3] = 0; vel[i3 + 1] = 0; vel[i3 + 2] = 0
        state[i] = NORMAL
        alpha[i] = 1
        flashed[i] = 0
      }
      anyPosDirty.current   = true
      anyAlphaDirty.current = true
    }

    // ── PASS 3: Forward attraction — near-field candidates only ──────────────
    // THIS is the critical change: instead of iterating 1400 particles and
    // doing distSq checks on all of them, we iterate only the ~nearCount
    // pre-selected candidates from beat-entry. Typical nearCount ≈ 150-250.
    if (goingForward && inBeat) {
      for (let ni = 0; ni < nc; ni++) {
        const i  = nIdx[ni]
        const i3 = i * 3

        if (state[i] !== NORMAL) {
          // Velocity apply for non-normal particles (vel should be zeroed, but
          // apply anyway to let them drift naturally if modified elsewhere)
          const vx = vel[i3]; const vy = vel[i3 + 1]; const vz = vel[i3 + 2]
          if (vx * vx + vy * vy + vz * vz > VEL_DIRTY_THRESHOLD_SQ) {
            pos[i3] += vx; pos[i3 + 1] += vy; pos[i3 + 2] += vz
            anyPosDirty.current = true
          }
          continue
        }

        const px = pos[i3]
        const py = pos[i3 + 1]
        const pz = pos[i3 + 2]

        const dx = ATTRACTOR_X - px
        const dy = ATTRACTOR_Y - py
        const dz = ATTRACTOR_Z - pz
        const distSq = dx * dx + dy * dy + dz * dz

        if (distSq < ATTRACT_RADIUS_SQ) {
          const dist        = Math.sqrt(distSq)
          const clampedDist = Math.max(dist, MIN_DIST)
          const pull        = attractStrength * 0.6 / (clampedDist * clampedDist) * delta * 60

          const norm = 1 / dist
          let dvx = dx * norm * pull
          let dvy = dy * norm * pull
          let dvz = dz * norm * pull

          const dvMagSq = dvx * dvx + dvy * dvy + dvz * dvz
          if (dvMagSq > MAX_DV_SQ) {
            const s = MAX_DV / Math.sqrt(dvMagSq)
            dvx *= s; dvy *= s; dvz *= s
          }

          vel[i3]     = (vel[i3]     + dvx) * 0.94
          vel[i3 + 1] = (vel[i3 + 1] + dvy) * 0.94
          vel[i3 + 2] = (vel[i3 + 2] + dvz) * 0.94

          // Close approach → begin resolve sequence (pool-based flash)
          if (dist < ABSORB_DIST && !flashed[i]) {
            flashed[i]  = 1
            state[i]    = RESOLVING
            stateTimer[i] = 0
            // Acquire idle pool slot — no allocation, no scene modification
            for (let fi = 0; fi < pool.length; fi++) {
              if (pool[fi].start < 0) {
                pool[fi].light.position.set(px, py, pz)
                pool[fi].light.intensity = 3
                pool[fi].start = time
                break
              }
            }
          }

          anyPosDirty.current = true
        } else {
          // Gentle bleed for candidates that drifted outside radius
          vel[i3]     *= 0.98
          vel[i3 + 1] *= 0.98
          vel[i3 + 2] *= 0.98
        }

        // Apply velocity
        const vx = vel[i3]; const vy = vel[i3 + 1]; const vz = vel[i3 + 2]
        if (vx * vx + vy * vy + vz * vz > VEL_DIRTY_THRESHOLD_SQ) {
          pos[i3] += vx; pos[i3 + 1] += vy; pos[i3 + 2] += vz
          anyPosDirty.current = true
        }
      }
    }

    // ── Flush to GPU only when something actually changed ────────────────────
    if (anyPosDirty.current)               posAttr.needsUpdate   = true
    if (anyAlphaDirty.current && alphaAttr) alphaAttr.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={undefined}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[sim.current?.pos ?? new Float32Array(COUNT * 3), 3]}
        />
        <bufferAttribute
          attach="attributes-aColor"
          args={[
            (() => {
              const palette = [
                new THREE.Color('#6d5dfe'),
                new THREE.Color('#22d3ee'),
                new THREE.Color('#8b5cf6'),
                new THREE.Color('#38bdf8'),
                new THREE.Color('#ffffff'),
              ]
              const colors = new Float32Array(COUNT * 3)
              for (let i = 0; i < COUNT; i++) {
                const c = palette[Math.floor(Math.random() * palette.length)]
                colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
              }
              return colors
            })(),
            3,
          ]}
        />
        <bufferAttribute
          attach="attributes-aAlpha"
          args={[new Float32Array(COUNT).fill(1), 1]}
        />
      </bufferGeometry>
      <primitive object={particleMat} attach="material" />
    </points>
  )
}
