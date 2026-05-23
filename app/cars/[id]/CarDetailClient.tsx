'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/lib/supabase/settings-context'
import PriceDisplay from '@/components/common/PriceDisplay'
import { 
  ChevronLeft, Calendar, Gauge, Fuel, Sliders, ShieldCheck, 
  Check, FileText, Send, MessageCircle, DollarSign, Award, Layers, 
  Download 
} from 'lucide-react'

// 목데이터: Fallback 상세 정보 매핑용 (신규 필드 포함)
const DETAILED_MOCK_CARS: Record<string, any> = {
  'avante-2020': {
    title: 'Hyundai Avante 1.6 Smart',
    brand: 'Hyundai',
    model: 'Avante',
    year: 2020,
    mileage: 45000,
    fuel_type: 'Gasoline',
    transmission: 'Automatic',
    price_usd: 11500,
    price_krw: 15500000,
    stock_number: 'ST-HY-001',
    photo_verified: true,
    dealer_source: 'Incheon Yard',
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
    ],
    specs: {
      engine_displacement: '1,598 cc',
      drive_type: '2WD (Front-Wheel)',
      color: 'Polar White',
      accident_history: 'No accidents, clear history',
      seating_capacity: 5,
      options: ['Leather Seats', 'Heated Steering Wheel', 'Lane Keeping Assist', 'Rear Camera', 'Smart Key', 'Apple CarPlay'],
      description: 'Superb condition Hyundai Avante smart trim. One owner, meticulously maintained. Fuel-efficient engine ideal for daily commuting and city driving. Immediate export documents available.',
      vin_partial: 'KMHDK41D1LU******',
      vehicle_location: 'Incheon Port Yard 3',
      fob_port: 'Incheon Port',
      steering_position: 'LHD',
      engine_number_partial: 'G4FL-123***',
      hs_code: '8703.22.9000',
      inspection_report_url: '/temp/report1.pdf',
      export_certificate_status: 'completed'
    }
  },
  'sportage-2019': {
    title: 'Kia Sportage 2.0 Trendy',
    brand: 'Kia',
    model: 'Sportage',
    year: 2019,
    mileage: 68000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    price_usd: 14200,
    price_krw: 19100000,
    stock_number: 'ST-KI-002',
    photo_verified: true,
    dealer_source: 'Busan Yard',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800'
    ],
    specs: {
      engine_displacement: '1,995 cc',
      drive_type: '2WD (Front-Wheel)',
      color: 'Steel Gray',
      accident_history: 'Minor bumper scratch repaired',
      seating_capacity: 5,
      options: ['Panoramic Sunroof', 'Navigation GPS', 'Power Seats', 'Heated & Ventilated Front Seats', 'Rear Parking Sensors'],
      description: 'Spacious SUV Kia Sportage in deep steel gray. Powerful diesel torque with great economy. Ideal choice for dynamic driving and family outings.',
      vin_partial: 'KPTC3C1C2KA******',
      vehicle_location: 'Busan Port Yard 1',
      fob_port: 'Busan Port',
      steering_position: 'LHD',
      engine_number_partial: 'D4HA-456***',
      hs_code: '8703.32.9000',
      inspection_report_url: '/temp/report2.pdf',
      export_certificate_status: 'completed'
    }
  }
}

const DEFAULT_FALLBACK = {
  title: 'Premium Certified Korean Used Car',
  brand: 'Certified',
  model: 'Used Car',
  year: 2020,
  mileage: 60000,
  fuel_type: 'Diesel',
  transmission: 'Automatic',
  price_usd: 12000,
  price_krw: 16200000,
  stock_number: 'ST-GEN-999',
  photo_verified: false,
  dealer_source: 'Incheon Port',
  images: [
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'
  ],
  specs: {
    engine_displacement: '1,999 cc',
    drive_type: '2WD',
    color: 'Silver/Gray',
    accident_history: 'Clean title, no accidents',
    seating_capacity: 5,
    options: ['Airbags', 'ABS Braking', 'Smart Key', 'Rear Camera', 'Alloy Wheels'],
    description: 'Highly demanded quality Korean vehicle. Fully inspected, clean exterior, minor wear and tear only. Complete engine and transmission maintenance has been performed.',
    vin_partial: 'KMHFC41B1MU******',
    vehicle_location: 'Incheon Port Yard 2',
    fob_port: 'Incheon Port',
    steering_position: 'LHD',
    engine_number_partial: 'G4KN-789***',
    hs_code: '8703.22.9000',
    inspection_report_url: '',
    export_certificate_status: 'completed'
  }
}

const TRUST_BADGES = [
  { label: 'Verified Vehicle Photos', desc: 'Real photos verified by inspector', icon: ShieldCheck },
  { label: 'Export Ready', desc: 'All documents cleared for shipping', icon: FileText },
  { label: 'Inspection Report Available', desc: '150-point technical check completed', icon: Award },
  { label: 'Secure Payment Guidance', desc: 'Escrow bank wire transfer support', icon: DollarSign },
  { label: 'Transparent FOB/CIF Quote', desc: 'No hidden ocean freight charges', icon: Layers },
  { label: 'WhatsApp Direct Support', desc: '24/7 dedicated export manager', icon: MessageCircle }
]

export default function CarDetailClient() {
  const { t, convertPrice, currency } = useSettings()
  const { id } = useParams()
  const supabase = createClient()

  const [carData, setCarData] = useState<any>(null)
  const [activeImage, setActiveImage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCarDetail() {
      setIsLoading(true)
      try {
        const { data: car } = await supabase
          .from('cars')
          .select('*, car_specs(*), car_images(*)')
          .eq('id', id)
          .single()

        if (car) {
          const imgs = car.car_images?.map((img: any) => img.image_url) || []
          const formatted = {
            title: car.title,
            brand: car.brand,
            model: car.model,
            year: car.year,
            mileage: car.mileage,
            fuel_type: car.fuel_type,
            transmission: car.transmission,
            price_usd: Number(car.price_usd),
            price_krw: Number(car.price_krw),
            stock_number: car.stock_number || 'N/A',
            photo_verified: car.photo_verified ?? false,
            dealer_source: car.dealer_source || 'N/A',
            images: imgs.length > 0 ? imgs : [
              'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800'
            ],
            specs: {
              engine_displacement: car.car_specs?.engine_displacement || 'N/A',
              drive_type: car.car_specs?.drive_type || 'N/A',
              color: car.car_specs?.color || 'N/A',
              accident_history: car.car_specs?.accident_history || 'N/A',
              seating_capacity: car.car_specs?.seating_capacity || 5,
              options: car.car_specs?.options || [],
              description: car.car_specs?.description || 'No description provided.',
              vin_partial: car.car_specs?.vin_partial || 'N/A',
              vehicle_location: car.car_specs?.vehicle_location || 'N/A',
              fob_port: car.car_specs?.fob_port || 'N/A',
              steering_position: car.car_specs?.steering_position || 'LHD',
              engine_number_partial: car.car_specs?.engine_number_partial || 'N/A',
              hs_code: car.car_specs?.hs_code || 'N/A',
              inspection_report_url: car.car_specs?.inspection_report_url || null,
              export_certificate_status: car.car_specs?.export_certificate_status || 'pending'
            }
          }
          setCarData(formatted)
          setActiveImage(formatted.images[0])
        } else {
          const mock = DETAILED_MOCK_CARS[id as string] || DEFAULT_FALLBACK
          setCarData(mock)
          setActiveImage(mock.images[0])
        }
      } catch (err) {
        const mock = DETAILED_MOCK_CARS[id as string] || DEFAULT_FALLBACK
        setCarData(mock)
        setActiveImage(mock.images[0])
      } finally {
        setIsLoading(false)
      }
    }

    if (id) loadCarDetail()
  }, [id, supabase])

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-48 space-y-4">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-accent rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold">Loading vehicle details...</p>
      </div>
    )
  }

  if (!carData) return null

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || '821000000000'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello!%20I%20am%20interested%20in%20"${encodeURIComponent(carData.title)}".%20Please%20provide%20more%20details.`

  return (
    <div className="flex-grow bg-slate-50 pb-24 md:pb-12">
      
      {/* 서브 네비 바 */}
      <div className="bg-white border-b border-slate-200 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <Link href="/cars" className="inline-flex items-center text-sm font-bold text-slate-600 hover:text-slate-900 gap-1">
            <ChevronLeft className="h-4 w-4" /> {t.backToInventory}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 왼쪽: 이미지 갤러리 영역 (7/12) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 큰 메인 이미지 */}
            <div className="aspect-[16/10] bg-slate-900 rounded-2xl overflow-hidden shadow border border-slate-200 relative">
              <img
                src={activeImage}
                alt={carData.title}
                className="w-full h-full object-cover"
              />
              {carData.photo_verified && (
                <div className="absolute top-4 left-4 bg-emerald-500/90 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1 backdrop-blur-sm">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verified Photos</span>
                </div>
              )}
            </div>

            {/* 작은 썸네일 그리드 */}
            <div className="grid grid-cols-4 gap-3">
              {carData.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    activeImage === img ? 'border-accent shadow-md scale-98' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt={`${carData.title} view ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* 차량 설명 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
              <h2 className="font-extrabold text-slate-900 text-lg border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" /> {t.descTitle}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {carData.specs.description}
              </p>
            </div>
          </div>

          {/* 오른쪽: 차량 상세 사양 & 견적 패널 (5/12) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 핵심 정보 카드 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="bg-slate-900 text-accent text-xs font-bold px-2.5 py-1 rounded">
                  {carData.brand} Certified
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  Stock: <span className="text-slate-700 font-extrabold">{carData.stock_number}</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
                {carData.title}
              </h1>

              {/* 가격 영역 */}
              <div className="mt-5 bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase">{t.fobPrice}</span>
                  <PriceDisplay priceUsd={carData.price_usd} className="text-3xl font-black text-slate-900" />
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-semibold block">FOB Port</span>
                  <span className="text-sm font-black text-accent">{carData.specs.fob_port}</span>
                </div>
              </div>

              {/* 기본 요약 아이콘 3종 */}
              <div className="grid grid-cols-3 gap-4 mt-6 border-t border-b border-slate-100 py-4 text-center">
                <div className="flex flex-col items-center">
                  <Calendar className="h-5 w-5 text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Year</span>
                  <span className="text-sm font-extrabold text-slate-800">{carData.year}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Gauge className="h-5 w-5 text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Mileage</span>
                  <span className="text-sm font-extrabold text-slate-800">{(carData.mileage).toLocaleString()} km</span>
                </div>
                <div className="flex flex-col items-center">
                  <Fuel className="h-5 w-5 text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Fuel</span>
                  <span className="text-sm font-extrabold text-slate-800">{carData.fuel_type}</span>
                </div>
              </div>

              {/* [모바일 용] Trust Badge 영역 */}
              <div className="grid grid-cols-2 gap-2 mt-4 md:hidden">
                {TRUST_BADGES.map((badge, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center space-x-2">
                    <badge.icon className="h-4.5 w-4.5 text-accent shrink-0 text-accent" />
                    <div>
                      <h4 className="text-[10px] font-extrabold text-slate-850 leading-tight">{badge.label}</h4>
                      <p className="text-[8px] text-slate-400 leading-tight mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 세부 스펙 리스트 (수출 관련 12대 필드 추가 노출) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-slate-500" /> {t.specsTitle}
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: 'Transmission', val: carData.transmission },
                    { label: 'Displacement', val: carData.specs.engine_displacement },
                    { label: 'Drive Train', val: carData.specs.drive_type },
                    { label: 'Exterior Color', val: carData.specs.color },
                    { label: 'Steering Position', val: carData.specs.steering_position },
                    { label: 'VIN (Masked)', val: carData.specs.vin_partial },
                    { label: 'Engine Number', val: carData.specs.engine_number_partial },
                    { label: 'Vehicle Yard', val: carData.specs.vehicle_location },
                    { label: 'HS Code', val: carData.specs.hs_code },
                    { label: 'Export Cert.', val: carData.specs.export_certificate_status.toUpperCase() },
                    { label: 'Accident History', val: carData.specs.accident_history },
                    { label: 'Seating Capacity', val: `${carData.specs.seating_capacity} Persons` }
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50 last:border-none">
                      <td className="py-2.5 text-slate-400 font-semibold">{row.label}</td>
                      <td className="py-2.5 text-slate-800 font-bold text-right">{row.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 성능점검표 다운로드 버튼 */}
              {carData.specs.inspection_report_url && (
                <a
                  href={carData.specs.inspection_report_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Download Technical Inspection Sheet</span>
                </a>
              )}
            </div>

            {/* 차량 옵션 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-slate-500" /> {t.optionsTitle}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {carData.specs.options.map((opt: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">{opt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* [PC 용] 견적 요청 및 Trust Badge 영역 */}
            <div className="hidden md:flex flex-col gap-4">
              
              {/* Trust Badge Grid */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-accent" />
                  <span>Secure Global Export</span>
                </h3>
                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {TRUST_BADGES.map((badge, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5">
                      <badge.icon className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{badge.label}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex flex-col gap-3">
                <Link
                  href={`/quote?carId=${id}`}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg border border-slate-800 flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                >
                  <Send className="h-4 w-4 text-accent" /> {t.btnInquireFob}
                </Link>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                >
                  <MessageCircle className="h-5 w-5" /> {t.btnWhatsapp}
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 모바일 화면 하단 고정 스티키 액션 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-3.5 shadow-2xl flex gap-3 md:hidden">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-center text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <MessageCircle className="h-5 w-5" /> {t.btnWhatsapp.split(' ')[0]}
        </a>
        <Link
          href={`/quote?carId=${id}`}
          className="flex-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-center text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
        >
          <Send className="h-4 w-4 text-accent" /> {t.quoteButton}
        </Link>
      </div>

    </div>
  )
}
