'use client'

import { useState } from 'react'

export function ProfileAvatar({ url, initials }: { url: string | null; initials: string }) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(url) && !failed

  return (
    <div className={`pp-avatar${showImage ? '' : ' pp-avatar--fallback'}`}>
      {showImage ? (
        <img src={url as string} alt="" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </div>
  )
}
