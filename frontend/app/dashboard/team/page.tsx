'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useWorkspace } from '@/lib/workspace-context'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  listTeam,
  inviteMember,
  removeMember,
  updateMemberRole,
  revokeInvite,
  type TeamMember,
  type PendingInvite,
} from '@/lib/api'
import WipPopup from '@/components/WipPopup'

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const { activeWsId, workspaces, refreshWorkspaces } = useWorkspace()
  const router = useRouter()
  const searchParams = useSearchParams()

  /* ── WIP popup ── */
  const [wipOpen, setWipOpen] = useState(false)

  const [members, setMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  /* ── Filters ── */
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  /* ── Context menu ── */
  const [openCtxIdx, setOpenCtxIdx] = useState<number | null>(null)
  const ctxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openCtxIdx === null) return
    const handler = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) {
        setOpenCtxIdx(null)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openCtxIdx])

  /* ── Invite modal ── */
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Member')
  const [inviteSending, setInviteSending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  /* ── Toast helper ── */
  const showToast = useCallback((msg: string) => {
    setToast(msg)
  }, [])

  /* ── Load team data when workspace changes or after invite acceptance ── */
  useEffect(() => {
    if (!activeWsId) return
    setDataLoading(true)
    setDataError(null)
    listTeam(activeWsId)
      .then((data) => {
        setMembers(data.members || [])
        setPendingInvites(data.pending_invites || [])
      })
      .catch((err) => {
        console.warn('failed to load team data', err)
        setDataError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => setDataLoading(false))
    if (searchParams.get('invite_accepted') === '1') {
      refreshWorkspaces()
    }
  }, [activeWsId, searchParams])

  const activeWs = workspaces.find((w) => w.id === activeWsId) ?? workspaces[0]

  /* ── Determine current user's role ── */
  const currentMember = members.find((m) => m.user_id === user?.id)
  const isOwnerOrAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin'

  /* ── Invite handler ── */
  const handleSendInvite = useCallback(async () => {
    const email = inviteEmail.trim()
    if (!email || !activeWsId) return
    setInviteSending(true)
    try {
      await inviteMember(activeWsId, email, inviteRole.toLowerCase())
      setInviteModalOpen(false)
      setInviteEmail('')
      showToast(`Invitation sent to ${email}`)
      const data = await listTeam(activeWsId)
      setMembers(data.members || [])
      setPendingInvites(data.pending_invites || [])
    } catch (err) {
      console.warn('invite failed', err)
      showToast('Failed to send invite')
    } finally {
      setInviteSending(false)
    }
  }, [inviteEmail, inviteRole, activeWsId, showToast])

  /* ── Remove member handler ── */
  const handleRemoveMember = useCallback(async (targetUserId: string) => {
    if (!activeWsId) return
    try {
      await removeMember(activeWsId, targetUserId)
      setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId))
      showToast('Member removed')
    } catch (err) {
      console.warn('remove member failed', err)
      showToast('Failed to remove member')
    }
  }, [activeWsId, showToast])

  /* ── Role change handler ── */
  const handleRoleChange = useCallback(async (targetUserId: string, newRole: 'admin' | 'member') => {
    if (!activeWsId) return
    try {
      await updateMemberRole(activeWsId, targetUserId, newRole)
      setMembers((prev) => prev.map((m) => m.user_id === targetUserId ? { ...m, role: newRole } : m))
      showToast(`Member ${newRole === 'admin' ? 'upgraded to Admin' : 'downgraded to Member'}`)
    } catch (err) {
      console.warn('role change failed', err)
      showToast('Failed to change role')
    }
  }, [activeWsId, showToast])

  /* ── Revoke invite handler ── */
  const handleRevokeInvite = useCallback(async (inviteId: string) => {
    if (!activeWsId) return
    try {
      await revokeInvite(activeWsId, inviteId)
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId))
      showToast('Invitation revoked')
    } catch (err) {
      console.warn('revoke invite failed', err)
      showToast('Failed to revoke invite')
    }
  }, [activeWsId, showToast])

  /* ── Filtered members ── */
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase()
    if (q && !m.user_id.toLowerCase().includes(q) && !(m.email || '').toLowerCase().includes(q)) return false
    if (roleFilter && m.role !== roleFilter) return false
    if (statusFilter === 'active' && !m.created_at) return false
    if (statusFilter === 'inactive' && m.created_at) return false
    return true
  })

  /* ── Avatar initials ── */
  function avatarInitials(email?: string, userId?: string) {
    const str = email || userId || '?'
    const parts = str.split(/[@._-]/)
    if (parts.length >= 2) {
      return (parts[0][0] + (parts[1][0] || '')).toUpperCase()
    }
    return str.slice(0, 2).toUpperCase()
  }

  function avatarColor(userId: string) {
    const colors = [
      'linear-gradient(135deg,#7C3AED,#4F46E5)',
      'linear-gradient(135deg,#0891B2,#0E7490)',
      'linear-gradient(135deg,#D97706,#B45309)',
      'linear-gradient(135deg,#DC2626,#B91C1C)',
      'linear-gradient(135deg,#059669,#047857)',
    ]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  if (authLoading || !user) return null

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Background Artwork */}
      <div className="dash-bg-ambient" style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.28, mixBlendMode: 'screen',
        backgroundImage: 'url(/images/bg-network.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(8px)', WebkitFilter: 'blur(8px)',
        maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
      }} />
    <div style={{ padding: '28px 28px 60px', maxWidth: 1400, position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
              {currentMember?.role !== 'member' ? 'Manage your team' : 'View your team'}
            </h1>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '2px 0 0' }}>
              {currentMember?.role !== 'member' ? 'Invite, remove, and manage team members and their roles.' : 'View team members and their roles in this workspace.'}
            </p>
          </div>
          {/* Stat cards */}
          <div
            className="dash-fade-up dash-delay-1"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginBottom: 28,
            }}
          >
            {/* Plan */}
            <div className="dash-card dash-card-lift" style={{ padding: 20, cursor: 'default' }}>
              <div className="dash-metric-glow" style={{ background: 'var(--rose)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>Plan</div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FB7185" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-hi)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Free Plan</div>
              <div style={{ fontSize: 11, color: '#34D399', marginTop: 5, fontWeight: 600 }}>Active</div>
            </div>

            {/* Total Members */}
            <div className="dash-card dash-card-lift" style={{ padding: 20, cursor: 'default' }}>
              <div className="dash-metric-glow" style={{ background: 'var(--cyan)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>Total Members</div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-hi)', letterSpacing: '-0.03em', lineHeight: 1 }}>{members.length}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-lo)', marginTop: 5 }}>Across all roles</div>
            </div>

            {/* Pending Invites */}
            {currentMember?.role !== 'member' && (
              <div className="dash-card dash-card-lift" style={{ padding: 20, cursor: 'default' }}>
                <div className="dash-metric-glow" style={{ background: 'var(--amber)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>Pending Invites</div>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-hi)', letterSpacing: '-0.03em', lineHeight: 1 }}>{pendingInvites.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-lo)', marginTop: 5 }}>Awaiting acceptance</div>
              </div>
            )}

            {/* Active Models */}
            <div className="dash-card dash-card-lift" style={{ padding: 20, cursor: 'default' }}>
              <div className="dash-metric-glow" style={{ background: 'var(--emerald)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>Active Models</div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-hi)', letterSpacing: '-0.03em', lineHeight: 1 }}>—</div>
              <div style={{ fontSize: 11, color: 'var(--text-lo)', marginTop: 5 }}>Deployed in workspace</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="dash-fade-up dash-delay-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            {isOwnerOrAdmin ? (
              <button
                className="dash-btn-primary"
                onClick={() => setInviteModalOpen(true)}
                style={{ padding: '10px 18px', fontSize: 13, borderRadius: 'var(--radius-sm)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                Invite Member
              </button>
            ) : (
              <div />
            )}
            <button
              className="dash-btn-ghost"
              onClick={() => {
                if (!activeWsId) return
                setDataLoading(true)
                listTeam(activeWsId)
                  .then((data) => {
                    setMembers(data.members || [])
                    setPendingInvites(data.pending_invites || [])
                  })
                  .catch((err) => {
                    console.warn('refresh failed', err)
                    showToast('Failed to refresh')
                  })
                  .finally(() => setDataLoading(false))
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={dataLoading ? { animation: 'spin 0.6s linear' } : undefined}>
                <path d="M1 4v6h6" />
                <path d="M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Loading state */}
          {dataLoading && members.length === 0 && (
            <div className="dash-card" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
              <div style={{ fontSize: 14, color: 'var(--text-md)' }}>Loading team data…</div>
            </div>
          )}

          {/* Error state */}
          {dataError && (
            <div className="dash-card" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 600, margin: '0 auto 24px' }}>
              <div style={{ fontSize: 14, color: '#FB7185', fontWeight: 600, marginBottom: 4 }}>Failed to load team data</div>
              <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>{dataError}</div>
            </div>
          )}

          {/* Empty state - no members yet */}
          {!dataLoading && !dataError && members.length === 0 && (
            <div className="dash-card" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 500, margin: '0 auto 24px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="1.5" style={{ opacity: 0.35, marginBottom: 16 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-md)', marginBottom: 4 }}>No team members yet</div>
              <div style={{ fontSize: 12, color: 'var(--text-lo)', lineHeight: 1.5, marginBottom: 16 }}>
                {isOwnerOrAdmin
                  ? 'Invite your teammates to collaborate on this workspace.'
                  : 'There are no members in this workspace yet.'}
              </div>
              {isOwnerOrAdmin && (
                <button
                  className="dash-btn-primary"
                  onClick={() => setInviteModalOpen(true)}
                  style={{ padding: '10px 18px', fontSize: 13, borderRadius: 'var(--radius-sm)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                  Invite Member
                </button>
              )}
            </div>
          )}

          {/* Members table */}
          {!dataLoading && !dataError && members.length > 0 && (
            <>
              <div className="dash-card dash-fade-up dash-delay-3" style={{ overflow: 'hidden', marginBottom: 24 }}>
                {/* Table header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>Members</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 99, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 11, fontWeight: 600, color: '#A78BFA' }}>{members.length} total</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Tab bar */}
                    <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
                      {(['all', 'active', 'inactive'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setStatusFilter(tab)}
                          style={{
                            padding: '7px 16px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 13,
                            fontWeight: 500,
                            color: statusFilter === tab ? '#C4B5FD' : 'var(--text-lo)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            border: 'none',
                            background: statusFilter === tab ? 'rgba(124,58,237,0.15)' : 'transparent',
                            fontFamily: 'inherit',
                            textTransform: 'capitalize',
                          }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                      <input
                        type="text"
                        placeholder="Search members…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '7px 12px 7px 30px',
                          fontSize: 12,
                          color: 'var(--text-hi)',
                          outline: 'none',
                          width: 190,
                          fontFamily: 'inherit',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                      />
                    </div>
                    {/* Role filter */}
                    <div style={{ position: 'relative' }}>
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        style={{
                          appearance: 'none',
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '7px 28px 7px 12px',
                          fontSize: 12,
                          color: 'var(--text-hi)',
                          outline: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                      >
                        <option value="">All Roles</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="dash-data-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', paddingLeft: 24 }}>Member</th>
                        <th style={{ textAlign: 'left' }}>Role</th>
                        <th style={{ textAlign: 'left' }}>Status</th>
                        <th style={{ textAlign: 'left' }}>Last Active</th>
                        <th style={{ textAlign: 'left' }}>Joined</th>
                        <th style={{ textAlign: 'right', paddingRight: 24 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((m, idx) => (
                        <tr key={m.user_id}>
                          <td style={{ paddingLeft: 24 }}>
                            <Link href={`/profile/${m.user_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  background: m.avatar_url ? `url(${m.avatar_url}) center/cover` : avatarColor(m.user_id),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: '#fff',
                                  flexShrink: 0,
                                  border: '1.5px solid rgba(255,255,255,0.1)',
                                }}
                              >
                                {!m.avatar_url && avatarInitials(m.display_name || m.email, m.user_id)}
                              </div>
                              <div>
                                {m.display_name ? (
                                  <>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>
                                      {m.display_name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-lo)', fontFamily: "'Geist Mono', 'Geist Mono Fallback', monospace", marginTop: 1 }}>
                                      {m.email || m.user_id}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>
                                    {m.email || m.user_id.slice(0, 8)}
                                  </div>
                                )}
                              </div>
                            </div>
                            </Link>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '3px 10px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                ...(m.role === 'owner'
                                  ? { background: 'rgba(124,58,237,0.14)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.25)' }
                                  : m.role === 'admin'
                                  ? { background: 'rgba(6,182,212,0.1)', color: '#22D3EE', border: '1px solid rgba(6,182,212,0.2)' }
                                  : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-md)', border: '1px solid var(--border-hi)' }),
                              }}
                            >
                              {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '3px 9px',
                                borderRadius: 99,
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                background: 'rgba(16,185,129,0.1)',
                                color: '#34D399',
                                border: '1px solid rgba(16,185,129,0.2)',
                              }}
                            >
                              <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: '#34D399', boxShadow: '0 0 5px #34D399' }} />
                              Active
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, color: 'var(--text-md)' }}>—</span>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>
                              {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}
                            </span>
                          </td>
                          <td style={{ paddingRight: 24 }}>
                            {isOwnerOrAdmin && m.user_id !== user?.id && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, position: 'relative' }}>
                                <button
                                  className="dash-icon-btn"
                                  style={{
                                    width: 30,
                                    height: 30,
                                    background: 'transparent',
                                    border: '1px solid transparent',
                                    borderRadius: 7,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-lo)',
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                                    e.currentTarget.style.borderColor = 'var(--border-hi)'
                                    e.currentTarget.style.color = 'var(--text-hi)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent'
                                    e.currentTarget.style.borderColor = 'transparent'
                                    e.currentTarget.style.color = 'var(--text-lo)'
                                  }}
                                  onClick={() => setOpenCtxIdx(openCtxIdx === idx ? null : idx)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></svg>
                                </button>
                                {openCtxIdx === idx && (
                                  <div
                                    ref={ctxRef}
                                    style={{
                                      position: 'absolute',
                                      right: 0,
                                      top: 'calc(100% + 4px)',
                                      background: 'rgba(10,14,26,0.98)',
                                      backdropFilter: 'blur(20px)',
                                      border: '1px solid var(--border-hi)',
                                      borderRadius: 'var(--radius-md)',
                                      boxShadow: '0 16px 50px rgba(0,0,0,0.6)',
                                      zIndex: 80,
                                      minWidth: 160,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {m.role !== 'owner' && (
                                      <>
                                        <div
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '9px 14px',
                                            fontSize: 13,
                                            color: 'var(--text-hi)',
                                            cursor: 'pointer',
                                            transition: 'all 0.1s',
                                          }}
                                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                          onClick={() => {
                                            setOpenCtxIdx(null)
                                            handleRoleChange(m.user_id, m.role === 'admin' ? 'member' : 'admin')
                                          }}
                                        >
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                                          {m.role === 'admin' ? 'Downgrade to Member' : 'Upgrade to Admin'}
                                        </div>
                                        <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
                                      </>
                                    )}
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '9px 14px',
                                        fontSize: 13,
                                        color: '#FB7185',
                                        cursor: 'pointer',
                                        transition: 'all 0.1s',
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244,63,94,0.1)')}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                      onClick={() => {
                                        setOpenCtxIdx(null)
                                        handleRemoveMember(m.user_id)
                                      }}
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="22" y2="13" /><line x1="22" y1="8" x2="17" y2="13" /></svg>
                                      Remove Member
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>Showing {filteredMembers.length} of {members.length} members</span>
                </div>
              </div>

              {/* Pending Invitations */}
              {pendingInvites.length > 0 && (
                <div className="dash-fade-up dash-delay-4" style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.01em' }}>Pending Invitations</h2>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 99, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', fontSize: 11, fontWeight: 600, color: '#FCD34D' }}>{pendingInvites.length} pending</span>
                  </div>

                  <div className="dash-card" style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="dash-data-table">
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', paddingLeft: 24 }}>Email</th>
                            <th style={{ textAlign: 'left' }}>Invited By</th>
                            <th style={{ textAlign: 'left' }}>Role</th>
                            <th style={{ textAlign: 'left' }}>Sent</th>
                            <th style={{ textAlign: 'left' }}>Expires</th>
                            <th style={{ textAlign: 'left' }}>Status</th>
                            <th style={{ textAlign: 'right', paddingRight: 24 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {pendingInvites.map((inv) => (
                            <tr key={inv.id}>
                              <td style={{ paddingLeft: 24 }}>
                                <span style={{ fontFamily: "'Geist Mono', 'Geist Mono Fallback', monospace", fontSize: 12, color: 'var(--text-hi)' }}>{inv.email}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>—</span>
                              </td>
                              <td>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '3px 10px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    ...(inv.role === 'admin'
                                      ? { background: 'rgba(6,182,212,0.1)', color: '#22D3EE', border: '1px solid rgba(6,182,212,0.2)' }
                                      : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-md)', border: '1px solid var(--border-hi)' }),
                                  }}
                                >
                                  {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>
                                  {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>—</span>
                              </td>
                              <td>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '3px 9px',
                                    borderRadius: 99,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    background: 'rgba(245,158,11,0.1)',
                                    color: '#FCD34D',
                                    border: '1px solid rgba(245,158,11,0.2)',
                                  }}
                                >
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: '#FCD34D' }} />
                                  Pending
                                </span>
                              </td>
                              <td style={{ paddingRight: 24 }}>
                                {isOwnerOrAdmin && (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                    <button
                                      onClick={async (e) => {
                                        const btn = e.currentTarget
                                        btn.disabled = true
                                        const orig = btn.textContent
                                        try {
                                          await inviteMember(activeWsId!, inv.email, inv.role)
                                          btn.textContent = 'Sent!'
                                          btn.style.color = '#34D399'
                                          btn.style.borderColor = 'rgba(52,211,153,0.3)'
                                          btn.style.background = 'rgba(16,185,129,0.1)'
                                          setTimeout(() => {
                                            btn.textContent = orig
                                            btn.style.color = ''
                                            btn.style.borderColor = ''
                                            btn.style.background = ''
                                            btn.disabled = false
                                          }, 2000)
                                        } catch {
                                          btn.textContent = 'Failed'
                                          btn.disabled = false
                                          setTimeout(() => { btn.textContent = orig }, 1500)
                                        }
                                      }}
                                      style={{
                                        background: 'rgba(124,58,237,0.1)',
                                        border: '1px solid rgba(124,58,237,0.25)',
                                        borderRadius: 6,
                                        padding: '4px 10px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: '#A78BFA',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)' }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)' }}
                                    >
                                      Resend
                                    </button>
                                    <button
                                      onClick={() => handleRevokeInvite(inv.id)}
                                      style={{
                                        background: 'rgba(244,63,94,0.08)',
                                        border: '1px solid rgba(244,63,94,0.2)',
                                        borderRadius: 6,
                                        padding: '4px 10px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: '#FB7185',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.18)' }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)' }}
                                    >
                                      Revoke
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      {/* ═══════ INVITE MODAL ═══════ */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          opacity: inviteModalOpen ? 1 : 0,
          pointerEvents: inviteModalOpen ? 'all' : 'none',
          transition: 'opacity 0.2s ease',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setInviteModalOpen(false)
        }}
      >
        <div
          style={{
            background: 'rgba(10,13,24,0.98)',
            border: '1px solid var(--border-hi)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px var(--border)',
            transform: inviteModalOpen ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
            transition: 'transform 0.2s ease',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.2))', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-hi)' }}>Invite Team Member</h3>
            </div>
            <button
              onClick={() => setInviteModalOpen(false)}
              style={{
                width: 28,
                height: 28,
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: 7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-lo)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.borderColor = 'var(--border-hi)'
                e.currentTarget.style.color = 'var(--text-hi)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.color = 'var(--text-lo)'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-md)', marginBottom: 6, textTransform: 'uppercase' }}>Email Address</div>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendInvite() }}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-hi)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: 13,
                  color: 'var(--text-hi)',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            {/* Role */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-md)', marginBottom: 6, textTransform: 'uppercase' }}>Role</div>
              <div style={{ position: 'relative' }}>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-hi)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontSize: 13,
                    color: 'var(--text-hi)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <option value="Member">Member — Can use models, view keys</option>
                  <option value="Admin">Admin — Can manage keys and members</option>
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
              </div>
            </div>

            {/* Role description */}
            <div style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <p style={{ fontSize: 12, color: 'var(--text-md)', lineHeight: 1.5 }}>Members can access assigned models and view usage. They cannot manage team settings, billing, or create API keys.</p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border)', marginTop: 4 }}>
              <button
                className="dash-btn-ghost"
                onClick={() => setInviteModalOpen(false)}
                style={{ padding: '9px 14px', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                className="dash-btn-primary"
                onClick={handleSendInvite}
                disabled={inviteSending || !inviteEmail.trim()}
                style={{
                  padding: '9px 14px',
                  fontSize: 13,
                  borderRadius: 'var(--radius-sm)',
                  opacity: inviteSending || !inviteEmail.trim() ? 0.6 : 1,
                  cursor: inviteSending || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                {inviteSending ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* ═══════ TOAST ═══════ */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 200,
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10,
            padding: '12px 18px',
            fontSize: 13,
            fontWeight: 600,
            color: '#34D399',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            animation: 'dash-fade-up-in 0.25s ease forwards',
          }}
        >
          {toast}
        </div>
      )}
      <WipPopup open={wipOpen} onClose={() => setWipOpen(false)} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
