import type { Metadata } from 'next'
import { ProfileAvatar } from './avatar'
import NotFoundContent from '@/components/NotFoundContent'
import '../../404/404.css'
import './public-profile.css'

// Status can change at any time (user toggles is_public off), so don't
// let this be statically cached at build time.
export const dynamic = 'force-dynamic'

interface PublicProfile {
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  created_at: string | null
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

async function fetchPublicProfile(id: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public/profile/${id}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null // covers 404 (not found or opted out) uniformly
    return (await res.json()) as PublicProfile
  } catch (err) {
    // Same rendered outcome as a 404 for enumeration-safety reasons, but
    // this branch means the request itself failed (network/5xx/parse) —
    // worth surfacing to error tracking so it doesn't look identical to
    // a normal opt-out in your metrics. Wire to Sentry/whatever the
    // frontend already uses, e.g.:
    //   Sentry.captureException(err, { tags: { route: 'public-profile' } })
    console.error('public_profile_fetch_failed', id, err)
    return null
  }
}

function initialsFor(name: string | null) {
  return (
    (name || '?')
      .split(/\s+/)
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const profile = await fetchPublicProfile(id)

  if (!profile) {
    return {
      title: 'Profile not found — PullO',
      robots: { index: false, follow: false },
    }
  }

  const name = profile.full_name || 'PullO user'
  return {
    title: `${name} — PullO`,
    description: profile.bio || `${name}'s public profile on PullO.`,
    robots: { index: true, follow: true },
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await fetchPublicProfile(id)

  if (!profile) {
    return <NotFoundContent />
  }

  const initials = initialsFor(profile.full_name)

  return (
    <div className="pp-page">
      <div className="pp-card">
        <ProfileAvatar url={profile.avatar_url} initials={initials} />

        <h1 className="pp-name">{profile.full_name || 'Anonymous'}</h1>

        {profile.location && <div className="pp-location">📍 {profile.location}</div>}

        {profile.bio && <p className="pp-bio">{profile.bio}</p>}

        {profile.created_at && (
          <div className="pp-since">
            Member since{' '}
            {new Date(profile.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })}
          </div>
        )}
      </div>
    </div>
  )
}