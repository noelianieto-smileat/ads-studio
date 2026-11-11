import Link from 'next/link'
export default function Nav({ email }: { email: string }) {
  return (
    <header>
      <span className="logo">smileat</span>
      <Link href="/">Inicio</Link><Link href="/gallery">Galería</Link><Link href="/products">Productos y recursos</Link>
      <span style={{ fontSize: 13 }}>{email}</span>
      <form action="/signout" method="post"><button className="btn ghost" type="submit">Cerrar sesión</button></form>
    </header>
  )
}
