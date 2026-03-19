import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ItalianiPro — Accompagnement candidature Italie',
    template: '%s | ItalianiPro',
  },
  description:
    'Plateforme premium d\'accompagnement documentaire et de préparation de candidature pour travailler en Italie. Préparez votre dossier, organisez vos documents, suivez votre parcours.',
  keywords: ['italie', 'travail italie', 'flussi', 'candidature italie', 'cameroun', 'afrique francophone'],
  openGraph: {
    title: 'ItalianiPro',
    description: 'Votre partenaire de confiance pour la préparation de candidature vers l\'Italie.',
    type: 'website',
    locale: 'fr_FR',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0f2454" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: { fontFamily: 'var(--font-sora)' },
          }}
        />
      </body>
    </html>
  )
}
