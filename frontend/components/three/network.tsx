'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, mapRange, BEATS } from '@/lib/scroll'

export function Network() {
  const group = useRef<THREE.Group>(null)
  const linesRef = useRef<THREE.LineSegments>(null)

  const { nodes, lineGeo } = useMemo(() => {
    const nodes: THREE.Vector3[] = []
    const R = 3.2
    const N = 26
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const radius = Math.sqrt(1 - y * y)
      const theta = Math.PI * (3 - Math.sqrt(5)) * i
      nodes.push(
        new THREE.Vector3(
          Math.cos(theta) * radius * R,
          y * R,
          Math.sin(theta) * radius * R,
        ),
      )
    }
    const pts: number[] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 2.6) {
          pts.push(...nodes[i].toArray(), ...nodes[j].toArray())
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return { nodes, lineGeo }
  }, [])

  useFrame((_, delta) => {
    const p = scrollState.progress
    const g = group.current
    if (!g) return
    const vis = mapRange(p, BEATS.network[0], BEATS.network[0] + 0.04, 0, 1) *
      mapRange(p, BEATS.network[1], BEATS.network[1] + 0.0125, 1, 0)
    g.visible = vis > 0.01
    g.scale.setScalar(THREE.MathUtils.lerp(0.4, 1, vis))
    g.rotation.y += delta * 0.12
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as
        | (THREE.Material & { opacity: number })
        | undefined
      if (m && 'opacity' in m) {
        m.transparent = true
        m.opacity = vis
      }
    })
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial
      mat.opacity = vis * (0.25 + Math.sin(performance.now() * 0.003) * 0.15)
    }
  })

  return (
    <group ref={group} visible={false}>
      {/* core globe */}
      <mesh>
        <icosahedronGeometry args={[3.2, 2]} />
        <meshBasicMaterial color="#101a3a" wireframe transparent opacity={0.3} />
      </mesh>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial color="#6d5dfe" transparent opacity={0.3} />
      </lineSegments>
      {nodes.map((n, i) => (
        <mesh key={i} position={n}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? '#22d3ee' : '#6d5dfe'}
            emissive={i % 3 === 0 ? '#22d3ee' : '#6d5dfe'}
            emissiveIntensity={1.6}
          />
        </mesh>
      ))}
      <pointLight position={[0, 0, 0]} color="#6d5dfe" intensity={2} distance={10} />
    </group>
  )
}
