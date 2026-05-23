import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { 
  Car, ClipboardList, MessageSquare, 
  ArrowUpRight, Plus, CheckCircle 
} from 'lucide-react'

// 목데이터: Fallback 통계 수치
const MOCK_STATS = {
  totalCars: 12,
  activeCars: 9,
  totalQuotes: 4,
  newInquiries: 3
}

const MOCK_LATEST_QUOTES = [
  {
    id: 'quote-1',
    buyer_name: 'Alex Kofi',
    destination_country: 'Ghana',
    whatsapp: '+233 24 123 4567',
    created_at: '2026-05-23T10:15:30Z',
    status: 'under_review',
    car: { title: 'Hyundai Avante 1.6 Smart' }
  },
  {
    id: 'quote-2',
    buyer_name: 'Minh Hoang',
    destination_country: 'Vietnam',
    whatsapp: '+84 90 123 4567',
    created_at: '2026-05-22T14:22:10Z',
    status: 'pending',
    car: { title: 'Kia Sportage 2.0 Trendy' }
  },
  {
    id: 'quote-3',
    buyer_name: 'Tareq Ali',
    destination_country: 'Libya',
    whatsapp: '+218 91 123 4567',
    created_at: '2026-05-21T09:40:00Z',
    status: 'sent',
    car: { title: 'Hyundai Santa Fe 2.2 Prestige' }
  }
]

export default async function AdminDashboard() {
  const supabase = await createClient()
  let stats = MOCK_STATS
  let latestQuotes = MOCK_LATEST_QUOTES

  try {
    // 1. 차량 카운트
    const { count: totalCount } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })

    const { count: activeCount } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')

    // 2. 견적 카운트
    const { count: quoteCount } = await supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true })

    // 3. 문의 카운트
    const { count: inquiryCount } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('is_resolved', false)

    stats = {
      totalCars: totalCount ?? MOCK_STATS.totalCars,
      activeCars: activeCount ?? MOCK_STATS.activeCars,
      totalQuotes: quoteCount ?? MOCK_STATS.totalQuotes,
      newInquiries: inquiryCount ?? MOCK_STATS.newInquiries
    }

    // 최근 견적 5개 로드
    const { data: quotes } = await supabase
      .from('quote_requests')
      .select('id, buyer_name, whatsapp, created_at, status, cars(title), countries(name)')
      .order('created_at', { ascending: false })
      .limit(5)

    if (quotes && quotes.length > 0) {
      latestQuotes = quotes.map((q: any) => ({
        id: q.id,
        buyer_name: q.buyer_name,
        destination_country: q.countries?.name || 'Unknown',
        whatsapp: q.whatsapp || 'N/A',
        created_at: q.created_at,
        status: q.status,
        car: { title: q.cars?.title || 'Selected Vehicle' }
      }))
    }
  } catch (err) {
    console.error('Failed to load admin dashboard statistics on server:', err)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-950/40 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-900/30">Pending</span>
      case 'under_review':
        return <span className="bg-blue-950/40 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-900/30">Reviewing</span>
      case 'sent':
        return <span className="bg-emerald-950/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-900/30">Sent Quote</span>
      default:
        return <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700/30">Contracted</span>
    }
  }

  return (
    <div className="space-y-8">
      
      {/* 타이틀 및 퀵액션 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-slate-400 text-xs mt-1">Real-time export data, inbound leads, and logistics state.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/cars/new"
            className="bg-accent hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Register Vehicle
          </Link>
        </div>
      </div>

      {/* 요약 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* 전체 매물 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow flex justify-between items-start group hover:border-slate-700 transition">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Inventory</span>
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalCars}</span>
          </div>
          <div className="p-2.5 bg-slate-800 text-accent rounded-xl group-hover:scale-105 transition">
            <Car className="h-5 w-5" />
          </div>
        </div>

        {/* 판매중 매물 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow flex justify-between items-start group hover:border-slate-700 transition">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Available Cars</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.activeCars}</span>
          </div>
          <div className="p-2.5 bg-slate-800 text-emerald-400 rounded-xl group-hover:scale-105 transition">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        {/* 견적 요청 건수 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow flex justify-between items-start group hover:border-slate-700 transition">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quote Requests</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{stats.totalQuotes}</span>
          </div>
          <div className="p-2.5 bg-slate-800 text-amber-400 rounded-xl group-hover:scale-105 transition">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>

        {/* 신규 문의 건수 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow flex justify-between items-start group hover:border-slate-700 transition">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Inquiries</span>
            <span className="text-2xl sm:text-3xl font-black text-blue-400">{stats.newInquiries}</span>
          </div>
          <div className="p-2.5 bg-slate-800 text-blue-400 rounded-xl group-hover:scale-105 transition">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 테이블 그리드 영역 */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* 최근 견적 신청 테이블 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow">
          <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-4">
            <div>
              <h2 className="font-extrabold text-white text-lg">Recent Quote Requests</h2>
              <p className="text-slate-400 text-xs mt-0.5">Most recent incoming quotes from global buyers.</p>
            </div>
            <Link
              href="/admin/quotes"
              className="text-xs font-bold text-accent hover:text-amber-500 flex items-center gap-1 transition"
            >
              <span>View All</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-slate-300 text-sm text-left">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 text-xs uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Buyer Name</th>
                  <th className="py-3 px-4">Vehicle Requested</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {latestQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white">{q.buyer_name}</td>
                    <td className="py-3.5 px-4 text-slate-200">{q.car.title}</td>
                    <td className="py-3.5 px-4 text-slate-400">{q.destination_country}</td>
                    <td className="py-3.5 px-4 text-slate-400">{q.whatsapp}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{new Date(q.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">{getStatusBadge(q.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  )
}
