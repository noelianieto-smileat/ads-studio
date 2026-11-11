import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/env'
export const supabaseBrowser = () =>
  createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
