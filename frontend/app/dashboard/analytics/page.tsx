'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/lib/workspace-context'
import {
  getTimeSeries,
  getRealtime,
  type TimeSeriesPoint,
  type RealtimeStats,
} from '@/lib/api'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import './analytics.css'

/* ── SVG Icon Components ── */

interface IconProps {
  className?: string
  style?: React.CSSProperties
  title?: string
}

function IconActivity({ className, style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function IconZap({ className, style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconAlertCircle({ className, style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IconCpu({ className, style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="15" x2="23" y2="15" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="15" x2="4" y2="15" />
    </svg>
  )
}

function IconInfo({ className, style, title }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function IconClock({ className, style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconRefreshCw({ className, style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

/* ── Recharts Custom Shapes ── */

interface DotProps {
  cx?: number
  cy?: number
  index?: number
}

const CustomBarShape = (props: { x?: number; y?: number; width?: number; height?: number }) => {
  const { x = 0, y = 0, width = 0, height = 0 } = props
  if (width <= 0 || height <= 0) return null

  const rTop = 6
  const rBot = 2

  return (
    <g style={{ cursor: 'pointer' }}>
      <rect
        x={x - 3} y={y - 3} width={width + 6} height={Math.min(height + 3, 24)}
        rx={rTop + 2} ry={rTop + 2} fill="#8B5CF6" opacity={0.16}
        style={{ transition: 'opacity 0.2s' }}
        filter="url(#barBlur)"
        pointerEvents="none"
      />
      <path
        d={`M ${x},${y + rTop} Q ${x},${y} ${x + rTop},${y} L ${x + width - rTop},${y} Q ${x + width},${y} ${x + width},${y + rTop} L ${x + width},${y + height - rBot} Q ${x + width},${y + height} ${x + width - rBot},${y + height} L ${x + rBot},${y + height} Q ${x},${y + height} ${x},${y + height - rBot} Z`}
        fill="url(#requestsBarGradient)"
      />
      <path d={`M ${x + 2.5} ${y + 2.5} Q ${x + width / 2} ${y + 1.2} ${x + width - 2.5} ${y + 2.5}`} stroke="rgba(255, 255, 255, 0.45)" strokeWidth={1.2} fill="none" pointerEvents="none" />
      <line x1={x + 2} y1={y + 3.5} x2={x + 2} y2={y + Math.min(height - rBot, 15)} stroke="rgba(255, 255, 255, 0.22)" strokeWidth={1} strokeLinecap="round" pointerEvents="none" />
    </g>
  )
}

const CustomLatencyDot = (props: DotProps) => {
  const { cx, cy } = props
  if (cx == null || cy == null) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill="#3b82f6" opacity={0.16} pointerEvents="none" />
      <circle cx={cx} cy={cy} r={5} fill="#3b82f6" opacity={0.45} pointerEvents="none" />
      <circle cx={cx} cy={cy} r={3.6} fill="url(#latencyDotGradient)" pointerEvents="none" />
      <circle cx={cx} cy={cy} r={1.2} fill="#FFFFFF" pointerEvents="none" />
    </g>
  )
}

const CustomActiveLatencyDot = (props: DotProps) => {
  const { cx, cy } = props
  if (cx == null || cy == null) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={11} fill="#3b82f6" opacity={0.24} pointerEvents="none" />
      <circle cx={cx} cy={cy} r={7.5} fill="#3b82f6" opacity={0.6} pointerEvents="none" />
      <circle cx={cx} cy={cy} r={4.5} fill="url(#latencyDotGradient)" pointerEvents="none" />
      <circle cx={cx} cy={cy} r={1.6} fill="#FFFFFF" pointerEvents="none" />
    </g>
  )
}

interface CustomTooltipContent {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; fill?: string }[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipContent) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#121728', border: '1px solid rgba(139,92,246,0.3)', color: '#f1f5f9',
        padding: '12px 14px', borderRadius: 12, fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif",
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)',
      }}>
        <div style={{ color: '#94A3B8', marginBottom: 6, fontWeight: 500 }}>{label}</div>
        {payload.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color || item.fill }} />
            <span style={{ color: '#cbd5e1' }}>
              {item.name}: <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</span>
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

/* ── Types ── */

interface TimeSeriesEntry {
  name: string
  value: number
}

interface TimeRangeConfig {
  period: string
  days: number
}

type RangeKey = '24h' | '7d' | '30d'

const RANGE_CONFIG: Record<RangeKey, TimeRangeConfig> = {
  '24h': { period: 'hour', days: 1 },
  '7d': { period: 'day', days: 7 },
  '30d': { period: 'day', days: 30 },
}

/* ── Helpers ── */

function formatTimeSeriesLabel(timestamp: string, period: string): string {
  const d = new Date(timestamp)
  if (period === 'hour') {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return `${value}`
}

function getDateRangeLabel(range: RangeKey): string {
  const now = new Date()
  const end = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (range === '24h') return end
  const start = new Date(now)
  start.setDate(start.getDate() - (range === '7d' ? 6 : 29))
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${startStr} - ${end}`
}

/* ── Main Component ── */

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  /* Workspace state */
  const { activeWsId } = useWorkspace()

  /* Data state */
  const [selectedRange, setSelectedRange] = useState<RangeKey>('7d')
  const [series, setSeries] = useState<TimeSeriesPoint[]>([])
  const [realtime, setRealtime] = useState<RealtimeStats | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('Just now')
  const [fadeKey, setFadeKey] = useState(0)

  /* Live request rolling buffer */
  interface LivePoint { time: string; value: number }
  const [liveRequestBuffer, setLiveRequestBuffer] = useState<LivePoint[]>([])
  const prevRequestsTodayRef = useRef<number | null>(null)
  const liveChartRef = useRef<HTMLDivElement>(null)

  /* Derive current config */
  const timeConfig = RANGE_CONFIG[selectedRange]

  /* Fetch time-series data (single source) */
  const fetchTimeSeries = useCallback(async (wsId: string, config: TimeRangeConfig) => {
    const res = await getTimeSeries(wsId, config.period, config.days)
    setSeries(res.series)
    return res.series
  }, [])

  /* Fetch realtime data */
  const fetchRealtime = useCallback(async (wsId: string) => {
    const data = await getRealtime(wsId)
    setRealtime(data)
    return data
  }, [])

  /* Fetch time-series when workspace or range changes */
  useEffect(() => {
    if (!activeWsId) return
    setDataLoading(true)
    setError(null)
    fetchTimeSeries(activeWsId, timeConfig)
      .then(() => {
        setLastUpdated('Just now')
        setFadeKey((k) => k + 1)
      })
      .catch((err) => {
        console.warn('time-series fetch failed', err)
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => setDataLoading(false))
  }, [activeWsId, selectedRange, fetchTimeSeries])

  /* Initial realtime fetch + rolling buffer + 30s polling */
  useEffect(() => {
    if (!activeWsId) return
    let active = true

    const pollAndBuffer = async () => {
      try {
        const data = await getRealtime(activeWsId)
        if (!active) return
        setRealtime(data)

        /* Build rolling live-request buffer from real delta values */
        const now = new Date()
        const timeStr =
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

        if (prevRequestsTodayRef.current !== null && data.requests_today !== undefined) {
          const delta = Math.max(0, data.requests_today - prevRequestsTodayRef.current)
          setLiveRequestBuffer((prev) => {
            const next = [...prev, { time: timeStr, value: delta }]
            if (next.length > 60) next.shift()
            return next
          })
        }
        prevRequestsTodayRef.current = data.requests_today ?? prevRequestsTodayRef.current

        setLastUpdated('Just now')
      } catch {
        /* silent */
      }
    }

    pollAndBuffer()
    const interval = setInterval(pollAndBuffer, 30000)
    return () => {
      active = false
      clearInterval(interval)
      /* preserve buffer across cleanups */
    }
  }, [activeWsId])

  /* Manual refresh */
  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !activeWsId) return
    setIsRefreshing(true)
    setError(null)
    try {
      await Promise.all([
        fetchTimeSeries(activeWsId, timeConfig),
        fetchRealtime(activeWsId),
      ])
      setLastUpdated('Just now')
      setFadeKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, activeWsId, timeConfig, fetchTimeSeries, fetchRealtime])

  /* Derived analytics values */
  const analytics = useMemo(() => {
    if (series.length === 0) return null

    const totalRequests = series.reduce((sum, s) => sum + (s.requests || 0), 0)
    const totalErrors = series.reduce((sum, s) => sum + (s.errors || 0), 0)
    const totalLatencyMs = series.reduce((sum, s) => sum + (s.avg_latency_ms || 0), 0)
    const avgLatencyMs = series.length > 0 ? totalLatencyMs / series.length : 0
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
    const successCount = totalRequests - totalErrors
    const totalTokens = series.reduce((sum, s) => sum + (s.tokens || 0), 0)

    return {
      totalRequests,
      totalErrors,
      successCount,
      avgLatencyMs,
      errorRate,
      totalTokens,
    }
  }, [series])

  /* Chart data */
  const requestsChartData: TimeSeriesEntry[] = useMemo(
    () => series.map((s) => ({ name: formatTimeSeriesLabel(s.timestamp, timeConfig.period), value: s.requests || 0 })),
    [series, timeConfig.period],
  )

  const latencyChartData: TimeSeriesEntry[] = useMemo(
    () => series.map((s) => ({ name: formatTimeSeriesLabel(s.timestamp, timeConfig.period), value: Math.round(s.avg_latency_ms || 0) })),
    [series, timeConfig.period],
  )

  const errorPieData = useMemo(() => {
    if (!analytics) return []
    return [
      { name: 'Errors', value: analytics.totalErrors, color: '#F43F5E' },
      { name: 'Successful', value: Math.max(analytics.successCount, 0), color: '#22C55E' },
    ]
  }, [analytics])

  /* Sparkline data for stat cards */
  const requestsSparkline = useMemo(
    () => series.map((s) => ({ value: s.requests || 0 })),
    [series],
  )
  const latencySparkline = useMemo(
    () => series.map((s) => ({ value: Math.round(s.avg_latency_ms || 0) })),
    [series],
  )
  const errorSparkline = useMemo(
    () => series.map((s) => {
      const rate = (s.requests || 0) > 0 ? ((s.errors || 0) / (s.requests || 0)) * 100 : 0
      return { value: Math.round(rate * 10) / 10 }
    }),
    [series],
  )

  if (authLoading || !user) return null

  const showLoading = dataLoading && series.length === 0

  return (
    <div className="analytics-page" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Ambient background artwork */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.28, mixBlendMode: 'screen',
        backgroundImage: 'url(/images/bg-network.png)',
        backgroundSize: 'cover', backgroundPosition: 'right center', backgroundRepeat: 'no-repeat',
        filter: 'blur(8px)', WebkitFilter: 'blur(8px)',
        maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
      }} />
      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        {/* PAGE HEADER */}
        <header style={{
          display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 24,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              padding: 10, background: 'linear-gradient(135deg, rgba(45,212,200,0.2), rgba(59,130,246,0.1))',
              border: '1px solid rgba(45,212,200,0.2)', borderRadius: 10, color: '#2dd4c8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconActivity className="" style={{ width: 24, height: 24 }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
                Analytics
              </h1>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '2px 0 0' }}>
                Monitor usage, performance, and errors in real time.
              </p>
            </div>
          </div>

          {/* Header controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{
              background: '#121728', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
              padding: 3, display: 'flex', alignItems: 'center',
            }}>
              {(['24h', '7d', '30d'] as RangeKey[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  style={{
                    padding: '6px 14px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 7,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                    background: selectedRange === range ? '#2dd4c8' : 'transparent',
                    color: selectedRange === range ? '#fff' : '#94A3B8',
                    boxShadow: selectedRange === range ? '0 4px 12px rgba(45,212,200,0.25)' : 'none',
                  }}
                >
                  {range}
                </button>
              ))}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', background: '#121728', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 9, color: '#94A3B8', fontSize: 12, fontWeight: 500,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{getDateRangeLabel(selectedRange)}</span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                padding: 8, background: '#121728', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 9, color: isRefreshing ? '#2dd4c8' : '#94A3B8', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}
              title="Refresh"
            >
              <IconRefreshCw className={isRefreshing ? 'analytics-spin' : ''} style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </header>

        {/* QUICK STATISTICS GRID */}
        <section
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16, marginBottom: 24,
          }}
          key={`stats-${fadeKey}`}
        >
          {/* Total Requests */}
          <div style={{
            background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(45,212,200,0.15)', borderRadius: 12,
            padding: 20, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                Total Requests
                <IconInfo className="" style={{ width: 14, height: 14, color: 'rgba(148,163,184,0.6)' }} title="Total API transactions completed" />
              </span>
              <div style={{ padding: 6, background: 'rgba(45,212,200,0.1)', color: '#2dd4c8', borderRadius: 8, display: 'flex' }}>
                <IconZap className="" style={{ width: 16, height: 16 }} />
              </div>
            </div>
            {showLoading ? (
              <div style={{ height: 38, width: '60%' }} className="analytics-skeleton" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 26, fontWeight: 700, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>
                    {analytics ? analytics.totalRequests.toLocaleString() : '—'}
                  </h3>
                </div>
                {requestsSparkline.length > 0 && (
                  <div style={{ width: 80, height: 36 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={requestsSparkline}>
                        <Line type="monotone" dataKey="value" stroke="#2dd4c8" strokeWidth={1.8} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Avg. Latency */}
          <div style={{
            background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(45,212,200,0.15)', borderRadius: 12,
            padding: 20, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                Avg. Latency
                <IconInfo className="" style={{ width: 14, height: 14, color: 'rgba(148,163,184,0.6)' }} title="Average time taken for server responses" />
              </span>
              <div style={{ padding: 6, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: 8, display: 'flex' }}>
                <IconClock className="" style={{ width: 16, height: 16 }} />
              </div>
            </div>
            {showLoading ? (
              <div style={{ height: 38, width: '60%' }} className="analytics-skeleton" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 26, fontWeight: 700, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>
                    {analytics ? `${Math.round(analytics.avgLatencyMs)} ms` : '—'}
                  </h3>
                </div>
                {latencySparkline.length > 0 && (
                  <div style={{ width: 80, height: 36 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={latencySparkline}>
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={1.8} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Rate */}
          <div style={{
            background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(45,212,200,0.15)', borderRadius: 12,
            padding: 20, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                Error Rate
                <IconInfo className="" style={{ width: 14, height: 14, color: 'rgba(148,163,184,0.6)' }} title="Percentage of requests with status code >= 400" />
              </span>
              <div style={{ padding: 6, background: 'rgba(244,63,94,0.1)', color: '#F43F5E', borderRadius: 8, display: 'flex' }}>
                <IconAlertCircle className="" style={{ width: 16, height: 16 }} />
              </div>
            </div>
            {showLoading ? (
              <div style={{ height: 38, width: '60%' }} className="analytics-skeleton" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 26, fontWeight: 700, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>
                    {analytics ? `${analytics.errorRate.toFixed(2)}%` : '—'}
                  </h3>
                </div>
                {errorSparkline.length > 0 && (
                  <div style={{ width: 80, height: 36 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={errorSparkline}>
                        <Line type="monotone" dataKey="value" stroke="#F43F5E" strokeWidth={1.8} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tokens Consumed */}
          <div style={{
            background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(45,212,200,0.15)', borderRadius: 12,
            padding: 20, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                Tokens Consumed
                <IconInfo className="" style={{ width: 14, height: 14, color: 'rgba(148,163,184,0.6)' }} title="Total LLM tokens processed" />
              </span>
              <div style={{ padding: 6, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', borderRadius: 8, display: 'flex' }}>
                <IconCpu className="" style={{ width: 16, height: 16 }} />
              </div>
            </div>
            {showLoading ? (
              <div style={{ height: 38, width: '60%' }} className="analytics-skeleton" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 26, fontWeight: 700, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>
                    {analytics ? analytics.totalTokens.toLocaleString() : '—'}
                  </h3>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Error state */}
        {error && (
          <div style={{
            padding: '12px 16px', marginBottom: 20, borderRadius: 10,
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
            color: '#FB7185', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* CHARTS ROW 1 */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
          {/* Requests per Day Bar Chart */}
          <div style={{
            background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
            padding: 20, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC', margin: 0 }}>Requests per Day</h3>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
                    Total number of requests over the selected time range.
                  </p>
                </div>
                <span style={{
                  padding: '6px 12px', background: '#121728', border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 12, color: '#F8FAFC', borderRadius: 8, fontWeight: 500,
                }}>
                  Total Requests
                </span>
              </div>
            </div>
            <div style={{ width: '100%', height: 280, marginTop: 12 }} key={`req-${fadeKey}`}>
              {showLoading ? (
                <div style={{ width: '100%', height: '100%' }} className="analytics-skeleton" />
              ) : requestsChartData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
                  No analytics data available for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={requestsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="requestsBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E6F7FF" stopOpacity={1} />
                        <stop offset="30%" stopColor="#B9E7FF" stopOpacity={0.92} />
                        <stop offset="55%" stopColor="#86D3FF" stopOpacity={0.78} />
                        <stop offset="80%" stopColor="#4BB6E6" stopOpacity={0.60} />
                        <stop offset="100%" stopColor="#0F3B57" stopOpacity={0.35} />
                      </linearGradient>
                      <filter id="barBlur">
                        <feGaussianBlur stdDeviation="3.5" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.04)" />
                    <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatYAxis} dx={-5} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.04)' }} />
                    <Bar
                      dataKey="value"
                      name="Requests"
                      fill="url(#requestsBarGradient)"
                      shape={<CustomBarShape />}
                      maxBarSize={32}
                      isAnimationActive={true}
                      animationDuration={700}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Average Latency Area Chart */}
          <div style={{
            background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
            padding: 20, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC', margin: 0 }}>Average Latency (ms)</h3>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
                    Performance telemetry across servers globally.
                  </p>
                </div>
                <span style={{
                  padding: '6px 12px', background: '#121728', border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 12, color: '#F8FAFC', borderRadius: 8, fontWeight: 500,
                }}>
                  Response Time
                </span>
              </div>
            </div>
            <div style={{ width: '100%', height: 280, marginTop: 12 }} key={`lat-${fadeKey}`}>
              {showLoading ? (
                <div style={{ width: '100%', height: '100%' }} className="analytics-skeleton" />
              ) : latencyChartData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
                  No analytics data available for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latencyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="latencyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.28} />
                        <stop offset="30%" stopColor="#3b82f6" stopOpacity={0.16} />
                        <stop offset="70%" stopColor="#2563eb" stopOpacity={0.06} />
                        <stop offset="100%" stopColor="#1e3a5f" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="latencyDotGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                      <linearGradient id="latencyCursorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                        <stop offset="50%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#1e40af" stopOpacity={0} />
                      </linearGradient>
                      <filter id="latencyLineGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.04)" />
                    <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val: number) => `${val}ms`} dx={-5} />
                    <RechartsTooltip cursor={{ stroke: 'url(#latencyCursorGradient)', strokeWidth: 1.5, strokeDasharray: '4 4' }} content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="none"
                      fillOpacity={1}
                      fill="url(#latencyAreaGradient)"
                      tooltipType="none"
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Latency"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      fillOpacity={0}
                      filter="url(#latencyLineGlow)"
                      dot={<CustomLatencyDot />}
                      activeDot={<CustomActiveLatencyDot />}
                      isAnimationActive={true}
                      animationDuration={850}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* CHARTS ROW 2 */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
          {/* Error Rate Donut */}
          <div style={{
            background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
            padding: 20, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ marginBottom: 4 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC', margin: 0 }}>Error Rate & Reliability</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
                Transaction reliability versus API network faults.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center', paddingTop: 12 }} key={`err-${fadeKey}`}>
              {showLoading ? (
                <div style={{ width: 160, height: 160, borderRadius: '50%' }} className="analytics-skeleton" />
              ) : errorPieData.length === 0 || (errorPieData[0]?.value === 0 && errorPieData[1]?.value === 0) ? (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 12 }}>
                  No analytics data available
                </div>
              ) : (
                <>
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: 160, height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            <linearGradient id="successDonutGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#4ADE80" />
                              <stop offset="50%" stopColor="#22C55E" />
                              <stop offset="100%" stopColor="#15803D" />
                            </linearGradient>
                            <linearGradient id="errorDonutGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#FB7185" />
                              <stop offset="50%" stopColor="#F43F5E" />
                              <stop offset="100%" stopColor="#BE123C" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={[{ value: 100 }]}
                            cx="50%" cy="50%" innerRadius={55} outerRadius={70}
                            dataKey="value" fill="rgba(148,163,184,0.08)" stroke="none"
                            isAnimationActive={false}
                          />
                          <Pie
                            data={errorPieData}
                            cx="50%" cy="50%" innerRadius={55} outerRadius={70}
                            paddingAngle={4} dataKey="value"
                            stroke="rgba(255,255,255,0.08)" strokeWidth={1.5}
                            isAnimationActive={true} animationDuration={800} animationEasing="ease-out"
                          >
                            {errorPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.name === 'Errors' ? 'url(#errorDonutGradient)' : 'url(#successDonutGradient)'} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Center text */}
                    <div
                      style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                        borderRadius: '50%',
                      }}
                      className="analytics-donut-center"
                    >
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC', textShadow: '0 0 12px rgba(45,212,200,0.4)' }}>
                        {analytics ? `${analytics.errorRate.toFixed(2)}%` : '—'}
                      </span>
                      <span style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.05em', marginTop: 2 }}>
                        Error Rate
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 3, background: '#F43F5E', boxShadow: '0 0 8px rgba(244,63,94,0.65)' }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', margin: 0 }}>Errors</p>
                        <p style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8', margin: '2px 0 0' }}>
                          {analytics?.totalErrors.toLocaleString() ?? '0'} ({analytics ? `${analytics.errorRate.toFixed(2)}%` : '0%'})
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 3, background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.65)' }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', margin: 0 }}>Successful</p>
                        <p style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8', margin: '2px 0 0' }}>
                          {analytics?.successCount.toLocaleString() ?? '0'} ({analytics ? `${(100 - analytics.errorRate).toFixed(2)}%` : '100%'})
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Live Requests Chart */}
          <div style={{
            background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
            padding: 20, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC', margin: 0 }}>Live Requests (Last 60 Seconds)</h3>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
                  Real-time request activity.
                </p>
              </div>
            </div>

            <div ref={liveChartRef} style={{ width: '100%', height: 180, position: 'relative' }}>
              {liveRequestBuffer.length < 2 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13, flexDirection: 'column', gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  <span>Waiting for realtime request data</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveRequestBuffer} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="liveArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E6F7FF" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#0F3B57" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="verticalTrail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#86D3FF" stopOpacity={0.35} />
                        <stop offset="40%" stopColor="#4BB6E6" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#0F3B57" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.04)" />
                    <XAxis
                      dataKey="time"
                      stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={8}
                      tickFormatter={(val: string, i: number) => {
                        const total = liveRequestBuffer.length
                        if (total <= 5) return val
                        const step = Math.max(1, Math.floor(total / 4))
                        return i % step === 0 ? val : ''
                      }}
                    />
                    <YAxis
                      stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dx={-5}
                      domain={[0, (max: number) => Math.max(Math.ceil(max / 5) * 5, 10)]}
                      tickFormatter={(v: number) => `${v}`}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Requests/sec"
                      stroke="#4BB6E6"
                      strokeWidth={1.2}
                      strokeOpacity={0.25}
                      fillOpacity={1}
                      fill="url(#liveArea)"
                      activeDot={{ r: 5, stroke: '#101524', strokeWidth: 1.5, fill: '#4BB6E6' }}
                      dot={(props: { cx?: number; cy?: number; index?: number }) => {
                        if (props.cx == null || props.cy == null) return null
                        const isLast = props.index === liveRequestBuffer.length - 1
                        return (
                          <g>
                            {isLast && (
                              <>
                                <circle cx={props.cx} cy={props.cy} r={5.5} fill="none" stroke="#4BB6E6" strokeWidth={1} className="live-request-pulse-1" pointerEvents="none" />
                                <circle cx={props.cx} cy={props.cy} r={5.5} fill="none" stroke="#4BB6E6" strokeWidth={1} className="live-request-pulse-2" pointerEvents="none" />
                              </>
                            )}
                            <rect x={props.cx - 2.5} y={props.cy} width={5} height={10} fill="url(#verticalTrail)" opacity={0.14} pointerEvents="none" />
                            <circle cx={props.cx} cy={props.cy} r={7} fill="#4BB6E6" opacity={0.18} pointerEvents="none" />
                            <circle cx={props.cx} cy={props.cy} r={5} fill="#4BB6E6" opacity={0.6} pointerEvents="none" />
                            <circle cx={props.cx} cy={props.cy} r={3.6} fill="#86D3FF" opacity={0.95} pointerEvents="none" />
                            <circle cx={props.cx} cy={props.cy} r={1.3} fill="#FFFFFF" pointerEvents="none" />
                          </g>
                        )
                      }}
                      isAnimationActive={true}
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{
          marginTop: 24, display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)',
          gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            All analytics are based on UTC timezone. Data is refreshed every 30 seconds.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
            <IconRefreshCw className="" style={{ width: 14, height: 14 }} />
            Last updated: {lastUpdated}
          </div>
        </footer>
      </div>
    </div>
  )
}
