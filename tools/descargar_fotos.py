#!/usr/bin/env python3
"""Descarga las fotos de producto de un export de Shopify (CSV 'productos activos').
Uso:  python3 tools/descargar_fotos.py productos.csv [--salida fotos-productos] [--sin-packs] [--incluir-portugal] [--dry-run]
Por defecto: se quitan los productos de Portugal (SKU PT-) y se mantienen los packs/promos/regalos.
Genera:
  <salida>/principales/<Producto>.<ext>   -> foto en posición 1, lista para importar en la herramienta
  <salida>/todas/<Producto>/<n>.<ext>      -> el resto de fotos, por si la principal no es la buena
  <salida>/productos.csv                   -> nombre,categoria,sku,handle (para asignar categorías)
Solo usa la librería estándar de Python 3."""
import argparse, csv, os, re, sys, time, urllib.request
from urllib.parse import urlparse

def limpio(s): return re.sub(r'\s+', ' ', re.sub(r'[\\/:*?"<>|]', '', s)).strip()
def ext(u):
    e = os.path.splitext(urlparse(u).path)[1].lower()
    return e if e in ('.jpg', '.jpeg', '.png', '.webp') else '.jpg'
def bajar(url, dest, dry):
    if os.path.exists(dest): return True
    if dry: return True
    for i in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as r, open(dest, 'wb') as f: f.write(r.read())
            return True
        except Exception as e:
            err = e; time.sleep(1.5)
    print('  ERROR', url, err); return False

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('csv'); ap.add_argument('--salida', default='fotos-productos')
    ap.add_argument('--sin-packs', action='store_true'); ap.add_argument('--incluir-portugal', action='store_true'); ap.add_argument('--dry-run', action='store_true'); a = ap.parse_args()
    PACKS = {'Pack', 'Promo', 'Regalo'}
    with open(a.csv, newline='', encoding='utf-8-sig') as f: rows = list(csv.DictReader(f))
    prods = {}
    for r in rows:
        h = r['Handle']; p = prods.setdefault(h, {'nombre': r['Producto'].strip(), 'tipo': r['Tipo'].strip(), 'sku': r['SKU'].strip(), 'fotos': []})
        if r['URL foto'].strip():
            try: pos = float(r['Posición foto'] or 99)
            except ValueError: pos = 99
            p['fotos'].append((pos, r['URL foto'].strip()))
    os.makedirs(os.path.join(a.salida, 'principales'), exist_ok=True)
    usados, out, sin_foto, excl, pt = set(), [], [], 0, 0
    for h, p in prods.items():
        mercado = p['sku'].split('-')[0] if p['sku'] else ''
        es_pack = p['tipo'] in PACKS
        if es_pack and a.sin_packs: excl += 1; continue
        if mercado == 'PT' and not es_pack and not a.incluir_portugal: pt += 1; continue  # Portugal fuera, salvo packs
        if not p['fotos']: sin_foto.append(p['nombre']); continue
        nombre = limpio(p['nombre'])
        if nombre.lower() in usados: nombre = f"{nombre} ({h})"
        usados.add(nombre.lower())
        fotos = sorted(p['fotos'])
        print(f"{nombre}  [{p['tipo']}]  {len(fotos)} fotos")
        bajar(fotos[0][1], os.path.join(a.salida, 'principales', nombre + ext(fotos[0][1])), a.dry_run)
        d = os.path.join(a.salida, 'todas', nombre); os.makedirs(d, exist_ok=True)
        for i, (_, u) in enumerate(fotos, 1): bajar(u, os.path.join(d, f'{i}{ext(u)}'), a.dry_run)
        out.append([nombre, p['tipo'], p['sku'], h, mercado])
    with open(os.path.join(a.salida, 'productos.csv'), 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f); w.writerow(['nombre', 'categoria', 'sku', 'handle', 'prefijo_sku']); w.writerows(out)
    print(f"\n{len(out)} productos con foto. Quitados de Portugal: {pt}. Packs/promos/regalos quitados: {excl}. Sin foto: {len(sin_foto)}")
    for n in sin_foto: print('  sin foto:', n)
if __name__ == '__main__': main()
