'use client'
import { Users, UserPlus, Mail, Phone } from 'lucide-react'

const TEAM = [
  { name:'Jean Kamdem',   role:'Agent dossier',    email:'jean@italianipro.com',    status:'active', dossiers:12 },
  { name:'Aissatou Ba',   role:'Coach CV & Entretien',email:'aissatou@italianipro.com',status:'active', dossiers:8  },
  { name:'Paul Mvondo',   role:'Agent dossier',    email:'paul@italianipro.com',    status:'active', dossiers:10 },
]

export default function TeamPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Équipe</h1>
          <p className="text-gray-500 text-sm mt-0.5">{TEAM.length} membres actifs</p>
        </div>
        <button className="flex items-center gap-2 bg-navy-800 text-white px-4 py-2 rounded-xl text-sm hover:bg-navy-700 transition">
          <UserPlus size={15}/> Ajouter un agent
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEAM.map((m,i)=>(
          <div key={i} className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 card-hover">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-navy-100 flex items-center justify-center text-navy-700 font-black">
                {m.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div>
                <div className="font-bold text-gray-800">{m.name}</div>
                <div className="text-xs text-gray-500">{m.role}</div>
              </div>
            </div>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2"><Mail size={12}/>{m.email}</div>
              <div className="flex items-center gap-2"><Users size={12}/>{m.dossiers} dossiers actifs</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"/>
              <span className="text-xs text-green-600 font-medium">Actif</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
