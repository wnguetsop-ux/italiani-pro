'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Shield, AlertTriangle, ArrowRight } from 'lucide-react'
import { loginUser } from '@/lib/auth'
import { toast } from 'sonner'

const ADMIN_ROLES = ['admin', 'super_admin', 'agent', 'coach']

export default function LoginPage() {
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { role } = await loginUser(form.email, form.password)
      toast.success('Connexion réussie !')

      // ✅ window.location.href pour forcer rechargement complet
      // Le middleware relit les cookies et laisse passer
      if (ADMIN_ROLES.includes(role)) {
        window.location.href = '/admin/dashboard'
      } else {
        window.location.href = '/dashboard'
      }

    } catch (err: any) {
      const msg =
        err.code === 'auth/invalid-credential'   ? 'Email ou mot de passe incorrect.' :
        err.code === 'auth/user-not-found'        ? 'Aucun compte avec cet email.' :
        err.code === 'auth/wrong-password'        ? 'Mot de passe incorrect.' :
        err.code === 'auth/too-many-requests'     ? 'Trop de tentatives. Réessayez dans quelques minutes.' :
        err.code === 'auth/network-request-failed'? 'Erreur réseau. Vérifiez votre connexion.' :
        'Erreur de connexion. Vérifiez vos identifiants.'
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-72 h-72 bg-gold-400/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
              <span className="text-gold-400 font-bold">IP</span>
            </div>
            <span className="text-white font-bold text-xl">Italiani<span className="text-gold-400">Pro</span></span>
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">Bienvenue sur votre espace</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            Gérez votre dossier, suivez l'avancement, consultez les preuves de travail
            et préparez votre candidature vers l'Italie.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 leading-relaxed">
            <AlertTriangle className="inline w-3 h-3 mr-1 mb-0.5" />
            Aucune garantie d'emploi, de visa ou de nulla osta n'est offerte par ItalianiPro.
          </div>
        </div>
        <div className="relative z-10 text-xs text-gray-600">© {new Date().getFullYear()} ItalianiPro</div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center">
              <span className="text-gold-400 font-bold text-sm">IP</span>
            </div>
            <span className="text-navy-900 font-bold">Italiani<span className="text-gold-500">Pro</span></span>
          </div>

          <div className="bg-white rounded-2xl shadow-card-lg p-8 border border-gray-100">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-navy-900">Connexion</h1>
              <p className="text-gray-500 text-sm mt-1">Accédez à votre espace ItalianiPro</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse e-mail</label>
                <input
                  type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="vous@exemple.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'} required value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 transition"
                  />
                  <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/reset-password" className="text-xs text-navy-600 hover:text-navy-800">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-navy-800 hover:bg-navy-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connexion en cours...</>
                ) : (
                  <><span>Se connecter</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Pas encore de compte ?{' '}
                <Link href="/register" className="text-navy-700 font-semibold hover:text-navy-900">
                  Créer mon espace
                </Link>
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 justify-center">
              <Shield size={11} /> Connexion sécurisée Firebase — données chiffrées
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}