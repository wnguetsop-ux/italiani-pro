'use client'
import { BarChart2, TrendingUp, Users, Star } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-navy-900">Analytics</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {l:'Taux de conversion',v:'34%',  icon:TrendingUp, c:'bg-blue-500'},
          {l:'Dossiers complétés',v:'20',   icon:Users,      c:'bg-green-500'},
          {l:'Temps moyen dossier',v:'18j', icon:BarChart2,  c:'bg-purple-500'},
          {l:'Satisfaction NPS',  v:'4.9★', icon:Star,       c:'bg-gold-500'},
        ].map((s,i)=>(
          <div key={i} className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">{s.l}</div>
              <div className="text-2xl font-black text-navy-900">{s.v}</div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.c}`}>
              <s.icon size={18} className="text-white"/>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-8 shadow-card border border-gray-100 text-center text-gray-400">
        <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Graphiques détaillés disponibles dans la version Pro</p>
      </div>
    </div>
  )
}
