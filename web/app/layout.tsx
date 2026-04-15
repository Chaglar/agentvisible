import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentVisible.ai - AI Agent Readiness Scanner',
  description: 'Free website scanner that scores your site\'s AI agent readiness (0-100)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  )
}