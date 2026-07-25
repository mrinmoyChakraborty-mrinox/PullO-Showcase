'use client'

import { useEffect, useState } from 'react'
import './WipPopup.css'

interface WipPopupProps {
  open: boolean
  onClose: () => void
}

export default function WipPopup({ open, onClose }: WipPopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
    } else {
      const t = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!visible) return null

  return (
    <div className={`wip-overlay${open ? ' open' : ''}`} onClick={onClose}>
      <div className="wip-toast" onClick={(e) => e.stopPropagation()}>
        <div className="wip-icon">🚧</div>
        <div>
          <div className="wip-title">Work in Progress</div>
          <div className="wip-desc">This page is being built. Check back soon.</div>
        </div>
        <button className="wip-close" onClick={onClose}>×</button>
      </div>
    </div>
  )
}
