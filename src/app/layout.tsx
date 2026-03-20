import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import '../styles/globals.css'
import { Toaster } from 'sonner'
import { PwaQuickActions } from '@/components/pwa/PwaQuickActions'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://italiani-pro.vercel.app'),
  applicationName: 'ItalianiPro',
  title: { default: 'ItalianiPro', template: '%s | ItalianiPro' },
  description: "Preparez votre candidature pour travailler en Italie. Accompagnement documentaire professionnel.",
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'ItalianiPro',
    locale: 'fr_FR',
    title: 'ItalianiPro',
    description: "Preparez votre candidature pour travailler en Italie. Accompagnement documentaire professionnel.",
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'ItalianiPro - candidature et accompagnement pour travailler en Italie',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ItalianiPro',
    description: "Preparez votre candidature pour travailler en Italie. Accompagnement documentaire professionnel.",
    images: ['/twitter-image'],
  },
  appleWebApp: { capable: true, title: 'ItalianiPro', statusBarStyle: 'default' },
  icons: {
    apple: '/icon-192.png',
    icon: ['/icon-192.png', '/icon-512.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1B3A6B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <PwaQuickActions />
        <Toaster position="top-center" richColors />
        <Script id="sw" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {})
            })
          }
        `}</Script>
      </body>
    </html>
  )
}
