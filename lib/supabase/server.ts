import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/env'
import { cookies } from 'next/headers'
export function supabaseServer() {
  const store = cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: { getAll: () => store.getAll(), setAll: (c: { name: string; value: string; options: CookieOptions }[]) => { try { c.forEach(({ name, value, options }) => store.set(name, value, options)) } catch {} } },
  })
}
export const allowed = (email?: string | null) =>
  !!email && email.toLowerCase().endsWith('@' + (process.env.ALLOWED_EMAIL_DOMAIN || 'smileat.com'))
