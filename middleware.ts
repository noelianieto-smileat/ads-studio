import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/env'
import { NextResponse, type NextRequest } from 'next/server'
const PUBLIC = ['/login', '/auth/callback']
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (c: { name: string; value: string; options: CookieOptions }[]) => { c.forEach(({ name, value }) => req.cookies.set(name, value)); res = NextResponse.next({ request: req }); c.forEach(({ name, value, options }) => res.cookies.set(name, value, options)) },
    },
  })
  const { data: { user } } = await sb.auth.getUser()
  const domain = '@' + (process.env.ALLOWED_EMAIL_DOMAIN || 'smileat.com')
  const ok = !!user?.email?.toLowerCase().endsWith(domain)
  if (!ok && !PUBLIC.includes(req.nextUrl.pathname)) return NextResponse.redirect(new URL('/login', req.url))
  return res
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
