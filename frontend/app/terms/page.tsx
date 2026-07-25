import Link from 'next/link'

const sections = [
  { id: 'acceptance', title: '1. Acceptance' },
  { id: 'service', title: '2. What PullO Does' },
  { id: 'accounts', title: '3. Accounts & Security' },
  { id: 'use', title: '4. Acceptable Use' },
  { id: 'data', title: '5. Your Data' },
  { id: 'host', title: '6. Host Responsibilities' },
  { id: 'limits', title: '7. Service Limitations' },
  { id: 'payment', title: '8. Payment' },
  { id: 'ip', title: '9. Intellectual Property' },
  { id: 'liability', title: '10. Disclaimer & Liability' },
  { id: 'changes', title: '11. Changes to These Terms' },
  { id: 'law', title: '12. Governing Law' },
  { id: 'contact', title: '13. Contact' },
]

export default function TermsPage() {
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
              Terms{' '}
              <span className="font-serif italic">&</span>{' '}
              <span className="font-serif italic text-[#F8FAFC]">
                Conditions
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-[640px] text-base leading-[1.75] text-[#93A0B8]/80">
              These Terms & Conditions explain the rules, responsibilities and conditions for using PullO&apos;s platform, services and APIs. By using PullO, you agree to these terms.
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
              <section id="acceptance" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">1. Acceptance</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  By accessing or using PullO, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these Terms, you must not access or use the Service.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  These Terms apply to all users, including workspace owners, team members, API consumers and anyone accessing PullO services.
                </p>
              </section>

              <section id="service" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">2. What PullO Does</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  PullO enables users to securely expose locally running AI models as OpenAI-compatible API endpoints. PullO provides authentication, workspace management, request routing, usage analytics and access control while allowing AI inference to remain on infrastructure controlled by the user.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  PullO does not own your AI models, prompts or generated outputs. Inference is performed by your local runtime or self-hosted model.
                </p>
              </section>

              <section id="accounts" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">3. Accounts & Security</h2>
                <h3 className="mb-3 mt-8 text-lg font-medium text-[#F8FAFC]">3.1 Registration</h3>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  You must create an account before using PullO. You are responsible for maintaining the confidentiality of your login credentials.
                </p>
                <h3 className="mb-3 mt-8 text-lg font-medium text-[#F8FAFC]">3.2 API Keys</h3>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  API keys are issued for authenticating applications accessing your workspace. Keep your keys confidential and regenerate compromised keys immediately.
                </p>
                <h3 className="mb-3 mt-8 text-lg font-medium text-[#F8FAFC]">3.3 Workspace Access</h3>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  Workspace administrators are responsible for granting and revoking permissions for team members.
                </p>
                <h3 className="mb-3 mt-8 text-lg font-medium text-[#F8FAFC]">3.4 Termination</h3>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  You may stop using PullO at any time. PullO reserves the right to suspend or terminate accounts that violate these Terms.
                </p>
              </section>

              <section id="use" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">4. Acceptable Use</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">You agree not to:</p>
                <ul className="mb-5 space-y-1.5 pl-5">
                  {[
                    'Use PullO for unlawful activities.',
                    'Attempt unauthorized access to other workspaces.',
                    'Reverse engineer or disrupt platform infrastructure.',
                    'Upload malware or malicious software.',
                    'Use PullO for abusive or fraudulent purposes.',
                    'Circumvent authentication or security protections.',
                    'Violate intellectual property rights.',
                    'Resell PullO as a standalone competing service.',
                  ].map((item) => (
                    <li key={item} className="leading-[1.8] text-[#93A0B8]/90">{item}</li>
                  ))}
                </ul>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  Failure to comply may result in immediate suspension or permanent termination of your account.
                </p>
              </section>

              <section id="data" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">5. Your Data</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">PullO is built with a privacy-first architecture.</p>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  Your prompts, responses and AI model weights remain under your control. PullO does not permanently store prompt contents or generated responses.
                </p>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  Limited operational metadata including timestamps, request status, latency and token counts may be retained for dashboard analytics and service monitoring.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  You remain solely responsible for the content processed through your workspace.
                </p>
              </section>

              <section id="host" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">6. Host Responsibilities</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  If you host AI models using PullO, you are responsible for:
                </p>
                <ul className="space-y-1.5 pl-5">
                  {[
                    'Maintaining your local inference server.',
                    'Keeping your operating system secure.',
                    'Updating your models responsibly.',
                    'Managing workspace permissions.',
                    'Protecting API credentials.',
                    'Ensuring your machine remains online while serving requests.',
                  ].map((item) => (
                    <li key={item} className="leading-[1.8] text-[#93A0B8]/90">{item}</li>
                  ))}
                </ul>
              </section>

              <section id="limits" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">7. Service Limitations</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  PullO relies on the availability of your local machine, internet connection and inference server.
                </p>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  Response speed depends on your hardware, network conditions and model performance.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  Although we strive for maximum uptime, PullO cannot guarantee uninterrupted availability.
                </p>
              </section>

              <section id="payment" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">8. Payment</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  Certain features of PullO may require a paid subscription. By purchasing a subscription, you agree to pay all applicable fees displayed at the time of purchase.
                </p>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  Payments are securely processed through third-party payment providers. PullO does not store your payment card information.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  Subscription pricing, billing intervals and usage limits may change over time. Any material pricing changes will be communicated before they take effect.
                </p>
              </section>

              <section id="ip" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">9. Intellectual Property</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  The PullO platform, website, branding, logos, software, documentation and associated services are protected under intellectual property laws.
                </p>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  Except where otherwise stated, PullO retains ownership of all platform assets.
                </p>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  You retain ownership of your AI models, prompts, datasets, generated responses and any content processed through your workspace.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  Nothing in these Terms transfers ownership of your intellectual property to PullO.
                </p>
              </section>

              <section id="liability" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">10. Disclaimer & Liability</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  PullO is provided on an <strong className="font-medium text-[#F8FAFC]">&quot;as is&quot;</strong> and <strong className="font-medium text-[#F8FAFC]">&quot;as available&quot;</strong> basis.
                </p>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  While we strive to maintain a reliable platform, we do not guarantee continuous availability, uninterrupted service or error-free operation.
                </p>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  To the maximum extent permitted by applicable law, PullO shall not be liable for indirect, incidental, consequential or special damages arising from the use of the Service.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  Users are responsible for validating AI-generated outputs before using them in production or business-critical environments.
                </p>
              </section>

              <section id="changes" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">11. Changes to These Terms</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  We may revise these Terms from time to time to reflect improvements, legal requirements or platform updates.
                </p>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  When significant changes are made, we will provide notice through the dashboard, email or other appropriate communication channels.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  Continued use of PullO after updated Terms become effective constitutes acceptance of those changes.
                </p>
              </section>

              <section id="law" className="border-b border-white/[0.08] pb-10 mb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">12. Governing Law</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  These Terms shall be governed and interpreted in accordance with the laws of India.
                </p>
                <p className="leading-[1.8] text-[#93A0B8]/90">
                  Any disputes arising from these Terms or the use of PullO shall be subject to the exclusive jurisdiction of the courts located in Kolkata, West Bengal, India.
                </p>
              </section>

              <section id="contact" className="pb-10 last:border-none">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">13. Contact</h2>
                <p className="mb-4 leading-[1.8] text-[#93A0B8]/90">
                  If you have questions regarding these Terms & Conditions, please contact our legal team.
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
