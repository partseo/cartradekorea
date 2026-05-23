'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  User, Mail, Phone, MapPin, Star, ClipboardList, 
  Ship, Trash2, ArrowRight, CheckCircle2, Clock, ShieldX, RefreshCw 
} from 'lucide-react'

// 목데이터: 가상 마이페이지 데이터 (로그인 안 되어 있거나 정보 없을 경우)
const MOCK_PROFILE = {
  full_name: 'Alex Kofi',
  email: 'alex.kofi@gmail.com',
  company_name: 'Accra Auto Imports',
  whatsapp: '+233 24 123 4567',
  country: 'Ghana',
  role: 'buyer'
}

const MOCK_QUOTES = [
  {
    id: 'quote-1',
    created_at: '2026-05-20T10:15:30Z',
    status: 'under_review',
    calculated_total_price: 14000,
    car: {
      id: 'avante-2020',
      title: 'Hyundai Avante 1.6 Smart',
      price_usd: 11500
    },
    port: { name: 'Tema Port' }
  },
  {
    id: 'quote-2',
    created_at: '2026-05-15T14:22:10Z',
    status: 'sent',
    calculated_total_price: 16700,
    car: {
      id: 'sportage-2019',
      title: 'Kia Sportage 2.0 Trendy',
      price_usd: 14200
    },
    port: { name: 'Tema Port' }
  }
]

const MOCK_FAVORITES = [
  {
    id: 'fav-1',
    car: {
      id: 'santa-2021',
      title: 'Hyundai Santa Fe 2.2 Prestige',
      price_usd: 23800,
      year: 2021,
      mileage: 32000,
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'
    }
  }
]

export default function MyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'quotes' | 'favorites'>('quotes')

  useEffect(() => {
    async function loadUserData() {
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          // 비인가 상태일 경우 안내 처리 또는 목데이터 로드 (데모용)
          setProfile(MOCK_PROFILE)
          setQuotes(MOCK_QUOTES)
          setFavorites(MOCK_FAVORITES)
          setIsLoading(false)
          return
        }

        // 1. 프로필 정보 가져오기
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setProfile(userProfile || MOCK_PROFILE)

        // 2. 견적 요청서 가져오기
        const { data: userQuotes } = await supabase
          .from('quote_requests')
          .select('*, cars(id, title, price_usd), ports(name)')
          .eq('buyer_id', session.user.id)
          .order('created_at', { ascending: false })
        
        setQuotes(userQuotes || [])

        // 3. 관심매물 가져오기
        const { data: userFavs } = await supabase
          .from('favorites')
          .select('*, cars(*, car_images(image_url, is_main))')
          .eq('user_id', session.user.id)
        
        if (userFavs) {
          const formattedFavs = userFavs.map((fav: any) => {
            const mainImg = fav.cars?.car_images?.find((img: any) => img.is_main)?.image_url 
              || fav.cars?.car_images?.[0]?.image_url 
              || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600';
            return {
              id: fav.id,
              car: {
                id: fav.cars?.id,
                title: fav.cars?.title,
                price_usd: Number(fav.cars?.price_usd),
                year: fav.cars?.year,
                mileage: fav.cars?.mileage,
                image: mainImg
              }
            }
          })
          setFavorites(formattedFavs)
        } else {
          setFavorites([])
        }

      } catch (err) {
        console.error(err)
        setProfile(MOCK_PROFILE)
        setQuotes(MOCK_QUOTES)
        setFavorites(MOCK_FAVORITES)
      } finally {
        setIsLoading(false)
      }
    }
    loadUserData()
  }, [supabase])

  // 관심매물 제거
  const handleRemoveFavorite = async (favId: string) => {
    try {
      // 실제 DB 삭제 시도
      const { error } = await supabase.from('favorites').delete().eq('id', favId)
      if (error) throw error

      setFavorites(favorites.filter((f) => f.id !== favId))
    } catch (e) {
      // 로컬 화면 갱신
      setFavorites(favorites.filter((f) => f.id !== favId))
    }
  }

  // 견적 진행단계 뱃지 UI 헬퍼
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit"><Clock className="h-3.5 w-3.5" /> Pending</span>
      case 'under_review':
        return <span className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Reviewing</span>
      case 'sent':
        return <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit"><CheckCircle2 className="h-3.5 w-3.5" /> Sent Quote</span>
      case 'completed':
        return <span className="bg-slate-900 border border-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Contracted</span>
      default:
        return <span className="bg-red-50 border border-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit"><ShieldX className="h-3.5 w-3.5" /> Cancelled</span>
    }
  }

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-48 space-y-4">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-accent rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold">Loading your details...</p>
      </div>
    )
  }

  return (
    <div className="flex-grow bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 1. 왼쪽: 프로필 패널 (4/12) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                <User className="h-10 w-10 text-slate-500" />
              </div>
              <h2 className="font-extrabold text-slate-900 text-lg mt-4">{profile?.full_name}</h2>
              <span className="bg-secondary/15 text-secondary text-[10px] font-bold px-2.5 py-1 rounded-full mt-2 uppercase tracking-wide">
                Certified {profile?.role}
              </span>
            </div>

            <div className="space-y-4 mt-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2.5">
                <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <span className="line-clamp-1">{profile?.email}</span>
              </div>
              {profile?.company_name && (
                <div className="flex items-center space-x-2.5">
                  <ClipboardList className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{profile.company_name}</span>
                </div>
              )}
              {profile?.whatsapp && (
                <div className="flex items-center space-x-2.5">
                  <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <span>{profile.whatsapp}</span>
                </div>
              )}
              {profile?.country && (
                <div className="flex items-center space-x-2.5">
                  <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <span>{profile.country}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. 오른쪽: 탭 영역 및 세부 내역 (8/12) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 탭 버튼들 */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('quotes')}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'quotes' 
                    ? 'border-secondary text-secondary' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <ClipboardList className="h-4.5 w-4.5" />
                <span>My Quotes ({quotes.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'favorites' 
                    ? 'border-secondary text-secondary' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Star className="h-4.5 w-4.5" />
                <span>Favorites ({favorites.length})</span>
              </button>
            </div>

            {/* 탭 본문 내용 */}
            <div>
              {activeTab === 'quotes' ? (
                /* 견적 리스트 */
                quotes.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No quote requests found.</p>
                    <Link
                      href="/cars"
                      className="inline-flex items-center text-sm font-bold text-secondary hover:text-blue-700 mt-4 transition"
                    >
                      Browse Inventory <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotes.map((q) => (
                      <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(q.created_at).toLocaleDateString()}</span>
                            <span className="text-xs font-semibold text-slate-500">ID: {q.id.slice(0,8)}</span>
                          </div>
                          <h3 className="font-extrabold text-slate-900 text-base">{q.cars?.title || 'Selected Vehicle'}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>Base: <strong>${q.cars?.price_usd?.toLocaleString() || '0'}</strong></span>
                            {q.ports?.name && (
                              <span className="flex items-center gap-1"><Ship className="h-3.5 w-3.5 text-slate-400" /> Destination: <strong>{q.ports.name}</strong></span>
                            )}
                          </div>
                        </div>

                        <div className="sm:text-right flex flex-row sm:flex-col justify-between items-center sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          {getStatusBadge(q.status)}
                          {q.calculated_total_price && (
                            <span className="text-sm font-bold text-slate-800 mt-1">Est. Total: <strong className="text-secondary font-black text-base">${q.calculated_total_price.toLocaleString()}</strong></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* 관심매물 리스트 */
                favorites.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <Star className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No favorite vehicles saved.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {favorites.map((fav) => (
                      <div key={fav.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col group relative">
                        {/* 이미지 영역 */}
                        <div className="relative aspect-[16/10] bg-slate-50 overflow-hidden">
                          <img
                            src={fav.car.image}
                            alt={fav.car.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                          <button
                            onClick={() => handleRemoveFavorite(fav.id)}
                            className="absolute top-3 right-3 bg-white hover:bg-red-50 text-red-500 p-2 rounded-full shadow border border-slate-100 transition cursor-pointer"
                            title="Remove from favorites"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        {/* 상세 텍스트 */}
                        <div className="p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-secondary transition-colors line-clamp-1">
                              {fav.car.title}
                            </h4>
                            <div className="flex gap-2 text-xs text-slate-500 mt-2">
                              <span>{fav.car.year} Year</span>
                              <span>•</span>
                              <span>{(fav.car.mileage).toLocaleString()} km</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-base font-black text-secondary">${fav.car.price_usd.toLocaleString()}</span>
                            <Link
                              href={`/cars/${fav.car.id}`}
                              className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded transition cursor-pointer"
                            >
                              Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
