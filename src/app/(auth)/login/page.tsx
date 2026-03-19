'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { login } from '@/lib/auth'
import { isAdmin } from '@/lib/auth'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { toast.error('Veuillez remplir tous les champs'); return }
    setLoading(true)
    try {
      const { role } = await login(email, password)
      toast.success('Connexion réussie !')
      window.location.href = isAdmin(role) ? '/admin' : '/dashboard'
    } catch (err: any) {
      const msg =
        err.code === 'auth/invalid-credential'    ? 'Email ou mot de passe incorrect' :
        err.code === 'auth/too-many-requests'     ? 'Trop de tentatives. Réessayez plus tard.' :
        err.code === 'auth/network-request-failed'? 'Erreur réseau. Vérifiez votre connexion.' :
        'Erreur de connexion'
      toast.error(msg)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F8F9FC', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <Link href="/" style={{ textDecoration:'none' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'44px', height:'44px', background:'#1B3A6B', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:'#D4A017', fontWeight:'900', fontSize:'16px' }}>IP</span>
              </div>
              <span style={{ fontSize:'22px', fontWeight:'800', color:'#111827' }}>
                Italiani<span style={{ color:'#D4A017' }}>Pro</span>
              </span>
            </div>
          </Link>
          <p style={{ marginTop:'8px', color:'#6B7280', fontSize:'14px' }}>Connectez-vous à votre espace</p>
        </div>

        {/* Form */}
        <div className="card" style={{ padding:'28px' }}>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <label className="field-label">Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="field-label">Mot de passe</label>
              <div style={{ position:'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight:'44px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6B7280', padding:'4px' }}
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign:'right', marginTop:'-8px' }}>
              <Link href="/reset-password" style={{ fontSize:'13px', color:'#1B3A6B', textDecoration:'none' }}>
                Mot de passe oublié ?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop:'4px' }}>
              {loading ? <><span className="spinner spinner-white" /> Connexion...</> : 'Se connecter'}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:'20px', paddingTop:'20px', borderTop:'1px solid #F0F2F5', fontSize:'14px', color:'#6B7280' }}>
            Pas encore de compte ?{' '}
            <Link href="/register" style={{ color:'#1B3A6B', fontWeight:'600', textDecoration:'none' }}>
              Créer mon espace
            </Link>
          </div>
        </div>

        <p style={{ textAlign:'center', marginTop:'20px', fontSize:'12px', color:'#9CA3AF' }}>
          ItalianiPro — Accompagnement documentaire uniquement.<br />
          Aucune garantie d'emploi, visa ou nulla osta.
        </p>
      </div>
    </div>
  )
}
