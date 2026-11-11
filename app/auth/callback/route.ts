import { NextResponse } from 'next/server'
import { supabaseServer, allowed } from '@/lib/supabase/server'
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const sb = supabaseServer()
  if (code) await sb.auth.exchangeCodeForSession(code)
  const { data: { user } } = await sb.auth.getUser()
  if (!allowed(user?.email)) { await sb.auth.signOut(); return NextResponse.redirect(`${origin}/login?error=domain`) }
  return NextResponse.redirect(origin)
}
