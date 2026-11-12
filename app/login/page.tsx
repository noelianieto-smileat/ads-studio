'use client'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
function Login() {
  const err = useSearchParams().get('error')
  const [diagnostic, setDiagnostic] = useState('')
  const go = async () => {
    setDiagnostic('')
    // Check only presence; never expose the key itself.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setDiagnostic('Falta configuración pública de Supabase en el build de Netlify. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en el contexto Production/Builds y vuelve a desplegar.')
      return
    }
    try {
      const { error } = await supabaseBrowser().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/auth/callback`, queryParams: { hd: 'smileat.com' } }
      })
      if (error) setDiagnostic(error.message)
    } catch (e) {
      setDiagnostic(e instanceof Error ? e.message : 'No se pudo iniciar la conexión con Supabase.')
    }
  }
  return (
    <div className="login"><div className="login-card">
      <img className="logo" src="/brand/smileat-azul.svg" alt="Smileat" />
      <h1>Ads Studio</h1>
      <div className="chars" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((i) => <img key={i} src={`/brand/personaje-${i}.png`} alt="" />)}</div>
      <p>Herramienta interna de Marketing para crear creatividades.</p>
      {err === 'domain' && <p className="err">Solo se permiten cuentas @smileat.com.</p>}
      {diagnostic && <p role="alert" className="err">{diagnostic}</p>}
      <button className="btn big" onClick={go}>Entrar con Google</button>
      <small>Acceso solo con cuenta @smileat.com</small>
    </div></div>
  )
}
export default function Page() { return <Suspense><Login /></Suspense> }
