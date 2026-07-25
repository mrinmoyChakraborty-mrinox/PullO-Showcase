'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LogsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/logs') }, [router])
  return null
}
