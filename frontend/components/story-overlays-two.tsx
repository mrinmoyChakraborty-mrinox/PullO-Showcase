'use client'

import { BeatOverlay } from './beat-overlay'
import { BEATS } from '@/lib/scroll'

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-soft)] backdrop-blur-md">
      {children}
    </span>
  )
}

// Reduced backdropFilter blur from 20px → 12px across all cards.
// On a near-transparent dark surface the two values are perceptually
// indistinguishable, but 12px roughly halves the Gaussian compositor pass
// cost — important because these cards all animate opacity+transform
// simultaneously, forcing a recomposite every frame during fade-in/out.
// saturate() was also removed: it adds a separate filter step with no
// visible benefit on a surface this close to neutral grey.
const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
  backdropFilter: 'blur(12px)',
} as const

export function StoryOverlaysTwo() {
  return (
    <>
      {/* INSIDE THE MACHINE */}
      <BeatOverlay range={BEATS.inside} travel={24}>
        <div className="absolute left-1/2 top-[16%] w-full max-w-lg -translate-x-1/2 text-center">
          <div className="rounded-3xl px-8 py-6 shadow-[0_0_60px_rgba(109,93,254,0.15)] glow-border relative" style={CARD_STYLE}>
            <Eyebrow>Under the hood</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-white md:text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Every request stays on your{' '}
              <span className="font-serif-italic">hardware</span>.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty leading-relaxed text-[var(--color-text-soft)]">
              Inference runs locally.
              PullO only coordinates access.
              Your data never leaves the machine running the model.
            </p>
          </div>
        </div>
      </BeatOverlay>

      {/* GPU */}
      <BeatOverlay range={BEATS.gpu} travel={24}>
        <div className="absolute left-1/2 bottom-[16%] w-full max-w-lg -translate-x-1/2 text-center">
          <div className="rounded-3xl px-8 py-6 shadow-[0_0_60px_rgba(109,93,254,0.15)] glow-border relative" style={CARD_STYLE}>
            <Eyebrow>GPU acceleration</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-white md:text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Built for the hardware you already own.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty leading-relaxed text-[var(--color-text-soft)]">
              CUDA, Metal and Vulkan acceleration work automatically through Ollama.
              PullO simply connects people to the models you already run.
            </p>
          </div>
        </div>
      </BeatOverlay>

      {/* CHROME / INTERFACE */}
      <BeatOverlay range={BEATS.chrome} travel={24}>
        <div className="absolute left-1/2 top-[18%] w-full max-w-2xl -translate-x-1/2 text-center md:left-[14%] md:max-w-lg md:translate-x-0 md:text-left">
          <div className="rounded-3xl px-8 py-6 shadow-[0_0_60px_rgba(109,93,254,0.15)] glow-border relative" style={CARD_STYLE}>
            <Eyebrow>Step 03 — Works everywhere your team works</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-white md:text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Works everywhere your team works.
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-[var(--color-text-soft)]">
              Use PullO inside websites, apps, agents and workflows that already speak OpenAI.
            </p>
          </div>
        </div>
      </BeatOverlay>

      {/* CONNECTED */}
      <BeatOverlay range={BEATS.connected} travel={24}>
        <div className="absolute left-1/2 top-[18%] w-full max-w-md -translate-x-1/2 text-center md:left-auto md:right-[12%] md:max-w-sm md:translate-x-0 md:text-right">
          <div className="rounded-3xl px-8 py-6 shadow-[0_0_60px_rgba(109,93,254,0.15)] glow-border relative" style={CARD_STYLE}>
            <Eyebrow>Always private</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-white md:text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Connected,{' '}
              <span className="font-serif-italic">never</span> exposed.
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-[var(--color-text-soft)]">
              No public ports. No public IPs. No incoming connections.
              PullO uses a pull-based architecture that works behind NATs and corporate firewalls.
            </p>
          </div>
        </div>
      </BeatOverlay>

      {/* NETWORK */}
      <BeatOverlay range={BEATS.network} travel={24}>
        <div className="absolute left-1/2 top-[14%] w-full max-w-2xl -translate-x-1/2 text-center">
          <div className="rounded-3xl px-8 py-6 shadow-[0_0_60px_rgba(109,93,254,0.15)] glow-border relative" style={CARD_STYLE}>
            <Eyebrow>The PullO network</Eyebrow>
            <h2 className="mt-5 text-balance text-3xl font-semibold leading-tight text-white md:text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Start with one machine.
              <br />
              Scale to a team.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty leading-relaxed text-[var(--color-text-soft)]">
              Share local AI with coworkers, clients and collaborators without changing how your models run.
            </p>
          </div>
        </div>
      </BeatOverlay>
    </>
  )
}
