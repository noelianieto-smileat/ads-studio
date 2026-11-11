import './globals.css'
import { Nunito, Montserrat } from 'next/font/google'
const nunito = Nunito({ subsets: ['latin'], weight: ['800', '900'], variable: '--font-nunito' })
const mont = Montserrat({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-mont' })
export const metadata = { title: 'SMILEAT ADS STUDIO', robots: { index: false, follow: false } }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es" className={`${nunito.variable} ${mont.variable}`}><body>{children}</body></html>
}
