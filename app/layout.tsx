import './globals.css'
export const metadata = { icons: { icon: '/brand/smileat-azul.png' }, title: 'Smileat Ads Studio', robots: { index: false, follow: false } }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>
}
