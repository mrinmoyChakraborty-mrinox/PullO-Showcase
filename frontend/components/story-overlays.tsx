'use client'

import { BeatOverlay } from './beat-overlay'
import { BEATS } from '@/lib/scroll'
import Image from 'next/image'
import MagneticButton from '@/components/magnetic-button'

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-soft)] backdrop-blur-md">
      {children}
    </span>
  )
}

export function StoryOverlays() {
  return (
    <>
      {/* HERO — Text left, laptop 3D fills center-right naturally */}
      <BeatOverlay range={BEATS.hero} travel={30} className="!justify-start !items-center pl-8 md:pl-12 lg:pl-20">
        <div className="w-full max-w-[44rem] flex flex-col items-start text-left pl-4 md:pl-0">
          <Eyebrow>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan-400)]" />
            The private AI network layer for local models and team APIs
          </Eyebrow>
          <h1 className="mt-7 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl">
            If Ollama runs it,
            <br />
            <span className="text-gradient-iris animate-gradient-drift">
              PullO{' '}
            </span>
            <span className="text-gradient-iris animate-gradient-drift font-serif-italic">
              shares
            </span>
            <span className="text-gradient-iris animate-gradient-drift">
              {' '}it
            </span>
          </h1>
          <p className="mt-6 max-w-[36rem] text-pretty text-lg leading-relaxed text-[var(--color-text-soft)]">
            Expose local AI models as secure OpenAI-compatible APIs for your team.
            No tunnels. No port forwarding. No cloud inference.
          </p>
          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <MagneticButton>
              <a
                href="#get"
                className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-[var(--color-ink-950)] transition-transform hover:scale-[1.03]"
              >
                Install PullO
              </a>
            </MagneticButton>
            <span className="font-mono text-xs text-[var(--color-text-soft)]">
              scroll to descend ↓
            </span>
          </div>
        </div>
      </BeatOverlay>

      {/* LAPTOP APPROACH */}
      <BeatOverlay range={BEATS.laptop} travel={26}>
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center">
          <Eyebrow>It begins on your desk</Eyebrow>
        </div>
      </BeatOverlay>

      {/* TERMINAL */}
      <BeatOverlay range={BEATS.terminal} travel={24}>
        <div className="absolute left-1/2 top-[18%] w-full max-w-md -translate-x-1/2 text-center md:left-[8%] md:max-w-xs md:translate-x-0 md:text-left">
          <Eyebrow>Step 01 — Connect Ollama</Eyebrow>
          <h2 className="mt-5 text-3xl font-semibold leading-tight text-white md:text-4xl">
            Your models stay exactly where they are.
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-[var(--color-text-soft)]">
            PullO automatically discovers your Ollama models on localhost.
            Any OpenAI-compatible endpoint works — LM Studio, llama.cpp, or custom servers.
          </p>
        </div>
      </BeatOverlay>

      {/* OLLAMA / ENGINE */}
      <BeatOverlay range={BEATS.ollama} travel={24}>
        <div className="absolute left-1/2 top-[18%] w-full max-w-md -translate-x-1/2 text-center md:left-auto md:right-[12%] md:max-w-sm md:translate-x-0 md:text-right">
          <Eyebrow>Step 02 — Turn local models into secure endpoints</Eyebrow>
          <h2 className="mt-5 text-3xl font-semibold leading-tight text-white md:text-4xl">
            Turn local models into secure endpoints.
          </h2>
          <div className="mt-4 relative rounded-2xl p-6 text-left font-mono text-sm text-[var(--color-text-soft)] glow-border"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="mb-4 text-white font-semibold">PullO Sharing Active</div>
            <div className="space-y-2">
              <div>✓ Ollama Connected</div>
              <div>✓ Model: gemma3:1b</div>
              <div>✓ Endpoint: localhost:11434/v1</div>
            </div>
          </div>
          <p className="mt-4 text-pretty leading-relaxed text-[var(--color-text-soft)]">
            Connect PullO once and every model becomes a private OpenAI-compatible API endpoint your team can access.
          </p>
        </div>
      </BeatOverlay>

      {/* PULLO FORMATION */}
      <BeatOverlay range={BEATS.pullo} travel={20}>
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 text-center">
          <div className="flex items-center justify-center gap-3">
            <Image
              src="/images/pullo-logo.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="text-2xl font-semibold tracking-tight text-white">
              This is PullO
            </span>
          </div>
          <p className="mx-auto mt-3 max-w-md text-pretty leading-relaxed text-[var(--color-text-soft)]">
            The private AI network layer that makes local model serving secure and shareable.
          </p>
        </div>
      </BeatOverlay>
    </>
  )
}
