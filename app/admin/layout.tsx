'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, Car, ClipboardList, MessageSquare, 
  Users, Ship, Menu, X, ArrowLeft, LogOut, ShieldAlert 
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 1. 관리자 권한 이중 확인 (미들웨어 보완)
  useEffect(() => {
    async function checkAdminAuth() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile && (profile.role === 'admin' || profile.role === 'staff')) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
          // 일반 바이어 계정인 경우 즉시 메인 페이지로 추방
          router.push('/')
        }
      } catch (e) {
        setIsAdmin(false)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }
    checkAdminAuth()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/cars', label: 'Cars Management', icon: Car },
    { href: '/admin/quotes', label: 'Quotes Management', icon: ClipboardList },
    { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
    { href: '/admin/shipments', label: 'Shipments', icon: Ship },
    { href: '/admin/users', label: 'Users & Roles', icon: Users }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white space-y-4">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-accent rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold text-sm">Verifying administrator credentials...</p>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-black">Access Denied</h1>
        <p className="text-slate-400 text-sm mt-2 max-w-sm">You do not have permission to access the administrator console. Redirecting to home...</p>
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
              <span className="font-extrabold text-sm tracking-wider uppercase">GLOBALAUTO <span className="text-accent text-[10px]">ADMIN</span></span>
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
            <span className="font-extrabold text-sm uppercase">GLOBALAUTO <span className="text-accent text-[10px]">ADMIN</span></span>
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
