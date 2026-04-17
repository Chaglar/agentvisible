import Link from 'next/link'

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-dark-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-dark-3 border border-dark-5 rounded-xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-white mb-3">Payment cancelled</h1>
        <p className="text-gray-300 mb-8">
          No charges were made. You can try again anytime.
        </p>
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full bg-teal-400 text-dark-1 py-3 rounded-lg font-medium hover:bg-teal-300 transition"
          >
            View pricing
          </Link>
          <Link
            href="/"
            className="block w-full border border-dark-5 text-gray-300 py-3 rounded-lg hover:border-dark-6 transition"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}