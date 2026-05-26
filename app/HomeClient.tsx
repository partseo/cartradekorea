'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/lib/supabase/settings-context'
import { Search, ArrowRight, Ship, Globe, MessageCircle, Star, ShieldCheck, FileCheck } from 'lucide-react'

// 이미지 로드 실패 시 폴백 URL
const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1920'
const CAR_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600'

// 목데이터: 추천 매물 6종
const RECOMMENDED_CARS = [
  {
    id: 'car-avante-2020',
    title: 'Hyundai Avante (Elantra) 1.6 Smart',
    brand: 'Hyundai',
    year: 2020,
    mileage: 45000,
    fuel_type: 'Gasoline',
    transmission: 'Automatic',
    price_usd: 11500,
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600',
    tag: 'Popular'
  },
  {
    id: 'car-sportage-2019',
    title: 'Kia Sportage 2.0 Trendy',
    brand: 'Kia',
    year: 2019,
    mileage: 68000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    price_usd: 14200,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600',
    tag: 'Best Seller'
  },
  {
    id: 'car-santa-2021',
    title: 'Hyundai Santa Fe 2.2 Prestige',
    brand: 'Hyundai',
    year: 2021,
    mileage: 32000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    price_usd: 23800,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
    tag: 'Premium'
  },
  {
    id: 'car-bongo-2018',
    title: 'Kia Bongo 3 1ton Double Cab',
    brand: 'Kia',
    year: 2018,
    mileage: 95000,
    fuel_type: 'Diesel',
    transmission: 'Manual',
    price_usd: 7900,
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=600',
    tag: 'Commercial'
  },
  {
    id: 'car-starex-2017',
    title: 'Hyundai Grand Starex 12-Seater',
    brand: 'Hyundai',
    year: 2017,
    mileage: 112000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    price_usd: 10500,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
    tag: 'High Capacity'
  },
  {
    id: 'car-sorento-2020',
    title: 'Kia Sorento 2.2 Noblesse',
    brand: 'Kia',
    year: 2020,
    mileage: 52000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    price_usd: 21500,
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600',
    tag: 'Highly Rated'
  }
]

export default function HomeClient() {
  const { t, convertPrice } = useSettings()
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [brandSelect, setBrandSelect] = useState('')
  const [dbCars, setDbCars] = useState<any[]>([])
  
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchLatestCars() {
      try {
        // ✅ 필요한 컬럼만 선택 — select('*') 제거로 페이로드 감소
        const { data } = await supabase
          .from('cars')
          .select('id, title, brand, year, mileage, fuel_type, transmission, price_usd, car_images(image_url, is_main)')
          .eq('status', 'available')
          .order('created_at', { ascending: false })
          .limit(6)
        
        if (data && data.length > 0) {
          const formatted = data.map((car: any) => {
            const mainImg = car.car_images?.find((img: any) => img.is_main)?.image_url 
              || car.car_images?.[0]?.image_url 
              || CAR_IMAGE_FALLBACK;
            return {
              id: car.id,
              title: car.title,
              brand: car.brand,
              year: car.year,
              mileage: car.mileage,
              fuel_type: car.fuel_type,
              transmission: car.transmission,
              price_usd: Number(car.price_usd),
              image: mainImg,
              tag: 'New'
            }
          })
          setDbCars(formatted)
        }
      } catch (e) {
        console.log('Using fallback mock data.')
      }
    }
    fetchLatestCars()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    let query = `/cars?`
    if (searchTerm) query += `search=${encodeURIComponent(searchTerm)}&`
    if (brandSelect) query += `brand=${brandSelect}`
    router.push(query)
  }

  const displayedCars = dbCars.length > 0 ? dbCars : RECOMMENDED_CARS
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || '821000000000'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello,%20I%20am%20interested%20in%20purchasing%20a%20used%2520car%20from%20Car%20Trade%20Korea.`

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col">
      
      {/* 1. 히어로 섹션 */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-transparent z-10" />
          {/* ✅ LCP 이미지 — priority로 즉시 로드, fill+object-cover로 layout shift 방지 */}
          <Image
            src={HERO_IMAGE_URL}
            alt="Premium Korean Used Cars"
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQQD/8QAIRAAAAcAAgMBAAAAAAAAAAAAAQIDBBEABRIhMVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AzMFVkpbLJ2kSVRF+7mV5GujzrDolWMBE8h5kqe+y0hEVIhYhEPqAFPUGwpuVAGgD/9k="
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent text-white uppercase tracking-wider mb-6 animate-pulse">
              <ShieldCheck className="h-3.5 w-3.5" /> {t.certifiedQuality}
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight sm:leading-none">
              {t.heroTitle.split(' Exported ')[0]} <br />
              <span className="text-accent bg-clip-text">
                {t.heroTitle.includes(' Exported ') ? `Exported ${t.heroTitle.split(' Exported ')[1]}` : t.heroTitle}
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              {t.heroSubtitle}
            </p>

            {/* 간편 검색 바 */}
            <form onSubmit={handleSearch} className="mt-10 max-w-2xl bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-2xl flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center bg-white rounded-lg px-3 py-2 shadow-inner">
                <Search className="h-5 w-5 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none text-slate-900 placeholder-slate-400 focus:outline-none text-sm"
                />
              </div>
              <div className="flex items-center bg-white rounded-lg px-3 py-2 sm:w-48 shadow-inner">
                <select
                  value={brandSelect}
                  onChange={(e) => setBrandSelect(e.target.value)}
                  className="w-full bg-transparent border-none text-slate-700 focus:outline-none text-sm cursor-pointer"
                >
                  <option value="">{t.allBrands}</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="Kia">Kia</option>
                  <option value="Genesis">Genesis</option>
                  <option value="Samsung">Renault Korea</option>
                  <option value="KG">KG Mobility</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-accent hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer text-sm"
              >
                <span>{t.searchButton}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. 장점 요약 섹션 */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-slate-900 text-accent rounded-xl">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{t.featureInspectionTitle}</h3>
                <p className="text-sm text-slate-500 mt-1">{t.featureInspectionDesc}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-slate-900 text-accent rounded-xl">
                <Ship className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{t.featureLogisticsTitle}</h3>
                <p className="text-sm text-slate-500 mt-1">{t.featureLogisticsDesc}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-slate-900 text-accent rounded-xl">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{t.featureDocsTitle}</h3>
                <p className="text-sm text-slate-500 mt-1">{t.featureDocsDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 추천 차량 그리드 */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t.featuredTitle}</h2>
            <p className="text-slate-500 text-sm mt-1">{t.featuredSubtitle}</p>
          </div>
          <Link href="/cars" className="hidden sm:inline-flex items-center text-sm font-bold text-secondary hover:text-blue-700 transition">
            {t.viewAllButton} <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedCars.map((car, index) => (
            <div key={car.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group">
              <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                {/* ✅ next/image — WebP/AVIF 자동, 반응형 sizes, lazy loading */}
                <Image
                  src={car.image || CAR_IMAGE_FALLBACK}
                  alt={car.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (target.src !== CAR_IMAGE_FALLBACK) target.src = CAR_IMAGE_FALLBACK
                  }}
                />
                <span className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-sm text-accent text-xs font-bold px-2.5 py-1 rounded-md">
                  {car.tag}
                </span>
                <span className="absolute bottom-3 right-3 bg-accent text-white text-sm font-bold px-3 py-1 rounded-md shadow-md">
                  {convertPrice(car.price_usd)} <span className="text-[10px] font-normal">FOB</span>
                </span>
              </div>

              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-secondary transition-colors line-clamp-1">
                    {car.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100">{car.year}</span>
                    <span className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100">{(car.mileage).toLocaleString()} km</span>
                    <span className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100">{car.fuel_type}</span>
                    <span className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100">{car.transmission}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                  <Link
                    href={`/cars/${car.id}`}
                    className="flex-1 text-center bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {t.detailsButton}
                  </Link>
                  <Link
                    href={`/quote?carId=${car.id}`}
                    className="flex-1 text-center border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {t.quoteButton}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link href="/cars" className="inline-flex items-center text-sm font-bold text-secondary hover:text-blue-700 transition">
            {t.viewAllButton} <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </div>
      </section>

      {/* 4. 수출 국가 안내 섹션 */}
      <section className="bg-slate-900 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">{t.networkTitle}</h2>
            <p className="text-slate-400 text-sm mt-2">{t.networkSubtitle}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[
              { country: 'Ghana', port: 'Tema Port', cost: '2,500', code: 'GHA', time: 'Approx. 40 Days' },
              { country: 'Nigeria', port: 'Lagos Port', cost: '2,700', code: 'NGA', time: 'Approx. 42 Days' },
              { country: 'Libya', port: 'Tripoli Port', cost: '1,900', code: 'LBY', time: 'Approx. 30 Days' },
              { country: 'Vietnam', port: 'Haiphong Port', cost: '1,200', code: 'VNM', time: 'Approx. 7 Days' },
            ].map((dest, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-accent/20 text-accent font-bold text-xs px-2.5 py-1 rounded">
                    {dest.code}
                  </div>
                  <Globe className="h-5 w-5 text-slate-400" />
                </div>
                <h3 className="text-white font-bold text-lg">{dest.country}</h3>
                <p className="text-xs text-slate-400 mt-1">{dest.port}</p>
                <div className="border-t border-white/10 my-4 pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{t.freightCost}:</span>
                    <span className="text-white font-semibold">${dest.cost} (RORO)</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-400">{t.transitTime}:</span>
                    <span className="text-white font-semibold">{dest.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 수출 프로세스 4단계 */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t.processTitle}</h2>
            <p className="text-slate-500 text-sm mt-2">{t.processSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              { num: '01', title: t.step1Title, desc: t.step1Desc },
              { num: '02', title: t.step2Title, desc: t.step2Desc },
              { num: '03', title: t.step3Title, desc: t.step3Desc },
              { num: '04', title: t.step4Title, desc: t.step4Desc }
            ].map((step, idx) => (
              <div key={idx} className="relative bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-4xl font-black text-slate-200 block mb-4">{step.num}</span>
                  <h3 className="font-bold text-slate-900 text-base">{step.title}</h3>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. WhatsApp 상담 플로팅 버튼 */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group cursor-pointer"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 text-sm font-bold transition-all duration-300 ease-in-out whitespace-nowrap">
          {t.btnWhatsapp.split(' ')[0]} Live
        </span>
      </a>

    </div>
  )
}
