'use client'
import { useState } from 'react'
import { Save, User, MapPin, Briefcase, Globe, Shield } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({
    full_name: 'Marie Tchouaffe', email: 'marie.t@gmail.com', phone: '+237 699 123 456',
    country: 'CM', city: 'Douala', profession: 'Aide-soignante',
    experience_years: '4', education_level: 'licence',
    target_sector: 'agriculture', target_region: 'Toscane',
    languages: 'Français, Anglais',
  })

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Profil mis à jour avec succès !')
  }

  const Section = ({ icon: Icon, title, children }: any) => (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <Icon size={17} className="text-navy-600" />
        <h2 className="font-bold text-navy-900 text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )

  const Field = ({ label, children }: any) => (
    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>{children}</div>
  )

  const Input = ({ name, type='text', placeholder }: any) => (
    <input type={type} value={(form as any)[name]}
      onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 transition" />
  )

  const Select = ({ name, children }: any) => (
    <select value={(form as any)[name]}
      onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white transition">
      {children}
    </select>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Mon profil</h1>
          <p className="text-gray-500 text-sm mt-0.5">Ces informations permettent à votre agent de mieux vous accompagner</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-navy-100 flex items-center justify-center text-navy-700 font-black text-xl">MT</div>
      </div>

      <form onSubmit={save} className="space-y-5">
        <Section icon={User} title="Informations personnelles">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nom complet *"><Input name="full_name" /></Field>
            <Field label="Email *"><Input name="email" type="email" /></Field>
            <Field label="Téléphone WhatsApp"><Input name="phone" placeholder="+237 6XX XXX XXX" /></Field>
            <Field label="Ville actuelle"><Input name="city" /></Field>
          </div>
        </Section>

        <Section icon={Briefcase} title="Situation professionnelle">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Profession actuelle"><Input name="profession" /></Field>
            <Field label="Années d'expérience">
              <Select name="experience_years">
                {['0','1','2','3','4','5','6','7','8','9','10+'].map(v=><option key={v} value={v}>{v} an(s)</option>)}
              </Select>
            </Field>
            <Field label="Niveau d'études">
              <Select name="education_level">
                <option value="none">Sans diplôme</option>
                <option value="bac">Baccalauréat</option>
                <option value="bts">BTS / DUT</option>
                <option value="licence">Licence</option>
                <option value="master">Master</option>
                <option value="doctorat">Doctorat</option>
              </Select>
            </Field>
            <Field label="Langues parlées"><Input name="languages" placeholder="Français, Anglais, Ewondo…" /></Field>
          </div>
        </Section>

        <Section icon={MapPin} title="Projet en Italie">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Secteur ciblé">
              <Select name="target_sector">
                <option value="">— Choisir —</option>
                <option value="agriculture">🌾 Agriculture / Saisonniers</option>
                <option value="tourism">🏨 Tourisme / Hôtellerie</option>
                <option value="construction">🏗️ Construction / BTP</option>
                <option value="care">🏥 Aide à domicile / Soins</option>
                <option value="other">🔧 Autre</option>
              </Select>
            </Field>
            <Field label="Région d'Italie ciblée">
              <Input name="target_region" placeholder="Ex: Toscane, Sicile, Lombardie…" />
            </Field>
          </div>
        </Section>

        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
          <Shield size={14} className="text-amber-600 shrink-0" />
          Vos données sont chiffrées et stockées de manière sécurisée. Vous pouvez demander leur suppression à tout moment.
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-navy-800 hover:bg-navy-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={16}/> Enregistrer les modifications</>
          }
        </button>
      </form>
    </div>
  )
}
