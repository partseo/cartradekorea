'use client'

import { Ship, Anchor, Globe, Calendar } from 'lucide-react'

const MOCK_SHIPMENTS = [
  { id: 'ship-1', buyer: 'Alex Kofi', vessel: 'ASIAN EMPIRE v.42', etd: '2026-06-01', eta: '2026-07-10', stage: 'booking', destination: 'Tema, Ghana' },
  { id: 'ship-2', buyer: 'Tareq Ali', vessel: 'GRAND DUKE v.11', etd: '2026-05-28', eta: '2026-06-28', stage: 'port_delivery', destination: 'Tripoli, Libya' }
]

export default function AdminShipmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Logistics & Shipments</h1>
        <p className="text-slate-400 text-xs mt-0.5">Track ocean freight state, vessel booking, and custom documents.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow divide-y divide-slate-850">
        {MOCK_SHIPMENTS.map((s) => (
          <div key={s.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                <Ship className="h-4.5 w-4.5 text-accent" />
                <span>{s.vessel}</span>
              </h3>
              <p className="text-xs text-slate-400">Buyer: <strong className="text-slate-200">{s.buyer}</strong> | Destination: <strong className="text-slate-200">{s.destination}</strong></p>
              <div className="flex gap-4 text-[10px] text-slate-500 pt-1">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> ETD: {s.etd}</span>
                <span className="flex items-center gap-1"><Anchor className="h-3.5 w-3.5" /> ETA: {s.eta}</span>
              </div>
            </div>
            <span className="bg-accent/20 text-accent text-xs font-bold px-3 py-1 rounded w-fit capitalize">
              {s.stage.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
