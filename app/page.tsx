import type { Metadata } from 'next'
import HomeClient from './HomeClient'

// 메인페이지 타겟 SEO 키워드 정의
export const metadata: Metadata = {
  title: "Buy Premium Korean Used Cars | Global Auto Export",
  description: "Global Auto Export is the leading platform to buy Korean used cars directly from South Korea. Safe transaction, certified inspections, global shipping, and customs clearance documents support.",
  keywords: [
    "used cars export",
    "Korean used cars",
    "buy used cars South Korea",
    "Hyundai used cars export",
    "Kia used cars export",
    "used car export to Ghana",
    "used car export to Nigeria"
  ],
  openGraph: {
    title: "Buy Premium Korean Used Cars | Global Auto Export",
    description: "Browse high-quality Korean used cars with direct shipping support to Ghana, Nigeria, Libya, and Vietnam.",
    url: "https://www.globalautoexport.com",
    images: [
      {
        url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200&h=630",
        width: 1200,
        height: 630,
        alt: "Korean Used Cars Export Hub"
      }
    ]
  }
}

export default function HomePage() {
  return <HomeClient />
}
