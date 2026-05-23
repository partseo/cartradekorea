'use client'

import { useState } from 'react'
import { MessageSquare, ShieldCheck, Mail, Clock } from 'lucide-react'

const MOCK_INQUIRIES = [
  { id: '1', name: 'James A.', email: 'james@accra.com', subject: 'Bulk shipping discount', message: 'Hi, I plan to buy 5 units of Hyundai Avante. Is there any shipping container price discount?', date: '2026-05-23' },
  { id: '2', name: 'Dmitry L.', email: 'dmitry@vladivostok.ru', subject: 'Left-hand drive details', message: 'Hello, are all Korean cars left-hand drive? I need clarification for importation rules.', date: '2026-05-21' }
]

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState(MOCK_INQUIRIES)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">General Inquiries</h1>
        <p className="text-slate-400 text-xs mt-0.5">Manage 1:1 customer business partnership messages.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow space-y-4">
        {inquiries.map((inq) => (
          <div key={inq.id} className="border-b border-slate-850 last:border-none pb-4 last:pb-0 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {inq.email}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {inq.date}</span>
            </div>
            <h3 className="font-extrabold text-white text-sm">{inq.subject} <span className="text-xs font-semibold text-slate-400">by {inq.name}</span></h3>
            <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg leading-relaxed italic">"{inq.message}"</p>
          </div>
        ))}
      </div>
    </div>
  )
}
