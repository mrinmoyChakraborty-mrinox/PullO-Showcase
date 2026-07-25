'use client'

import PullOLoader from '@/components/dashboard/PullOLoader'

export default function DashboardLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#021624',
        width: '100%',
      }}
    >
      <PullOLoader size={200} />
    </div>
  )
}
