import Nav from '../Nav'
import { supabaseServer } from '@/lib/supabase/server'

export default async function Studio() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  return (
    <>
      <Nav email={user?.email ?? ''} />
      <main style={{ maxWidth: 'none', padding: '12px 16px 24px' }}>
        <div className="note">
          <b>Beta del prototipo integrado.</b> Esta primera integración conserva el flujo de 7 pasos, el editor y la descarga PNG. En esta fase, las creatividades y los productos que importes desde este estudio se guardan en este navegador; todavía no se sincronizan con Supabase ni generan imágenes con IA. No uses esta galería como archivo definitivo de campaña.
        </div>
        <iframe
          title="Smileat Ads Studio beta"
          src="/prototype.html"
          style={{ width: '100%', height: 'calc(100vh - 150px)', minHeight: 760, border: 0, borderRadius: 12, background: '#fff' }}
        />
      </main>
    </>
  )
}
