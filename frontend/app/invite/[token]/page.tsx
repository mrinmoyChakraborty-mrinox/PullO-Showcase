'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { acceptInvite } from '@/lib/api'
import PullOLoader from '@/components/dashboard/PullOLoader'

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  const [status, setStatus] = useState<'checking' | 'signing-in' | 'accepting' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid invite link.')
      return
    }

    async function run() {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        setStatus('signing-in')
        router.replace('/login?redirect=' + encodeURIComponent('/invite/' + token))
        return
      }

      setStatus('accepting')
      try {
        const result = await acceptInvite(token)
        setStatus('success')
        setMessage(`You have joined "${result.workspace_name}"`)
        setTimeout(() => router.replace('/dashboard/team?invite_accepted=1'), 1500)
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Failed to accept invite')
      }
    }

    run()
  }, [token, router])

  const containerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#080B14', color: '#94A3B8',
    fontFamily: 'system-ui, sans-serif', fontSize: 16, flexDirection: 'column', gap: 24,
  }

  if (status === 'checking' || status === 'accepting') {
    return (
      <div style={containerStyle}>
        <PullOLoader size={200} />
        <span>{status === 'checking' ? 'Verifying invite...' : 'Accepting invite...'}</span>
      </div>
    )
  }

  if (status === 'signing-in') {
    return (
      <div style={containerStyle}>
        <span>Redirecting to login...</span>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div style={containerStyle}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{message}</span>
        <span style={{ fontSize: 13 }}>Redirecting to team page...</span>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FB7185" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <span style={{ color: '#E2E8F0', fontWeight: 600 }}>Invite failed</span>
      <span style={{ fontSize: 13, maxWidth: 400, textAlign: 'center' }}>{message}</span>
      <button
        onClick={() => router.push('/dashboard/team')}
        style={{
          marginTop: 8, padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.04)', color: '#E2E8F0', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
        }}
      >
        Go to Team
      </button>
    </div>
  )
}
