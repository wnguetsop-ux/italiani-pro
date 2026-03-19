'use client'
import { formatCFA } from '@/lib/utils'
import { TrendingUp, DollarSign, Download } from 'lucide-react'

export default function FinancePage() {
  const DATA = [
    { month:'Jan', rev:520000 },{ month:'Fév', rev:780000 },{ month:'Mar', rev:650000 },
    { month:'Avr', rev:920000 },{ month:'Mai', rev:1100000 },{ month:'Juin', rev:1350000 },
  ]
  const total = DATA.reduce((a,b)=>a+b.rev,0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Finance</h1>
          <p className="text-gray-500 text-sm mt-0.5">Revenus et paiements</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
          <Download size={15}/> Exporter
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {l:"Revenus ce mois",v:formatCFA(1350000),icon:DollarSign,c:'bg-emerald-500'},
          {l:"Revenus 6 mois", v:formatCFA(total),  icon:TrendingUp, c:'bg-navy-700'},
          {l:"Paiements en attente",v:"12",          icon:DollarSign,c:'bg-orange-500'},
          {l:"Factures émises",    v:"48",           icon:DollarSign,c:'bg-blue-500'},
        ].map((s,i)=>(
          <div key={i} className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{s.l}</div>
              <div className="text-2xl font-black text-navy-900">{s.v}</div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.c}`}>
              <s.icon size={18} className="text-white" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
        <h2 className="font-bold text-navy-900 mb-6">Revenus mensuels</h2>
        <div className="flex items-end gap-3 h-48">
          {DATA.map(d=>{
            const h = Math.round((d.rev / Math.max(...DATA.map(x=>x.rev))) * 100)
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-bold text-navy-800">{formatCFA(d.rev).replace('XAF','').trim()}</div>
                <div className="w-full bg-gradient-to-t from-navy-700 to-navy-500 rounded-t-lg" style={{height:`${h}%`}} />
                <div className="text-xs text-gray-500">{d.month}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
