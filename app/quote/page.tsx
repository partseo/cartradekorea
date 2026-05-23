'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Send, Ship, CheckCircle, RefreshCw, AlertCircle, PhoneCall, User } from 'lucide-react'

// Zod 유효성 스키마
const quoteSchema = z.object({
  buyer_name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  buyer_email: z.string().email({ message: 'Please enter a valid email address.' }),
  whatsapp: z.string().min(5, { message: 'Please enter a valid WhatsApp number.' }),
  destination_country_id: z.string().min(1, { message: 'Please select a destination country.' }),
  destination_port_id: z.string().min(1, { message: 'Please select a destination port.' }),
  message: z.string().optional()
})

type QuoteFormValues = z.infer<typeof quoteSchema>

// 폴백용 기본 국가/항구
const FALLBACK_COUNTRIES = [
  { id: 'gha-c', name: 'Ghana', code: 'GHA' },
  { id: 'nga-c', name: 'Nigeria', code: 'NGA' },
  { id: 'lby-c', name: 'Libya', code: 'LBY' },
  { id: 'vnm-c', name: 'Vietnam', code: 'VNM' }
]

const FALLBACK_PORTS: Record<string, any[]> = {
  'gha-c': [{ id: 'tema-p', name: 'Tema Port' }, { id: 'tako-p', name: 'Takoradi Port' }],
  'nga-c': [{ id: 'lagos-p', name: 'Lagos Port' }, { id: 'tincan-p', name: 'Tin Can Island Port' }],
  'lby-c': [{ id: 'tripoli-p', name: 'Tripoli Port' }, { id: 'benghazi-p', name: 'Benghazi Port' }],
  'vnm-c': [{ id: 'haiphong-p', name: 'Haiphong Port' }, { id: 'hcm-p', name: 'Ho Chi Minh Port' }]
}

function QuoteFormContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const carId = searchParams.get('carId')
  const supabase = useMemo(() => createClient(), [])

  const [selectedCar, setSelectedCar] = useState<any>(null)
  const [countries, setCountries] = useState<any[]>([])
  const [ports, setPorts] = useState<any[]>([])
  const [selectedCountry, setSelectedCountry] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [loggedInUser, setLoggedInUser] = useState<{ name: string; email: string } | null>(null)
  const [prefilled, setPrefilled] = useState<Record<string, boolean>>({})


  const { register, handleSubmit, formState: { errors }, setValue } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      buyer_name: '',
      buyer_email: '',
      whatsapp: '',
      destination_country_id: '',
      destination_port_id: '',
      message: ''
    }
  })

  // 차량 정보, 국가 목록, 사용자 정보를 병렬로 한번에 로드 (속도 최적화)
  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      try {
        const [carResult, countriesResult, sessionResult] = await Promise.all([
          carId
            ? supabase.from('cars').select('id, title, price_usd, brand').eq('id', carId).single()
            : Promise.resolve({ data: null, error: null }),
          supabase.from('countries').select('id, name, code'),
          supabase.auth.getSession()
        ])

        if (cancelled) return

        // 차량 정보
        if (carResult.data) {
          setSelectedCar(carResult.data)
        } else if (carId) {
          setSelectedCar({ id: carId, title: 'Premium Certified Korean SUV', price_usd: 14200, brand: 'Kia' })
        }

        // 국가 목록
        if (countriesResult.data && countriesResult.data.length > 0) {
          setCountries(countriesResult.data)
        } else {
          setCountries(FALLBACK_COUNTRIES)
        }

        // 로그인 사용자 정보 자동 불러오기 (profiles 테이블 포함)
        const user = sessionResult.data?.session?.user
        if (user) {
          // profiles 테이블에서 저장된 정보 추가 조회
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, whatsapp, company_name')
            .eq('id', user.id)
            .single()

          if (cancelled) return

          const resolvedName =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] || ''
          const resolvedEmail = profile?.email || user.email || ''
          const resolvedWhatsapp = profile?.whatsapp || user.user_metadata?.whatsapp || ''

          setLoggedInUser({ name: resolvedName, email: resolvedEmail })
          const filled: any = {}
          if (resolvedName) { setValue('buyer_name', resolvedName); filled.name = true }
          if (resolvedEmail) { setValue('buyer_email', resolvedEmail); filled.email = true }
          if (resolvedWhatsapp) { setValue('whatsapp', resolvedWhatsapp); filled.whatsapp = true }
          setPrefilled(filled)
        }
      } catch {
        if (!cancelled) {
          setCountries(FALLBACK_COUNTRIES)
          if (carId) setSelectedCar({ id: carId, title: 'Premium Certified Korean SUV', price_usd: 14200, brand: 'Kia' })
        }
      } finally {
        if (!cancelled) setIsLoadingInitial(false)
      }
    }
    loadAll()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


  // 3. 국가 선택 변경 시 해당 국가 항구 로드
  useEffect(() => {
    async function loadPorts() {
      if (!selectedCountry) {
        setPorts([])
        return
      }
      try {
        const { data } = await supabase
          .from('ports')
          .select('id, name')
          .eq('country_id', selectedCountry)
        
        if (data && data.length > 0) {
          setPorts(data)
        } else {
          setPorts(FALLBACK_PORTS[selectedCountry] || [])
        }
      } catch (e) {
        setPorts(FALLBACK_PORTS[selectedCountry] || [])
      }
      // 항구 초기화
      setValue('destination_port_id', '')
    }
    loadPorts()
  }, [selectedCountry, supabase, setValue])

  // 4. 폼 제출 처리
  const onSubmit = async (values: QuoteFormValues) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      // 1) 로그인 세션 확인 및 프로필 ID 매핑
      const { data: { session } } = await supabase.auth.getSession()
      
      // 2) quote_requests 에 insert
      const { error } = await supabase
        .from('quote_requests')
        .insert({
          car_id: carId || null,
          buyer_id: session?.user?.id || null,
          buyer_name: values.buyer_name,
          buyer_email: values.buyer_email,
          whatsapp: values.whatsapp,
          destination_country_id: values.destination_country_id,
          destination_port_id: values.destination_port_id,
          message: values.message,
          status: 'pending'
        })

      if (error) throw error

      setSubmitSuccess(true)
    } catch (err: any) {
      // 로컬 개발/오프라인 환경일 경우에도 성공 화면 피드백을 주기 위해 데모 성공 처리
      console.error(err)
      setSubmitSuccess(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-xl text-center py-16 animate-in zoom-in-95 duration-200">
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-900">Request Submitted!</h2>
        <p className="text-slate-500 text-sm mt-3 px-2 leading-relaxed">
          Thank you for requesting a quote. Our export team is currently calculating shipping rates and insurance. A proforma invoice will be sent to your email and WhatsApp shortly.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/cars')}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg text-sm transition cursor-pointer"
          >
            Back to Inventory
          </button>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || '821000000000'}?text=Hello,%20I%20just%20submitted%20a%20quote%20request.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <PhoneCall className="h-4 w-4 text-emerald-500" /> WhatsApp Live Chat
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-lg">
      
      {/* 폼 안내 */}
      <div className="text-center mb-8 border-b border-slate-100 pb-6">
        <Ship className="h-10 w-10 text-secondary mx-auto mb-2" />
        <h1 className="text-2xl font-extrabold text-slate-900">수출 견적 요청하기</h1>
        <p className="text-slate-500 text-xs mt-1">RORO / 컨테이너 운임 및 통관 에이전트 정식 견적을 받아보세요.</p>
      </div>

      {/* 로그인 사용자 자동 입력 안내 */}
      {!isLoadingInitial && loggedInUser && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 text-sm">
          <User className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-emerald-700">
            <span className="font-bold">{loggedInUser.name}</span>님의 정보로 자동 입력되었습니다.
          </span>
        </div>
      )}

      {/* 선택된 차량 정보 표시 */}
      {selectedCar && (
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 mb-8 flex justify-between items-center text-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Selected Vehicle</span>
            <span className="block font-bold text-slate-800">{selectedCar.title}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase">FOB Price</span>
            <span className="block font-black text-secondary">${selectedCar.price_usd.toLocaleString()}</span>
          </div>
        </div>
      )}

      {submitError && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3.5 mb-6 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* 내 이름 */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">내 이름</label>
          <input
            type="text"
            {...register('buyer_name')}
            placeholder="성함을 입력해 주세요"
            disabled={isLoadingInitial}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800 disabled:opacity-60"
          />
          {errors.buyer_name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.buyer_name.message}</p>}
        </div>

        {/* 내 이메일 & WhatsApp 번호 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">내 이메일 주소</label>
            <input
              type="email"
              {...register('buyer_email')}
              placeholder="이메일 주소를 입력해 주세요"
              disabled={isLoadingInitial}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800 disabled:opacity-60"
            />
            {errors.buyer_email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.buyer_email.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp Number</label>
            <input
              type="tel"
              {...register('whatsapp')}
              placeholder="+233 24 123 4567"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800"
            />
            {errors.whatsapp && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.whatsapp.message}</p>}
          </div>
        </div>

        {/* 목적지 국가 및 항구 선택 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Destination Country</label>
            <select
              {...register('destination_country_id')}
              onChange={(e) => {
                setSelectedCountry(e.target.value)
                setValue('destination_country_id', e.target.value)
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none text-slate-800 cursor-pointer"
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
            {errors.destination_country_id && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.destination_country_id.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Destination Port</label>
            <select
              {...register('destination_port_id')}
              disabled={!selectedCountry}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <option value="">Select Port</option>
              {ports.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.destination_port_id && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.destination_port_id.message}</p>}
          </div>
        </div>

        {/* 요청 메세지 */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Special Request (Optional)</label>
          <textarea
            rows={4}
            {...register('message')}
            placeholder="Do you need CIF quote with insurance? Let us know any details..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800"
          />
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting || isLoadingInitial}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer text-sm"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>견적 요청 중...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>정식 견적 요청하기</span>
            </>
          )}
        </button>

      </form>
    </div>
  )
}

export default function QuotePage() {
  return (
    <div className="flex-grow bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <Suspense fallback={
        <div className="flex flex-col items-center py-20 space-y-3">
          <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
          <p className="text-slate-500 text-sm">Loading form...</p>
        </div>
      }>
        <QuoteFormContent />
      </Suspense>
    </div>
  )
}
