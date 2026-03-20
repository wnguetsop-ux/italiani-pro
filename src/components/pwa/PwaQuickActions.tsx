'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, Plus, Share2, Smartphone, X } from 'lucide-react'
import { toast } from 'sonner'

interface DeferredPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type InstallGuideMode = 'ios_safari' | 'ios_other' | 'android' | 'browser' | null

function detectStandalone() {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    typeof window.navigator !== 'undefined' &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return media || iosStandalone
}

function getInstallGuide(mode: InstallGuideMode) {
  switch (mode) {
    case 'ios_other':
      return {
        title: 'Installer sur iPhone',
        description: "Sur iPhone, l installation PWA fonctionne correctement depuis Safari. Ouvre d abord ItalianiPro dans Safari, puis ajoute-le a l ecran d accueil.",
        steps: [
          '1. Ouvre le lien dans Safari.',
          '2. Appuie sur le bouton Partager du navigateur.',
          '3. Choisis Sur l ecran d accueil puis Ajouter.',
        ],
      }
    case 'ios_safari':
      return {
        title: 'Installer sur iPhone',
        description: "Safari n affiche pas de popup automatique. L installation se fait manuellement depuis le menu Partager.",
        steps: [
          '1. Appuie sur le bouton Partager de Safari.',
          '2. Choisis Sur l ecran d accueil.',
          '3. Valide Ajouter pour installer l app.',
        ],
      }
    case 'android':
      return {
        title: 'Installer sur Android',
        description: "Si Chrome n affiche pas encore la popup, ouvre le menu du navigateur puis utilise Installer l application ou Ajouter a l ecran d accueil.",
        steps: [
          '1. Ouvre ItalianiPro dans Chrome ou Edge.',
          '2. Appuie sur le menu du navigateur.',
          '3. Choisis Installer l application ou Ajouter a l ecran d accueil.',
        ],
      }
    case 'browser':
      return {
        title: 'Installation guidee',
        description: "Ce navigateur ne propose pas toujours le prompt PWA. Ouvre le lien dans Safari sur iPhone, ou dans Chrome / Edge sur Android.",
        steps: [
          '1. Copie ou partage le lien ItalianiPro.',
          '2. Ouvre-le dans Safari, Chrome ou Edge.',
          '3. Utilise l option Installer l application du navigateur.',
        ],
      }
    default:
      return null
  }
}

export function PwaQuickActions() {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [guideMode, setGuideMode] = useState<InstallGuideMode>(null)
  const [isClient, setIsClient] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isIos = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
  }, [])

  const isSafari = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios|opr\//i.test(navigator.userAgent)
  }, [])

  const isChromiumLike = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /chrome|chromium|edg\//i.test(navigator.userAgent)
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
      setMenuOpen(false)
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
  const showInstallAction = !isStandalone

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
      setMenuOpen(false)
      return
    }

    if (isIos) {
      setGuideMode(isSafari ? 'ios_safari' : 'ios_other')
      return
    }

    if (isChromiumLike) {
      setGuideMode('android')
      return
    }

    setGuideMode('browser')
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ItalianiPro',
          text: 'Prepare ton dossier pour travailler en Italie avec ItalianiPro.',
          url: shareUrl,
        })
        setMenuOpen(false)
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Lien copie. Tu peux le partager a tes amis.')
        setMenuOpen(false)
        return
      }

      toast.message(`Lien a partager: ${shareUrl}`)
    } catch {
      toast.error('Impossible de partager pour le moment')
    }
  }

  const guide = getInstallGuide(guideMode)

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: '14px',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '10px',
        }}
      >
        {menuOpen && (
          <div
            style={{
              width: 'min(240px, calc(100vw - 28px))',
              background: 'rgba(15, 23, 42, 0.96)',
              color: 'white',
              borderRadius: '18px',
              padding: '12px',
              boxShadow: '0 18px 44px rgba(15, 23, 42, 0.28)',
              display: 'grid',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'rgba(255,255,255,0.76)', padding: '2px 4px 6px' }}>
              Outils rapides ItalianiPro
            </div>
            <button
              onClick={handleShare}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                border: 'none',
                borderRadius: '14px',
                background: '#059669',
                color: 'white',
                padding: '12px 14px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={16} />
                Partager l app
              </span>
            </button>
            {showInstallAction && (
              <button
                onClick={handleInstall}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  border: 'none',
                  borderRadius: '14px',
                  background: '#1B3A6B',
                  color: 'white',
                  padding: '12px 14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={16} />
                  Installer l app
                </span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => setMenuOpen((current) => !current)}
          aria-label={menuOpen ? 'Fermer le menu rapide' : 'Ouvrir le menu rapide'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            border: 'none',
            borderRadius: '999px',
            background: '#0F172A',
            color: 'white',
            boxShadow: '0 16px 36px rgba(15, 23, 42, 0.28)',
            cursor: 'pointer',
          }}
        >
          {menuOpen ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {guide && (
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
                <div
                  style={{
                    display: 'inline-flex',
                    width: '40px',
                    height: '40px',
                    borderRadius: '999px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                  }}
                >
                  <Smartphone size={20} />
                </div>
                <h2 style={{ margin: '14px 0 8px', fontSize: '22px', fontWeight: 900, color: '#0F172A' }}>
                  {guide.title}
                </h2>
              </div>
              <button
                onClick={() => setGuideMode(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: '0 0 14px', color: '#475569', lineHeight: 1.7, fontSize: '14px' }}>
              {guide.description}
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              {guide.steps.map((step) => (
                <div
                  key={step}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    color: '#334155',
                    fontSize: '13px',
                    lineHeight: 1.65,
                  }}
                >
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
                onClick={() => setGuideMode(null)}
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
