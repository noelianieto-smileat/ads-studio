import Nav from '../Nav'
import Uploader from './Uploader'
import ShopifyImport from './ShopifyImport'
import { supabaseServer } from '@/lib/supabase/server'
export default async function Products() {
  const sb = supabaseServer(); const { data: { user } } = await sb.auth.getUser()
  const { data: prods } = await sb.from('products').select('id,name,category,image_path').order('created_at', { ascending: false })
  const paths = (prods ?? []).map((p) => p.image_path).filter(Boolean) as string[]
  const { data: signed } = paths.length ? await sb.storage.from('brand').createSignedUrls(paths, 3600) : { data: [] }
  const url = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]))
  return (<><Nav email={user?.email ?? ''} /><main><h2>Productos y recursos</h2><br /><ShopifyImport /><br /><Uploader /><br />
    <div className="grid">{(prods ?? []).map((p) => (<div className="card" key={p.id}>
      {p.image_path && url.get(p.image_path) ? <img src={url.get(p.image_path) ?? undefined} alt="" /> : null}
      <div><b>{p.name}</b><br /><span style={{ fontSize: 12, color: 'var(--mu)' }}>{p.category}</span></div></div>))}</div>
  </main></>)
}
