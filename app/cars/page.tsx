import type { Metadata } from 'next'
import CarsClient from './CarsClient'

export const metadata: Metadata = {
  title: "Used Cars Export Inventory | Global Auto Export",
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
    title: "Used Cars Export Inventory | Global Auto Export",
    description: "Search and filter premium Korean used vehicles. Get immediate FOB/CIF logistics costs.",
    url: "https://www.globalautoexport.com/cars"
  }
}

export default function CarsPage() {
  return <CarsClient />
}
