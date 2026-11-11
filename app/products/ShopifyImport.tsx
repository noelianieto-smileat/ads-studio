'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

type P = { name: string; type: string; sku: string; photos: [number, string][] }
const PACKS = ['Pack', 'Promo', 'Regalo']

function parseCsv(t: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], f = '', q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = '' }
    else if (c !== '\r') f += c
  }
  if (f || row.length) { row.push(f); rows.push(row) }
  return rows
}

export default function ShopifyImport() {
  const [items, setItems] = useState<P[]>([]); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function read(file: File | undefined) {
    if (!file) return
    const rows = parseCsv(await file.text()); const head = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim())
    const ix = (n: string) => head.indexOf(n)
    const [iN, iH, iT, iS, iU, iP] = ['Producto', 'Handle', 'Tipo', 'SKU', 'URL foto', 'Posición foto'].map(ix)
    if ([iN, iH, iU].includes(-1)) { setMsg('El CSV no tiene las columnas Producto, Handle y URL foto.'); return }
    const map = new Map<string, P>()
    for (const r of rows.slice(1)) {
      if (!r[iH]) continue
      const p = map.get(r[iH]) ?? { name: (r[iN] || '').trim(), type: (r[iT] || '').trim(), sku: (r[iS] || '').trim(), photos: [] }
      if ((r[iU] || '').trim()) p.photos.push([parseFloat(r[iP]) || 99, r[iU].trim()])
      map.set(r[iH], p)
    }
    const list = [...map.values()].filter((p) => p.photos.length && !(p.sku.startsWith('PT-') && !PACKS.includes(p.type)))
    list.forEach((p) => p.photos.sort((a, b) => a[0] - b[0]))
    setItems(list)
    setMsg(`${list.length} productos listos (sin los de Portugal; los packs, promos y regalos se mantienen).`)
  }

  async function run() {
    setBusy(true); const sb = supabaseBrowser(); const failed: string[] = []; let ok = 0
    const { data: ex } = await sb.from('products').select('name'); const have = new Set((ex ?? []).map((x) => x.name.toLowerCase()))
    for (const [i, p] of items.entries()) {
      if (have.has(p.name.toLowerCase())) continue
      setMsg(`Importando ${i + 1} de ${items.length}: ${p.name}`)
      try {
        const url = p.photos[0][1]; const res = await fetch(url); if (!res.ok) throw new Error(String(res.status))
        const blob = await res.blob(); const ext = (url.split('?')[0].match(/\.(jpe?g|png|webp)$/i)?.[0] ?? '.jpg').toLowerCase()
        const path = `products/${crypto.randomUUID()}${ext}`
        const up = await sb.storage.from('brand').upload(path, blob, { contentType: blob.type || undefined }); if (up.error) throw up.error
        const ins = await sb.from('products').insert({ name: p.name, category: p.type || null, image_path: path }); if (ins.error) throw ins.error
        ok++
      } catch { failed.push(p.name) }
    }
    setBusy(false); router.refresh()
    setMsg(`${ok} importados.` + (failed.length ? ` No se pudo descargar la foto de ${failed.length}: ${failed.slice(0, 5).join(', ')}${failed.length > 5 ? '…' : ''}. Súbelas a mano.` : ''))
  }

  return (
    <div className="card" style={{ padding: 20, maxWidth: 520 }}>
      <h3>Importar desde el CSV de Shopify</h3>
      <p style={{ fontSize: 13 }}>Sube el export «productos activos». Se descarga la foto en posición 1 de cada producto. Revisa después que sea el envase y no una foto de ambiente.</p>
      <input type="file" accept=".csv" onChange={(e) => read(e.target.files?.[0])} /><br /><br />
      {items.length > 0 && <button className="btn" disabled={busy} onClick={run}>Importar {items.length} productos</button>}
      <p>{msg}</p>
    </div>
  )
}
