'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ApiKeysRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/api-keys') }, [router])
  return null
}
