'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, mapRange, BEATS } from '@/lib/scroll'
import { Particles } from './particles'
import { Laptop } from './laptop'
import { Hardware } from './hardware'
import { Network } from './network'
import { PulloLetters } from './pullo-letters'
import { SignalPing } from './signal-ping'
import { cursorWorldPos } from './cursor-state'

function CursorLight() {
  const { camera } = useThree()
  const lightRef = useRef<THREE.PointLight>(null!)
  const mouse = useRef(new THREE.Vector2())
  const targetPos = useRef(new THREE.Vector3())
  const isActive = useRef(true)

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  useEffect(() => {
    const isFine = window.matchMedia('(pointer: fine)').matches
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!isFine || prefersReduced) {
      isActive.current = false
      return
    }
    const onMouse = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMouse)
    return () => window.removeEventListener('mousemove', onMouse)
  }, [])

  useFrame(() => {
    if (!isActive.current || !lightRef.current) return

    raycaster.setFromCamera(mouse.current, camera)
    const denom = raycaster.ray.direction.dot(plane.normal)
    if (Math.abs(denom) > 1e-6) {
      const t = -(raycaster.ray.origin.dot(plane.normal) + plane.constant) / denom
      if (t > 0) {
        targetPos.current.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, t)
      }
    }

    cursorWorldPos.copy(targetPos.current)
    lightRef.current.position.lerp(targetPos.current, 0.08)

    const p = scrollState.progress
    let target = 0
    if (p < BEATS.pullo[1]) {
      target = 1.5
    } else if (p >= BEATS.inside[0] && p < BEATS.network[0]) {
      target = 1.8
    }

    lightRef.current.intensity += (target - lightRef.current.intensity) * 0.05
  })

  return <pointLight ref={lightRef} color="#7c6bfb" distance={5} intensity={0} />
}

function CameraRig() {
  const { camera } = useThree()
  const target = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    const p = scrollState.progress

    // Default
    let camZ = 9
    let camY = 0.6
    let tx = 0    // centered look by default
    let ty = 0

    // -------------------------------------------------------------------------
    // Hero (p: 0 → 0.07)
    // Camera centered, laptop on right side at X=0.6-2.0
    // -------------------------------------------------------------------------
    camZ = mapRange(p, 0, BEATS.laptop[0], 10, 9)
    camY = 0.5
    tx = mapRange(p, 0, BEATS.laptop[0], 0.3, 0.2)

    // -------------------------------------------------------------------------
    // Laptop approach (p: 0.07 → 0.15)
    // Close in as laptop settles to X=0.6, screen faces camera
    // -------------------------------------------------------------------------
    if (p >= BEATS.laptop[0]) {
      camZ = mapRange(p, BEATS.laptop[0], BEATS.terminal[1], 9, 3.5)
      camY = mapRange(p, BEATS.laptop[0], BEATS.terminal[1], 0.5, 0.2)
      tx = mapRange(p, BEATS.laptop[0], BEATS.terminal[1], 0.2, 0.3)
    }

    // -------------------------------------------------------------------------
    // PULLO keys rise — pull back to see letters above
    // -------------------------------------------------------------------------
    if (p >= BEATS.pullo[0]) {
      camZ = mapRange(p, BEATS.pullo[0], BEATS.pullo[1], 4.0, 6.5)
      ty = mapRange(p, BEATS.pullo[0], BEATS.pullo[1], 0.1, 1.6)
      tx = mapRange(p, BEATS.pullo[0], BEATS.pullo[1], 0.3, 0)
    }

    // -------------------------------------------------------------------------
    // Dive inside the machine (abstract hardware visualization)
    // -------------------------------------------------------------------------
    if (p >= BEATS.inside[0]) {
      camZ = mapRange(
        p,
        BEATS.inside[0],
        BEATS.gpu[1],
        8,
        6
      )
      camY = mapRange(p, BEATS.inside[0], BEATS.gpu[1], 1.0, 1.4)
      ty = 0.4
      tx = 0
    }

    // -------------------------------------------------------------------------
    // Back to laptop for connected state
    // -------------------------------------------------------------------------
    if (p >= BEATS.chrome[0]) {
      camZ = mapRange(p, BEATS.chrome[0], BEATS.connected[1], 5.5, 6.0)
      camY = mapRange(p, BEATS.chrome[0], BEATS.connected[1], 1.2, 0.5)
      ty = 0
      tx = 0.4
    }

    // -------------------------------------------------------------------------
    // Network: pull way back
    // -------------------------------------------------------------------------
    if (p >= BEATS.network[0]) {
      camZ = mapRange(p, BEATS.network[0], BEATS.network[1], 7, 11)
      camY = 0.5
      tx = 0
    }

    // -------------------------------------------------------------------------
    // Footer: settle
    // -------------------------------------------------------------------------
    if (p >= BEATS.features[0]) {
      camZ = mapRange(p, BEATS.features[0], 1, 10, 6)
      camY = 0.6
      tx = 0
    }

    // Smooth damp toward targets
    camera.position.x += (tx - camera.position.x) * 0.06
    camera.position.y += (camY - camera.position.y) * 0.06
    camera.position.z += (camZ - camera.position.z) * 0.06
    target.current.x += (0 - target.current.x) * 0.06
    target.current.y += (ty - target.current.y) * 0.06
    camera.lookAt(target.current)
  })
  return null
}

export function Scene() {
  const [renderKey, setRenderKey] = useState(0)
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)
  const [sceneVisible, setSceneVisible] = useState(true)
  const blurRef = useRef<HTMLDivElement>(null)
  const recoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let raf = 0
    const check = () => {
      setSceneVisible(scrollState.progress < 0.999)
      raf = requestAnimationFrame(check)
    }
    raf = requestAnimationFrame(check)
    return () => cancelAnimationFrame(raf)
  }, [])

  
  useEffect(() => {
    if (!canvasElement) return

    const handleContextLost = (e: Event) => {
      e.preventDefault()
      if (recoverTimer.current) clearTimeout(recoverTimer.current)
      recoverTimer.current = setTimeout(() => setRenderKey((k) => k + 1), 400)
    }

    const handleContextRestored = () => {
      if (recoverTimer.current) {
        clearTimeout(recoverTimer.current)
        recoverTimer.current = null
      }
      setRenderKey((k) => k + 1)
    }

    canvasElement.addEventListener('webglcontextlost', handleContextLost, false)
    canvasElement.addEventListener('webglcontextrestored', handleContextRestored)

    return () => {
      canvasElement.removeEventListener('webglcontextlost', handleContextLost)
      canvasElement.removeEventListener('webglcontextrestored', handleContextRestored)
      if (recoverTimer.current) {
        clearTimeout(recoverTimer.current)
        recoverTimer.current = null
      }
    }
  }, [canvasElement])

  return (
    <div ref={blurRef} className="fixed inset-0 z-0" style={{ display: sceneVisible ? 'block' : 'none' }}>
      <Canvas
        key={renderKey}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.6,
        }}
        dpr={[1, 1.5]}
        camera={{ position: [0.3, 0.5, 10], fov: 42 }}
        onCreated={({ gl }) => {
          setCanvasElement(gl.domElement)
        }}
      >
        {/* No opaque background color — canvas is transparent (alpha:true) so the ambient-background component shows through */}
        <fog attach="fog" args={['#050816', 20, 52]} />

        {/* Ambient — muted so the laptop reads as part of the dark theme */}
        <ambientLight intensity={0.5} />

        {/* Key light — soft highlight, no longer harsh */}
        <directionalLight position={[6, 10, 7]} intensity={2.0} color="#d4ddf0" castShadow />

        {/* Fill light — left side, subtle blue-purple */}
        <directionalLight position={[-8, 3, 5]} intensity={0.8} color="#7b6ef6" />

        {/* Rim / back light — subtle separation from background */}
        <directionalLight position={[0, 6, -8]} intensity={0.8} color="#22d3ee" />

        {/* Under-glow — faint keyboard glow */}
        <pointLight position={[0, -3, 2]} intensity={0.8} color="#22d3ee" distance={18} />

        {/* Purple accent — restrained */}
        <pointLight position={[-5, 2, 4]} intensity={1.2} color="#6d5dfe" distance={22} />

        {/* Right-side fill — gentle */}
        <pointLight position={[4, 1, 3]} intensity={1.2} color="#d4ddf0" distance={16} />

        {/* Screen spill */}
        <pointLight position={[1.4, 0.4, 3]} intensity={1.0} color="#22d3ee" distance={10} />

        <CursorLight />
        <SignalPing />
        <Particles />
        <Suspense fallback={null}>
          <Laptop />
        </Suspense>
        <PulloLetters />
        <Hardware />
        <Network />

        <CameraRig />
      </Canvas>
    </div>
  )
}
