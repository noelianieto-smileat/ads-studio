import Link from 'next/link'
import Nav from './Nav'
import { supabaseServer } from '@/lib/supabase/server'
export default async function Home() {
  const { data: { user } } = await supabaseServer().auth.getUser()
  return (<><Nav email={user?.email ?? ''} /><main>
    <h1 style={{ fontSize: 56, color: 'var(--pr)' }}>SMILEAT ADS STUDIO</h1>
    <p style={{ maxWidth: 520, color: 'var(--mu)' }}>Crea, revisa y descarga creatividades para Meta Ads y TikTok Ads en España, Portugal e Italia.</p>
    <div className="note">Ya puedes probar la beta del flujo creativo integrado. Esta versión inicial conserva el prototipo original; el guardado compartido en Supabase y la generación con IA se incorporarán en fases posteriores.</div>
    <Link className="btn big" href="/studio">Abrir estudio creativo</Link><br /><br />
    <Link className="btn" href="/products">Gestionar productos</Link> <Link className="btn" href="/gallery">Ver galería</Link>
  </main></>)
}
