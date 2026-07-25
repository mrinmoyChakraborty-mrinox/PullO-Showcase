'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/lib/workspace-context'
import {
  listModels,
  type Model,
} from '@/lib/api'

export default function ModelsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  const { activeWsId, setActiveWsId, workspaces } = useWorkspace()
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(0)

  const currentWsId = activeWsId || (workspaces.length > 0 ? workspaces[0].id : null)

  useEffect(() => {
    if (!activeWsId && workspaces.length > 0) {
      setActiveWsId(workspaces[0].id)
    }
  }, [activeWsId, workspaces, setActiveWsId])

  useEffect(() => {
    if (!currentWsId) {
      if (workspaces.length === 0) {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError(null)
    listModels(currentWsId)
      .then((data) => {
        setModels(data || [])
      })
      .catch((err) => {
        console.error('Failed to load models:', err)
        setError(err instanceof Error ? err.message : 'Failed to load models')
      })
      .finally(() => setLoading(false))
  }, [currentWsId, workspaces.length])

  // Reset pagination to first page when search changes
  useEffect(() => {
    setCurrentPage(0)
  }, [search])

  // Case-insensitive, trimmed search filtering over model names (including special chars)
  const filteredModels = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return models

    return models.filter((model) =>
      model.name.toLowerCase().includes(normalizedSearch)
    )
  }, [models, search])

  if (authLoading || !user) return null

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1440, position: 'relative', minHeight: '100vh' }}>
      {/* Ambient background artwork */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.28, mixBlendMode: 'screen',
        backgroundImage: 'url(/images/bg-network.png)',
        backgroundSize: 'cover', backgroundPosition: 'right center', backgroundRepeat: 'no-repeat',
        filter: 'blur(8px)', WebkitFilter: 'blur(8px)',
        maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Top Header & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>Workspace</span>
          <select
            value={currentWsId ?? ''}
            onChange={(e) => setActiveWsId(e.target.value)}
            style={{
              background: 'var(--surface-2)',
              color: 'var(--text-hi)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
        </div>

        {/* Model Search Input */}
        <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-lo)"
            strokeWidth="2"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            style={{
              width: '100%',
              background: 'var(--surface-2)',
              color: 'var(--text-hi)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 28px 6px 32px',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--violet, #7C3AED)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-lo)',
                cursor: 'pointer',
                fontSize: 12,
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 220, borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16, background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FB7185" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#FB7185', marginBottom: 4 }}>Could not load models</div>
          <div style={{ fontSize: 13, color: 'var(--text-lo)', marginBottom: 16, lineHeight: 1.5 }}>{error}</div>
          <button
            onClick={() => {
              if (currentWsId) {
                setLoading(true)
                setError(null)
                listModels(currentWsId)
                  .then((data) => setModels(data || []))
                  .catch((err) => setError(err instanceof Error ? err.message : String(err)))
                  .finally(() => setLoading(false))
              }
            }}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)', color: 'var(--text-md)', cursor: 'pointer', fontSize: 13,
            }}
          >
            Retry
          </button>
        </div>
      ) : models.length === 0 ? (
        <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-lo)', maxWidth: 500, margin: '0 auto' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.35, marginBottom: 14 }}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-md)', marginBottom: 4 }}>No models connected</div>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>Install PullO Desktop on your machine, register a model, and it will appear here.</div>
        </div>
      ) : filteredModels.length === 0 ? (
        /* No Search Results Empty State */
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-lo)', maxWidth: 450, margin: '0 auto' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="1.8">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-md)', marginBottom: 4 }}>No models found</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
            No models match &quot;<span style={{ color: 'var(--text-hi)' }}>{search}</span>&quot;. Try another model name.
          </div>
          <button
            onClick={() => setSearch('')}
            style={{
              padding: '6px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)', color: 'var(--text-md)', cursor: 'pointer', fontSize: 12,
            }}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredModels.map((model) => {
            const isOnline = model.status === 'online'
            return (
              <div
                key={model.id}
                style={{
                  background: 'var(--glass)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: isOnline ? 1 : 0.6,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={(e) => { if (!isOnline) e.currentTarget.style.opacity = '0.6' }}
              >
                <div style={{
                  height: 80,
                  background: isOnline
                    ? 'linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(79,70,229,0.08) 100%)'
                    : 'linear-gradient(135deg,rgba(244,63,94,0.08) 0%,rgba(239,68,68,0.04) 100%)',
                  borderBottom: '1px solid var(--border)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: isOnline
                      ? 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(79,70,229,0.2))'
                      : 'linear-gradient(135deg,rgba(244,63,94,0.18),rgba(239,68,68,0.12))',
                    border: `1px solid ${isOnline ? 'rgba(124,58,237,0.3)' : 'rgba(244,63,94,0.25)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isOnline ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="1.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FB7185" strokeWidth="1.5">
                        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                      </svg>
                    )}
                  </div>
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', fontFamily: "'Geist Mono', monospace" }}>
                    {model.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOnline ? '#10B981' : '#F43F5E' }} />
                    <span style={{ fontSize: 12, color: isOnline ? '#10B981' : '#F43F5E' }}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  {model.stats && (
                    <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12, color: 'var(--text-md)' }}>
                      <div>
                        <span style={{ color: 'var(--text-lo)' }}>Requests </span>
                        <span style={{ color: 'var(--text-hi)' }}>{model.stats.requests ?? 0}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-lo)' }}>Latency </span>
                        <span style={{ color: 'var(--text-hi)' }}>{model.stats.avg_latency_ms != null ? `${model.stats.avg_latency_ms}ms` : '—'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-lo)' }}>Uptime </span>
                        <span style={{ color: 'var(--text-hi)' }}>{model.stats.error_count != null ? `${Math.max(0, 100 - model.stats.error_count)}%` : '—'}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ flex: 1 }} />

                  <Link
                    href={`/dashboard/models/${model.id}?workspace_id=${currentWsId}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14,
                      padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#C4B5FD',
                      background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                      textDecoration: 'none', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(124,58,237,0.18)'
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(124,58,237,0.1)'
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    View Details
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
