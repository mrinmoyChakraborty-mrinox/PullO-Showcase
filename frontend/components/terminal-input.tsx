'use client'

import { useEffect, useRef, useState } from 'react'
import { scrollState, BEATS } from '@/lib/scroll'
import { terminalState } from '@/components/terminal-state'

const VALID_CHARS = /^[a-zA-Z0-9:_-]$/
const MAX_NAME_LEN = 24

function HelperText({ helperRef }: { helperRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={helperRef}
      className="pointer-events-none fixed bottom-28 left-1/2 z-20 -translate-x-1/2 text-center transition-opacity duration-700"
      style={{ opacity: 0 }}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--color-text-soft)] backdrop-blur-md">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-cyan-400)]" />
        try typing a model name...
      </span>
    </div>
  )
}

function DesktopInput({ handleKeyDown, inputRef }: {
  handleKeyDown: (e: React.KeyboardEvent) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <input
      ref={inputRef}
      className="fixed z-20 opacity-0"
      style={{
        left: '55%',
        top: '22%',
        width: '30%',
        height: '60px',
        caretColor: 'transparent',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: 'transparent',
      }}
      onKeyDown={handleKeyDown}
      autoComplete="off"
      spellCheck={false}
      tabIndex={0}
      aria-label="Model name input"
    />
  )
}

function MobileInput() {
  const ref = useRef<HTMLInputElement>(null)
  const buffer = useRef('')

  const doPull = () => {
    const model = buffer.current.trim()
    if (!model || model.length > MAX_NAME_LEN) return
    terminalState.submittedModel = model
    terminalState.typedBuffer = ''
    terminalState.pullProgress = 0
    terminalState.pullStartTime = performance.now()
    terminalState.phase = 'pulling'
    if (ref.current) ref.current.value = ''
    buffer.current = ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const sanitized = raw.replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, MAX_NAME_LEN)
    buffer.current = sanitized
    if (sanitized !== raw) e.target.value = sanitized
  }

  return (
    <div className="fixed bottom-12 left-1/2 z-20 -translate-x-1/2 transition-opacity duration-700"
      style={{ opacity: terminalState.phase === 'idle' || terminalState.phase === 'done' ? 1 : 0 }}
    >
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c1226]/90 px-3 py-2 backdrop-blur-md">
        <span className="font-mono text-sm text-[var(--color-cyan-400)]">$ ollama pull</span>
        <input
          ref={ref}
          className="w-28 bg-transparent font-mono text-sm text-white outline-none placeholder:text-[var(--color-text-soft)]"
          placeholder="model-name"
          autoComplete="off"
          spellCheck={false}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); doPull() }
          }}
        />
        <button
          className="rounded-lg bg-[var(--color-cyan-400)] px-3 py-1 text-xs font-semibold text-[#04060f] transition-transform hover:scale-105 active:scale-95"
          onClick={doPull}
        >
          Pull
        </button>
      </div>
    </div>
  )
}

export function TerminalInput() {
  const inputRef = useRef<HTMLInputElement>(null)
  const helperRef = useRef<HTMLDivElement>(null)
  const [isFine, setIsFine] = useState<boolean | null>(null)
  const focusGuard = useRef(0)

  useEffect(() => {
    setIsFine(window.matchMedia('(pointer: fine)').matches)
  }, [])

  useEffect(() => {
    let raf = 0

    const tick = () => {
      const p = scrollState.progress
      const inTerminal = p >= BEATS.terminal[0] && p < BEATS.ollama[0]

      if (
        inTerminal &&
        terminalState.phase === 'idle' &&
        inputRef.current &&
        document.activeElement !== inputRef.current
      ) {
        focusGuard.current++
        if (focusGuard.current > 3) {
          inputRef.current.focus()
        }
      } else {
        focusGuard.current = 0
      }

      if (helperRef.current) {
        const show = inTerminal && terminalState.phase === 'idle'
        helperRef.current.style.opacity = show ? '1' : '0'
        helperRef.current.style.pointerEvents = show ? 'auto' : 'none'
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (terminalState.phase === 'done') {
      if (e.key === 'Enter') {
        e.preventDefault()
        terminalState.phase = 'idle'
      }
      return
    }
    if (terminalState.phase !== 'idle') return

    if (e.key === 'Enter') {
      e.preventDefault()
      const model = terminalState.typedBuffer.trim()
      if (!model || model.length > MAX_NAME_LEN) return

      terminalState.submittedModel = model
      terminalState.typedBuffer = ''
      terminalState.pullProgress = 0
      terminalState.pullStartTime = performance.now()
      terminalState.phase = 'pulling'
      return
    }

    if (e.key === 'Backspace') {
      e.preventDefault()
      terminalState.typedBuffer = terminalState.typedBuffer.slice(0, -1)
      return
    }

    if (e.key.length === 1 && VALID_CHARS.test(e.key)) {
      e.preventDefault()
      if (terminalState.typedBuffer.length < MAX_NAME_LEN) {
        terminalState.typedBuffer += e.key
      }
    }
  }

  // Not yet determined — render nothing to avoid SSR mismatch
  if (isFine === null) return null

  return (
    <>
      {isFine ? (
        <DesktopInput handleKeyDown={handleKeyDown} inputRef={inputRef} />
      ) : (
        <MobileInput />
      )}
      <HelperText helperRef={helperRef} />
    </>
  )
}
