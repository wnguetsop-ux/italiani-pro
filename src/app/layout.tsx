import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import '../styles/globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: { default: 'ItalianiPro', template: '%s | ItalianiPro' },
  description: "Préparez votre candidature pour travailler en Italie. Accompagnement documentaire professionnel.",
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'ItalianiPro', statusBarStyle: 'default' },
}
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1,
  themeColor: '#1B3A6B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <Toaster position="top-center" richColors />
        <Script id="sw" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {})
          }
        `}</Script>
      </body>
    </html>
  )
}
