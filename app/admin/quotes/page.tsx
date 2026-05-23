'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, RefreshCw, AlertCircle, Phone, Mail, MapPin, Check } from 'lucide-react'

// 목데이터: Fallback 견적서 목록
const MOCK_ADMIN_QUOTES = [
  {
    id: 'quote-1',
    buyer_name: 'Alex Kofi',
    buyer_email: 'alex.kofi@gmail.com',
    whatsapp: '+233 24 123 4567',
    destination_country: 'Ghana',
    destination_port: 'Tema Port',
    message: 'I need a CIF price quote including sea freight and marine cargo insurance.',
    created_at: '2026-05-23T10:15:30Z',
    status: 'under_review',
    car: { title: 'Hyundai Avante 1.6 Smart', price_usd: 11500 }
  },
  {
    id: 'quote-2',
    buyer_name: 'Minh Hoang',
    buyer_email: 'minh.hoang@gmail.com',
    whatsapp: '+84 90 123 4567',
    destination_country: 'Vietnam',
    destination_port: 'Haiphong Port',
    message: 'Please send photo of underbody. Thank you.',
    created_at: '2026-05-22T14:22:10Z',
    status: 'pending',
    car: { title: 'Kia Sportage 2.0 Trendy', price_usd: 14200 }
  },
  {
    id: 'quote-3',
    buyer_name: 'Tareq Ali',
    buyer_email: 'tareq.ali@yahoo.com',
    whatsapp: '+218 91 123 4567',
    destination_country: 'Libya',
    destination_port: 'Tripoli Port',
    message: '',
    created_at: '2026-05-21T09:40:00Z',
    status: 'sent',
    car: { title: 'Hyundai Santa Fe 2.2 Prestige', price_usd: 23800 }
  }
]

export default function AdminQuotesPage() {
  const supabase = createClient()

  const [quotes, setQuotes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuotes() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('quote_requests')
          .select('*, cars(title, price_usd), countries(name), ports(name)')
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          const formatted = data.map((q: any) => ({
            id: q.id,
            buyer_name: q.buyer_name,
            buyer_email: q.buyer_email,
            whatsapp: q.whatsapp || 'N/A',
            destination_country: q.countries?.name || 'Unknown',
            destination_port: q.ports?.name || 'Unknown',
            message: q.message || '',
            created_at: q.created_at,
            status: q.status,
            car: {
              title: q.cars?.title || 'Selected Vehicle',
              price_usd: Number(q.cars?.price_usd || 0)
            }
          }))
          setQuotes(formatted)
        } else {
          setQuotes(MOCK_ADMIN_QUOTES)
        }
      } catch (err) {
        setQuotes(MOCK_ADMIN_QUOTES)
      } finally {
        setIsLoading(false)
      }
    }
    loadQuotes()
  }, [supabase])

  const handleStatusChange = async (quoteId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ status: newStatus })
        .eq('id', quoteId)

      if (error) throw error

      setQuotes(quotes.map((q) => q.id === quoteId ? { ...q, status: newStatus } : q))
      showFeedback('Quote status updated successfully.')
    } catch (e) {
      setQuotes(quotes.map((q) => q.id === quoteId ? { ...q, status: newStatus } : q))
      showFeedback('Status updated locally.')
    }
  }

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3000)
  }

  return (
    <div className="space-y-6">
      
      {/* 타이틀 */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Quotes Management</h1>
        <p className="text-slate-400 text-xs mt-0.5">Manage buyer quote requests, shipping routes, and update statuses.</p>
      </div>

      {feedback && (
        <div className="bg-slate-900 border border-slate-800 text-accent text-xs rounded-lg p-3 flex items-center gap-2 shadow animate-in fade-in duration-200">
          <Check className="h-4.5 w-4.5 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 리스트 본문 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl py-20 text-center">
            <RefreshCw className="h-8 w-8 text-slate-500 animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-xs font-semibold">Loading quote requests...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl py-20 text-center">
            <ClipboardList className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No quote requests received yet.</p>
          </div>
        ) : (
          quotes.map((q) => (
            <div key={q.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow hover:border-slate-750 transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              
              {/* 왼쪽: 바이어 및 요청 상세 정보 */}
              <div className="space-y-3.5 flex-grow">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold">{new Date(q.created_at).toLocaleString()}</span>
                  <span className="text-slate-700 text-xs">|</span>
                  <span className="text-slate-400 text-xs font-semibold">ID: {q.id.slice(0, 8)}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-white text-base flex flex-wrap items-center gap-2">
                    <span>{q.buyer_name}</span>
                    <span className="text-xs font-bold text-accent">({q.car.title})</span>
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-500" /> {q.buyer_email}</span>
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-500" /> {q.whatsapp}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-500" /> {q.destination_country} ({q.destination_port})</span>
                  </div>
                </div>

                {q.message && (
                  <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 text-xs text-slate-400 leading-relaxed italic max-w-2xl">
                    "{q.message}"
                  </div>
                )}
              </div>

              {/* 오른쪽: 상태 관리 셀렉터 및 요금 정보 */}
              <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-800">
                <div className="text-left lg:text-right space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Vehicle FOB Price</span>
                  <span className="text-lg font-black text-white">${q.car.price_usd.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold hidden sm:inline">Status:</span>
                  <select
                    value={q.status}
                    onChange={(e) => handleStatusChange(q.id, e.target.value)}
                    className={`bg-slate-950 border text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer ${
                      q.status === 'pending'
                        ? 'text-amber-400 border-amber-950/60'
                        : q.status === 'under_review'
                        ? 'text-blue-400 border-blue-950/60'
                        : q.status === 'sent'
                        ? 'text-emerald-400 border-emerald-950/60'
                        : q.status === 'completed'
                        ? 'text-white border-slate-700'
                        : 'text-red-400 border-red-950/60'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="sent">Sent Quote</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  
                  <Link
                    href={`/admin/quotes/${q.id}`}
                    className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    Details
                  </Link>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  )
}
