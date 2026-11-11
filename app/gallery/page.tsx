import Nav from '../Nav'
import { supabaseServer } from '@/lib/supabase/server'
export default async function Gallery() {
  const sb = supabaseServer(); const { data: { user } } = await sb.auth.getUser()
  const { data } = await sb.from('creatives').select('id,market,format,channel,type,review_status,spec,created_at').order('created_at', { ascending: false }).limit(100)
  return (<><Nav email={user?.email ?? ''} /><main><h2>Galería</h2>
    {!data?.length ? <div className="note">Aún no hay creatividades guardadas. La generación y el guardado se conectan en la siguiente fase.</div> :
    <table><tbody>{data.map((c) => (<tr key={c.id}><td>{(c.spec as { head?: string })?.head}</td><td>{c.market}</td><td>{c.format}</td><td>{c.channel}</td><td>{c.type}</td><td>{c.review_status}</td></tr>))}</tbody></table>}
  </main></>)
}
