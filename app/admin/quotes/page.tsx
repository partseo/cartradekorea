import { createClient } from '@/lib/supabase/server'
import AdminQuotesClient from '@/components/admin/AdminQuotesClient'

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

export default async function AdminQuotesPage() {
  const supabase = await createClient()
  let initialQuotes: any[] = []

  try {
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*, cars(title, price_usd), countries(name), ports(name)')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      initialQuotes = data.map((q: any) => ({
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
    } else {
      initialQuotes = MOCK_ADMIN_QUOTES
    }
  } catch (err) {
    console.error('Failed to load quotes on server:', err)
    initialQuotes = MOCK_ADMIN_QUOTES
  }

  return <AdminQuotesClient initialQuotes={initialQuotes} />
}
