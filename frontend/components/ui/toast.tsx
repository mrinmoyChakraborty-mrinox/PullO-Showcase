'use client'

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'error' | 'loading'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextType {
  addToast: (msg: string, variant?: ToastVariant) => string
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType>({
  addToast: () => '',
  removeToast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

let toastListeners: Array<(toast: { message: string; variant: ToastVariant }) => void> = []

function emitToast(message: string, variant: ToastVariant) {
  toastListeners.forEach(fn => fn({ message, variant }))
}

export const toast = {
  default: (msg: string) => emitToast(msg, 'default'),
  success: (msg: string) => emitToast(msg, 'success'),
  error: (msg: string) => emitToast(msg, 'error'),
  loading: (msg: string) => emitToast(msg, 'loading'),
  promise: <T,>(promise: Promise<T>, messages: { loading: string; success: string | ((data: T) => string); error: string }) => {
    const loadingToast: ToastItem = { id: Math.random().toString(36).slice(2), message: messages.loading, variant: 'loading' }
    const event = new CustomEvent('toast-add', { detail: loadingToast })
    window.dispatchEvent(event)
    promise.then(
      (data) => {
        const msg = typeof messages.success === 'function' ? messages.success(data) : messages.success
        const event2 = new CustomEvent('toast-remove', { detail: loadingToast.id })
        window.dispatchEvent(event2)
        emitToast(msg, 'success')
      },
      () => {
        const event2 = new CustomEvent('toast-remove', { detail: loadingToast.id })
        window.dispatchEvent(event2)
        emitToast(messages.error, 'error')
      }
    )
  },
}

let toastCounter = 0

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, variant: ToastVariant = 'default', id?: string) => {
    const toastId = id ?? `toast-${++toastCounter}`
    setToasts(prev => [...prev, { id: toastId, message, variant }])
    if (variant !== 'loading') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId))
      }, 3500)
    }
    return toastId
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastItem
      addToast(detail.message, detail.variant, detail.id)
    }
    const removeHandler = (e: Event) => {
      removeToast((e as CustomEvent).detail)
    }
    window.addEventListener('toast-add' as any, handler as any)
    window.addEventListener('toast-remove' as any, removeHandler as any)
    return () => {
      window.removeEventListener('toast-add' as any, handler as any)
      window.removeEventListener('toast-remove' as any, removeHandler as any)
    }
  }, [addToast, removeToast])

  useEffect(() => {
    const handler = ({ message, variant }: { message: string; variant: ToastVariant }) => addToast(message, variant)
    toastListeners.push(handler)
    return () => { toastListeners = toastListeners.filter(fn => fn !== handler) }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all',
            t.variant === 'error' && 'bg-red-950/60 text-red-200 border border-red-500/30',
            t.variant === 'success' && 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/30',
            t.variant === 'loading' && 'bg-zinc-950/60 text-zinc-200 border border-zinc-700/50',
            t.variant === 'default' && 'bg-zinc-950/60 text-zinc-200 border border-zinc-700/50',
          )}
        >
          {t.variant === 'loading' && (
            <svg className="animate-spin size-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {t.variant === 'success' && (
            <svg className="size-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {t.variant === 'error' && (
            <svg className="size-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.5, padding: 2 }}
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      ))}
    </div>
  )
}
