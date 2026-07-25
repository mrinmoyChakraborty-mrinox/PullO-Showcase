'use client'

// Pullo Split-Screen Auth Page (Updated)
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import './login.css'

interface LoginPageProps {
  initialMode?: 'login' | 'register'
}

const HERO_SLIDES = [
  {
    id: 0,
    image: '/images/auth-slide-0.svg',
    bgGradient: 'radial-gradient(circle at 20% 20%, rgba(109, 93, 254, 0.45), transparent 60%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.3), transparent 50%), linear-gradient(145deg, #1b1435 0%, #0d0a1a 50%, #06050b 100%)',
    heading: 'Capturing Moments, Creating Memories',
    subtext: 'Turn local AI infrastructure into team superpowers with end-to-end privacy.',
  },
  {
    id: 1,
    image: '/images/auth-slide-1.svg',
    bgGradient: 'radial-gradient(circle at 75% 25%, rgba(56, 189, 248, 0.35), transparent 60%), radial-gradient(circle at 25% 75%, rgba(109, 93, 254, 0.35), transparent 50%), linear-gradient(145deg, #0b1d3a 0%, #090e24 50%, #040612 100%)',
    heading: "Your Local AI. Your Team's API.",
    subtext: 'Zero data leaves your machine with enterprise corporate firewall security.',
  },
  {
    id: 2,
    image: '/images/auth-slide-2.svg',
    bgGradient: 'radial-gradient(circle at 50% 30%, rgba(236, 72, 153, 0.35), transparent 60%), radial-gradient(circle at 80% 90%, rgba(124, 58, 237, 0.35), transparent 50%), linear-gradient(145deg, #280c2e 0%, #12071d 50%, #06030a 100%)',
    heading: 'High Performance, Zero Compromise',
    subtext: 'OpenAI-compatible endpoints running at maximum GPU performance.',
  },
]

export default function LoginPage({ initialMode = 'login' }: LoginPageProps) {
  const { syncProfile } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [registerFirstName, setRegisterFirstName] = useState('')
  const [registerLastName, setRegisterLastName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)

  // Automatic Slide Rotation every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const modeParam = searchParams.get('mode')
      if (modeParam === 'register' || modeParam === 'login') {
        setMode(modeParam)
      }
    }
  }, [])

  const redirectTo = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('redirect') || '/dashboard'
    : '/dashboard'

  const handleLogin = async () => {
    setLoginLoading(true)
    setLoginError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })

    if (error) {
      setLoginError(error.message)
      console.error(error)
      setLoginLoading(false)
      return
    }

    if (data.session?.access_token) {
      await syncProfile(data.session.access_token)

      try {
        window.postMessage({
          source: 'pullo-dashboard',
          action: 'auth-set-session',
          payload: { session: data.session },
        }, '*')
      } catch {
        // Extension not installed — this is fine
      }
    }

    router.replace(redirectTo)
  }

  const handleRegister = async () => {
    if (!agreeTerms) {
      setRegisterError('You must agree to the Terms & Conditions to register.')
      return
    }

    setRegistering(true)
    setRegisterError('')
    const supabase = createClient()
    const fullName = `${registerFirstName} ${registerLastName}`.trim()
    const username = registerFirstName.toLowerCase() || fullName.toLowerCase()

    const { data, error } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
      options: {
        emailRedirectTo: window.location.origin + '/dashboard',
        data: {
          first_name: registerFirstName,
          last_name: registerLastName,
          full_name: fullName,
          username: username,
        },
      },
    })

    if (error) {
      setRegisterError(error.message)
      console.error(error)
      setRegistering(false)
      return
    }

    if (data.session?.access_token) {
      await syncProfile(data.session.access_token)

      try {
        window.postMessage({
          source: 'pullo-dashboard',
          action: 'auth-set-session',
          payload: { session: data.session },
        }, '*')
      } catch {
        // Extension not installed — this is fine
      }

      router.replace(redirectTo)
    } else {
      // Email confirmation required — show confirmation message
      setRegistered(true)
      setRegistering(false)
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    const cbUrl = window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(redirectTo)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: cbUrl,
      },
    })

    if (error) {
      console.error(error)
    }
  }

  const handleAppleLogin = async () => {
    const supabase = createClient()
    const cbUrl = window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(redirectTo)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: cbUrl,
      },
    })

    if (error) {
      console.error('Apple OAuth:', error)
      if (mode === 'login') {
        setLoginError('Apple Sign In is not currently configured.')
      } else {
        setRegisterError('Apple Sign In is not currently configured.')
      }
    }
  }

  const currentSlide = HERO_SLIDES[activeSlide]

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* ================= LEFT PANEL (HERO CAROUSEL) ================= */}
        <div className="auth-hero-panel">
          {/* Animated Background Slides */}
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`auth-slide-bg ${idx === activeSlide ? 'active' : ''}`}
              style={{
                background: `${slide.bgGradient}, url('${slide.image}') center/cover no-repeat`,
              }}
            />
          ))}

          <div className="auth-hero-overlay" />

          {/* Top Row: Logo & Back Button */}
          <div className="auth-hero-top auth-hero-content">
            <div className="auth-brand-logo">
              <Image
                src="/images/pullo-logo.png"
                alt="PullO Logo"
                width={28}
                height={28}
                style={{ borderRadius: 8 }}
              />
              <span>PullO</span>
            </div>

            <Link href="/" className="auth-back-btn">
              Back to website <ArrowRight size={13} />
            </Link>
          </div>

          {/* Bottom Row: Dynamic Slide Text & Interactive Dots */}
          <div className="auth-hero-bottom auth-hero-content">
            <div className="auth-slide-text-container">
              <h1 className="auth-hero-heading">
                {currentSlide.heading}
              </h1>
              <p className="auth-hero-subtext">
                {currentSlide.subtext}
              </p>
            </div>

            {/* Carousel Navigation Dots */}
            <div className="auth-slider-dots">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="auth-dot-btn"
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  <div className={`auth-dot ${idx === activeSlide ? 'active' : 'inactive'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL (FORM AREA) ================= */}
        <div className="auth-form-panel">
          <div className="auth-form-container">
            {registered ? (
              /* ── Post-registration Confirmation ── */
              <div className="auth-confirmation-card">
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                    border: '1px solid rgba(139,92,246,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2">
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22" strokeWidth="1.5" />
                    <path d="M22 2L2 9" strokeWidth="1.5" />
                  </svg>
                </div>
                <h2 className="auth-title">Check your email</h2>
                <p className="auth-subtitle" style={{ maxWidth: 320, textAlign: 'center', marginBottom: 24 }}>
                  We sent a confirmation link to <strong style={{ color: '#E2E8F0' }}>{registerEmail}</strong>. Click the link to activate your account.
                </p>
                <button
                  className="auth-primary-btn"
                  onClick={() => {
                    setRegistered(false)
                    setMode('login')
                  }}
                >
                  Back to Log in
                </button>
              </div>
            ) : mode === 'register' ? (
              /* ── Register Form ── */
              <>
                <h2 className="auth-title">Create an account</h2>
                <p className="auth-subtitle">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-link"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    onClick={() => {
                      setRegisterError('')
                      setMode('login')
                    }}
                  >
                    Log in
                  </button>
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleRegister()
                  }}
                >
                  {/* First Name & Last Name Side by Side */}
                  <div className="auth-grid-2">
                    <div className="auth-input-group">
                      <label className="auth-label" htmlFor="register-first-name">First name</label>
                      <div className="auth-input-wrapper">
                        <input
                          id="register-first-name"
                          type="text"
                          className="auth-input"
                          placeholder="Jane"
                          required
                          value={registerFirstName}
                          onChange={(e) => setRegisterFirstName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="auth-input-group">
                      <label className="auth-label" htmlFor="register-last-name">Last name</label>
                      <div className="auth-input-wrapper">
                        <input
                          id="register-last-name"
                          type="text"
                          className="auth-input"
                          placeholder="Doe"
                          required
                          value={registerLastName}
                          onChange={(e) => setRegisterLastName(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="auth-input-group">
                    <label className="auth-label" htmlFor="register-email">Email</label>
                    <div className="auth-input-wrapper">
                      <input
                        id="register-email"
                        type="email"
                        className="auth-input"
                        placeholder="jane.doe@example.com"
                        required
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password with Eye Toggle */}
                  <div className="auth-input-group">
                    <label className="auth-label" htmlFor="register-password">Password</label>
                    <div className="auth-input-wrapper">
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        className="auth-input auth-input-has-icon"
                        placeholder="••••••••"
                        required
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox: Terms & Conditions */}
                  <div className="auth-checkbox-row">
                    <input
                      id="agree-terms"
                      type="checkbox"
                      className="auth-checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      required
                    />
                    <label className="auth-checkbox-label" htmlFor="agree-terms">
                      I agree to the{' '}
                      <Link href="/terms" className="auth-link">Terms &amp; Conditions</Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="auth-link">Privacy Policy</Link>
                    </label>
                  </div>

                  {registerError && (
                    <div className="auth-error-msg">{registerError}</div>
                  )}

                  {/* Primary CTA */}
                  <button
                    type="submit"
                    className="auth-primary-btn"
                    style={{ marginTop: 12 }}
                    disabled={registering || !agreeTerms}
                  >
                    {registering ? 'Creating account…' : 'Create account'}
                  </button>
                </form>

                {/* Divider */}
                <div className="auth-divider">
                  <div className="auth-divider-line" />
                  <span className="auth-divider-text">Or register with</span>
                  <div className="auth-divider-line" />
                </div>

                {/* OAuth Provider Buttons */}
                <div className="auth-providers-row">
                  <button
                    type="button"
                    className="auth-provider-btn"
                    onClick={handleGoogleLogin}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9c-.4-.9-.6-1.9-.6-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                      />
                    </svg>
                    Google
                  </button>

                  <button
                    type="button"
                    className="auth-provider-btn"
                    onClick={handleAppleLogin}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.65c.66-.8 1.11-1.92.99-3.04-.96.04-2.13.64-2.82 1.44-.61.71-1.15 1.85-.99 2.96 1.07.08 2.16-.54 2.82-1.36z" />
                    </svg>
                    Apple
                  </button>
                </div>
              </>
            ) : (
              /* ── Login Form ── */
              <>
                <h2 className="auth-title">Log in</h2>
                <p className="auth-subtitle">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    className="auth-link"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    onClick={() => {
                      setLoginError('')
                      setMode('register')
                    }}
                  >
                    Sign up
                  </button>
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleLogin()
                  }}
                >
                  {/* Email */}
                  <div className="auth-input-group">
                    <label className="auth-label" htmlFor="login-email">Email</label>
                    <div className="auth-input-wrapper">
                      <input
                        id="login-email"
                        type="email"
                        className="auth-input"
                        placeholder="jane.doe@example.com"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password with Eye Toggle */}
                  <div className="auth-input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="auth-label" htmlFor="login-password">Password</label>
                      <button
                        type="button"
                        className="auth-link"
                        style={{ fontSize: '0.8125rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={(e) => {
                          e.preventDefault()
                          const email = loginEmail.trim()
                          if (!email) {
                            setLoginError('Enter your email first')
                            return
                          }
                          const supabase = createClient()
                          supabase.auth.resetPasswordForEmail(email, {
                            redirectTo: window.location.origin + '/login',
                          }).then(() => {
                            setLoginError('')
                            alert('Password reset link sent to ' + email)
                          }).catch((err) => {
                            setLoginError(err.message)
                          })
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="auth-input-wrapper" style={{ marginTop: 4 }}>
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        className="auth-input auth-input-has-icon"
                        placeholder="••••••••"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="auth-error-msg">{loginError}</div>
                  )}

                  {/* Primary CTA */}
                  <button
                    type="submit"
                    className="auth-primary-btn"
                    style={{ marginTop: 20 }}
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Signing in…' : 'Log in'}
                  </button>
                </form>

                {/* Divider */}
                <div className="auth-divider">
                  <div className="auth-divider-line" />
                  <span className="auth-divider-text">Or log in with</span>
                  <div className="auth-divider-line" />
                </div>

                {/* OAuth Provider Buttons */}
                <div className="auth-providers-row">
                  <button
                    type="button"
                    className="auth-provider-btn"
                    onClick={handleGoogleLogin}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9c-.4-.9-.6-1.9-.6-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                      />
                    </svg>
                    Google
                  </button>

                  <button
                    type="button"
                    className="auth-provider-btn"
                    onClick={handleAppleLogin}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.65c.66-.8 1.11-1.92.99-3.04-.96.04-2.13.64-2.82 1.44-.61.71-1.15 1.85-.99 2.96 1.07.08 2.16-.54 2.82-1.36z" />
                    </svg>
                    Apple
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
