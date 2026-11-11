import Link from 'next/link'
import Nav from './Nav'
import { supabaseServer } from '@/lib/supabase/server'
export default async function Home() {
  const { data: { user } } = await supabaseServer().auth.getUser()
  return (<><Nav email={user?.email ?? ''} /><main>
    <h1 style={{ fontSize: 56, color: 'var(--pr)' }}>SMILEAT ADS STUDIO</h1>
    <p style={{ maxWidth: 520, color: 'var(--mu)' }}>Crea, revisa y descarga creatividades para Meta Ads y TikTok Ads en España, Portugal e Italia.</p>
    <div className="note">El flujo de 7 pasos, el editor y la descarga siguen en el prototipo (carpeta <code>prototype/</code>) y se portan a esta base en la siguiente fase. Aún no hay botón de creación aquí para no simular una función que no existe.</div>
    <Link className="btn" href="/products">Gestionar productos</Link> <Link className="btn" href="/gallery">Ver galería</Link>
  </main></>)
}
