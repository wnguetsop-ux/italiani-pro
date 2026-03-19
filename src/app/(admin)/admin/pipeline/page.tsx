'use client'
import { useState } from 'react'
import { Flame, Eye, MessageCircle, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const COLUMNS = [
  { id:'draft',           label:'Brouillons',         color:'bg-gray-100',    count:4  },
  { id:'incomplete',      label:'Incomplets',         color:'bg-red-100',     count:7  },
  { id:'in_review',       label:'En vérification',    color:'bg-blue-100',    count:5  },
  { id:'pending_payment', label:'Attente paiement',   color:'bg-orange-100',  count:4  },
  { id:'in_progress',     label:'En cours',           color:'bg-indigo-100',  count:9  },
  { id:'ready',           label:'Prêts',              color:'bg-green-100',   count:3  },
]

const CARDS: Record<string, {id:string;name:string;pack:string;score:number;urgent?:boolean}[]> = {
  draft:           [{id:'d1',name:'Ibrahim Kouyate', pack:'—',       score:10},{id:'d2',name:'Claire Mballa',  pack:'—',       score:5}],
  incomplete:      [{id:'i1',name:'Patrick Essama',  pack:'CV',      score:32,urgent:false},{id:'i2',name:'Rose Nguema',   pack:'Dossier', score:28}],
  in_review:       [{id:'r1',name:'Casimir Ondo',    pack:'Dossier', score:65},{id:'r2',name:'Marie Tchouaffe',pack:'Premium', score:78,urgent:true}],
  pending_payment: [{id:'p1',name:'Edouard Mbarga',  pack:'Dossier', score:55},{id:'p2',name:'Sylvie Ateba',  pack:'CV',      score:48}],
  in_progress:     [{id:'g1',name:'Fatima Diallo',   pack:'Candidature',score:90},{id:'g2',name:'Jean Nkolo', pack:'Premium', score:82}],
  ready:           [{id:'x1',name:'Christine Ateba', pack:'Premium', score:100}],
}

export default function PipelinePage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Pipeline des dossiers</h1>
        <p className="text-gray-500 text-sm mt-0.5">Vue Kanban — glissez les cartes pour changer le statut</p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map(col => (
            <div key={col.id} className={cn('rounded-2xl p-4 w-72', col.color)}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-bold text-sm text-gray-700">{col.label}</span>
                  <span className="ml-2 text-xs bg-white/70 px-2 py-0.5 rounded-full font-bold text-gray-600">{col.count}</span>
                </div>
              </div>
              <div className="space-y-3">
                {(CARDS[col.id] ?? []).map(card => (
                  <div key={card.id} className="bg-white rounded-xl p-4 shadow-sm border border-white/50 card-hover">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {card.urgent && <Flame size={13} className="text-red-500 shrink-0" />}
                        <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-[10px]">
                          {card.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800 text-xs truncate">{card.name}</div>
                          <div className="text-[10px] text-gray-500">{card.pack}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Link href={`/admin/candidates/${card.id}`}
                          className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center hover:bg-navy-100 transition">
                          <Eye size={11} className="text-gray-500" />
                        </Link>
                        <button className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center hover:bg-blue-100 transition">
                          <MessageCircle size={11} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full progress-bar" style={{ width: `${card.score}%` }} />
                      </div>
                      <span className={cn('text-[10px] font-bold', card.score>=70?'text-green-600':card.score>=40?'text-orange-500':'text-red-500')}>
                        {card.score}%
                      </span>
                    </div>
                  </div>
                ))}
                {(CARDS[col.id]??[]).length === 0 && (
                  <div className="text-center py-6 text-xs text-gray-400">Aucun dossier</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
