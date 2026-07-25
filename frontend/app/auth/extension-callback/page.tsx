'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ExtensionCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function sync() {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (!accessToken || !refreshToken) {
        router.replace('/login')
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        console.error('Failed to set session from extension', error)
        router.replace('/login')
        return
      }

      try {
        window.postMessage({
          source: 'pullo-extension-callback',
          action: 'auth-set-session',
          payload: { access_token: accessToken, refresh_token: refreshToken },
        }, '*')
      } catch { }

      router.replace('/dashboard')
    }

    sync()
  }, [router])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#080B14', color: '#94A3B8',
      fontFamily: 'system-ui, sans-serif', fontSize: 16,
    }}>
      Signing in from extension...
    </div>
  )
}
