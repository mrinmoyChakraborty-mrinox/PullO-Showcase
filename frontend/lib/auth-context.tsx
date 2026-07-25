'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// Helper to send a message to the extension via postMessage
const sendToExtension = (action: string, payload?: any): Promise<any> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const requestId = Math.random().toString(36).substring(2);
    
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.source === 'pullo-extension' && event.data.requestId === requestId) {
        window.removeEventListener('message', handler);
        resolve(event.data.response);
      }
    };
    
    window.addEventListener('message', handler);
    
    window.postMessage({
      source: 'pullo-dashboard',
      action,
      payload,
      requestId
    }, '*');

    // Timeout after 1.5 seconds in case extension isn't running or bridge is missing
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(null);
    }, 1500);
  });
};

export type Profile = {
  user_id: string
  email: string | null
  full_name?: string | null
  avatar_url?: string | null
  plan?: string | null
}

type AuthUser = { id: string; email: string | null; full_name?: string | null }

type AuthContextValue = {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  syncProfile: (accessToken: string) => Promise<Profile | null>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  syncProfile: async () => null,
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const lastSyncedToken = useRef<string | null>(null)
  const syncPromiseRef = useRef<Promise<Profile | null> | null>(null)

  const syncProfile = useCallback(async (accessToken: string): Promise<Profile | null> => {
    if (syncPromiseRef.current) {
      return syncPromiseRef.current
    }
    const promise = (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/sync-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        })
        if (!res.ok) {
          console.warn('session_sync_failed', res.status)
          return null
        }
        const body = await res.json()
        const p: Profile = body.profile
        setProfile(p)
        return p
      } catch (e) {
        console.warn('session_sync_error', e)
        return null
      } finally {
        syncPromiseRef.current = null
      }
    })()
    syncPromiseRef.current = promise
    return promise
  }, [])

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      let { data: sessionData } = await supabase.auth.getSession()

      // If no local session, attempt to restore it from the extension
      if (!sessionData.session) {
        const response = await sendToExtension('auth-get-session');
        if (response && response.session) {
          const { data: setSessionData, error } = await supabase.auth.setSession({
            access_token: response.session.access_token,
            refresh_token: response.session.refresh_token
          });
          if (!error && setSessionData.session) {
            sessionData = { session: setSessionData.session };
          }
        }
      }

      if (!sessionData.session) {
        setUser(null)
        setProfile(null)
        lastSyncedToken.current = null
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const u = { id: userData.user.id, email: userData.user.email ?? null, full_name: userData.user.user_metadata?.full_name ?? null }

        // Re-read session to get the latest token (extension sync cascade may have
        // refreshed the session between getSession() and here)
        const { data: { session: latestSession } } = await supabase.auth.getSession()
        if (!latestSession) {
          setUser(null)
          setProfile(null)
          lastSyncedToken.current = null
          return
        }
        lastSyncedToken.current = latestSession.access_token
        await syncProfile(latestSession.access_token)
        setUser(u)
      }
    } catch (e) {
      console.error('auth_refresh_error', e)
    } finally {
      setLoading(false)
    }
  }, [syncProfile])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Bi-directional Synchronization: Listen to extension changes and dashboard changes
  useEffect(() => {
    // 1. Listen for auth state changes from the extension
    const handleExtensionEvent = async (event: MessageEvent) => {
      if (event.data && event.data.source === 'pullo-extension-event') {
        const { event: type, payload } = event.data;
        const supabase = createClient();
        
        if (type === 'auth-state-changed') {
          const extensionSession = payload.session;
          const { data: localSessionData } = await supabase.auth.getSession();
          
          if (!extensionSession) {
            // Extension logged out -> sign out dashboard
            if (localSessionData.session) {
              lastSyncedToken.current = null;
              await supabase.auth.signOut();
              setUser(null);
              setProfile(null);
            }
          } else {
            // Extension logged in or refreshed -> set dashboard session if different
            if (!localSessionData.session || localSessionData.session.access_token !== extensionSession.access_token) {
              const { data: setSessionData, error } = await supabase.auth.setSession({
                access_token: extensionSession.access_token,
                refresh_token: extensionSession.refresh_token
              });
              if (!error && setSessionData.session) {
                lastSyncedToken.current = setSessionData.session.access_token;
                setUser({ id: setSessionData.session.user.id, email: setSessionData.session.user.email ?? null, full_name: setSessionData.session.user.user_metadata?.full_name ?? null });
                await syncProfile(setSessionData.session.access_token);
              }
            }
          }
        }
      }
    };

    window.addEventListener('message', handleExtensionEvent);

    // 2. Listen to local supabase auth events and push to extension
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (lastSyncedToken.current !== null) {
          lastSyncedToken.current = null;
          await sendToExtension('auth-logout');
          setUser(null);
          setProfile(null);
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session && lastSyncedToken.current !== session.access_token) {
          lastSyncedToken.current = session.access_token;
          setUser({ id: session.user.id, email: session.user.email ?? null, full_name: session.user.user_metadata?.full_name ?? null });
          await sendToExtension('auth-set-session', { session });
          if (event === 'TOKEN_REFRESHED') {
            await syncProfile(session.access_token);
          }
        }
      }
    });

    return () => {
      window.removeEventListener('message', handleExtensionEvent);
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, syncProfile, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
