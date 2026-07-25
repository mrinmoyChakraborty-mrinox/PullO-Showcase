'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import PullOLoader from '@/components/dashboard/PullOLoader'

function CallbackHandler() {
  const { syncProfile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('Completing sign in...')

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      const redirectTo = searchParams.get('redirect') || '/dashboard'

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage('Something went wrong. Redirecting...')
        setTimeout(() => router.replace('/login?error=auth_failed'), 1500)
        return
      }

      setMessage('Syncing your account...')
      await syncProfile(session.access_token)

      router.replace(redirectTo)
    }

    handleCallback()
  }, [router, searchParams, syncProfile])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
      height: '100vh', background: '#021624',
    }}>
      <PullOLoader size={200} />
      <div style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8', letterSpacing: '0.03em' }}>{message}</div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
        height: '100vh', background: '#021624',
      }}>
        <PullOLoader size={200} />
        <div style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8', letterSpacing: '0.03em' }}>Signing in…</div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
