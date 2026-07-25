import Link from 'next/link'

const sections = [
  { id: 'collect', title: '1. Information We Collect' },
  { id: 'use', title: '2. How We Use Information' },
  { id: 'share', title: '3. Information Sharing' },
  { id: 'security', title: '4. Data Security' },
  { id: 'retention', title: '5. Data Retention' },
  { id: 'rights', title: '6. Your Rights' },
  { id: 'children', title: "7. Children's Privacy" },
  { id: 'changes', title: '8. Changes to This Policy' },
  { id: 'contact', title: '9. Contact Us' },
]

export default function PrivacyPage() {
  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; scroll-padding-top: 2rem; }
      `}</style>
      <div className="min-h-screen" style={{ background: 'radial-gradient(circle at 50% 120px, rgba(109,74,255,.22), transparent 300px), #090B14' }}>
        <div className="mx-auto max-w-[1320px] px-8 py-8">
          {/* Nav */}
          <nav className="flex items-center justify-between border-b border-white/[0.06] pb-10">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <img src="/images/pullo-logo.png" alt="PullO" className="h-[34px]" />
              <span className="text-[28px] font-extrabold text-[#F8FAFC]">PullO</span>
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-[rgba(109,74,255,.25)] bg-[rgba(109,74,255,.08)] px-7 py-3 font-semibold text-white no-underline backdrop-blur transition-all duration-300 ease-in-out hover:border-[#6D4AFF] hover:bg-[rgba(109,74,255,.18)] hover:shadow-[0_0_20px_rgba(109,74,255,.35),0_0_40px_rgba(109,74,255,.15)] hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </nav>

          {/* Hero */}
          <div className="py-20 text-center">
            <h1 className="font-serif text-[72px] font-normal leading-[1.15] tracking-tight max-sm:text-[44px]">
              Privacy{' '}
              <span className="font-serif italic text-[#F8FAFC]">
                Policy
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-[640px] text-base leading-[1.75] text-[#93A0B8]/80">
              This Privacy Policy explains how PullO collects, uses, stores and protects your information while keeping your AI infrastructure private and under your control.
            </p>
          </div>

          {/* Content */}
          <div className="grid grid-cols-[240px_1fr] gap-16 max-lg:grid-cols-1">
            {/* Sidebar */}
            <aside className="sticky top-8 h-max max-lg:relative max-lg:mb-10">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">Sections</p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block border-l-2 border-transparent py-2.5 pl-4 text-sm leading-snug text-[#8d92ad] no-underline transition-all duration-250 hover:border-[#FF5FBF] hover:text-white"
                >
                  {s.title}
                </a>
              ))}
            </aside>

            {/* Main */}
            <main className="pb-20">
              <section id="collect" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">1. Information We Collect</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  When you create a PullO account, we may collect information including your name, email address, authentication credentials, billing information and workspace details.
                </p>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  We also collect operational metadata such as request timestamps, response times, usage statistics and error logs to improve platform reliability.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  PullO does not permanently store prompt contents, AI responses or your locally hosted model weights.
                </p>
              </section>

              <section id="use" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">2. How We Use Information</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">We use collected information to:</p>
                <ul className="space-y-1.5 pl-5">
                  {[
                    'Provide and maintain the PullO platform.',
                    'Authenticate users and API requests.',
                    'Generate analytics and usage dashboards.',
                    'Improve performance and reliability.',
                    'Send important service updates.',
                    'Detect fraud and security threats.',
                  ].map((item) => (
                    <li key={item} className="leading-[1.8] text-[#93A0B8]/90">{item}</li>
                  ))}
                </ul>
              </section>

              <section id="share" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">3. Information Sharing</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  PullO never sells your personal information.
                </p>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  Information may only be shared with trusted service providers that help us operate our infrastructure, process payments or deliver customer support.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  We may also disclose information where required by applicable law.
                </p>
              </section>

              <section id="security" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">4. Data Security</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  We implement industry-standard security practices to protect your information.
                </p>
                <ul className="space-y-1.5 pl-5">
                  {[
                    'TLS encrypted communication',
                    'Secure authentication',
                    'Hashed API keys',
                    'Role-based workspace permissions',
                    'Continuous monitoring',
                    'In-memory prompt processing',
                  ].map((item) => (
                    <li key={item} className="leading-[1.8] text-[#93A0B8]/90">{item}</li>
                  ))}
                </ul>
              </section>

              <section id="retention" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">5. Data Retention</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  Operational metadata is retained only for the period necessary to provide analytics, improve the platform and comply with legal obligations.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  Prompt contents and AI responses are not permanently retained by PullO.
                </p>
              </section>

              <section id="rights" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">6. Your Rights</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  Depending on your location, you may have the right to:
                </p>
                <ul className="space-y-1.5 pl-5">
                  {[
                    'Access your personal data.',
                    'Correct inaccurate information.',
                    'Request deletion of your account.',
                    'Export your information.',
                    'Object to certain processing activities.',
                  ].map((item) => (
                    <li key={item} className="leading-[1.8] text-[#93A0B8]/90">{item}</li>
                  ))}
                </ul>
              </section>

              <section id="children" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">7. Children&apos;s Privacy</h2>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  PullO is not intended for children under the applicable legal age. We do not knowingly collect personal information from children.
                </p>
              </section>

              <section id="changes" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">8. Changes to This Privacy Policy</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  We may update this Privacy Policy periodically to reflect improvements, legal requirements or new platform features.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  Material changes will be communicated through email, dashboard notifications or our official website.
                </p>
              </section>

              <section id="contact" className="pb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">9. Contact Us</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  For questions regarding this Privacy Policy, contact us at:
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  <strong className="font-medium text-[#F8FAFC]">Email:</strong>{' '}
                  <a href="https://mail.google.com/mail/?view=cm&fs=1&to=runtimeco.team@gmail.com" target="_blank" rel="noopener noreferrer" className="text-[#82A7FF] transition-colors hover:text-white">runtimeco.team@gmail.com</a>
                </p>
              </section>
            </main>
          </div>

          {/* Footer */}
          <footer className="border-t border-white/[0.06] px-10 py-10 mt-20 text-center text-sm text-[#7f8aa3]/70">
            <p>&copy; 2026 PullO. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </>
  )
}
