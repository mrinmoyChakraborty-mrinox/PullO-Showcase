import { Analytics } from '@vercel/analytics/react'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { QueryProvider } from '@/lib/query-provider'
import CustomCursor from '@/components/custom-cursor'
import { Toaster } from '@/components/ui/toast'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['italic', 'normal'],
  variable: '--font-serif',
  subsets: ['latin'],
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pullo.runtimeco.qzz.io'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PullO — Private AI Network Layer for Local Models & Team APIs',
    template: '%s — PullO',
  },
  description:
    'PullO is a private AI network layer that turns local models (Ollama, LM Studio, llama.cpp) into secure, OpenAI-compatible APIs for your team. No port forwarding, no tunnels, no cloud inference. Share local LLMs with API keys, workspaces, and role-based access. Supports MCP, streaming, and any OpenAI SDK.',
  applicationName: 'PullO',
  authors: [{ name: 'PullO', url: 'https://github.com/mrinmoyChakraborty-mrinox/PullO' }],
  generator: 'Next.js',
  keywords: [
    'PullO',
    'private AI network layer',
    'OpenAI compatible API',
    'local AI sharing',
    'Ollama API gateway',
    'llama.cpp',
    'LM Studio',
    'MCP',
    'Model Context Protocol',
    'AI infrastructure',
    'AI runtime',
    'self-hosted AI',
    'local LLM API',
    'local inference',
    'team AI infrastructure',
    'AI gateway',
    'browser extension AI',
    'developer tools',
    'pull-based tunnel',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Runtime.co',
  publisher: 'Runtime.co',
  icons: {
    icon: [
      { url: '/pullo_favicon/favicon.ico', sizes: 'any' },
      { url: '/pullo_favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/pullo_favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/pullo_favicon/apple-touch-icon.png' }],
    shortcut: [{ url: '/pullo_favicon/favicon.ico' }],
  },
  manifest: '/pullo_favicon/site.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'PullO',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'PullO',
    title: 'PullO — Private AI Network Layer for Local Models & Team APIs',
    description:
      'Turn local AI models (Ollama, LM Studio) into secure, shareable OpenAI-compatible APIs for your team. Pull-based architecture: zero inbound ports, works behind corporate firewalls. API keys, workspaces, rate limiting, MCP tools, and real-time analytics included.',
    url: siteUrl,
    images: [
      {
        url: '/images/pullo-logo.png',
        width: 256,
        height: 256,
        alt: 'PullO — Private AI Network Layer for Local Models',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@runtime_co',
    title: 'PullO — Private AI Network Layer for Local Models & Team APIs',
    description:
      'Turn local AI models into secure, OpenAI-compatible APIs for your team. Zero inbound ports. Works behind firewalls. Open source.',
    images: ['/images/pullo-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
}

export const viewport: Viewport = {
  themeColor: '#050816',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      style={{ backgroundColor: '#050816' }}
    >
      <head>
        <link rel="icon" href="/pullo_favicon/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/pullo_favicon/favicon.ico" />
        <link rel="apple-touch-icon" href="/pullo_favicon/apple-touch-icon.png" />
        <meta property="og:site_name" content="PullO" />
        <meta name="application-name" content="PullO" />
        <meta name="apple-mobile-web-app-title" content="PullO" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'PullO',
                url: siteUrl,
                logo: `${siteUrl}/images/pullo-logo.png`,
                description:
                  'Private AI network layer that turns local models into secure, shareable OpenAI-compatible APIs.',
                sameAs: [
                  'https://github.com/mrinmoyChakraborty-mrinox/PullO',
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'PullO',
                url: siteUrl,
                description:
                  'The private AI network layer for local models. Expose Ollama, LM Studio, and any OpenAI-compatible endpoint as secure team APIs.',
                applicationCategory: 'DeveloperApplication',
                keywords:
                  'local AI, Ollama, OpenAI compatible API, MCP, AI infrastructure, self-hosted AI, LLM API gateway',
              },
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'PullO',
                applicationCategory: 'DeveloperApplication',
                operatingSystem: 'Windows, macOS, Linux, Chrome',
                description:
                  'Private AI network layer that turns local AI models (Ollama, LM Studio, llama.cpp) into secure, OpenAI-compatible APIs for teams. Features pull-based architecture, WebSocket relay, API key auth, workspace management, rate limiting, MCP tool integration, and real-time analytics.',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'USD',
                  availability: 'https://schema.org/InStock',
                },
                browserRequirements: 'Chrome MV3',
                softwareHelp: {
                  '@type': 'WebSite',
                  url: 'https://pullo-docs.vercel.app',
                },
              },
            ]),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
        <CustomCursor />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
