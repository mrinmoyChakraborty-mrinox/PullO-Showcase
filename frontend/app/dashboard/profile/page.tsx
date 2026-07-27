'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getProfile, updateProfile, uploadAvatar, listDevices, type ProfileData, type Device } from '@/lib/api'
import { toast } from '@/components/ui/toast'
import './profile.css'

const CDN_BASE = 'https://runtimeco.qzz.io/images/avatars'

const AVATAR_PRESETS: Record<string, { label: string; url: string; bg: string }> = {
  initials: { label: 'Initials', url: '', bg: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' },
  male: { label: 'Male', url: `${CDN_BASE}/male.png`, bg: 'linear-gradient(135deg,#60a5fa,#2563eb)' },
  female: { label: 'Female', url: `${CDN_BASE}/female.png`, bg: 'linear-gradient(135deg,#f472b6,#ec4899)' },
  robot: { label: 'Robot', url: `${CDN_BASE}/robot.png`, bg: 'linear-gradient(135deg,#a78bfa,#7c3aed)' },
  workspace: { label: 'Organisation', url: `${CDN_BASE}/organisation.png`, bg: 'linear-gradient(135deg,#34d399,#059669)' },
  abstract: { label: 'Abstract', url: `${CDN_BASE}/abstract.png`, bg: 'linear-gradient(135deg,#fbbf24,#d97706)' },
}

export default function ProfilePage() {
  const { user } = useAuth()

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [devicesExpanded, setDevicesExpanded] = useState(false)
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState('/images/avatar.closed.svg')
  const pickerCardRef = useRef<HTMLDivElement>(null)
  const pickerOverlayRef = useRef<HTMLDivElement>(null)
  const libBtnRef = useRef<HTMLButtonElement>(null)
  const iconRef = useRef<HTMLImageElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const bioRef = useRef<HTMLTextAreaElement>(null)
  const bioCountRef = useRef<HTMLSpanElement>(null)
  const firstNameRef = useRef<HTMLInputElement>(null)
  const lastNameRef = useRef<HTMLInputElement>(null)
  const displayNameRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const locationRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : '?'
  const displayName = profileData?.full_name || user?.email?.split('@')[0] || 'User'
  const userEmail = profileData?.email || user?.email || ''
  const currentAvatarUrl = profileData?.avatar_url

  const [devices, setDevices] = useState<Device[]>([])
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [isPublic, setIsPublic] = useState(false)
  const [publicToggling, setPublicToggling] = useState(false)

  useEffect(() => {
    getProfile().then((data) => {
      setProfileData(data)
      setIsPublic((data as any).is_public === true)
      setLoading(false)
    }).catch(() => setLoading(false))

    listDevices().then((data) => {
      const seen = new Set<string>()
      setDevices(data.filter((d) => { const dup = seen.has(d.id); seen.add(d.id); return !dup }))
    }).catch(() => {}).finally(() => setDevicesLoading(false))
  }, [])

  useEffect(() => {
    document.querySelectorAll('.toggle').forEach(t => {
      t.addEventListener('click', () => t.classList.toggle('off'))
    })
  }, [])

  useEffect(() => {
    const bio = bioRef.current
    const count = bioCountRef.current
    if (bio && count) {
      const handler = () => { count.textContent = String(bio.value.length) }
      bio.addEventListener('input', handler)
      return () => bio.removeEventListener('input', handler)
    }
  }, [modalOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pickerOpen) { closeAvatarPicker(); return }
        closeEditProfileModal()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [pickerOpen])

  const openEditProfileModal = useCallback(() => {
    setSelectedAvatarUrl(null)
    setModalOpen(true)
    document.body.style.overflow = 'hidden'
  }, [])

  const closeEditProfileModal = useCallback(() => {
    setModalOpen(false)
    setSelectedAvatarUrl(null)
    document.body.style.overflow = ''
  }, [])

  const toggleAvatarPicker = useCallback(() => {
    if (pickerOpen) closeAvatarPicker()
    else openAvatarPicker()
  }, [pickerOpen])

  const openAvatarPicker = useCallback(() => {
    const card = pickerCardRef.current
    const overlay = pickerOverlayRef.current
    const btn = libBtnRef.current
    const icon = iconRef.current
    if (!card || !overlay || !btn || !icon) return
    const rect = btn.getBoundingClientRect()
    const modalPanel = document.querySelector('.modal-panel')
    if (!modalPanel) return
    const modalRect = modalPanel.getBoundingClientRect()
    card.style.left = (rect.left - modalRect.left - 140 + rect.width / 2) + 'px'
    card.style.top = (rect.bottom - modalRect.top + 8) + 'px'
    card.classList.add('open')
    overlay.classList.add('open')
    btn.classList.add('open')
    icon.style.opacity = '0'
    setTimeout(() => {
      setAvatarSrc('/images/avatar.open.svg')
      icon.style.opacity = '1'
    }, 110)
    setPickerOpen(true)
  }, [])

  const closeAvatarPicker = useCallback(() => {
    const card = pickerCardRef.current
    const overlay = pickerOverlayRef.current
    const btn = libBtnRef.current
    const icon = iconRef.current
    if (!card || !overlay || !btn || !icon) return
    card.classList.remove('open')
    overlay.classList.remove('open')
    btn.classList.remove('open')
    icon.style.opacity = '0'
    setTimeout(() => {
      setAvatarSrc('/images/avatar.closed.svg')
      icon.style.opacity = '1'
    }, 110)
    setPickerOpen(false)
  }, [])

  const selectAvatarPreset = useCallback((type: string) => {
    document.querySelectorAll('.picker-avatar').forEach(a => a.classList.remove('active'))
    const el = document.querySelector(`.picker-avatar[data-type="${type}"]`)
    if (el) el.classList.add('active')
    const preset = AVATAR_PRESETS[type]
    if (!preset) return
    setSelectedAvatarUrl(preset.url || null)
    const preview = previewRef.current
    if (!preview) return
    if (preset.url) {
      preview.style.background = preset.bg
      preview.innerHTML = `<img src="${preset.url}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
    } else {
      preview.style.background = preset.bg
      preview.textContent = initials
    }
    closeAvatarPicker()
  }, [closeAvatarPicker, initials])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const { url } = await uploadAvatar(file)
      setSelectedAvatarUrl(url)
      const preview = previewRef.current
      if (preview) {
        preview.style.background = 'transparent'
        preview.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
      }
    } catch (err) {
      console.error('Avatar upload failed', err)
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  const handleTogglePublic = useCallback(async () => {
    setPublicToggling(true)
    try {
      const updated = await updateProfile({ is_public: !isPublic })
      setProfileData(updated)
      setIsPublic((updated as any).is_public === true)
      if (!isPublic) {
        navigator.clipboard.writeText(`${window.location.origin}/profile/${user?.id}`)
        toast.success('Public profile link copied!')
      }
    } catch (e) {
      toast.error('Failed to update visibility setting')
    } finally {
      setPublicToggling(false)
    }
  }, [isPublic, user?.id])

  const copyProfileLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${user?.id}`)
    toast.success('Profile link copied!')
  }, [user?.id])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const first = firstNameRef.current?.value?.trim() || ''
      const last = lastNameRef.current?.value?.trim() || ''
      const fullName = [first, last].filter(Boolean).join(' ') || null
      const display = displayNameRef.current?.value?.trim() || null
      const bioVal = bioRef.current?.value?.trim() || null
      const locVal = locationRef.current?.value?.trim() || null
      const patch: { full_name?: string | null; avatar_url?: string | null; bio?: string | null; location?: string | null } = {}
      if (fullName) patch.full_name = fullName
      if (display && display !== fullName) patch.full_name = display
      if (selectedAvatarUrl !== null) patch.avatar_url = selectedAvatarUrl
      patch.bio = bioVal
      patch.location = locVal
      const updated = await updateProfile(patch)
      setProfileData(updated)
      closeEditProfileModal()
    } catch (e) {
      console.error('Failed to update profile', e)
    } finally {
      setSaving(false)
    }
  }, [selectedAvatarUrl, closeEditProfileModal])

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  return (
    <>
      <div className="page">
        <div className="hero">
          <div className="hero-avatar" style={currentAvatarUrl ? { background: 'transparent', border: 'none' } : undefined}>
            {currentAvatarUrl
              ? <img src={currentAvatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials
            }
            <div className="cam">📷</div>
          </div>
          <div className="hero-info">
            <h2>{displayName}</h2>
            <div className="hero-meta">
              <span>✉ {userEmail}</span>
              {profileData?.plan && <span className="badge badge-pro">👑 {profileData.plan === 'free' ? 'Free' : `PullO ${profileData.plan.charAt(0).toUpperCase() + profileData.plan.slice(1)}`}</span>}
            </div>
            {profileData?.bio && <div className="hero-bio">{profileData.bio}</div>}
            {profileData?.location && <div className="hero-location">📍 {profileData.location}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignSelf: 'center' }}>
            {isPublic && (
              <button className="btn-ghost" onClick={copyProfileLink} style={{ fontSize: 12 }}>
                🔗 Copy Link
              </button>
            )}
            <button className="btn-primary" onClick={openEditProfileModal}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
              Edit Profile
            </button>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="card-head"><h3>🔒 Security</h3></div>
            <div className="row"><div className="label"><span className="ic">🔑</span>Password</div><div className="value"><span className="chev">›</span></div></div>
            <div className="row"><div className="label"><span className="ic">📧</span>Email</div><div className="value">{userEmail}</div></div>
            <button className="btn-ghost" onClick={() => toast.default('Coming soon')}>Manage Security</button>
          </div>

          <div className="card">
            <div className="card-head"><h3>👑 Current Plan</h3></div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
              {profileData?.plan === 'free' ? 'Free Plan' : `${(profileData?.plan || 'Free').charAt(0).toUpperCase() + (profileData?.plan || 'free').slice(1)} Plan`}
            </div>

            <button className="btn-ghost" onClick={() => toast.default('Coming soon')}>Manage Plan</button>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>🌐 Public Profile</h3>
              <div
                className={`toggle${isPublic ? '' : ' off'}`}
                onClick={() => { if (!publicToggling) handleTogglePublic() }}
                style={{ opacity: publicToggling ? 0.5 : 1, cursor: publicToggling ? 'not-allowed' : 'pointer' }}
              />
            </div>
            <div style={{ padding: '12px 20px 16px', fontSize: 13, color: 'var(--text-lo)', lineHeight: 1.5 }}>
              {isPublic
                ? 'Your profile is publicly visible at your shareable link.'
                : 'Enable this to create a public profile page others can view.'}
            </div>
            {isPublic && (
              <div style={{ padding: '0 20px 16px' }}>
                <button className="btn-ghost" onClick={copyProfileLink} style={{ fontSize: 12 }}>
                  🔗 Copy profile link
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h3>💻 Connected Devices</h3>
              {devicesLoading ? null : devices.length > 2 ? (
                <span className="link" style={{ cursor: 'pointer' }} onClick={() => setDevicesExpanded(v => !v)}>
                  {devicesExpanded ? 'Show less' : 'View all'}
                </span>
              ) : null}
            </div>
            {devicesLoading ? (
              <div style={{ padding: '16px 20px', color: 'var(--text-lo)', fontSize: 13 }}>Loading devices…</div>
            ) : devices.length === 0 ? (
              <div style={{ padding: '16px 20px', color: 'var(--text-lo)', fontSize: 13 }}>No devices connected.</div>
            ) : (
              (() => {
                const visible = devicesExpanded ? devices : devices.slice(0, 2)
                return visible.map((d, i) => {
                  const isActive = d.is_active
                  const tag = i === 0 && isActive ? 'This Device' : isActive ? null : 'Offline'
                  return (
                    <div className="device-card" key={d.id}>
                      <div className={'status-dot ' + (isActive ? 'on' : 'off')}></div>
                      <div className="meta"><b>{d.device_name || 'Extension'}</b><div>Chrome Extension</div></div>
                      {tag && <span className="tag">{tag}</span>}
                    </div>
                  )
                })
              })()
            )}
          </div>

          <div className="card">
            <div className="card-head"><h3>🧩 Extension Status</h3></div>
            <div className="ext-status">
              <div className="ext-icon">🧩</div>
              <div className="ext-meta">
                <div className="live">Connected</div>
                <div className="ext-grid">
                  <div>Version<b>0.4.2</b></div>
                  <div>Last Sync<b>{profileData?.updated_at ? new Date(profileData.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}</b></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'none' }}>
            <div className="card-head"><h3>🔔 Notifications</h3></div>
            <div className="row"><div className="label"><span className="ic">✉</span>Email Notifications</div><div className="toggle"></div></div>
            <div className="row"><div className="label"><span className="ic">🖥</span>Desktop Notifications</div><div className="toggle"></div></div>
            <div className="row"><div className="label"><span className="ic">🧩</span>Extension Notifications</div><div className="toggle"></div></div>
            <div className="row"><div className="label"><span className="ic">✅</span>Weekly Usage Report</div><div className="toggle"></div></div>
            <div className="row"><div className="label"><span className="ic">🔔</span>API Alerts</div><div className="toggle"></div></div>
            <div className="row"><div className="label"><span className="ic">👥</span>Workspace Invites</div><div className="toggle"></div></div>
            <div className="row"><div className="label"><span className="ic">🛡</span>Security Alerts</div><div className="toggle"></div></div>
          </div>

          <div className="card">
            <div className="card-head"><h3>📈 Recent Activity</h3><span className="link">View all</span></div>
            <div className="activity-row"><div className="ic">⚿</div><div className="txt">Account created</div><div className="time">{profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div></div>
            <div className="activity-row"><div className="ic">🔒</div><div className="txt">Profile last updated</div><div className="time">{profileData?.updated_at ? new Date(profileData.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div></div>
          </div>
        </div>
      </div>

      <div className={`modal-overlay${modalOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeEditProfileModal() }}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-header-left">
              <h2>Edit Profile</h2>
              <p>Manage your account information and preferences</p>
            </div>
            <button className="modal-close" onClick={closeEditProfileModal}>&#xD7;</button>
          </div>
          <div className="modal-body">
            <div className="modal-col-left">
              <div className="modal-col-title">Profile Photo</div>
              <div className="avatar-preview-wrap">
                <div className="avatar-preview" ref={previewRef}>
                  {currentAvatarUrl
                    ? <img src={currentAvatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : initials
                  }
                </div>
                <div className="avatar-cam-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                </div>
              </div>
              <div className="btn-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button className="modal-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                  {uploadingAvatar ? 'Uploading…' : 'Upload Photo'}
                </button>
                <button className="avatar-lib-btn" ref={libBtnRef} onClick={toggleAvatarPicker} title="Avatar Library">
                  <img src={avatarSrc} ref={iconRef} width="40" height="42" alt="Avatar" />
                </button>
              </div>
              <button className="modal-remove-btn" onClick={() => {
                setSelectedAvatarUrl(null)
                const preview = previewRef.current
                if (preview) {
                  preview.style.background = 'linear-gradient(135deg,#8b5cf6,#3b82f6)'
                  preview.textContent = initials
                }
              }}>Remove</button>
              <div className="modal-helper-text">PNG, JPG or WEBP • Max 5MB</div>
              <div className="avatar-picker-overlay" ref={pickerOverlayRef} onClick={closeAvatarPicker}></div>
              <div className="avatar-picker-card" ref={pickerCardRef}>
                <div className="picker-header">
                  <h4>Choose Avatar</h4>
                  <p>Select a preset avatar</p>
                </div>
                <div className="picker-grid">
                  {Object.entries(AVATAR_PRESETS).map(([type, preset]) => (
                    <div
                      key={type}
                      className={`picker-avatar${type === 'initials' ? ' active' : ''}`}
                      style={{ background: preset.bg }}
                      data-type={type}
                      onClick={() => selectAvatarPreset(type)}
                    >
                      {preset.url
                        ? <img src={preset.url} alt={preset.label} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        : <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{initials}</span>
                      }
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-col-right">
              <div className="modal-col-title">Personal Information</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>First Name</label>
                  <input className="field-input" ref={firstNameRef} type="text" placeholder="First name" defaultValue={profileData?.full_name?.split(' ')[0] || ''} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input className="field-input" ref={lastNameRef} type="text" placeholder="Last name" defaultValue={profileData?.full_name?.split(' ').slice(1).join(' ') || ''} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Username</label>
                  <div className="username-row">
                    <input className="field-input" ref={usernameRef} type="text" placeholder="username" defaultValue={userEmail.split('@')[0] || ''} />
                    <span className="avail-check">&#x2713;</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Display Name</label>
                  <input className="field-input" ref={displayNameRef} type="text" placeholder="Display name" defaultValue={profileData?.full_name || userEmail.split('@')[0] || ''} />
                </div>
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea className="field-input textarea" ref={bioRef} placeholder="Tell us about yourself…" maxLength={160} defaultValue={profileData?.bio || ''}></textarea>
                <div className="char-counter"><span ref={bioCountRef}>{(profileData?.bio || '').length}</span> / 160</div>
              </div>
              <div className="form-group">
                <label>Location</label>
                <div className="field-input-wrapper">
                  <span className="input-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  </span>
                  <input className="field-input" ref={locationRef} type="text" placeholder="City, Country" defaultValue={profileData?.location || ''} />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <div className="modal-status">
              <span className="dot"></span>
              You have unsaved changes
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={closeEditProfileModal}>Cancel</button>
              <button className="modal-save" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
