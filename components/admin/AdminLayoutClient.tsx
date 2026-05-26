'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, Car, ClipboardList, MessageSquare, 
  Users, Ship, Menu, X, ArrowLeft, LogOut, ShieldAlert 
} from 'lucide-react'

interface AdminLayoutClientProps {
  children: React.ReactNode
  user: any
  isAdmin: boolean
  debugInfo: {
    email: string
    uid: string
    metaRole: string
    dbRole: string
    errorMsg: string
  } | null
}

export default function AdminLayoutClient({
  children,
  user,
  isAdmin,
  debugInfo
}: AdminLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLogout = async () => {
    // 1. Supabase 공식 세션 종료
    await supabase.auth.signOut()

    // 2. 로컬 스토리지의 supabase 세션 흔적도 명시적으로 완전 소멸
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
    }

    // 3. 쿠키 파쇄 엔드포인트로 이동 (쿠키 완전히 제거한 후 로그인 페이지로 자동 리다이렉트됨)
    window.location.href = '/api/clear-cookies'
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/cars', label: 'Cars Management', icon: Car },
    { href: '/admin/quotes', label: 'Quotes Management', icon: ClipboardList },
    { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
    { href: '/admin/shipments', label: 'Shipments', icon: Ship },
    { href: '/admin/users', label: 'Users & Roles', icon: Users }
  ]

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-black text-red-500">Access Denied (접근 거부됨)</h1>
        <p className="text-slate-400 text-sm mt-2 max-w-md">
          관리자 콘솔에 접근할 수 있는 권한이 없습니다. 계정의 권한 설정을 점검해 주십시오.
        </p>

        {/* 상세 디버그 진단 박스 */}
        {debugInfo && process.env.NODE_ENV === 'development' && (
          <div className="mt-6 w-full max-w-lg bg-slate-900 border border-red-900/50 rounded-xl p-5 text-left text-xs font-mono space-y-2 text-slate-300 shadow-xl mx-auto">
            <h3 className="text-red-400 font-bold border-b border-slate-800 pb-2 mb-2 uppercase tracking-wider text-[11px]">🔧 접근 제어 진단 데이터 (Diagnostic Info)</h3>
            <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-500">계정 이메일:</span> <span className="text-white font-bold">{debugInfo.email}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-500">사용자 UUID:</span> <span className="text-slate-400">{debugInfo.uid}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-500">세션 메타 권한 (JWT):</span> <span className="text-amber-400 font-bold">{debugInfo.metaRole}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-500">실시간 DB 권한 (Profiles):</span> <span className="text-amber-400 font-bold">{debugInfo.dbRole}</span></div>
            <div className="pt-3.5 mt-2">
              <span className="text-slate-500 block mb-1">상세 진단 에러 내용:</span>
              <p className="text-red-400 bg-red-950/30 p-2.5 rounded border border-red-900/30 break-all leading-normal whitespace-pre-wrap font-sans">
                {debugInfo.errorMsg}
              </p>
            </div>
          </div>
        )}

        {/* 조치 버튼들 */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            다른 계정으로 로그인
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            메인 페이지로 이동
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      
      {/* 1. 데스크톱 사이드바 (Lg 이상 고정) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-5 space-y-6 shrink-0 justify-between">
        <div className="space-y-6">
          
          {/* 어드민 로고 */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <Link href="/" className="flex items-center space-x-2 text-white">
              <Car className="h-6 w-6 text-accent" />
              <span className="font-extrabold text-sm tracking-wider uppercase">CAR TRADE KOREA <span className="text-accent text-[10px]">ADMIN</span></span>
            </Link>
          </div>

          {/* 메뉴 링크 리스트 */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-accent text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* 하단 제어 메뉴 */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Buyer Website</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition text-left cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>System Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. 모바일 GNB 탑 바 (드로어 트리거 포함) */}
      <div className="flex-grow flex flex-col min-w-0">
        <header className="lg:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <Link href="/" className="flex items-center space-x-2 text-white">
            <Car className="h-5 w-5 text-accent" />
            <span className="font-extrabold text-sm uppercase">CAR TRADE KOREA <span className="text-accent text-[10px]">ADMIN</span></span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* 본문 콘텐츠 스크롤 영역 */}
        <main className="flex-grow p-4 sm:p-8 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>

      {/* 3. 모바일 사이드바 드로어 (오버레이) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            onClick={() => setIsSidebarOpen(false)} 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" 
          />
          <aside className="relative w-64 bg-slate-900 h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <span className="font-extrabold text-sm uppercase tracking-wider text-white">Admin Console</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                        isActive 
                          ? 'bg-accent text-white shadow-md' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              <Link
                href="/"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Buyer Website</span>
              </Link>
              <button
                onClick={() => {
                  setIsSidebarOpen(false)
                  handleLogout()
                }}
                className="flex w-full items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>System Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

    </div>
  )
}
