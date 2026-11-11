import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function supabaseServer() {
  const store = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => store.getAll(), setAll: (c: { name: string; value: string; options: CookieOptions }[]) => { try { c.forEach(({ name, value, options }) => store.set(name, value, options)) } catch {} } },
  })
}
export const allowed = (email?: string | null) =>
  !!email && email.toLowerCase().endsWith('@' + (process.env.ALLOWED_EMAIL_DOMAIN || 'smileat.com'))
