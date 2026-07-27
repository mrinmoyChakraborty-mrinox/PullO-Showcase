'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import PullOLoader from '@/components/dashboard/PullOLoader'
import { createClient } from '@/lib/supabase/client'
import WipPopup from '@/components/WipPopup'
import { ActionBar } from '@/components/matos-ui/action-bar'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import AvatarSpringStack from '@/components/ruixen/avatar-spring-stack'
import {
  createWorkspace,
  acceptInvite,
  listNotifications,
  listTeam,
  markNotificationRead,
  markAllNotificationsRead,
  type Workspace,
  type AppNotification,
} from '@/lib/api'
import { useWorkspace, WorkspaceProvider } from '@/lib/workspace-context'
import './dashboard.css'

function timeAgo(date: string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const sec = Math.floor((now - then) / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </WorkspaceProvider>
  )
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((o) => !o)
    setWsMenuOpen(false)
    setSignOutOpen(false)
  }, [])

  const [wipOpen, setWipOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const [wsMenuOpen, setWsMenuOpen] = useState(false)
  const wsBtnRef = useRef<HTMLButtonElement>(null)
  const wsMenuRef = useRef<HTMLDivElement>(null)
  const [wsMembers, setWsMembers] = useState<Record<string, Array<{ src?: string; label: string }>>>({})

  const [wsModalOpen, setWsModalOpen] = useState(false)
  const [wsNameInput, setWsNameInput] = useState('')
  const [wsCreating, setWsCreating] = useState(false)
  const wsInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (wsModalOpen) {
      setWsNameInput('')
      setTimeout(() => wsInputRef.current?.focus(), 50)
    }
  }, [wsModalOpen])

  const toggleWsMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setWsMenuOpen((o) => !o)
  }, [])

  useEffect(() => {
    if (!wsMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (
        wsBtnRef.current && !wsBtnRef.current.contains(e.target as Node) &&
        wsMenuRef.current && !wsMenuRef.current.contains(e.target as Node)
      ) {
        setWsMenuOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [wsMenuOpen])

  const handleCreateWorkspace = useCallback(() => {
    setWsMenuOpen(false)
    setWsModalOpen(true)
  }, [])

  const { activeWsId, setActiveWsId, workspaces, refreshWorkspaces, myRole, loading: wsLoading } = useWorkspace()
  const canManage = myRole === 'owner' || myRole === 'admin'

  const workspaceColors = ['#7C3AED', '#0891B2', '#D97706', '#DC2626', '#059669', '#7C3AED']
  function wsColor(id: string) {
    const i = workspaces.findIndex((w) => w.id === id)
    return workspaceColors[((i % workspaceColors.length) + workspaceColors.length) % workspaceColors.length]
  }

  useEffect(() => {
    if (!wsMenuOpen || workspaces.length === 0) return
    const memberAvatars: Record<string, Array<{ src?: string; label: string }>> = {}
    Promise.all(
      workspaces.map(async (ws) => {
        try {
          const team = await listTeam(ws.id)
          memberAvatars[ws.id] = team.members.map((m) => ({
            src: m.avatar_url || undefined,
            label: m.display_name || m.email || '?',
          }))
        } catch {
          memberAvatars[ws.id] = []
        }
      })
    ).then(() => setWsMembers(memberAvatars))
  }, [wsMenuOpen, workspaces])

  const handleWsCreateConfirm = useCallback(async () => {
    const name = wsNameInput.trim()
    if (!name) return
    setWsCreating(true)
    try {
      await createWorkspace(name)
      await refreshWorkspaces()
      setWsModalOpen(false)
    } catch (err) {
      console.warn('create workspace failed', err)
    } finally {
      setWsCreating(false)
    }
  }, [wsNameInput, refreshWorkspaces])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setSidebarOpen(false)
    }
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const activeWs = workspaces.find((w) => w.id === activeWsId) ?? workspaces[0]

  const isModelDetail = pathname.startsWith('/dashboard/models/') && pathname !== '/dashboard/models'

  const [extDetected, setExtDetected] = useState(false)
  const extPingedRef = useRef(false)

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.source === 'pullo-extension' || event.data?.source === 'pullo-extension-event') {
        setExtDetected(true)
      }
    }
    window.addEventListener('message', handler)

    // Proactively ping the extension — content script responds if loaded
    if (!extPingedRef.current) {
      extPingedRef.current = true
      const requestId = Math.random().toString(36).substring(2)
      const timeout = setTimeout(() => {
        window.removeEventListener('message', pingHandler)
      }, 600)
      const pingHandler = (event: MessageEvent) => {
        if (event.data?.source === 'pullo-extension' && event.data?.requestId === requestId) {
          clearTimeout(timeout)
          setExtDetected(true)
          window.removeEventListener('message', pingHandler)
        }
      }
      window.addEventListener('message', pingHandler)
      window.postMessage({ source: 'pullo-dashboard', action: 'ping', requestId }, '*')
    }

    return () => window.removeEventListener('message', handler)
  }, [])

  /* ── Notifications ── */
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await listNotifications()
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch { }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll every 30s for new notifications
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [notifOpen])

  const handleAcceptInvite = useCallback(async (token: string) => {
    try {
      await acceptInvite(token)
      await fetchNotifications()
      router.push('/dashboard/team')
    } catch (err) {
      console.warn('accept invite failed', err)
    }
  }, [fetchNotifications, router])

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const handleNotifClick = useCallback(async (n: AppNotification) => {
    if (!n.read) {
      await markNotificationRead(n.id)
      setNotifications((prev) => prev.map((p) => p.id === n.id ? { ...p, read: true } : p))
      setUnreadCount((c) => Math.max(0, c - 1))
    }
  }, [])

  const pageTitle = pathname === '/dashboard' ? 'Dashboard'
    : pathname === '/dashboard/models' ? 'Models'
    : pathname === '/dashboard/analytics' ? 'Analytics'
    : pathname === '/dashboard/api-keys' ? 'API Keys'
    : pathname === '/dashboard/mcp' ? 'MCP & Tools'
    : pathname === '/dashboard/logs' ? 'Logs'
    : pathname === '/dashboard/team' ? 'Team'
    : pathname === '/dashboard/profile' ? 'Profile'
    : isModelDetail ? 'Model Details'
    : 'Dashboard'

  const pageDesc = pathname === '/dashboard'
    ? canManage ? 'Overview of your local models and API usage' : 'Overview of workspace models and API usage'
    : pathname === '/dashboard/models'
      ? 'All registered models and their status'
      : pathname === '/dashboard/analytics'
        ? 'Monitor usage, performance, and errors'
      : pathname === '/dashboard/api-keys'
        ? 'Manage API keys for external access'
      : pathname === '/dashboard/mcp'
        ? 'Model Context Protocol connections and custom tools'
      : pathname === '/dashboard/logs'
        ? 'Request and error logs'
      : pathname === '/dashboard/team'
        ? 'Manage your workspace team'
      : pathname === '/dashboard/profile'
        ? 'Manage your personal profile and preferences'
      : isModelDetail
        ? 'View and manage model configuration'
        : ''

  if (authLoading || wsLoading) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <PullOLoader size={200} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="dashboard-page">
      <div className="dash-bg-ambient">
        <div className="dash-ambient-orb dash-orb-1" />
        <div className="dash-ambient-orb dash-orb-2" />
        <div className="dash-ambient-orb dash-orb-3" />
      </div>

      <aside className={`dash-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Image src="/images/pullo-logo.png" alt="PullO" width={32} height={32} style={{ borderRadius: 10, flexShrink: 0 }} />
          <span className="dash-sidebar-label" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em' }}>PullO</span>
        </div>

        <div style={{ padding: '0 12px 16px', position: 'relative', flexShrink: 0 }}>
          <button
            ref={wsBtnRef}
            onClick={toggleWsMenu}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)', cursor: 'pointer', gap: 8, transition: 'all 0.15s',
              color: 'inherit', fontFamily: 'inherit', fontSize: 13,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hi)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <Avatar size="sm" className="shrink-0" style={{ borderRadius: 7 }}>
                {activeWs?.logo_url ? (
                  <AvatarImage src={activeWs.logo_url} alt={activeWs.name} />
                ) : null}
                <AvatarFallback style={{ borderRadius: 7, background: activeWsId ? `linear-gradient(135deg,${wsColor(activeWsId)},${wsColor(activeWsId)}dd)` : 'var(--border)', color: '#fff', fontSize: 10 }}>
                  {activeWs ? activeWs.name.charAt(0).toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>
              <span className="dash-sidebar-label" style={{
                fontSize: 13, fontWeight: 500, color: 'var(--text-hi)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {activeWs ? activeWs.name : 'No workspace'}
              </span>
            </div>
            <svg className="dash-sidebar-label" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} stroke="var(--text-lo)" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div ref={wsMenuRef} className={`dash-ws-menu${wsMenuOpen ? ' open' : ''}`}>
            <div style={{ padding: '10px 14px 6px' }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>Workspaces</span>
            </div>
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="dash-ws-item"
                style={ws.id === activeWsId ? { color: 'var(--text-hi)' } : undefined}
                onClick={() => { setActiveWsId(ws.id); setWsMenuOpen(false) }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                  <Avatar className="shrink-0" style={{ width: 26, height: 26, borderRadius: 7 }}>
                    {ws.logo_url ? (
                      <AvatarImage src={ws.logo_url} alt={ws.name} />
                    ) : null}
                    <AvatarFallback style={{ borderRadius: 7, background: `linear-gradient(135deg,${wsColor(ws.id)},${wsColor(ws.id)}dd)`, color: '#fff', fontSize: 11 }}>
                      {ws.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{ws.name}</span>
                  {ws.id === activeWsId && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
                {wsMembers[ws.id] && wsMembers[ws.id].length > 0 && (
                  <div style={{ marginTop: 6, marginLeft: 36 }}>
                    <AvatarSpringStack
                      avatars={wsMembers[ws.id]}
                      maxVisible={5}
                      size={24}
                    />
                  </div>
                )}
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
            <div className="dash-ws-item" onClick={handleCreateWorkspace} style={{ color: '#A78BFA' }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, border: '1px dashed rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Create Workspace</span>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div className="dash-section-eyebrow">Infrastructure</div>
          {[
            { label: 'Dashboard', icon: 'grid', hover: 'dash-dashboard', href: '/dashboard' },
            { label: 'Models', icon: 'layers', hover: 'dash-models', href: '/dashboard/models' },
            { label: 'API Keys', icon: 'key', hover: 'dash-apikeys', href: '/dashboard/api-keys' },
            { label: 'MCP & Tools', icon: 'puzzle', hover: 'dash-mcp', href: '/dashboard/mcp' },
            { label: 'Team', icon: 'users', hover: 'dash-team', href: '/dashboard/team' },
            { label: 'Logs', icon: 'terminal', hover: 'dash-logs', href: '/dashboard/logs' },
            { label: 'Analytics', icon: 'chart', hover: 'dash-analytics', href: '/dashboard/analytics' },
          ].filter((item) => (canManage || item.label !== 'MCP & Tools') && item.label !== 'Profile').map((item) => {
            const active = item.href === '/dashboard/models'
              ? pathname.startsWith('/dashboard/models')
              : pathname === item.href
            const isWip = item.href === '#'
            const navClass = `dash-nav-item${active ? ' active' : ''}${item.hover ? ` ${item.hover}` : ''}`
            const iconSvg = (
              <svg className="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
                {item.icon === 'grid' && <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>}
                {item.icon === 'layers' && <><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></>}
                {item.icon === 'key' && <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></>}
                {item.icon === 'users' && <><g className="front-person"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></g><g className="back-person"><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path className="back-torso-left" d="M15 15a4 4 0 0 0-3 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></g></>}
                {item.icon === 'terminal' && <><g className="logs-arrow"><polyline points="4 17 10 11 4 5" /></g><line x1="12" y1="19" x2="20" y2="19" /></>}
                {item.icon === 'chart' && <><g className="analytics-bar bar-1"><line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" /></g><g className="analytics-bar bar-2"><line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" /></g><g className="analytics-bar bar-3"><line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" /></g></>}
                {item.icon === 'puzzle' && <><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.611a2.404 2.404 0 0 1-1.704.706 2.404 2.404 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.404 2.404 0 0 1 1.998 12c0-.617.236-1.233.706-1.704L4.315 8.69a.979.979 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61a2.404 2.404 0 0 1 1.704-.706c.617 0 1.233.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.969a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.968 1.02z" /></>}
                {item.icon === 'user' && <><circle className="profile-ring" cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>}
              </svg>
            )
            if (isWip) {
              return (
                <a
                  key={item.label} href="#"
                  className={navClass}
                  onClick={(e) => { e.preventDefault(); setWipOpen(true) }}
                >
                  {iconSvg}
                  <span className="dash-sidebar-label">{item.label}</span>
                </a>
              )
            }
            return (
              <Link key={item.label} href={item.href} className={navClass}>
                {iconSvg}
                <span className="dash-sidebar-label">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: 8, borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Link href="/dashboard/profile" className={`dash-nav-item dash-profile${pathname === '/dashboard/profile' ? ' active' : ''}`}>
            <svg className="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
              <circle className="profile-ring" cx="12" cy="8" r="4" />
              <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
            </svg>
            <span className="dash-sidebar-label">Profile</span>
          </Link>
          {canManage && (
            <Link href="/dashboard/settings" className={`dash-nav-item dash-settings${pathname.startsWith('/dashboard/settings') ? ' active' : ''}`}>
              <svg className="dash-nav-icon settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="dash-sidebar-label">Settings</span>
            </Link>
          )}
          <a href="https://pullo-docs.vercel.app" target="_blank" rel="noopener noreferrer" className="dash-nav-item dash-docs">
            <svg className="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
              <path className="doc-body doc-body-folded" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path className="doc-body doc-body-flat" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2z" />
              <polyline className="doc-fold" points="14 2 14 8 20 8" />
              <g className="doc-line line-1"><line x1="7" y1="8" x2="16" y2="8" strokeLinecap="round" /></g>
              <g className="doc-line line-2"><line x1="7" y1="11" x2="13" y2="11" strokeLinecap="round" /></g>
              <g className="doc-line line-3"><line x1="7" y1="14" x2="15" y2="14" strokeLinecap="round" /></g>
            </svg>
            <span className="dash-sidebar-label">Docs</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 10, marginTop: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: profile?.avatar_url ? 'none' : 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U')}
            </div>
            <div className="dash-sidebar-label" style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-lo)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || ''}
              </div>
            </div>
            <button
              className="dash-sidebar-label"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: 2, borderRadius: 4, transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FB7185')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-lo)')}
              title="Sign out"
              onClick={() => setSignOutOpen(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <g className="signout-arrow"><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></g>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <div className={`dash-main${sidebarOpen ? '' : ' expanded'}`}>
        {!isModelDetail && (
          <>
            {!extDetected && (
            <div className="dash-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>PullO Extension is not detected on this browser.</span>
                  <span style={{ fontSize: 12, color: 'var(--text-md)', marginLeft: 6 }}>Local inference will run in compatibility mode until the extension is connected.</span>
                </div>
              </div>
              <button
                onClick={(e) => { (e.currentTarget.closest('.dash-banner') as HTMLElement)?.remove() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: 4, borderRadius: 6, transition: 'color 0.15s', flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-hi)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-lo)')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            )}

            <div className="dash-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={toggleSidebar}
                  style={{
                    width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-md)', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.color = 'var(--text-hi)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-md)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                <div>
                  <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{pageTitle}</h1>
                  <p style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 1 }}>{pageDesc}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div ref={notifRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setNotifOpen((o) => !o)}
                    style={{
                      position: 'relative', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: notifOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: notifOpen ? 'var(--text-hi)' : 'var(--text-md)', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.color = 'var(--text-hi)' }}
                    onMouseLeave={(e) => { if (!notifOpen) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-md)' } }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <div style={{
                        position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: 9,
                        background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--bg)',
                      }}>{unreadCount > 9 ? '9+' : unreadCount}</div>
                    )}
                  </button>

                  {notifOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 360,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      zIndex: 1000, maxHeight: 420, overflowY: 'auto',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderBottom: '1px solid var(--border)',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            style={{
                              fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none',
                              cursor: 'pointer', padding: 0,
                            }}
                          >Mark all read</button>
                        )}
                      </div>

                      {notifications.length === 0 && (
                        <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-lo)' }}>
                          No notifications yet
                        </div>
                      )}

                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          style={{
                            display: 'flex', gap: 10, padding: '10px 12px',
                            cursor: 'pointer', transition: 'background 0.1s',
                            background: n.read ? 'transparent' : 'rgba(124,58,237,0.06)',
                            borderBottom: '1px solid var(--border)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(124,58,237,0.06)' }}
                        >
                          <div style={{
                            width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0,
                            background: n.read ? 'var(--border)' : 'var(--accent)',
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: 'var(--text-hi)', lineHeight: 1.3 }}>{n.title}</div>
                            {n.body && <div style={{ fontSize: 12, color: 'var(--text-md)', marginTop: 2, lineHeight: 1.3 }}>{n.body}</div>}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                              <span style={{ fontSize: 11, color: 'var(--text-lo)' }}>
                                {timeAgo(n.created_at)}
                              </span>
                              {!n.read && n.type === 'invite' && n.metadata?.invite_token && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAcceptInvite(n.metadata.invite_token!) }}
                                  style={{
                                    fontSize: 11, fontWeight: 600, color: '#fff', background: 'var(--accent)',
                                    border: 'none', borderRadius: 'var(--radius-sm)', padding: '2px 8px',
                                    cursor: 'pointer',
                                  }}
                                >Join</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {children}
      </div>

      {wsModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setWsModalOpen(false)}
        >
          <div
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 600 }}>Create Workspace</h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-lo)' }}>Give your workspace a name.</p>
            <input
              ref={wsInputRef}
              value={wsNameInput}
              onChange={(e) => setWsNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleWsCreateConfirm() }}
              placeholder="e.g. My Models"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-hi)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button
                onClick={() => setWsModalOpen(false)}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-lo)', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleWsCreateConfirm}
                disabled={wsCreating || !wsNameInput.trim()}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: wsCreating || !wsNameInput.trim() ? 'var(--border)' : '#7C3AED', color: wsCreating || !wsNameInput.trim() ? 'var(--text-lo)' : '#fff', fontSize: 13, fontWeight: 600, cursor: wsCreating || !wsNameInput.trim() ? 'not-allowed' : 'pointer' }}
              >
                {wsCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      <WipPopup open={wipOpen} onClose={() => setWipOpen(false)} />
      {signOutOpen && (
        <ActionBar
          subject="Sign out"
          tone="destructive"
          placement="bottomCenter"
          icon={<LogOut className="size-4 text-destructive" aria-hidden />}
          confirmLabel="Sign out"
          confirmLabelLoading="Signing out..."
          cancelLabel="Stay"
          actions={{
            onCancel: () => { setSignOutOpen(false); setSigningOut(false) },
            onConfirm: async () => {
              setSigningOut(true)
              try {
                await createClient().auth.signOut()
              } catch {}
              window.location.href = '/login'
            },
            isLoading: signingOut,
          }}
        />
      )}
    </div>
  )
}
