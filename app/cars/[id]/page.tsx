import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CarDetailClient from './CarDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

// 1. Next.js App Router 규격의 동적 메타데이터 생성기 (generateMetadata)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  
  try {
    const supabase = await createClient()
    const { data: car } = await supabase
      .from('cars')
      .select('title, brand, model, year, price_usd')
      .eq('id', id)
      .single()

    if (car) {
      const title = `${car.brand} ${car.model} (${car.year}) for Export | Car Trade Korea`
      const description = `Buy certified ${car.title} for export from South Korea. Instant FOB/CIF price quote $${Number(car.price_usd).toLocaleString()}. Safe shipping & document handling.`
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `https://www.cartradekorea.com/cars/${id}`
        }
      }
    }
  } catch (error) {
    console.error('generateMetadata error for car ID:', id, error)
  }

  // 폴백 기본 메타데이터
  return {
    title: "Premium Korean Used Car for Export | Car Trade Korea",
    description: "Export high-quality Korean used cars directly from Incheon yard. Safe trade, global RORO shipping, and verified photos."
  }
}

export default function CarDetailPage() {
  return <CarDetailClient />
}
