import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ItalianiPro'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: '54px',
          background:
            'linear-gradient(135deg, #0f172a 0%, #16355f 45%, #f4f1e8 45%, #f4f1e8 100%)',
          color: '#0f172a',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            borderRadius: '34px',
            overflow: 'hidden',
            background: '#ffffff',
            boxShadow: '0 28px 80px rgba(15, 23, 42, 0.18)',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '44%',
              padding: '52px 44px',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'linear-gradient(180deg, #17355e 0%, #102847 100%)',
              color: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '-0.03em',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 64,
                  height: 64,
                  borderRadius: '18px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  color: '#17355e',
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                IP
              </div>
              ItalianiPro
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: 58,
                  lineHeight: 1.04,
                  fontWeight: 800,
                  letterSpacing: '-0.05em',
                }}
              >
                Travaillez en Italie avec un dossier vraiment pret.
              </div>
              <div
                style={{
                  display: 'flex',
                  maxWidth: 420,
                  fontSize: 24,
                  lineHeight: 1.35,
                  color: 'rgba(255,255,255,0.82)',
                }}
              >
                CV professionnel, traduction, documents classes et accompagnement pour le flusso.
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                fontSize: 22,
                color: '#dfe8f5',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  padding: '10px 16px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                }}
              >
                Flusso Italia
              </div>
              <div
                style={{
                  display: 'flex',
                  padding: '10px 16px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                }}
              >
                CV IT
              </div>
              <div
                style={{
                  display: 'flex',
                  padding: '10px 16px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                }}
              >
                Dossier candidat
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              width: '56%',
              padding: '46px 40px',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '18px',
              background: '#f7f1e6',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 92,
                  height: 92,
                  borderRadius: '24px',
                  background: '#1f4b80',
                  color: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 42,
                  fontWeight: 800,
                }}
              >
                CV
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: '#0f172a' }}>
                  Workflow candidature
                </div>
                <div style={{ display: 'flex', fontSize: 22, color: '#42526a' }}>
                  Collecte, analyse IA, adaptation italienne et suivi admin.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                paddingTop: '14px',
              }}
            >
              {[
                'Le candidat envoie ses documents',
                'L IA restructure le CV et la lettre',
                'Le dossier final est pret pour postuler',
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '18px 20px',
                    borderRadius: '20px',
                    background: '#ffffff',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: 40,
                      height: 40,
                      borderRadius: '999px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#ebf1f8',
                      color: '#1f4b80',
                      fontSize: 22,
                      fontWeight: 800,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ display: 'flex', fontSize: 24, color: '#0f172a', fontWeight: 600 }}>
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
