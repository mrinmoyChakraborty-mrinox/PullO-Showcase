'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState, mapRange, BEATS } from '@/lib/scroll'
import { cursorWorldPos } from './cursor-state'
import { terminalState } from '@/components/terminal-state'

// ---------------------------------------------------------------------------
// Screen canvas helpers — 1280×800 for sharp rendering
// ---------------------------------------------------------------------------

const TERMINAL_LINES = [
  '$ ollama pull gemma3:1b',
  'pulling model...',
  'loading weights...',
  'starting inference...',
  '✓ Model Ready',
]

const FULL_TEXT = TERMINAL_LINES.join('\n')
const FULL_TEXT_LEN = FULL_TEXT.length

// Deterministic per-character reveal thresholds with subtle jitter (±1.5%) so
// typing feels human rather than mechanically linear, without flickering.
const CHAR_THRESHOLDS: number[] = (() => {
  const a = new Array(FULL_TEXT_LEN)
  for (let i = 0; i < FULL_TEXT_LEN; i++) {
    const h = Math.sin(i * 127.1 + 311.7) * 43758.5453
    const jitter = ((h - Math.floor(h)) * 2 - 1) * 0.015
    a[i] = Math.max(0, Math.min(1, i / FULL_TEXT_LEN + jitter))
  }
  return a
})()

function drawTerminal(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Background
  ctx.fillStyle = '#04060f'
  ctx.fillRect(0, 0, w, h)
  // Title bar
  ctx.fillStyle = '#0b1020'
  ctx.fillRect(0, 0, w, 72)
  // Traffic lights
  const dots = ['#ff5f56', '#ffbd2e', '#27c93f']
  dots.forEach((c, i) => {
    ctx.beginPath()
    ctx.fillStyle = c
    ctx.arc(56 + i * 52, 36, 14, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.fillStyle = '#6d7a99'
  ctx.font = '32px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('ollama terminal', w / 2, 46)
  ctx.textAlign = 'left'

  // Reveal count: per-character threshold test (jittered) so adjacent chars
  // occasionally swap order – nearly imperceptible, reads as "real typing"
  let shown = 0
  for (let i = 0; i < FULL_TEXT_LEN; i++) {
    if (CHAR_THRESHOLDS[i] <= t) shown++
  }
  // Clamp in case t slightly exceeds 1
  if (shown > FULL_TEXT_LEN) shown = FULL_TEXT_LEN

  const lines = FULL_TEXT.slice(0, shown).split('\n')
  ctx.font = '44px monospace'
  let y = 170
  lines.forEach((line) => {
    if (line.startsWith('$')) ctx.fillStyle = '#22d3ee'
    else if (line.startsWith('✓')) ctx.fillStyle = '#27c93f'
    else ctx.fillStyle = '#9aa6c0'
    ctx.fillText(line, 80, y)
    y += 84
  })
  // Blinking cursor — position computed from ACTUAL revealed text every frame
  if (t < 1 && Math.floor(performance.now() / 500) % 2 === 0) {
    const lastLine = lines[lines.length - 1] ?? ''
    const cw = ctx.measureText(lastLine).width
    ctx.fillStyle = '#27c93f'
    ctx.fillRect(80 + cw + 8, y - 84 - 38, 22, 46)
  }
}

const PULL_LINES = (model: string) => [
  `$ ollama pull ${model}`,
  'pulling model...',
  'loading weights...',
  'starting inference...',
  '✓ Model Ready',
]

function drawInteractiveTerminal(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: typeof terminalState,
  reduced: boolean,
) {
  ctx.fillStyle = '#04060f'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#0b1020'
  ctx.fillRect(0, 0, w, 72)
  const dots = ['#ff5f56', '#ffbd2e', '#27c93f']
  dots.forEach((c, i) => {
    ctx.beginPath()
    ctx.fillStyle = c
    ctx.arc(56 + i * 52, 36, 14, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.fillStyle = '#6d7a99'
  ctx.font = '32px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('ollama terminal', w / 2, 46)
  ctx.textAlign = 'left'

  // Completed scripted content — always fully visible
  ctx.font = '44px monospace'
  let y = 170
  TERMINAL_LINES.forEach((line) => {
    if (line.startsWith('$')) ctx.fillStyle = '#22d3ee'
    else if (line.startsWith('✓')) ctx.fillStyle = '#27c93f'
    else ctx.fillStyle = '#9aa6c0'
    ctx.fillText(line, 80, y)
    y += 84
  })

  y += 20

  if (state.phase === 'idle') {
    const prompt = `$ ${state.typedBuffer}`
    ctx.fillStyle = '#22d3ee'
    ctx.fillText(prompt, 80, y)

    const blink = reduced || Math.floor(performance.now() / 530) % 2 === 0
    if (blink) {
      const cw = ctx.measureText(prompt).width
      ctx.fillStyle = '#27c93f'
      ctx.fillRect(80 + cw + 6, y - 38, 22, 46)
    }
    return
  }

  if (state.phase === 'pulling' || state.phase === 'done') {
    const lines = PULL_LINES(state.submittedModel)
    const fullText = lines.join('\n')
    const totalLen = fullText.length

    let charsToShow = totalLen
    if (state.phase === 'pulling') {
      charsToShow = reduced
        ? lines.slice(0, Math.min(lines.length, Math.floor(state.pullProgress * lines.length))).join('\n').length
        : Math.floor(state.pullProgress * totalLen)
    }

    const visible = fullText.slice(0, charsToShow).split('\n')
    visible.forEach((line) => {
      if (line.startsWith('$')) ctx.fillStyle = '#22d3ee'
      else if (line.startsWith('✓')) ctx.fillStyle = '#27c93f'
      else ctx.fillStyle = '#9aa6c0'
      ctx.fillText(line, 80, y)
      y += 84
    })

    if (state.phase === 'pulling') {
      const blink = reduced || Math.floor(performance.now() / 530) % 2 === 0
      if (blink && charsToShow < totalLen) {
        const lastLine = visible[visible.length - 1] ?? ''
        const cw = ctx.measureText(lastLine).width
        ctx.fillStyle = '#27c93f'
        ctx.fillRect(80 + cw + 6, y - 84 - 38, 22, 46)
      }
    }
  }
}

function drawOllama(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, h * 0.7)
  g.addColorStop(0, `rgba(109,93,254,${0.55 * t})`)
  g.addColorStop(1, '#04060f')
  ctx.fillStyle = '#04060f'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.save()
  ctx.translate(w / 2, h / 2 - 30)
  ctx.strokeStyle = `rgba(255,255,255,${0.85 * t})`
  ctx.lineWidth = 12
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.arc(0, 0, 80 + i * 58, -0.4, Math.PI + 0.4)
    ctx.stroke()
  }
  ctx.restore()
  ctx.fillStyle = `rgba(184,192,212,${t})`
  ctx.font = 'bold 40px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('ollama running locally', w / 2, h - 80)
  ctx.textAlign = 'left'
}

function drawDashboard(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#04060f'
  ctx.fillRect(0, 0, w, h)
  // Card
  ctx.fillStyle = '#0c1226'
  const pad = 50
  ctx.fillRect(pad, pad, w - pad * 2, h - pad * 2)
  // Header bar
  ctx.fillStyle = '#111b35'
  ctx.fillRect(pad, pad, w - pad * 2, 80)
  // Brand
  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 52px monospace'
  ctx.fillText('PullO', pad + 40, pad + 58)
  // Status dot
  ctx.fillStyle = '#27c93f'
  ctx.beginPath()
  ctx.arc(w - pad - 140, pad + 40, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#b8c0d4'
  ctx.font = '32px monospace'
  ctx.fillText('Connected', w - pad - 110, pad + 52)
  // Rows
  const rows: [string, string, string][] = [
    ['Model', 'gemma3:1b', '#ffffff'],
    ['Status', 'Running', '#27c93f'],
    ['Latency', '< 1ms', '#22d3ee'],
    ['Privacy', '100% Local', '#b8c0d4'],
  ]
  let y = pad + 160
  rows.forEach(([k, v, col], i) => {
    const reveal = Math.min(1, Math.max(0, t * 4 - i))
    ctx.save()
    ctx.globalAlpha = reveal
    // Row separator
    ctx.strokeStyle = '#1e2d50'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad + 30, y - 30)
    ctx.lineTo(w - pad - 30, y - 30)
    ctx.stroke()
    ctx.fillStyle = '#6d7a99'
    ctx.font = '30px monospace'
    ctx.fillText(k, pad + 40, y)
    ctx.fillStyle = col
    ctx.font = 'bold 34px monospace'
    const vw = ctx.measureText(v).width
    ctx.fillText(v, w - pad - 50 - vw, y)
    ctx.restore()
    y += 110
  })
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Laptop() {
  const { scene: glbScene } = useGLTF('/models/LAPTOP.glb')

  // Clone to avoid shared cache side effects on hot-reloads and remounts
  const scene = useMemo(() => {
    return glbScene ? glbScene.clone() : null
  }, [glbScene])

  const group = useRef<THREE.Group>(null)
  const initialized = useRef(false)
  const glowLight = useRef<THREE.PointLight | null>(null)
  const specularLight = useRef<THREE.PointLight | null>(null)
  const prefersReduced = useRef(false)
  const pointerFine = useRef(true)
  const wallpaperRef = useRef<THREE.Mesh | null>(null)
  const glareRef = useRef<THREE.Mesh | null>(null)
  const _screenPos = useMemo(() => new THREE.Vector3(), [])
  const _cursorLocal = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    pointerFine.current = window.matchMedia('(pointer: fine)').matches
  }, [])

  // Screen canvas — 1280×800 for sharp text
  const { texture, ctx, canvas } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 800
    const ctx = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    texture.flipY = false
    texture.colorSpace = THREE.SRGBColorSpace
    texture.generateMipmaps = false
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    return { texture, ctx, canvas }
  }, [])

  // Compute centering offset + uniform scale once the scene is ready
  const { scaleFactor, offset } = useMemo(() => {
    if (!scene) return { scaleFactor: 1, offset: new THREE.Vector3() }

    scene.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    console.log('[Laptop] GLB world bbox size:', size.x.toFixed(3), size.y.toFixed(3), size.z.toFixed(3))
    console.log('[Laptop] GLB world bbox center:', center.x.toFixed(3), center.y.toFixed(3), center.z.toFixed(3))

    // desiredWidth: controls the apparent scale of the laptop.
    // Camera at terminal beat is Z=3.5, FOV=42° → visible width ≈ 2.7 units.
    // A 9-unit model at X=0.6 fills the frame dramatically (Apple-style hero).
    // The screen (rightmost part at -π/2 rotation) aligns toward center-right.
    const desiredWidth = 6.0
    const sf = size.x > 0 ? desiredWidth / size.x : 1

    return { scaleFactor: sf, offset: center.negate() }
  }, [scene])

  const lastDraw = useRef(0)
  const momentumReveal = useRef(0)
  // Content-dirtiness tracking — skip canvas redraw when nothing visible changed
  const lastDrawnBuffer = useRef('')
  const lastDrawnPhase = useRef(terminalState.phase)
  const lastDrawnProgress = useRef(0)
  const lastDrawnBlink = useRef(-1)

  // Damped transform targets — absorb frame-level discontinuities from fast scroll.
  // Without these, a single frame can jump insideOut by 0.3+ (half the beat range
  // in one tick during a flick), causing a 1+ unit scale snap per frame (wobble).
  const smoothScale  = useRef(1)
  const smoothPosZ   = useRef(0)
  const smoothPosY   = useRef(-0.15)

  useFrame(() => {
    const p = scrollState.progress
    const g = group.current
    if (!g) return

    // -----------------------------------------------------------------------
    // One-time scene discovery & texture wiring
    // -----------------------------------------------------------------------
    if (!initialized.current && scene) {
      initialized.current = true

      // Log hierarchy
      console.groupCollapsed('[Laptop] GLB hierarchy')
      scene.traverse((node) => {
        console.log(`  ${node.type.padEnd(12)} | "${node.name}"`)
      })
      console.groupEnd()

      // Wire screen texture to wallpaper mesh
      const wallpaper = scene.getObjectByName('wallpaper') as THREE.Mesh | undefined
      if (wallpaper && wallpaper.isMesh) {
        wallpaper.material = new THREE.MeshBasicMaterial({
          map: texture,
          toneMapped: false,
          side: THREE.DoubleSide,
        })
        console.log('[Laptop] Screen texture wired to:', wallpaper.name)
        console.log('[Laptop] Mirror fix applied via texture repeat/offset mapping')

        // Matte glass overlay on screen — catches cursor light specular highlights
        wallpaper.geometry.computeBoundingBox()
        const bb = wallpaper.geometry.boundingBox
        if (bb) {
          const sx = Math.abs(bb.max.x - bb.min.x)
          const sy = Math.abs(bb.max.y - bb.min.y)
          const sz = Math.abs(bb.max.z - bb.min.z)
          let gw = sy, gh = sz
          if (sx > sy && sx > sz) {
            gw = sy; gh = sz
          } else if (sy > sx && sy > sz) {
            gw = sx; gh = sz
          } else {
            gw = sx; gh = sy
          }
          const glassGeo = new THREE.PlaneGeometry(gw * 0.98, gh * 0.98)
          const glassMat = new THREE.MeshPhysicalMaterial({
            transparent: true,
            opacity: 0.1,
            roughness: 0.3,
            metalness: 0.05,
            clearcoat: 0.15,
            side: THREE.DoubleSide,
            envMapIntensity: 0.4,
            depthWrite: false,
          })
          const glass = new THREE.Mesh(glassGeo, glassMat)
          glass.name = 'screen-glass'
          glass.position.copy(wallpaper.position)
          glass.position.x += 0.04
          glass.rotation.copy(wallpaper.rotation)
          wallpaper.parent?.add(glass)

          // Glare overlay — fake screen reflection driven by cursor proximity
          const glareTexCanvas = document.createElement('canvas')
          glareTexCanvas.width = 128
          glareTexCanvas.height = 128
          const gCtx = glareTexCanvas.getContext('2d')!
          const gGrad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64)
          gGrad.addColorStop(0, 'rgba(200,210,240,0.35)')
          gGrad.addColorStop(0.2, 'rgba(200,210,240,0.12)')
          gGrad.addColorStop(0.5, 'rgba(200,210,240,0.01)')
          gGrad.addColorStop(1, 'rgba(200,210,240,0)')
          gCtx.fillStyle = gGrad
          gCtx.fillRect(0, 0, 128, 128)
          const glareTex = new THREE.CanvasTexture(glareTexCanvas)
          glareTex.wrapS = glareTex.wrapT = THREE.ClampToEdgeWrapping
          const glareGeo = new THREE.PlaneGeometry(gw * 0.98, gh * 0.98)
          const glareMat = new THREE.MeshBasicMaterial({
            map: glareTex,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
          })
          const glare = new THREE.Mesh(glareGeo, glareMat)
          glare.name = 'screen-glare'
          glare.position.copy(wallpaper.position)
          glare.position.x += 0.041
          glare.rotation.copy(wallpaper.rotation)
          wallpaper.parent?.add(glare)
          glareRef.current = glare
          wallpaperRef.current = wallpaper
        }
      } else {
        console.warn('[Laptop] "wallpaper" mesh not found — screen texture not applied')
      }

      // Screen glow light — subtle, matching dark theme
      const glow = new THREE.PointLight('#6d5dfe', 3, 12)
      glow.position.set(0, 0.8, 1.5)
      g.add(glow)
      // Cyan screen bounce
      const screenBounce = new THREE.PointLight('#22d3ee', 2, 8)
      screenBounce.position.set(0, 0.2, 1.0)
      g.add(screenBounce)
      glowLight.current = glow
      // Specular sweep light — periodic diagonal flash
      const spec = new THREE.PointLight('#ffffff', 0, 6)
      spec.position.set(0, 0, 2)
      g.add(spec)
      specularLight.current = spec
    }

    // -----------------------------------------------------------------------
    // Scroll-driven group transforms
    // -----------------------------------------------------------------------
    const appear    = mapRange(p, 0, BEATS.laptop[1], 0.5, 1)
    const insideOut = mapRange(p, BEATS.inside[0], BEATS.inside[1], 0, 1)

    g.visible = insideOut < 0.999
    if (!g.visible) return

    // ── Damped scale: lerp toward the raw target each frame ─────────────────
    // Raw target can jump by >1 unit/frame during a fast scroll flick
    // (insideOut changes 0.3+ in one frame → scale jumps 0.72 units in one tick).
    // Smoothing factor 0.18 settles in ~5 frames (83ms at 60fps) — fast enough
    // to track intentional scroll, slow enough to kill single-frame snaps.
    const targetScale = THREE.MathUtils.lerp(0.6, 1, appear) * (1 + insideOut * 2.4)
    smoothScale.current += (targetScale - smoothScale.current) * 0.18
    g.scale.setScalar(smoothScale.current)

    // ── Position ─────────────────────────────────────────────────────────────
    // X is fine — it has no fast-ramping insideOut multiplier.
    g.position.x = THREE.MathUtils.lerp(2.0, 0.6, appear)

    // Y: appear-driven only, damp lightly
    const targetY = THREE.MathUtils.lerp(-1.0, -0.15, appear)
    smoothPosY.current += (targetY - smoothPosY.current) * 0.18
    g.position.y = smoothPosY.current

    // Z: insideOut * 7 is the main fast-jump offender — damp it
    const targetZ = THREE.MathUtils.lerp(-5, 0.0, appear) + insideOut * 7
    smoothPosZ.current += (targetZ - smoothPosZ.current) * 0.18
    g.position.z = smoothPosZ.current

    // ── Rotation ─────────────────────────────────────────────────────────────
    // These use appear only (no insideOut multiplier), so no damping needed.
    g.rotation.x = THREE.MathUtils.lerp(-0.4, -0.10, appear)
    g.rotation.y = THREE.MathUtils.lerp(-1.2, -1.45, appear) + Math.sin(p * 6) * 0.015

    // -----------------------------------------------------------------------
    // Screen canvas content by scroll stage
    // -----------------------------------------------------------------------
    const terminalT = mapRange(p, BEATS.terminal[0], BEATS.terminal[1] - 0.01, 0, 1)
    const ollamaT = mapRange(p, BEATS.ollama[0], BEATS.ollama[1], 0, 1)
    const dashT = mapRange(p, BEATS.connected[0] - 0.03, BEATS.connected[1], 0, 1)

    // -----------------------------------------------------------------------
    // Velocity-reactive momentum boost for terminal typing
    // -----------------------------------------------------------------------
    const inTerminal = p >= BEATS.terminal[0] && p < BEATS.ollama[0]
    if (inTerminal) {
      const velMag = Math.abs(scrollState.velocity)
      // target boost in t-space: up to 8 extra chars (= 8 / FULL_TEXT_LEN)
      const targetBoost = Math.min(8 / FULL_TEXT_LEN, velMag * 2)
      momentumReveal.current += (targetBoost - momentumReveal.current) * 0.15
    } else {
      momentumReveal.current = 0
    }
    const boostedTerminalT = Math.min(1, terminalT + momentumReveal.current)

    let glowIntensity = 0
    const now = performance.now()
    // Reduced throttle during the terminal beat so velocity reactivity feels smooth
    const throttleMs = inTerminal ? 0 : 80

    // ── Suppress canvas redraw during BEATS.inside ───────────────────────────
    // During the pullo→inside transition the laptop is scaling away and becoming
    // visually irrelevant (disappears at insideOut ≥ 0.999). Redrawing the canvas
    // texture AND uploading it to the GPU (1280×800 CanvasTexture) every 80ms
    // at exactly this moment — the same frame window where scale/position are
    // ramping rapidly AND Hardware.tsx is also starting its fade-in — compounds
    // three real costs at the worst possible moment. Holding the last-drawn frame
    // is imperceptible since the screen is shrinking away. Skip entirely.
    const inInsideBeat = p >= BEATS.inside[0] && p < BEATS.inside[1]

    if (!inInsideBeat && now - lastDraw.current > throttleMs) {
      lastDraw.current = now
      if (p < BEATS.terminal[0]) {
        ctx.fillStyle = '#04060f'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        glowIntensity = 0.2
        texture.needsUpdate = true
      } else if (p < BEATS.ollama[0]) {
        if (!terminalState.scriptedComplete && boostedTerminalT >= 0.99) {
          terminalState.scriptedComplete = true
          terminalState.phase = 'idle'
        }
        if (terminalState.phase === 'pulling') {
          const elapsed = now - terminalState.pullStartTime
          terminalState.pullProgress = Math.min(1, elapsed / 2800)
          if (terminalState.pullProgress >= 1) {
            terminalState.phase = 'done'
          }
        }
        if (terminalState.scriptedComplete && terminalState.phase !== 'scripted') {
          const currentBlink = Math.floor(now / 530)
          const contentChanged =
            terminalState.typedBuffer !== lastDrawnBuffer.current ||
            terminalState.phase !== lastDrawnPhase.current ||
            terminalState.pullProgress !== lastDrawnProgress.current ||
            currentBlink !== lastDrawnBlink.current
          if (contentChanged) {
            lastDrawnBuffer.current = terminalState.typedBuffer
            lastDrawnPhase.current = terminalState.phase
            lastDrawnProgress.current = terminalState.pullProgress
            lastDrawnBlink.current = currentBlink
            drawInteractiveTerminal(ctx, canvas.width, canvas.height, terminalState, prefersReduced.current)
            texture.needsUpdate = true
          }
        } else {
          lastDrawnBuffer.current = ''
          lastDrawnPhase.current = 'scripted'
          lastDrawnProgress.current = 0
          lastDrawnBlink.current = -1
          drawTerminal(ctx, canvas.width, canvas.height, boostedTerminalT)
          texture.needsUpdate = true
        }
        glowIntensity = 0.4 + terminalT * 0.6
      } else if (p < BEATS.pullo[0]) {
        drawOllama(ctx, canvas.width, canvas.height, ollamaT)
        glowIntensity = 1.2
        texture.needsUpdate = true
      } else if (p >= BEATS.connected[0] - 0.05) {
        drawDashboard(ctx, canvas.width, canvas.height, dashT)
        glowIntensity = 0.9
        texture.needsUpdate = true
      } else {
        drawOllama(ctx, canvas.width, canvas.height, 1)
        glowIntensity = 0.8
        texture.needsUpdate = true
      }
    } else {
      if (p < BEATS.terminal[0]) glowIntensity = 0.2
      else if (p < BEATS.ollama[0]) glowIntensity = 0.4 + terminalT * 0.6
      else if (p < BEATS.pullo[0]) glowIntensity = 1.2
      else if (p >= BEATS.connected[0] - 0.05) glowIntensity = 0.9
      else glowIntensity = 0.8
    }

    if (glowLight.current) {
      glowLight.current.intensity = glowIntensity * 1.5
    }

    // ── Specular sweep — periodic diagonal light streak every 7s ──
    if (!prefersReduced.current && specularLight.current) {
      const specCycle = 7000
      const specActive = 1400
      const specT = (now % specCycle) / specActive
      if (specT < 1) {
        const s = specT
        specularLight.current.position.set(
          THREE.MathUtils.lerp(-3, 3, s),
          THREE.MathUtils.lerp(2, -1, s),
          THREE.MathUtils.lerp(2.5, -0.5, s),
        )
        specularLight.current.intensity = Math.sin(s * Math.PI) * 1.8
      } else {
        specularLight.current.intensity = 0
      }
    }

    // ── Fake screen reflection (glare overlay) driven by cursor proximity ──
    if (!prefersReduced.current && pointerFine.current && glareRef.current && wallpaperRef.current) {
      wallpaperRef.current.getWorldPosition(_screenPos)
      _cursorLocal.copy(cursorWorldPos).sub(_screenPos)

      const horiz = _cursorLocal.x
      const vert = _cursorLocal.y
      const depth = _cursorLocal.z
      const dist = Math.sqrt(horiz * horiz + vert * vert + depth * depth)

      const glareOpacity = THREE.MathUtils.clamp((1 - dist / 4.5) * 0.12, 0, 0.12)
      const offsetX = THREE.MathUtils.clamp(horiz * 0.04, -0.15, 0.15)
      const offsetY = THREE.MathUtils.clamp(vert * 0.04, -0.15, 0.15)

      const mat = glareRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = glareOpacity
      if (mat.map) {
        mat.map.offset.x += (offsetX - mat.map.offset.x) * 0.08
        mat.map.offset.y += (offsetY - mat.map.offset.y) * 0.08
      }
    }
  })

  return (
    <group ref={group} dispose={null}>
      {/*
        Centering: negate the model centroid so it sits at local (0,0,0).
        offset is in GLB-space; multiply by scaleFactor to get world-space shift.
      */}
      {scene && (
        <group position={[offset.x * scaleFactor, offset.y * scaleFactor, offset.z * scaleFactor]}>
          <group scale={[scaleFactor, scaleFactor, scaleFactor]}>
            <primitive object={scene} />
          </group>
        </group>
      )}
    </group>
  )
}

useGLTF.preload('/models/LAPTOP.glb')
