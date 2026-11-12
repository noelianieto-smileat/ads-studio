import Link from 'next/link'
import Nav from './Nav'
import { supabaseServer } from '@/lib/supabase/server'

const TILES = [
  { href: '/studio', t: 'Estudio creativo', d: 'Crea creatividades para Meta y TikTok Ads con las plantillas de marca.', bb: 'blue', ico: 'estudio' },
  { href: '/products', t: 'Productos y recursos', d: 'Fotos originales de envase y datos de cada producto, por mercado.', bb: 'green', ico: 'productos' },
  { href: '/gallery', t: 'Galería', d: 'Revisa, aprueba y descarga las creatividades guardadas.', bb: 'pink', ico: 'galeria' },
]

export default async function Home() {
  const { data: { user } } = await supabaseServer().auth.getUser()
  return (
    <>
      <Nav email={user?.email ?? ''} />
      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">Alimentación infantil ecológica</div>
            <h1>Ads Studio</h1>
            <p>Crea, revisa y descarga creatividades para Meta Ads y TikTok Ads en España, Portugal e Italia, con el logo, los colores y los recursos de Smileat.</p>
            <Link className="btn big" href="/studio">Abrir estudio creativo</Link>
          </div>
          <div className="chars" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => <img key={i} src={`/brand/personaje-${i}.png`} alt="" />)}
          </div>
        </section>
        <section className="tiles">
          {TILES.map((x) => (
            <Link key={x.href} href={x.href} className="tile">
              <div className="bb" style={{ backgroundImage: `url(/brand/bocadillo-${x.bb}.png)` }}><img src={`/brand/ico-${x.ico}.png`} alt="" /></div>
              <div><h3>{x.t}</h3><small>{x.d}</small></div>
            </Link>
          ))}
        </section>
        <div className="note">Versión beta: el flujo creativo ya funciona, pero las creatividades se guardan solo en tu navegador. El guardado compartido y la generación con IA llegan en las siguientes fases.</div>
      </main>
    </>
  )
}
