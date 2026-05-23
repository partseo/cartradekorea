'use client'

import { useState, useEffect, useMemo, useCallback, Suspense, memo } from 'react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/lib/supabase/settings-context'
import PriceDisplay from '@/components/common/PriceDisplay'
import { Filter, SlidersHorizontal, X, ArrowUpDown, RefreshCw } from 'lucide-react'

// 폴백용 가상 중고차 데이터
const FALLBACK_CARS = [
  { id: 'avante-2020', title: 'Hyundai Avante 1.6 Smart', brand: 'Hyundai', year: 2020, mileage: 45000, fuel_type: 'Gasoline', transmission: 'Automatic', price_usd: 11500, price_krw: 15500000, image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600', status: 'available' },
  { id: 'sportage-2019', title: 'Kia Sportage 2.0 Trendy', brand: 'Kia', year: 2019, mileage: 68000, fuel_type: 'Diesel', transmission: 'Automatic', price_usd: 14200, price_krw: 19100000, image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600', status: 'available' },
  { id: 'santa-2021', title: 'Hyundai Santa Fe 2.2 Prestige', brand: 'Hyundai', year: 2021, mileage: 32000, fuel_type: 'Diesel', transmission: 'Automatic', price_usd: 23800, price_krw: 32100000, image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600', status: 'available' },
  { id: 'bongo-2018', title: 'Kia Bongo 3 1ton Double Cab', brand: 'Kia', year: 2018, mileage: 95000, fuel_type: 'Diesel', transmission: 'Manual', price_usd: 7900, price_krw: 10600000, image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=600', status: 'available' },
  { id: 'starex-2017', title: 'Hyundai Grand Starex 12-Seater', brand: 'Hyundai', year: 2017, mileage: 112000, fuel_type: 'Diesel', transmission: 'Automatic', price_usd: 10500, price_krw: 14100000, image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600', status: 'available' },
  { id: 'sorento-2020', title: 'Kia Sorento 2.2 Noblesse', brand: 'Kia', year: 2020, mileage: 52000, fuel_type: 'Diesel', transmission: 'Automatic', price_usd: 21500, price_krw: 29000000, image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600', status: 'available' }
]

// ─── 스켈레톤 카드 (로딩 중 표시) ───────────────────────────
const SkeletonCard = memo(() => (
  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
    <div className="aspect-[16/10] bg-slate-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-slate-200 rounded w-4/5" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-3 bg-slate-100 rounded" />
        <div className="h-3 bg-slate-100 rounded" />
        <div className="h-3 bg-slate-100 rounded" />
        <div className="h-3 bg-slate-100 rounded" />
      </div>
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <div className="flex-1 h-8 bg-slate-200 rounded-md" />
        <div className="flex-1 h-8 bg-slate-100 rounded-md" />
      </div>
    </div>
  </div>
))
SkeletonCard.displayName = 'SkeletonCard'

// ─── 필터 패널 (memo로 불필요한 리렌더 방지) ─────────────────
interface FilterPanelProps {
  t: any
  searchQuery: string
  setSearchQuery: (v: string) => void
  selectedBrand: string
  setSelectedBrand: (v: string) => void
  selectedFuel: string
  setSelectedFuel: (v: string) => void
  selectedTrans: string
  setSelectedTrans: (v: string) => void
  maxPrice: string
  setMaxPrice: (v: string) => void
  maxMileage: string
  setMaxMileage: (v: string) => void
  minYear: string
  setMinYear: (v: string) => void
  onReset: () => void
}

const FilterPanel = memo(({
  t, searchQuery, setSearchQuery, selectedBrand, setSelectedBrand,
  selectedFuel, setSelectedFuel, selectedTrans, setSelectedTrans,
  maxPrice, setMaxPrice, maxMileage, setMaxMileage,
  minYear, setMinYear, onReset
}: FilterPanelProps) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
      <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-slate-500" /> {t.filterTitle}
      </h3>
      <button onClick={onReset} className="text-xs font-bold text-slate-400 hover:text-accent transition flex items-center gap-1 cursor-pointer">
        <RefreshCw className="h-3 w-3" /> {t.filterReset}
      </button>
    </div>

    {/* 검색어 */}
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.filterKeyword}</label>
      <input
        type="text"
        placeholder="Model name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800"
      />
    </div>

    {/* 브랜드 */}
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.filterBrand}</label>
      <select
        value={selectedBrand}
        onChange={(e) => setSelectedBrand(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none text-slate-800 cursor-pointer"
      >
        <option value="">{t.allBrands}</option>
        <option value="Hyundai">Hyundai</option>
        <option value="Kia">Kia</option>
        <option value="Genesis">Genesis</option>
        <option value="Samsung">Renault Korea</option>
        <option value="KG">KG Mobility</option>
      </select>
    </div>

    {/* 연료 종류 */}
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.filterFuel}</label>
      <div className="flex flex-wrap gap-2">
        {['Gasoline', 'Diesel', 'LPG', 'Hybrid', 'Electric'].map((fuel) => (
          <button
            key={fuel}
            onClick={() => setSelectedFuel(selectedFuel === fuel ? '' : fuel)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              selectedFuel === fuel
                ? 'bg-secondary text-white border-secondary'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {fuel}
          </button>
        ))}
      </div>
    </div>

    {/* 변속기 */}
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.filterTrans}</label>
      <div className="grid grid-cols-2 gap-2">
        {['Automatic', 'Manual'].map((trans) => (
          <button
            key={trans}
            onClick={() => setSelectedTrans(selectedTrans === trans ? '' : trans)}
            className={`py-1.5 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
              selectedTrans === trans
                ? 'bg-secondary text-white border-secondary'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {trans}
          </button>
        ))}
      </div>
    </div>

    {/* 가격 슬라이더 */}
    <div>
      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        <span>{t.filterMaxPrice}</span>
        <span className="text-secondary font-extrabold">${Number(maxPrice).toLocaleString()}</span>
      </div>
      <input type="range" min="5000" max="80000" step="2500" value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)} className="w-full accent-secondary cursor-pointer" />
    </div>

    {/* 주행거리 슬라이더 */}
    <div>
      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        <span>{t.filterMaxMileage}</span>
        <span className="text-secondary font-extrabold">{Number(maxMileage).toLocaleString()} km</span>
      </div>
      <input type="range" min="10000" max="200000" step="10000" value={maxMileage}
        onChange={(e) => setMaxMileage(e.target.value)} className="w-full accent-secondary cursor-pointer" />
    </div>

    {/* 최소 연식 */}
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.filterMinYear}</label>
      <select
        value={minYear}
        onChange={(e) => setMinYear(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none text-slate-800 cursor-pointer"
      >
        {['2012', '2015', '2017', '2018', '2019', '2020', '2021', '2022'].map((yr) => (
          <option key={yr} value={yr}>{yr} or newer</option>
        ))}
      </select>
    </div>
  </div>
))
FilterPanel.displayName = 'FilterPanel'

// ─── 메인 콘텐츠 ──────────────────────────────────────────────
function CarsPageContent() {
  const { t } = useSettings()
  const searchParams = useNextSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '')
  const [selectedBrand, setSelectedBrand] = useState(searchParams?.get('brand') || '')
  const [selectedFuel, setSelectedFuel] = useState('')
  const [selectedTrans, setSelectedTrans] = useState('')
  const [maxPrice, setMaxPrice] = useState('50000')
  const [maxMileage, setMaxMileage] = useState('150000')
  const [minYear, setMinYear] = useState('2015')
  const [sortBy, setSortBy] = useState('newest')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [cars, setCars] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ✅ 핵심: supabase 클라이언트를 렌더 외부에 한번만 생성
  const supabase = useMemo(() => createClient(), [])

  // ✅ 핵심: 의존성을 [] 로 고정 → 최초 1회만 실행
  useEffect(() => {
    let cancelled = false
    async function loadCars() {
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('id, title, brand, year, mileage, fuel_type, transmission, price_usd, price_krw, status, car_images(image_url, is_main)')
          .eq('status', 'available')
          .order('year', { ascending: false }) // DB 단에서 정렬

        if (cancelled) return

        if (data && data.length > 0) {
          const formatted = data.map((car: any) => {
            const mainImg =
              car.car_images?.find((img: any) => img.is_main)?.image_url ||
              car.car_images?.[0]?.image_url ||
              'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600'
            return {
              id: car.id,
              title: car.title,
              brand: car.brand,
              year: car.year,
              mileage: car.mileage,
              fuel_type: car.fuel_type,
              transmission: car.transmission,
              price_usd: Number(car.price_usd),
              price_krw: Number(car.price_krw),
              image: mainImg,
              status: car.status
            }
          })
          setCars(formatted)
        } else {
          setCars(FALLBACK_CARS)
        }
      } catch {
        if (!cancelled) setCars(FALLBACK_CARS)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadCars()
    return () => { cancelled = true }
  }, [supabase])

  // ✅ 핵심: 필터+정렬을 useMemo로 캐싱 → 차량 데이터/필터가 변할 때만 재계산
  const filteredCars = useMemo(() => {
    const nMaxPrice = Number(maxPrice)
    const nMaxMileage = Number(maxMileage)
    const nMinYear = Number(minYear)
    const lSearch = searchQuery.toLowerCase()
    const lBrand = selectedBrand.toLowerCase()
    const lFuel = selectedFuel.toLowerCase()
    const lTrans = selectedTrans.toLowerCase()

    return cars
      .filter((car) => {
        if (lSearch && !car.title.toLowerCase().includes(lSearch)) return false
        if (lBrand && car.brand.toLowerCase() !== lBrand) return false
        if (lFuel && car.fuel_type.toLowerCase() !== lFuel) return false
        if (lTrans && car.transmission.toLowerCase() !== lTrans) return false
        if (car.price_usd > nMaxPrice) return false
        if (car.mileage > nMaxMileage) return false
        if (car.year < nMinYear) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price_usd - b.price_usd
        if (sortBy === 'price_desc') return b.price_usd - a.price_usd
        if (sortBy === 'mileage_asc') return a.mileage - b.mileage
        return b.year - a.year
      })
  }, [cars, searchQuery, selectedBrand, selectedFuel, selectedTrans, maxPrice, maxMileage, minYear, sortBy])

  // ✅ useCallback으로 함수 재생성 방지
  const resetFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedBrand('')
    setSelectedFuel('')
    setSelectedTrans('')
    setMaxPrice('50000')
    setMaxMileage('150000')
    setMinYear('2015')
    setSortBy('newest')
  }, [])

  const filterPanelProps = {
    t, searchQuery, setSearchQuery, selectedBrand, setSelectedBrand,
    selectedFuel, setSelectedFuel, selectedTrans, setSelectedTrans,
    maxPrice, setMaxPrice, maxMileage, setMaxMileage,
    minYear, setMinYear, onReset: resetFilters
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.viewAllButton.split(' ')[0]} {t.navInventory}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLoading
              ? '차량 목록 불러오는 중...'
              : `총 ${filteredCars.length}대의 차량이 검색되었습니다.`}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-sm">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest Year</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="mileage_asc">Mileage: Low to High</option>
            </select>
          </div>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="md:hidden flex items-center justify-center gap-1.5 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow active:scale-95 transition cursor-pointer"
          >
            <Filter className="h-4 w-4" />
            <span>{t.filterTitle}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 flex-grow">
        {/* 데스크탑 필터 사이드바 */}
        <aside className="hidden md:block bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm h-fit sticky top-24">
          <FilterPanel {...filterPanelProps} />
        </aside>

        {/* 차량 그리드 */}
        <div className="md:col-span-3">
          {isLoading ? (
            /* ✅ 스켈레톤 UI - 로딩 중에도 레이아웃 안정적으로 표시 */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl py-24 text-center shadow-inner">
              <SlidersHorizontal className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-extrabold text-slate-900 text-lg">검색 결과 없음</h3>
              <p className="text-slate-500 text-sm mt-1 px-4">조건에 맞는 차량이 없습니다. 필터를 초기화하고 다시 검색해보세요.</p>
              <button
                onClick={resetFilters}
                className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow cursor-pointer"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCars.map((car) => (
                <div key={car.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col group">
                  <div className="relative aspect-[16/10] bg-slate-50 overflow-hidden">
                    {/* ✅ lazy loading으로 초기 로드 시간 단축 */}
                    <img
                      src={car.image}
                      alt={car.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <PriceDisplay
                      priceUsd={car.price_usd}
                      className="absolute bottom-3 right-3 bg-accent text-white text-sm font-black px-2.5 py-1 rounded shadow"
                    />
                  </div>

                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-secondary transition-colors line-clamp-1">
                        {car.title}
                      </h3>
                      <div className="mt-2.5 grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs text-slate-500">
                        <span>연식: <strong className="text-slate-700">{car.year}</strong></span>
                        <span>주행: <strong className="text-slate-700">{car.mileage.toLocaleString()}km</strong></span>
                        <span>연료: <strong className="text-slate-700">{car.fuel_type}</strong></span>
                        <span>변속: <strong className="text-slate-700">{car.transmission}</strong></span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                      <Link
                        href={`/cars/${car.id}`}
                        className="flex-1 text-center bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold py-2 rounded-md transition cursor-pointer"
                      >
                        {t.detailsButton.split(' ')[0]}
                      </Link>
                      <Link
                        href={`/quote?carId=${car.id}`}
                        className="flex-1 text-center border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold py-2 rounded-md transition cursor-pointer"
                      >
                        {t.quoteButton.split(' ')[0]}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 모바일 필터 드로어 */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div
            onClick={() => setIsFilterOpen(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-6">
              <span className="font-extrabold text-slate-900">상세 필터</span>
              <button onClick={() => setIsFilterOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-grow">
              <FilterPanel {...filterPanelProps} />
            </div>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl mt-8 shadow cursor-pointer text-sm"
            >
              {t.filterApply}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CarsClient() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="hidden md:block bg-white p-6 rounded-2xl border border-slate-100 h-64 animate-pulse" />
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    }>
      <CarsPageContent />
    </Suspense>
  )
}
