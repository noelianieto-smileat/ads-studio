'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/studio', label: 'Estudio creativo' },
  { href: '/gallery', label: 'Galería' },
  { href: '/products', label: 'Productos y recursos' },
]

export default function Nav({ email }: { email: string }) {
  const path = usePathname()
  return (
    <header className="top">
      <div className="in">
        <Link className="brand" href="/" aria-label="Smileat Ads Studio, inicio"><img src="/brand/smileat-azul.svg" alt="Smileat" /></Link>
        <nav aria-label="Principal">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={(l.href === '/' ? path === '/' : path.startsWith(l.href)) ? 'on' : ''}>{l.label}</Link>
          ))}
        </nav>
        <div className="who">
          <span title={email}>{email}</span>
          <form action="/signout" method="post"><button className="btn ghost" type="submit">Cerrar sesión</button></form>
        </div>
      </div>
    </header>
  )
}
