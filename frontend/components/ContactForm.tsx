'use client'

import React, { useState, useEffect } from 'react'
import { sendContactEmail } from '@/lib/email'
import MagneticButton from '@/components/magnetic-button'

interface ToastState {
  message: string
  type: 'success' | 'error'
}

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const availableTags = ['Installation', 'Performance', 'Documentation', 'Feature Request', 'Bug Report']

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const validate = () => {
    const errs: { name?: string; email?: string; message?: string } = {}
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedMessage = message.trim()

    if (!trimmedName) {
      errs.name = 'Please enter your name'
    }

    if (!trimmedEmail) {
      errs.email = 'Please enter your email address'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address'
    }

    if (!trimmedMessage) {
      errs.message = 'Please enter your message or query'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (submitting) return
    if (!validate()) return

    setSubmitting(true)

    try {
      await sendContactEmail({
        name: name.trim(),
        email: email.trim(),
        rating: rating ? `${rating}/5` : 'Not rated',
        query_type: selectedTags.length > 0 ? selectedTags.join(', ') : 'General',
        message: message.trim(),
      })

      // Show success modal popup
      setShowSuccessModal(true)

      // Reset form to initial state
      handleReset()
    } catch (error) {
      console.error('EmailJS transmission error:', error)
      setToast({
        message: 'Unable to send your message. Please try again.',
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setName('')
    setEmail('')
    setMessage('')
    setRating(null)
    setSelectedTags([])
    setErrors({})
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-left glow-border"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Success Modal Popup */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 p-6 sm:p-8 text-center shadow-2xl transition-all"
            style={{
              background: 'linear-gradient(145deg, rgba(15, 20, 35, 0.95) 0%, rgba(8, 12, 24, 0.98) 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Glowing Icon */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              Thank You for Contacting PullO
            </h3>

            <p className="mt-3 text-sm text-[var(--color-text-soft)] leading-relaxed">
              We have successfully received your message. Our support team is currently reviewing your request and will get back to you as soon as possible.
            </p>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-slate-100 hover:scale-[1.01] active:scale-[0.99] shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-slate-900/90 text-emerald-300'
              : 'border-rose-500/30 bg-slate-900/90 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 flex-shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-white/50 hover:text-white"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label htmlFor="contact-name" className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-soft)] mb-2">
              Your Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              disabled={submitting}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              placeholder="e.g. Alex Morgan"
              className={`w-full rounded-xl border ${
                errors.name ? 'border-rose-500' : 'border-white/10'
              } bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-[var(--color-iris-500)] disabled:opacity-50`}
            />
            {errors.name && <p className="mt-1.5 text-xs text-rose-400">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="contact-email" className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-soft)] mb-2">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              disabled={submitting}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
              }}
              placeholder="alex@company.com"
              className={`w-full rounded-xl border ${
                errors.email ? 'border-rose-500' : 'border-white/10'
              } bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-[var(--color-iris-500)] disabled:opacity-50`}
            />
            {errors.email && <p className="mt-1.5 text-xs text-rose-400">{errors.email}</p>}
          </div>
        </div>

        {/* Experience Rating */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-soft)] mb-2">
            Rate your experience (Optional)
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={submitting}
                onClick={() => setRating(rating === star ? null : star)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-all disabled:opacity-50 ${
                  rating && rating >= star
                    ? 'border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                    : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/70'
                }`}
                aria-label={`Rate ${star} out of 5 stars`}
              >
                ★
              </button>
            ))}
            {rating && (
              <span className="ml-2 text-xs text-amber-300/80 font-medium">
                {rating}/5
              </span>
            )}
          </div>
        </div>

        {/* Feedback Category Tags */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-soft)] mb-2">
            What is your query about? (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  disabled={submitting}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                    active
                      ? 'border-[var(--color-iris-500)] bg-[var(--color-iris-500)]/20 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/90'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="contact-message" className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-soft)]">
              Your Message / Query <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-white/30 font-mono">
              {message.length}/1000
            </span>
          </div>
          <textarea
            id="contact-message"
            rows={4}
            maxLength={1000}
            value={message}
            disabled={submitting}
            onChange={(e) => {
              setMessage(e.target.value)
              if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }))
            }}
            placeholder="Tell us what's working well, features you'd like to see, or any issues you encountered..."
            className={`w-full rounded-xl border ${
              errors.message ? 'border-rose-500' : 'border-white/10'
            } bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-[var(--color-iris-500)] resize-none disabled:opacity-50`}
          />
          {errors.message && <p className="mt-1.5 text-xs text-rose-400">{errors.message}</p>}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <MagneticButton className="w-full">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[var(--color-ink-950)] shadow-lg transition-all duration-200 hover:bg-slate-100 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span>Sending...</span>
              ) : (
                <>
                  <svg className="h-4 w-4 text-[var(--color-ink-950)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3 21l18-9L3 3l3 9zm0 0h75" />
                  </svg>
                  <span>Send Message</span>
                </>
              )}
            </button>
          </MagneticButton>
        </div>
      </form>
    </div>
  )
}
