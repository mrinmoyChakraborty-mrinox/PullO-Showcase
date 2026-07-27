'use client'

// Pullo Split-Screen Auth Page (Updated with Google Auth & Back to PullO branding)
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Sparkles, Cpu, Zap, Layers, Server, ShieldCheck, Key, Users, Activity, Lock, TrendingUp, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import './login.css'

interface LoginPageProps {
  initialMode?: 'login' | 'register'
}

const HERO_SLIDES = [
  {
    id: 0,
    image: '/images/first.png',
    bgGradient: 'linear-gradient(180deg, rgba(15, 12, 36, 0.2) 0%, rgba(5, 3, 11, 0.65) 100%)',
    heading: 'Plug In. Scale Up.',
    subtext: 'Add models and teammates in minutes, not sprints.',
  },
  {
    id: 1,
    image: '/images/second.png',
    bgGradient: 'linear-gradient(180deg, rgba(8, 27, 46, 0.2) 0%, rgba(3, 7, 15, 0.65) 100%)',
    heading: 'One Endpoint. Every Model.',
    subtext: 'Run and route local LLMs without juggling a dozen configs.',
  },
  {
    id: 2,
    image: '/images/third.png',
    bgGradient: 'linear-gradient(180deg, rgba(36, 10, 42, 0.2) 0%, rgba(8, 2, 10, 0.65) 100%)',
    heading: 'Built for Teams, Not Just Machines.',
    subtext: 'Manage access, keys, and usage across your whole team from one dashboard.',
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
              <Image
                src="/images/pullo-logo.png"
                alt="PullO Logo"
                width={16}
                height={16}
                style={{ borderRadius: 4 }}
              />
              Back to PullO <ArrowRight size={13} />
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
                    Continue with Google
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
                    Continue with Google
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
