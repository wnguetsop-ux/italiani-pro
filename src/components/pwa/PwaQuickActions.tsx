'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, Share2, Smartphone, X } from 'lucide-react'
import { toast } from 'sonner'

interface DeferredPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function detectStandalone() {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = typeof window.navigator !== 'undefined' && (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return media || iosStandalone
}

export function PwaQuickActions() {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const isIos = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
  }, [])

  useEffect(() => {
    setIsClient(true)
    setIsStandalone(detectStandalone())

    const onInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as DeferredPromptEvent)
    }

    const onInstalled = () => {
      setDeferredPrompt(null)
      setIsStandalone(true)
      toast.success('ItalianiPro est maintenant installee sur cet appareil')
    }

    window.addEventListener('beforeinstallprompt', onInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!isClient || pathname?.startsWith('/admin')) return null

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://italiani-pro.vercel.app'

  async function handleInstall() {
    if (isStandalone) {
      toast.message('L application est deja installee sur cet appareil')
      return
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        toast.success('Installation lancee')
      } else {
        toast.message('Installation annulee')
      }
      setDeferredPrompt(null)
      return
    }

    if (isIos) {
      setShowIosHelp(true)
      return
    }

    toast.message('Ouvrez le menu du navigateur puis choisissez Installer l application ou Ajouter a l ecran d accueil.')
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ItalianiPro',
          text: 'Prepare ton dossier pour travailler en Italie avec ItalianiPro.',
          url: shareUrl,
        })
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Lien copie. Tu peux le partager a tes amis.')
        return
      }

      toast.message(`Lien a partager: ${shareUrl}`)
    } catch {
      toast.error('Impossible de partager pour le moment')
    }
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: '14px',
          bottom: '18px',
          zIndex: 60,
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={handleShare}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            borderRadius: '999px',
            background: '#059669',
            color: 'white',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 800,
            boxShadow: '0 12px 28px rgba(5, 150, 105, 0.28)',
            cursor: 'pointer',
          }}
        >
          <Share2 size={16} />
          Partager l app
        </button>

        <button
          onClick={handleInstall}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            borderRadius: '999px',
            background: '#1B3A6B',
            color: 'white',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 800,
            boxShadow: '0 12px 28px rgba(27, 58, 107, 0.28)',
            cursor: 'pointer',
          }}
        >
          <Download size={16} />
          {isStandalone ? 'App installee' : 'Installer l app'}
        </button>
      </div>

      {showIosHelp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.62)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
            zIndex: 80,
          }}
        >
          <div
            style={{
              width: 'min(100%, 420px)',
              background: 'white',
              borderRadius: '22px',
              padding: '22px',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.28)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'inline-flex', width: '40px', height: '40px', borderRadius: '999px', alignItems: 'center', justifyContent: 'center', background: '#EFF6FF', color: '#1D4ED8' }}>
                  <Smartphone size={20} />
                </div>
                <h2 style={{ margin: '14px 0 8px', fontSize: '22px', fontWeight: 900, color: '#0F172A' }}>Installer sur iPhone</h2>
              </div>
              <button
                onClick={() => setShowIosHelp(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: '0 0 14px', color: '#475569', lineHeight: 1.7, fontSize: '14px' }}>
              Sur iPhone, Safari ne montre pas de popup d installation automatique. Il faut ajouter l application manuellement a l ecran d accueil.
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              {[
                '1. Ouvre ItalianiPro dans Safari.',
                '2. Appuie sur le bouton Partager du navigateur.',
                '3. Choisis Sur l ecran d accueil puis Ajouter.',
              ].map((step) => (
                <div key={step} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px 14px', color: '#334155', fontSize: '13px', lineHeight: 1.65 }}>
                  {step}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={handleShare}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  borderRadius: '999px',
                  background: '#059669',
                  color: 'white',
                  padding: '11px 15px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <Share2 size={15} />
                Partager le lien
              </button>
              <button
                onClick={() => setShowIosHelp(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '999px',
                  background: 'white',
                  color: '#0F172A',
                  padding: '11px 15px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
