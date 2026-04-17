import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SignOutButton } from './sign-out-button'

export async function AuthNav() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      ) : (
        <Link
          href="/auth/signin"
          className="bg-transparent border border-teal-400 text-teal-400 px-4 py-2 rounded-lg hover:bg-teal-400 hover:text-dark-1 transition-colors text-sm font-medium"
        >
          Sign In
        </Link>
      )}
    </div>
  )
}