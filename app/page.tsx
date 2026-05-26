import type { Metadata } from 'next'
import HomeClient from './HomeClient'

// ✅ 5분 캐싱 — 홈페이지 추쳜 차량은 자주 바뀌지 않으므로 SSR 매번 불필요
export const revalidate = 300
export const metadata: Metadata = {
  title: "Buy Premium Korean Used Cars | Car Trade Korea",
  description: "Car Trade Korea is the leading platform to buy Korean used cars directly from South Korea. Safe transaction, certified inspections, global shipping, and customs clearance documents support.",
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
    title: "Buy Premium Korean Used Cars | Car Trade Korea",
    description: "Browse high-quality Korean used cars with direct shipping support to Ghana, Nigeria, Libya, and Vietnam.",
    url: "https://www.cartradekorea.com",
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
