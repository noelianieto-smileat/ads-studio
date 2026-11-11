// Supabase clients need the project base URL (https://xxxx.supabase.co).
// Strip any path such as /rest/v1/ that may have been pasted into the env var.
const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
export const SUPABASE_URL = raw ? new URL(raw).origin : raw
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
