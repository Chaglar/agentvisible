'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 2000)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setShowBanner(false)
  }

  const rejectCookies = () => {
    localStorage.setItem('cookieConsent', 'rejected')
    setShowBanner(false)
    // In a full implementation, this would disable analytics
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-dark-900 border-t border-gray-dark-700 p-4 shadow-2xl">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">Cookie Consent</h3>
          <p className="text-gray-dark-300 text-sm leading-relaxed">
            We use essential cookies to make our website work and analytics cookies to understand how you interact with our website.
            We don't use advertising cookies or share data with third parties.
            <Link href="/privacy" className="text-accent hover:text-secondary ml-1">
              Learn more in our Privacy Policy
            </Link>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={rejectCookies}
            className="px-6 py-3 bg-transparent border border-gray-dark-500 text-gray-dark-300 rounded-lg hover:border-gray-dark-400 hover:text-white transition-all duration-200"
          >
            Essential Only
          </button>
          <button
            onClick={acceptCookies}
            className="px-6 py-3 bg-accent text-background font-semibold rounded-lg hover:bg-secondary transition-all duration-200"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}