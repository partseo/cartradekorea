import { createClient } from '@/lib/supabase/server'
import AdminCarsClient from '@/components/admin/AdminCarsClient'

// 목데이터: Fallback 차량 목록
const MOCK_ADMIN_CARS = [
  { id: 'avante-2020', title: 'Hyundai Avante 1.6 Smart', brand: 'Hyundai', year: 2020, price_usd: 11500, status: 'available', mileage: 45000 },
  { id: 'sportage-2019', title: 'Kia Sportage 2.0 Trendy', brand: 'Kia', year: 2019, price_usd: 14200, status: 'available', mileage: 68000 },
  { id: 'santa-2021', title: 'Hyundai Santa Fe 2.2 Prestige', brand: 'Hyundai', year: 2021, price_usd: 23800, status: 'reserved', mileage: 32000 },
  { id: 'bongo-2018', title: 'Kia Bongo 3 1ton Double Cab', brand: 'Kia', year: 2018, price_usd: 7900, status: 'sold', mileage: 95000 }
]

export default async function AdminCarsPage() {
  const supabase = await createClient()
  let initialCars: any[] = []

  try {
    const { data, error } = await supabase
      .from('cars')
      .select('id, title, brand, year, price_usd, status, mileage')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      initialCars = data
    } else {
      initialCars = MOCK_ADMIN_CARS
    }
  } catch (err) {
    console.error('Failed to load cars on server:', err)
    initialCars = MOCK_ADMIN_CARS
  }

  return <AdminCarsClient initialCars={initialCars} />
}
