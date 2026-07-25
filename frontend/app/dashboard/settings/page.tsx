'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useWorkspace } from '@/lib/workspace-context'
import {
  getWorkspace,
  renameWorkspace,
  deleteWorkspace,
  listTeam,
  removeMember,
  updateMemberRole,
  revokeInvite,
  uploadWorkspaceLogo,
  updateWorkspaceLogo,
  type TeamMember,
  type PendingInvite,
} from '@/lib/api'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toast'
import './settings.css'

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { activeWsId, refreshWorkspaces } = useWorkspace()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  const [wsNameInput, setWsNameInput] = useState('')
  const [wsHeading, setWsHeading] = useState('')
  const [wsCreatedAt, setWsCreatedAt] = useState('')
  const [wsSlug, setWsSlug] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!activeWsId) return
    setLoading(true)
    Promise.all([
      getWorkspace(activeWsId),
      listTeam(activeWsId),
    ]).then(([ws, team]) => {
      setWsNameInput(ws.name)
      setWsHeading(ws.name)
      setWsCreatedAt(ws.created_at ? new Date(ws.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—')
      setWsSlug(ws.id)
      setLogoUrl(ws.logo_url ?? null)
      setLogoPreview(null)
      setLogoFile(null)
      setMembers(team.members)
      setPendingInvites(team.pending_invites)
    }).catch(() => {
      toast.error('Failed to load workspace settings')
    }).finally(() => setLoading(false))
  }, [activeWsId])

  const saveWorkspaceName = useCallback(async () => {
    if (!activeWsId) return
    const val = wsNameInput.trim()
    if (!val || val === wsHeading) return
    setSaving(true)
    try {
      const updated = await renameWorkspace(activeWsId, val)
      setWsHeading(updated.name)
      setWsNameInput(updated.name)
      await refreshWorkspaces()
      toast.success('Workspace renamed successfully')
    } catch {
      toast.error('Failed to rename workspace')
    } finally {
      setSaving(false)
    }
  }, [activeWsId, wsNameInput, wsHeading, refreshWorkspaces])

  const onLogoSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File exceeds 2MB limit')
      return
    }
    const reader = new FileReader()
    reader.onload = (evt) => {
      setLogoPreview(evt.target?.result as string)
      setLogoFile(file)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const saveLogo = useCallback(async () => {
    if (!activeWsId || !logoFile) return
    toast.promise(
      (async () => {
        const { url } = await uploadWorkspaceLogo(activeWsId, logoFile!)
        await updateWorkspaceLogo(activeWsId, url)
        setLogoUrl(url)
        setLogoPreview(null)
        setLogoFile(null)
        await refreshWorkspaces()
      })(),
      {
        loading: 'Uploading logo…',
        success: 'Logo updated',
        error: 'Failed to upload logo',
      }
    )
  }, [activeWsId, logoFile, refreshWorkspaces])

  const cancelLogoPreview = useCallback(() => {
    setLogoPreview(null)
    setLogoFile(null)
  }, [])

  const removeLogoAction = useCallback(async () => {
    if (!activeWsId) return
    toast.promise(
      (async () => {
        await updateWorkspaceLogo(activeWsId, '')
        setLogoUrl(null)
        setLogoPreview(null)
        setLogoFile(null)
        await refreshWorkspaces()
      })(),
      {
        loading: 'Removing logo…',
        success: 'Logo removed',
        error: 'Failed to remove logo',
      }
    )
  }, [activeWsId, refreshWorkspaces])

  const removeMemberAction = useCallback(async (uid: string, name: string) => {
    if (!activeWsId) return
    if (!window.confirm(`Remove ${name} from this workspace?`)) return
    try {
      await removeMember(activeWsId, uid)
      setMembers(prev => prev.filter(m => m.user_id !== uid))
      toast.success('Member removed')
    } catch {
      toast.error('Failed to remove member')
    }
  }, [activeWsId])

  const handleRoleChange = useCallback(async (uid: string, newRole: 'admin' | 'member') => {
    if (!activeWsId) return
    try {
      await updateMemberRole(activeWsId, uid, newRole)
      setMembers(prev => prev.map(m => m.user_id === uid ? { ...m, role: newRole } : m))
      toast.success(newRole === 'admin' ? 'Upgraded to Admin' : 'Downgraded to Member')
    } catch {
      toast.error('Failed to change role')
    }
  }, [activeWsId])

  const cancelInviteAction = useCallback(async (inviteId: string) => {
    if (!activeWsId) return
    try {
      await revokeInvite(activeWsId, inviteId)
      setPendingInvites(prev => prev.filter(p => p.id !== inviteId))
      toast.success('Invite cancelled')
    } catch {
      toast.error('Failed to cancel invite')
    }
  }, [activeWsId])

  const confirmDeleteWorkspace = useCallback(async () => {
    if (!activeWsId) return
    toast.promise(
      (async () => {
        await deleteWorkspace(activeWsId)
        await refreshWorkspaces()
        setDeleteModalOpen(false)
        router.push('/dashboard')
      })(),
      {
        loading: 'Deleting workspace…',
        success: 'Workspace deleted',
        error: 'Failed to delete workspace',
      }
    )
  }, [activeWsId, refreshWorkspaces, router])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeleteModalOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const nameSaveDisabled = wsNameInput.trim() === '' || wsNameInput.trim() === wsHeading || saving

  if (authLoading || !user) return null

  return (
    <>
      <div className="page">
        <div className="page-head">
          <div className="page-eyebrow">Workspace Settings</div>
          <h1>{wsHeading}</h1>
          <p>Manage your workspace preferences, view access permissions, and manage infrastructure.</p>
        </div>

        {loading ? (
          <div className="stack">
            <div className="card"><div className="skeleton" style={{ height: 140 }} /></div>
            <div className="card"><div className="skeleton" style={{ height: 100 }} /></div>
            <div className="card"><div className="skeleton" style={{ height: 200 }} /></div>
          </div>
        ) : (
          <div className="stack">

            {/* ===== General Information ===== */}
            <div className="card">
              <h3 className="card-title">General Information</h3>
              <p className="card-sub">Basic details and identifiers for this workspace.</p>

              <div className="info-grid">
                <div><div className="k">Workspace ID</div><div className="v">{wsSlug}</div></div>
                <div><div className="k">Created On</div><div className="v" style={{ fontFamily: 'inherit' }}>{wsCreatedAt}</div></div>
              </div>

              <div className="row-flex" style={{ marginBottom: 18 }}>
                <div className="grow">
                  <label className="field-label">Workspace Name</label>
                  <input type="text" className="field-input" value={wsNameInput} onChange={e => setWsNameInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveWorkspaceName() }} />
                </div>
                <button className="btn-primary" onClick={saveWorkspaceName} disabled={nameSaveDisabled}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>

            {/* ===== Workspace Logo ===== */}
            <div className="card">
              <h3 className="card-title">Workspace Logo</h3>
              <p className="card-sub">Displayed across the dashboard and shared invite pages.</p>

              <div className="logo-row">
                <div className="logo-preview">
                  {logoPreview ? <img src={logoPreview} alt="logo" /> : logoUrl ? <img src={logoUrl} alt="logo" /> : wsHeading.charAt(0).toUpperCase()}
                </div>
                <div className="logo-actions">
                  <div className="row">
                    <button className="btn-primary" onClick={() => logoInputRef.current?.click()}>Upload Photo</button>
                    {logoPreview ? (
                      <>
                        <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }} onClick={saveLogo} disabled={logoUploading}>Save</button>
                        <button className="btn-ghost" onClick={cancelLogoPreview}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn-ghost" onClick={removeLogoAction} disabled={!logoUrl}>Remove logo</button>
                    )}
                  </div>
                  <div className="hint">PNG, JPG or WEBP · Max 2MB</div>
                </div>
                <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" style={{ display: 'none' }} onChange={onLogoSelected} />
              </div>
            </div>

            {/* ===== Members ===== */}
            <div className="card">
              <h3 className="card-title">Members</h3>
              <p className="card-sub">Manage who has access to this workspace.</p>

              <div className="table-wrap">
                <table className="members">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.user_id}>
                        <td>
                          <div className="member-cell">
                            <div
                              className="member-av"
                              style={m.avatar_url ? { background: `url(${m.avatar_url}) center/cover`, color: 'transparent' } : {}}
                            >
                              {!m.avatar_url && initials(m.display_name || m.email || '?')}
                            </div>
                            <span className="member-name">{m.display_name || m.email?.split('@')[0] || 'Unknown'} {m.role === 'owner' ? <span className="crown">👑</span> : ''}</span>
                          </div>
                        </td>
                        <td>{m.email || '—'}</td>
                        <td>
                          {m.role === 'owner'
                            ? <span className="role-badge role-owner">👑 Owner</span>
                            : <span className="role-badge" style={{ background: 'rgba(45,212,200,0.1)', color: 'var(--teal)', border: '1px solid rgba(45,212,200,0.3)' }}>{m.role.charAt(0).toUpperCase() + m.role.slice(1)}</span>
                          }
                        </td>
                        <td>{m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                        <td style={{ textAlign: 'right', paddingRight: 20, display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          {m.role !== 'owner' && (
                            <button
                              className="icon-btn-sm-alt"
                              title={m.role === 'admin' ? 'Downgrade to Member' : 'Upgrade to Admin'}
                              onClick={() => handleRoleChange(m.user_id, m.role === 'admin' ? 'member' : 'admin')}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                            </button>
                          )}
                          <button className="icon-btn-sm" title="Remove member" disabled={m.role === 'owner'} onClick={() => removeMemberAction(m.user_id, m.display_name || m.email || 'this member')}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendingInvites.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="member-cell">
                            <div className="member-av" style={{ background: 'var(--bg-panel-2)', color: 'var(--text-dim)', border: '1px dashed var(--border-hi)' }}>···</div>
                            <span className="member-name" style={{ color: 'var(--text-dim)', fontWeight: 500 }}>Invitation sent</span>
                          </div>
                        </td>
                        <td>{p.email}</td>
                        <td><span className="role-badge role-pending">Pending · {p.role.charAt(0).toUpperCase() + p.role.slice(1)}</span></td>
                        <td>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                        <td style={{ textAlign: 'right', paddingRight: 20 }}>
                          <button className="icon-btn-sm" title="Cancel invite" onClick={() => cancelInviteAction(p.id)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== Billing ===== */}
            <div className="card">
              <h3 className="card-title">Billing</h3>
              <p className="card-sub">Coming soon.</p>
            </div>

            {/* ===== Danger Zone ===== */}
            <div className="card danger">
              <h3 className="card-title danger-text">Danger Zone</h3>
              <p className="card-sub">Destructive actions for this workspace. Proceed with caution.</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, padding: 16, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 11 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Delete Workspace</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>Permanently remove this workspace and all its models, API keys, and logs.</div>
                </div>
                <button className="btn-danger" onClick={() => { setDeleteConfirmInput(''); setDeleteModalOpen(true) }}>Delete Workspace</button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ============ DELETE MODAL ============ */}
      <div className={'modal-overlay' + (deleteModalOpen ? ' open' : '')} onClick={e => { if (e.target === e.currentTarget) setDeleteModalOpen(false) }}>
        <div className="modal-panel">
          <div className="mp-head">
            <div className="mp-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
            </div>
            <div><h3>Delete Workspace</h3><div className="mp-sub">This action is irreversible</div></div>
          </div>
          <p>Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{wsHeading}</strong>? All associated models, API keys, and logs will be permanently deleted.</p>
          <label className="field-label">Type <strong style={{ color: 'var(--text)' }}>{wsHeading}</strong> to confirm:</label>
          <input type="text" className="field-input" placeholder="Type workspace name to confirm" value={deleteConfirmInput} onChange={e => setDeleteConfirmInput(e.target.value)} />
          <div className="modal-actions">
            <button className="btn-ghost" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
            <button className="btn-danger" onClick={confirmDeleteWorkspace} disabled={deleteConfirmInput !== wsHeading}>Permanently delete</button>
          </div>
        </div>
      </div>
    </>
  )
}
