'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/lib/supabase/settings-context'
import { Language } from '@/lib/supabase/dictionary'
import { Currency } from '@/lib/supabase/exchange-rates'
import { Menu, X, Car, User, Globe, LogOut, LayoutDashboard, Coins } from 'lucide-react'

// 국기 이모지 및 언어 라벨 매핑 (8개 국어)
const LANGUAGE_LIST: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' }
]

// 지원 통화 리스트
const CURRENCY_LIST: { code: Currency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'KRW', symbol: '₩', label: 'KR Won' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'SAR', symbol: 'ر.س', label: 'Saudi Riyal' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'VND', symbol: '₫', label: 'Vietnamese Dong' },
  { code: 'CLP', symbol: '$', label: 'Chilean Peso' }
]

export default function Header() {
  const { language, setLanguage, currency, setCurrency, t } = useSettings()
  const [isOpen, setIsOpen] = useState(false)
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const [isCurrDropdownOpen, setIsCurrDropdownOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        if (profile) setRole(profile.role)
      } else {
        setUser(null)
        setRole(null)
      }
    }

    getUserData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          if (profile) setRole(profile.role)
        } else {
          setUser(null)
          setRole(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/', label: t.navHome },
    { href: '/cars', label: t.navInventory },
    { href: '/inquiry', label: t.navContact },
  ]

  const activeLink = (path: string) =>
    pathname === path
      ? 'text-accent border-b-2 border-accent'
      : 'text-primary-foreground/80 hover:text-accent transition-colors duration-200'

  const activeLang = LANGUAGE_LIST.find((l) => l.code === language) || LANGUAGE_LIST[0]
  const activeCurr = CURRENCY_LIST.find((c) => c.code === currency) || CURRENCY_LIST[0]

  if (pathname.startsWith('/admin')) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full glassmorphism-dark shadow-md text-white bg-slate-900/95 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* 로고 영역 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold tracking-wider text-white">
              <Car className="h-7 w-7 text-accent" />
              <span className="font-extrabold uppercase">GLOBAL<span className="text-accent">AUTO</span></span>
            </Link>
          </div>

          {/* 데스크톱 메뉴 */}
          <nav className="hidden md:flex space-x-8 text-sm font-semibold tracking-wide uppercase">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`pb-1 ${activeLink(link.href)}`}>
                {link.label}
              </Link>
            ))}
            {role && (role === 'admin' || role === 'staff') && (
              <Link
                href="/admin"
                className="flex items-center space-x-1 text-accent font-bold hover:text-amber-500 transition-colors duration-200"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin Portal</span>
              </Link>
            )}
          </nav>

          {/* 데스크톱 설정 및 인증 영역 */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* 1. 다국어 셀렉터 (드롭다운) */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsLangDropdownOpen(!isLangDropdownOpen)
                  setIsCurrDropdownOpen(false)
                }}
                className="flex items-center space-x-1 text-sm text-slate-300 hover:text-white transition cursor-pointer bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50"
              >
                <Globe className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase">{activeLang.flag} {activeLang.code}</span>
              </button>
              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 z-55 animate-in fade-in slide-in-from-top-1 duration-150">
                  {LANGUAGE_LIST.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setIsLangDropdownOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-left transition cursor-pointer ${
                        language === lang.code ? 'text-accent bg-slate-900' : 'text-slate-300'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span>{lang.flag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. 다중 통화 셀렉터 (드롭다운) */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsCurrDropdownOpen(!isCurrDropdownOpen)
                  setIsLangDropdownOpen(false)
                }}
                className="flex items-center space-x-1 text-sm text-slate-300 hover:text-white transition cursor-pointer bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50"
              >
                <Coins className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase">{activeCurr.code} ({activeCurr.symbol})</span>
              </button>
              {isCurrDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 z-55 animate-in fade-in slide-in-from-top-1 duration-150 max-h-72 overflow-y-auto">
                  {CURRENCY_LIST.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => {
                        setCurrency(curr.code)
                        setIsCurrDropdownOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-left transition cursor-pointer ${
                        currency === curr.code ? 'text-accent bg-slate-900' : 'text-slate-300'
                      }`}
                    >
                      <span>{curr.code} - {curr.label}</span>
                      <span className="text-accent">{curr.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. 유저 인증 상태 */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/mypage" className="flex items-center space-x-1 text-sm text-slate-300 hover:text-accent transition-colors">
                  <User className="h-4 w-4" />
                  <span>{t.navMyPage}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.navLogout}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
                >
                  {t.navLogin}
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold bg-accent text-white px-4 py-2 rounded-md hover:bg-amber-700 shadow-sm transition-all duration-200"
                >
                  {t.navRegister}
                </Link>
              </div>
            )}
          </div>

          {/* 모바일 햄버거 메뉴 버튼 */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/98 py-3 animate-in fade-in slide-in-from-top duration-200">
          
          {/* 모바일 다국어 및 통화 설정 컨트롤러 */}
          <div className="px-4 py-2 flex flex-col space-y-2.5 border-b border-slate-800 pb-3 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1">
                <Globe className="h-4 w-4 text-accent" />
                <span>Language</span>
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-slate-950 text-slate-300 border border-slate-850 text-xs font-semibold px-2 py-1 rounded-md cursor-pointer"
              >
                {LANGUAGE_LIST.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1">
                <Coins className="h-4 w-4 text-accent" />
                <span>Currency</span>
              </span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="bg-slate-950 text-slate-300 border border-slate-850 text-xs font-semibold px-2 py-1 rounded-md cursor-pointer"
              >
                {CURRENCY_LIST.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-2 space-y-1 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-3 rounded-md text-base ${
                  pathname === link.href ? 'text-accent bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {role && (role === 'admin' || role === 'staff') && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-3 rounded-md text-base text-accent font-bold hover:bg-slate-800"
              >
                Admin Portal
              </Link>
            )}

            <div className="border-t border-slate-800 my-2 pt-2"></div>

            {user ? (
              <>
                <Link
                  href="/mypage"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2 px-3 py-3 rounded-md text-base text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <User className="h-5 w-5" />
                  <span>{t.navMyPage}</span>
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    handleLogout()
                  }}
                  className="flex w-full items-center space-x-2 px-3 py-3 rounded-md text-base text-slate-400 hover:text-white hover:bg-slate-800 text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t.navLogout}</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-2.5 border border-slate-700 rounded-md text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  {t.navLogin}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-2.5 bg-accent text-white rounded-md hover:bg-amber-700"
                >
                  {t.navRegister}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
