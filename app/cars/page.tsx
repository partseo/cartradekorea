import type { Metadata } from 'next'
import CarsClient from './CarsClient'

// ✅ 3분 캐싱 — 차량 목록은 새 차량 등록 시 빠른 반영을 위해 홈보다 짧게 설정
export const revalidate = 180
export const metadata: Metadata = {
  title: "Used Cars Export Inventory | Car Trade Korea",
  description: "Browse our extensive inventory of high-quality Korean used cars. Filter by brand, year, mileage, transmission, and fuel type. Get transparent instant shipping quotes.",
  keywords: [
    "used cars export",
    "Korean used cars inventory",
    "Hyundai used cars export",
    "Kia used cars export",
    "used car export to Ghana",
    "used car export to Nigeria"
  ],
  openGraph: {
    title: "Used Cars Export Inventory | Car Trade Korea",
    description: "Search and filter premium Korean used vehicles. Get immediate FOB/CIF logistics costs.",
    url: "https://www.cartradekorea.com/cars"
  }
}

export default function CarsPage() {
  return <CarsClient />
}
