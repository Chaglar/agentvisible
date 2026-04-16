import Link from 'next/link'

export default function ReportNotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl font-bold text-accent mb-4 font-mono">404</div>

        <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>

        <p className="text-gray-dark-300 mb-8">
          The scan report you're looking for doesn't exist or may have expired.
        </p>

        <div className="space-y-4">
          <Link
            href="/"
            className="block px-6 py-3 bg-gradient-to-r from-accent to-secondary text-background font-bold rounded-lg hover:shadow-lg transition-all"
          >
            Scan Your Website
          </Link>

          <Link
            href="/"
            className="block px-6 py-3 bg-gray-dark-700 text-white font-bold rounded-lg hover:bg-gray-dark-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-dark-400">
          <p>Need help? Reports are available for 30 days after scanning.</p>
        </div>
      </div>
    </main>
  )
}