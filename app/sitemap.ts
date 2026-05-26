import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cartradekorea.com'

  // 고정 정적 페이지 경로들
  const staticRoutes = [
    '',
    '/cars',
    '/inquiry',
    '/login',
    '/register',
    '/export-to-ghana',
    '/export-to-nigeria',
    '/used-hyundai-export',
    '/used-kia-export',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  // 데이터베이스에서 차량 상세 동적 경로 가져오기
  let dynamicRoutes: any[] = []
  try {
    const supabase = createClient()
    const { data: cars } = await supabase
      .from('cars')
      .select('id, updated_at')
      .eq('status', 'available')

    if (cars) {
      dynamicRoutes = cars.map((car) => ({
        url: `${baseUrl}/cars/${car.id}`,
        lastModified: new Date(car.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Sitemap dynamic routes generation error:', error)
  }

  return [...staticRoutes, ...dynamicRoutes]
}
