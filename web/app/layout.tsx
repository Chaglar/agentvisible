import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono'
})

export const metadata: Metadata = {
  title: 'AgentVisible.ai - Can AI Agents Find Your Business?',
  description: 'Free AI agent readiness scanner. Most websites score under 45. Get your score (0-100) across structured data, crawlability, parseability, commerce protocols, and agent discovery.',
  keywords: ['AI agents', 'website optimization', 'AI readiness', 'structured data', 'SEO', 'crawlability'],
  authors: [{ name: 'AgentVisible.ai' }],
  openGraph: {
    title: 'AgentVisible.ai - Can AI Agents Find Your Business?',
    description: 'Free AI agent readiness scanner. Most websites score under 45. Get your score and actionable fixes.',
    url: 'https://agentvisible.ai',
    siteName: 'AgentVisible.ai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentVisible.ai - Can AI Agents Find Your Business?',
    description: 'Free AI agent readiness scanner. Most websites score under 45.',
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-white font-display antialiased">
        {children}
      </body>
    </html>
  )
}