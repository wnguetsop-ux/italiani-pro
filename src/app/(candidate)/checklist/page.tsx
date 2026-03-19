'use client'
import { useState } from 'react'
import { CheckCircle, Circle, AlertTriangle, Clock, Upload, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const SECTIONS = [
  {
    title: 'Documents d\'identité', icon: '🪪',
    items: [
      { id:'1', label:'Passeport valide (min. 6 mois restants)',    done:true,  urgent:false },
      { id:'2', label:'Acte de naissance officiel',                done:true,  urgent:false },
      { id:'3', label:'Casier judiciaire (moins de 3 mois)',       done:true,  urgent:false },
      { id:'4', label:'Photo d\'identité récente (biométrique)',   done:false, urgent:true  },
      { id:'5', label:'Justificatif de domicile (moins de 3 mois)',done:false, urgent:false },
    ]
  },
  {
    title: 'Documents professionnels', icon: '💼',
    items: [
      { id:'6',  label:'CV optimisé (version française)',          done:true,  urgent:false },
      { id:'7',  label:'CV version anglaise',                      done:false, urgent:false },
      { id:'8',  label:'Lettre de motivation personnalisée',       done:false, urgent:true  },
      { id:'9',  label:'Lettres de recommandation employeurs',     done:false, urgent:false },
      { id:'10', label:'Contrat ou offre d\'emploi proposé',       done:false, urgent:false },
    ]
  },
  {
    title: 'Formation & diplômes', icon: '🎓',
    items: [
      { id:'11', label:'Diplômes et certificats scolaires',        done:true,  urgent:false },
      { id:'12', label:'Attestations de formation professionnelle',done:false, urgent:false },
      { id:'13', label:'Attestation niveau de langue (FR/EN/IT)',  done:false, urgent:false },
    ]
  },
  {
    title: 'Documents financiers', icon: '🏦',
    items: [
      { id:'14', label:'Relevés bancaires (3 derniers mois)',      done:false, urgent:false },
    ]
  },
]

export default function ChecklistPage() {
  const allItems = SECTIONS.flatMap(s => s.items)
  const done  = allItems.filter(i => i.done).length
  const total = allItems.length
  const pct   = Math.round((done / total) * 100)

  const [open, setOpen] = useState<string[]>(SECTIONS.map(s => s.title))
  const toggle = (t: string) => setOpen(o => o.includes(t) ? o.filter(x => x !== t) : [...o, t])

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Checklist dossier</h1>
        <p className="text-gray-500 text-sm mt-0.5">Toutes les pièces nécessaires pour votre candidature Flussi</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-3xl font-black text-navy-900">{pct}%</div>
            <div className="text-sm text-gray-500">{done}/{total} documents complétés</div>
          </div>
          <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-2xl', pct === 100 ? 'bg-green-100' : pct >= 60 ? 'bg-gold-100' : 'bg-red-50')}>
            {pct === 100 ? '✅' : pct >= 60 ? '📋' : '⚠️'}
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full progress-bar transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
        {allItems.filter(i => i.urgent && !i.done).length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700">
            <AlertTriangle size={13} />
            <strong>{allItems.filter(i=>i.urgent&&!i.done).length} pièce(s) urgente(s)</strong> à fournir immédiatement
          </div>
        )}
      </div>

      {/* Sections */}
      {SECTIONS.map(section => {
        const sectionDone  = section.items.filter(i => i.done).length
        const sectionTotal = section.items.length
        const isOpen       = open.includes(section.title)

        return (
          <div key={section.title} className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <button onClick={() => toggle(section.title)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.icon}</span>
                <div className="text-left">
                  <div className="font-bold text-navy-900 text-sm">{section.title}</div>
                  <div className="text-xs text-gray-500">{sectionDone}/{sectionTotal} complétés</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {section.items.map(i => (
                    <div key={i.id} className={cn('w-2 h-2 rounded-full', i.done ? 'bg-green-400' : i.urgent ? 'bg-red-400' : 'bg-gray-200')} />
                  ))}
                </div>
                <ChevronDown size={16} className={cn('text-gray-400 transition-transform', isOpen && 'rotate-180')} />
              </div>
            </button>

            {isOpen && (
              <div className="px-6 pb-4 space-y-2.5 border-t border-gray-100">
                {section.items.map(item => (
                  <div key={item.id} className={cn(
                    'flex items-center justify-between gap-3 p-3 rounded-xl',
                    item.done ? 'bg-green-50' : item.urgent ? 'bg-red-50' : 'bg-gray-50'
                  )}>
                    <div className="flex items-center gap-3">
                      {item.done
                        ? <CheckCircle size={18} className="text-green-500 shrink-0" />
                        : item.urgent
                        ? <AlertTriangle size={18} className="text-red-500 shrink-0" />
                        : <Circle size={18} className="text-gray-300 shrink-0" />
                      }
                      <span className={cn('text-sm', item.done ? 'text-green-800 line-through' : 'text-gray-700')}>{item.label}</span>
                    </div>
                    {!item.done && (
                      <label className={cn('text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 transition whitespace-nowrap',
                        item.urgent ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-navy-800 hover:bg-navy-700 text-white')}>
                        <Upload size={11} /> Uploader
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 text-center">
        Cette checklist est indicative. Votre agent peut vous demander des documents supplémentaires selon votre profil et le secteur ciblé.
      </div>
    </div>
  )
}
