'use client'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
function Login() {
  const err = useSearchParams().get('error')
  const go = () => supabaseBrowser().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback`, queryParams: { hd: 'smileat.com' } } })
  return (
    <div className="login"><div className="card" style={{ padding: 32 }}>
      <h2>SMILEAT ADS STUDIO</h2><p>Herramienta interna de Marketing.</p>
      {err === 'domain' && <p style={{ color: '#C0264B' }}>Solo se permiten cuentas @smileat.com.</p>}
      <button className="btn big" onClick={go}>Entrar con Google</button>
    </div></div>
  )
}
export default function Page() { return <Suspense><Login /></Suspense> }
