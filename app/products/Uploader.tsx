'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useRef } from 'react'
export default function Uploader() {
  const [msg, setMsg] = useState(''); const router = useRouter(); const csvRef = useRef<HTMLInputElement>(null)
  async function run(files: FileList | null) {
    if (!files?.length) return
    const sb = supabaseBrowser(); let n = 0
    const cats: Record<string, string> = {}
    const cf = csvRef.current?.files?.[0]
    if (cf) (await cf.text()).split(/\r?\n/).slice(1).forEach((l) => { const p = l.split(','); if (p[0]) cats[p[0].trim().toLowerCase()] = (p[1] || '').trim() })
    for (const f of Array.from(files)) {
      setMsg(`Importando ${++n} de ${files.length}…`)
      const name = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
      const path = `products/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, '_')}`
      const up = await sb.storage.from('brand').upload(path, f)
      if (up.error) { setMsg('Error al subir ' + f.name + ': ' + up.error.message); return }
      const ins = await sb.from('products').insert({ name, image_path: path, category: cats[name.toLowerCase()] || null })
      if (ins.error) { setMsg('Error al guardar ' + name + ': ' + ins.error.message); return }
    }
    setMsg(`${n} productos importados.`); router.refresh()
  }
  return (<div className="card" style={{ padding: 20, maxWidth: 520 }}>
    <h3>Importar varios productos de golpe</h3>
    <p style={{ fontSize: 13 }}>Selecciona todas las fotos originales a la vez. El nombre del archivo será el nombre del producto.</p>
    <p style={{ fontSize: 13 }}>Opcional: <code>productos.csv</code> (nombre,categoria) para asignar categorías. Selecciónalo antes que las fotos.</p><input ref={csvRef} type="file" accept=".csv" /><br /><br /><input type="file" accept="image/*" multiple onChange={(e) => run(e.target.files)} /><p>{msg}</p>
  </div>)
}
