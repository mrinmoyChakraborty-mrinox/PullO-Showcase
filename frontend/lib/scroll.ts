'use client'

import { createContext, useContext } from 'react'

// Shared mutable scroll state read by the 3D scene every frame (no re-renders).
export const scrollState = { progress: 0, velocity: 0 }

export const ScrollContext = createContext<{ progress: number }>({ progress: 0 })

export function useScrollProgressValue() {
  return useContext(ScrollContext)
}

/** Smoothstep helper */
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export function clamp01(x: number) {
  return Math.min(1, Math.max(0, x))
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Map a value within [inMin,inMax] to [outMin,outMax], clamped. */
export function mapRange(
  x: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  const t = clamp01((x - inMin) / (inMax - inMin))
  return outMin + (outMax - outMin) * t
}

/**
 * Returns the actual fade-in/fade-out range BeatOverlay uses for a beat,
 * accounting for its symmetric fade-span buffer (fadeSpan = span * fade).
 * Any 3D component computing its own visibility from a BEATS range MUST
 * use these buffered values instead of raw BEATS boundaries to stay in
 * sync with the corresponding DOM overlay.
 */
export function getBeatFadeRange(range: readonly [number, number], fade = 0.25) {
  const [start, end] = range
  const span = end - start
  const fadeSpan = span * fade
  return {
    fadeSpan,
    fadeInStart: start - fadeSpan,
    fadeInEnd: start + fadeSpan,
    fadeOutStart: end - fadeSpan,
    fadeOutEnd: end + fadeSpan,
  }
}

// Story beats as scroll-progress ranges (0..1 across the whole page).
export const BEATS = {
  hero: [0.0, 0.07],
  laptop: [0.07, 0.15],
  terminal: [0.15, 0.26],
  ollama: [0.26, 0.34],
  pullo: [0.34, 0.45],
  // Gap after pullo: pullo BeatOverlay fade-out tail (fadeSpan=0.0275) + PulloLetters
  // fade-out over [0.45, 0.49] means pullo's last visible element ends at ~0.49.
  // inside[0]=0.50 places its BeatOverlay fade-in start (outerStart=0.4775) after
  // PulloLetters' fade-out completion, keeping both below 0.15 simultaneously.
  inside: [0.50, 0.59],
  gpu: [0.59, 0.67],
  chrome: [0.67, 0.75],
  connected: [0.75, 0.82],
  network: [0.82, 0.88],
  features: [0.88, 0.94],
  contact: [0.94, 0.99],
  footer: [0.99, 1.02],
} as const
