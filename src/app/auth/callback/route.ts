import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      // Code exchange failed — redirect to login with error message
      const loginUrl = new URL('/login', origin)
      loginUrl.searchParams.set('error', 'Link expired or already used. Please request a new one.')
      return NextResponse.redirect(loginUrl)
    }
    // Success — go to dashboard (or originally requested page)
    const redirectTo = next.startsWith('/') ? `${origin}${next}` : `${origin}/dashboard`
    return NextResponse.redirect(redirectTo)
  }

  // No code in URL — redirect to login
  return NextResponse.redirect(new URL('/login', origin))
}
