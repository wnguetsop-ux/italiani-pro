import { ImageResponse } from 'next/og'

export const SOCIAL_IMAGE_SIZE = {
  width: 1200,
  height: 630,
}

function LogoMark({ size = 88 }: { size?: number }) {
  const stripeWidth = Math.max(8, Math.round(size * 0.1))
  const dotSize = Math.round(size * 0.26)
  const stemWidth = Math.round(size * 0.16)
  const stemHeight = Math.round(size * 0.44)
  const stemLeft = Math.round(size * 0.34)
  const stemTop = Math.round(size * 0.45)
  const bowlSize = Math.round(size * 0.42)
  const bowlLeft = Math.round(size * 0.44)
  const bowlTop = Math.round(size * 0.24)

  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1b3a6b 0%, #143157 100%)',
        color: '#ffffff',
        fontSize: Math.round(size * 0.38),
        fontWeight: 800,
        letterSpacing: '-0.05em',
        boxShadow: '0 18px 42px rgba(15, 23, 42, 0.18)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: stripeWidth * 3,
        }}
      >
        <div style={{ display: 'flex', width: stripeWidth, background: '#2f8f4e' }} />
        <div style={{ display: 'flex', width: stripeWidth, background: '#fff7e7' }} />
        <div style={{ display: 'flex', width: stripeWidth, background: '#d4423f' }} />
      </div>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: stemLeft,
          top: stemTop,
          width: stemWidth,
          height: stemHeight,
          background: '#f8fafc',
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: bowlLeft,
          top: bowlTop,
          width: bowlSize,
          height: bowlSize,
          borderRadius: '50%',
          border: `${Math.max(7, Math.round(size * 0.09))}px solid #f8fafc`,
          borderLeftColor: 'transparent',
          borderBottomColor: 'transparent',
          transform: 'rotate(45deg)',
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          right: Math.round(size * 0.15),
          top: Math.round(size * 0.1),
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: '#d4a017',
        }}
      />
    </div>
  )
}

export function SocialPreviewCard() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: '48px',
          background:
            'radial-gradient(circle at top right, rgba(47, 143, 78, 0.18), transparent 30%), linear-gradient(135deg, #0f172a 0%, #15345d 38%, #f4efe4 38%, #f4efe4 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            borderRadius: '36px',
            overflow: 'hidden',
            background: '#ffffff',
            boxShadow: '0 28px 80px rgba(15, 23, 42, 0.18)',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '44%',
              padding: '48px 44px',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'linear-gradient(180deg, #16355f 0%, #102847 100%)',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <LogoMark />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 34,
                      fontWeight: 800,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    ItalianiPro
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 18,
                      color: 'rgba(255,255,255,0.76)',
                    }}
                  >
                    Accompagnement documentaire pour travailler en Italie
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  fontSize: 58,
                  lineHeight: 1.02,
                  fontWeight: 800,
                  letterSpacing: '-0.05em',
                  maxWidth: 430,
                }}
              >
                Le vrai dossier candidat, pret pour l Italie.
              </div>

              <div
                style={{
                  display: 'flex',
                  maxWidth: 420,
                  fontSize: 24,
                  lineHeight: 1.34,
                  color: 'rgba(255,255,255,0.82)',
                }}
              >
                CV professionnel, traduction, classement et suivi admin dans un seul outil.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {['Flusso Italia', 'CV italien', 'Dossier final'].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    padding: '10px 16px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.14)',
                    fontSize: 20,
                    color: '#e5edf8',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              width: '56%',
              padding: '44px 38px',
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
                gap: '18px',
                marginBottom: '6px',
              }}
            >
              <LogoMark size={78} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: '#0f172a' }}>
                  Workflow candidature
                </div>
                <div style={{ display: 'flex', fontSize: 22, color: '#44536a', maxWidth: 420 }}>
                  Le candidat envoie ses documents, l IA les transforme, puis le dossier final est exporte.
                </div>
              </div>
            </div>

            {[
              'Le candidat charge son CV et ses documents',
              'ItalianiPro analyse, adapte et traduit le profil',
              'Le back-office classe et exporte le dossier final',
            ].map((item, index) => (
              <div
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '18px 20px',
                  borderRadius: '22px',
                  background: '#ffffff',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: 42,
                    height: 42,
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
                <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color: '#0f172a' }}>
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    SOCIAL_IMAGE_SIZE,
  )
}
