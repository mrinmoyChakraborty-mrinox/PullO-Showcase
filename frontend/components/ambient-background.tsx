'use client'

export function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 z-[-2]"
      style={{
        backgroundColor: 'transparent',
        backgroundImage: `
          radial-gradient(circle at 25% 30%, rgba(124, 58, 237, 0.16) 0%, transparent 22%),
          radial-gradient(circle at 75% 65%, rgba(6, 182, 212, 0.12) 0%, transparent 25%),
          radial-gradient(circle at 60% 20%, rgba(190, 24, 93, 0.08) 0%, transparent 16%),
          radial-gradient(circle at 40% 80%, rgba(56, 189, 248, 0.06) 0%, transparent 18%)
        `,
        filter: 'blur(120px)',
        transform: 'translateZ(0)',
        willChange: 'transform',
        animation: 'nebula-drift 45s ease-in-out infinite',
      }}
      aria-hidden
    />
  )
}
