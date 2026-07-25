'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Cpu, ShieldCheck, Zap, Boxes, Terminal, Network, Download, Layers, Key, Globe } from 'lucide-react'
import Image from 'next/image'
import { BlurReveal } from '@/components/blur-reveal'
import MagneticButton from '@/components/magnetic-button'
import { ContactForm } from '@/components/ContactForm'


const howItWorksSteps = [
  {
    icon: Download,
    title: '1. Install Extension',
    body: 'Add the PullO Chrome extension (MV3). It acts as a secure WebSocket relay that pulls requests from the cloud queue to your local AI models.',
  },
  {
    icon: Layers,
    title: '2. Connect Ollama',
    body: 'PullO auto-discovers your local models on Ollama, LM Studio, or any OpenAI-compatible endpoint. No importing or migration required.',
  },
  {
    icon: Key,
    title: '3. Generate API Keys',
    body: 'Create scoped API keys with per-model permissions, rate limits, and daily budgets. Share access without exposing your local infrastructure.',
  },
  {
    icon: Globe,
    title: '4. Integrate Anywhere',
    body: 'Point any OpenAI SDK, CLI tool, or pipeline at your PullO endpoint. Drop-in compatible with existing developer workflows and AI agents.',
  },
]

const features = [
  {
    icon: ShieldCheck,
    title: 'Private AI Network Layer',
    body: 'Pull-based architecture with zero inbound ports. Works behind corporate firewalls, NAT, and VPNs. No public IP or port forwarding needed. Data never leaves your machine — prompts and responses are never stored.',
  },
  {
    icon: Zap,
    title: 'OpenAI-Compatible API',
    body: 'Drop-in replacement for OpenAI SDKs. Just change the base_url to your PullO endpoint. Works with any language or tool that speaks the OpenAI API format — Python, TypeScript, cURL, LangChain, and more.',
  },
  {
    icon: Boxes,
    title: 'Any Local Model',
    body: 'Connect Ollama, LM Studio, or any OpenAI-compatible endpoint. Support for Llama, Mistral, Qwen, Gemma, DeepSeek, CodeGemma, Phi and all models available through your local runtime.',
  },
  {
    icon: Cpu,
    title: 'WebSocket Relay Architecture',
    body: 'Persistent, low-latency WebSocket connection between the Chrome extension and cloud backend. Heartbeat health monitoring, streaming SSE responses, and automatic reconnection for reliable model serving.',
  },
  {
    icon: Terminal,
    title: 'Team Access Controls',
    body: 'Workspace isolation, role-based access (Owner, Admin, Member), API key management with SHA-256 hashing, per-model permissions, rate limits (RPM), and daily budget controls.',
  },
  {
    icon: Network,
    title: 'MCP & Tool Integration',
    body: 'Built-in intelligence layer with web search, URL fetching, calculator, and date/time tools. Extend models with MCP (Model Context Protocol) servers and Corsair plugin marketplace for GitHub, Slack, and Gmail integrations.',
  },
]

const stats = [
  { value: '0ms', label: 'Network latency' },
  { value: '100%', label: 'On-device' },
  { value: '40+', label: 'Models supported' },
  { value: '$0', label: 'Per-token cost' },
]

export function ClosingSections() {
  return (
    <div className="relative bg-gradient-to-b from-transparent via-[#070a18] to-[#050816]">
      {/* HOW IT WORKS */}
      <section
        id="how"
        className="relative mx-auto max-w-6xl px-6 pt-32 pb-16 border-b border-white/5"
      >
        {/* Soft iris glow behind how-it-works grid */}
        <div
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2"
          style={{
            width: '80vw',
            maxWidth: '900px',
            height: '400px',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(109,93,254,0.05) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          aria-hidden
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-soft)]">
              Workflow
            </span>
            <h2 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl">
              How Pull<span className="text-[var(--color-iris-500)]">O</span> Works
            </h2>
          </div>
          <p className="max-w-xs text-pretty text-sm leading-relaxed text-[var(--color-text-soft)] lg:mt-14">
            Turn local AI models into team-accessible OpenAI-compatible APIs in four simple steps. Pull-based architecture keeps data on your machine.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorksSteps.map((step, i) => {
            const Icon = step.icon
            return (
              <BlurReveal
                key={step.title}
                delay={i * 100}
              >
                <div
                  className="group relative flex flex-col gap-4 rounded-2xl p-8 glow-border h-full"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                  }}
                >
                  <div
                    className="relative flex h-12 w-12 items-center justify-center rounded-xl glow-icon"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                      backdropFilter: 'blur(12px) saturate(180%)',
                      boxShadow: '0 0 24px rgba(109,93,254,0.12)',
                    }}
                  >
                    <Icon
                      className="relative z-[2] h-5 w-5 text-[var(--color-iris-500)]"
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="text-pretty text-sm leading-relaxed text-[var(--color-text-soft)]">
                    {step.body}
                  </p>
                </div>
              </BlurReveal>
            )
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="pullo-grid-bg relative mx-auto max-w-6xl px-6 pt-32 pb-16"
      >
        {/* Soft iris glow behind feature grid */}
        <div
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2"
          style={{
            width: '80vw',
            maxWidth: '900px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(109,93,254,0.07) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          aria-hidden
        />

        {/* Editorial section header — left-aligned, serif accent */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-soft)]">
              Everything included
            </span>
            <h2 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Private AI infrastructure for{' '}
              <span className="font-serif-italic">your</span> team
            </h2>
          </div>
          <p className="max-w-xs text-pretty text-sm leading-relaxed text-[var(--color-text-soft)] lg:mt-14">
            Everything you need to turn local AI models into a team-ready OpenAI-compatible API —
            no tunnels, no port forwarding, no cloud inference.
          </p>
        </div>

        {/* Asymmetric bento grid — glass cards with gradient-stroke border */}
        {/* Verified layout (lg:grid-cols-3):
            Row 1: Private (col-span-2) + Sub-ms (1)        = 3
            Row 2: Any model (1) + Silicon (1) + OpenAI (1) = 3
            Row 3: Encrypted (col-span-2) + accent (1)      = 3
        */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon
            const span: Record<number, string> = {
              0: 'sm:col-span-2 lg:col-span-2',
              5: 'sm:col-span-2 lg:col-span-2',
            }
            return (
              <BlurReveal
                key={f.title}
                delay={i === 0 ? 0 : i === 5 ? 300 : i < 3 ? 100 : 200}
                className={span[i] ?? ''}
              >
                <div
                  className="group relative flex flex-col gap-4 rounded-2xl p-8 glow-border"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                  }}
                >
                  {/* Icon container — liquid-glass + glow */}
                  <div
                    className="relative flex h-12 w-12 items-center justify-center rounded-xl glow-icon"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                      backdropFilter: 'blur(12px) saturate(180%)',
                      boxShadow:
                        '0 0 24px rgba(109,93,254,0.12)',
                    }}
                  >
                    <Icon
                      className="relative z-[2] h-5 w-5 text-[var(--color-iris-500)]"
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="text-pretty text-sm leading-relaxed text-[var(--color-text-soft)]">
                    {f.body}
                  </p>
                </div>
              </BlurReveal>
            )
          })}

          {/* Decorative accent panel — fills the remaining col-3 on row 3 */}
          <BlurReveal delay={300} className="hidden sm:hidden lg:block">
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center glow-border"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
              }}
            >
              <Image
                src="/images/pullo-logo.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 object-contain opacity-50"
              />
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-text-soft)]/50">
                PullO
              </span>
            </div>
          </BlurReveal>
        </div>
      </section>

      {/* STATS */}
      <section className="relative mx-auto max-w-6xl px-6 py-20">
        {/* Subtle cyan glow behind stats */}
        <div
          className="pointer-events-none absolute -top-10 right-0"
          style={{
            width: '50vw',
            maxWidth: '600px',
            height: '400px',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(34,211,238,0.05) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          aria-hidden
        />

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative rounded-2xl px-6 py-10 text-center glow-border"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
              }}
            >
              <div className="bg-gradient-to-r from-[var(--color-iris-500)] to-[var(--color-cyan-400)] bg-clip-text text-4xl font-semibold tracking-tight text-transparent md:text-5xl">
                {s.value}
              </div>
              <div className="mt-2 text-sm text-[var(--color-text-soft)]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA / GET STARTED */}
      <section
        id="get"
        className="relative mx-auto max-w-4xl px-6 py-24 text-center"
      >
        {/* Deep iris glow behind CTA card */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '70vw',
            maxWidth: '700px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(109,93,254,0.08) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          aria-hidden
        />
        <Image
          src="/images/pullo-logo.png"
          alt=""
          width={72}
          height={72}
          className="mx-auto h-16 w-16 object-contain"
          style={{ animation: 'pullo-float 6s ease-in-out infinite' }}
        />
        <h2 className="mt-8 text-balance text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
          Go from local model to team API in minutes.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-pretty text-lg leading-relaxed text-[var(--color-text-soft)]">
          Install the PullO Chrome extension, connect your local Ollama or LM Studio model, and start sharing private AI through a secure OpenAI-compatible API endpoint.
        </p>

        {/* Extension Card */}
        <BlurReveal className="mx-auto mt-10 max-w-md">
          <div
            className="relative overflow-hidden rounded-2xl p-6 text-left glow-border"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
              backdropFilter: 'blur(24px) saturate(180%)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Header: Icon & title */}
            <div className="flex items-center gap-4">
              <div
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl glow-icon"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(108,92,231,0.2) 0%, rgba(139,123,255,0.05) 100%)',
                  border: '1px solid rgba(139,123,255,0.3)',
                  boxShadow: '0 0 24px rgba(109,93,254,0.2)',
                }}
              >
                <svg className="h-6 w-6 text-[var(--color-iris-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white tracking-tight">Chrome Extension</h3>
                <p className="text-xs text-[var(--color-text-soft)]">Connect Ollama &amp; LM Studio directly in browser</p>
              </div>
            </div>

            {/* Action button */}
            <div className="mt-5">
              <MagneticButton className="w-full">
                <a
                  href="https://runtimeco.qzz.io/extension/latest/install-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[var(--color-ink-950)] shadow-lg transition-all duration-200 hover:bg-slate-100 hover:scale-[1.01] hover:shadow-white/20"
                >
                  <svg className="h-4 w-4 text-[var(--color-ink-950)] transition-transform duration-200 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Add to Chrome</span>
                  <svg className="h-4 w-4 opacity-50 transition-transform duration-200 group-hover:translate-x-1 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </MagneticButton>
            </div>

            {/* Metadata Footer */}
            <div className="mt-3.5 text-center text-[12px] text-[var(--color-text-soft)] opacity-80">
              Unpacked developer build · Free &amp; Open Source · 2-minute setup guide
            </div>
          </div>
        </BlurReveal>

        {/* Installation Timeline */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid gap-6 sm:grid-cols-4">
            <BlurReveal delay={0}>
              <div
                className="relative rounded-xl p-5 text-left glow-border"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                }}
              >
                <div
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg glow-icon mb-3"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                    backdropFilter: 'blur(12px) saturate(180%)',
                    boxShadow: '0 0 24px rgba(109,93,254,0.12)',
                  }}
                >
                  <svg className="h-5 w-5 text-[var(--color-iris-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-white">Install PullO Extension</div>
                <div className="mt-1 text-xs text-[var(--color-text-soft)]">Chrome MV3 · WebSocket relay</div>
              </div>
            </BlurReveal>
            <BlurReveal delay={100}>
              <div
                className="relative rounded-xl p-5 text-left glow-border"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                }}
              >
                <div
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg glow-icon mb-3"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                    backdropFilter: 'blur(12px) saturate(180%)',
                    boxShadow: '0 0 24px rgba(109,93,254,0.12)',
                  }}
                >
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-white">Install Ollama</div>
                <div className="mt-1 text-xs text-[var(--color-text-soft)]">Local inference server</div>
              </div>
            </BlurReveal>
            <BlurReveal delay={200}>
              <div
                className="relative rounded-xl p-5 text-left glow-border"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                }}
              >
                <div
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg glow-icon mb-3"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                    backdropFilter: 'blur(12px) saturate(180%)',
                    boxShadow: '0 0 24px rgba(109,93,254,0.12)',
                  }}
                >
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-white">Download a Model</div>
                <div className="mt-1 text-xs text-[var(--color-text-soft)]">Llama · Mistral · Qwen · Gemma · DeepSeek</div>
              </div>
            </BlurReveal>
            <BlurReveal delay={300}>
              <div
                className="relative rounded-xl p-5 text-left glow-border"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                }}
              >
                <div
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg glow-icon mb-3"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                    backdropFilter: 'blur(12px) saturate(180%)',
                    boxShadow: '0 0 24px rgba(109,93,254,0.12)',
                  }}
                >
                  <svg className="h-5 w-5 text-[var(--color-cyan-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-white">Start Browsing</div>
                <div className="mt-1 text-xs text-[var(--color-text-soft)]">Step 4</div>
              </div>
            </BlurReveal>
          </div>
        </div>

        {/* Contact / Feedback Section */}
        <div id="contact" className="mt-28">
          <BlurReveal>
            <div className="text-center mb-10">
              <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
                Have a Query? Connect with us
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-balance text-base text-[var(--color-text-soft)]">
                Tell us what's not working, request new features, or let us know how PullO can better serve your local AI workflow.
              </p>
            </div>

            <div className="mx-auto max-w-2xl">
              <ContactForm />

              {/* Direct reach out pills */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <span className="text-xs text-[var(--color-text-soft)] font-medium">Or reach us directly:</span>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=runtimeco.team@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Email runtimeco.team@gmail.com"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/5 hover:border-white/30"
                  >
                    <svg className="h-4 w-4 text-[var(--color-iris-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <span>runtimeco.team@gmail.com</span>
                  </a>

                  <a
                    href="https://discord.gg/YKdSNNR9ae"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Join our Discord community"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/5 hover:border-white/30"
                  >
                    <svg className="h-4 w-4 fill-current text-[#5865F2]" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span>Join Discord</span>
                  </a>
                </div>
              </div>
            </div>
          </BlurReveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#040612] pt-16 pb-12">
        <div className="mx-auto max-w-6xl px-6">
          {/* Top Brand Section */}
          <div className="flex flex-col gap-8 pb-12 border-b border-white/10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/pullo-logo.png"
                  alt="PullO"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
                <span className="text-xl font-bold tracking-tight text-white">
                  Pull<span className="text-[var(--color-iris-500)]">O</span>
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-soft)]">
                Private AI network layer turning local models on Ollama & LM Studio into secure, OpenAI-compatible APIs for your team. Zero data retention & zero inbound ports.
              </p>
            </div>

            {/* Live System Status Badge */}
            <div className="flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-xs font-semibold text-emerald-400 self-start lg:self-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Structured Multi-Column Grid */}
          <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
            {/* Col 1: Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Product
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a href="https://runtimeco.qzz.io/extension/latest/install-guide" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    Chrome Extension
                  </a>
                </li>
                <li>
                  <a href="#how" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    Local Model Relay
                  </a>
                </li>
                <li>
                  <a href="#how" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    OpenAI Compatibility
                  </a>
                </li>
                <li>
                  <Link href="/dashboard" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    Dashboard & API Keys
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 2: Developers */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Developers
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a href="https://pullo-docs.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="https://pullo-docs.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    OpenAI SDK Integration
                  </a>
                </li>
                <li>
                  <a href="https://pullo-docs.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    MCP Gateway & Tools
                  </a>
                </li>
                <li>
                  <a href="https://pullo-docs.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    Corsair Marketplace
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Community & Support */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Community
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a href="#contact" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    Connect & Feedback
                  </a>
                </li>
                <li>
                  <a href="https://discord.gg/YKdSNNR9ae" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    Discord Community
                  </a>
                </li>
                <li>
                  <a href="https://mail.google.com/mail/?view=cm&fs=1&to=runtimeco.team@gmail.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    Email Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Legal & Security */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Legal & Security
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link href="/terms" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a href="#how" className="text-[var(--color-text-soft)] transition-colors hover:text-white">
                    On-Device Security
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Security Note */}
          <div className="pt-8 border-t border-white/5 flex flex-col items-center justify-between gap-4 text-xs text-[var(--color-text-soft)]/60 sm:flex-row">
            <div>
              &copy; {new Date().getFullYear()} PullO by Runtime Co. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400/80">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <span>100% On-Device & Zero Data Retention</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
