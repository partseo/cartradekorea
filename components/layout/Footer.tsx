'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Mail, Phone, MapPin, ExternalLink } from 'lucide-react'

export default function Footer() {
  const pathname = usePathname()
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || '821000000000'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello,%20I%20am%20interested%20in%20buying%20a%20used%20car%20from%20Car%20Trade%20Korea.`

  // 어드민 관리자 페이지에서는 하단 푸터를 렌더링하지 않음
  if (pathname.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
      {/* 주요 정보 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* 회사 소개 및 로고 */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold tracking-wider text-white">
              <Car className="h-6 w-6 text-accent" />
              <span className="font-extrabold uppercase">CAR TRADE <span className="text-accent">KOREA</span></span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Leading the global market in high-quality Korean used car exports. We provide reliable shipping, complete export documentation, and premium customer service.
            </p>
          </div>

          {/* 주요 수출 대상 국가 및 노선 */}
          <div>
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Export Destinations</h3>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-white transition-colors">Ghana (Tema Port)</li>
              <li className="hover:text-white transition-colors">Nigeria (Lagos Port)</li>
              <li className="hover:text-white transition-colors">Libya (Tripoli Port)</li>
              <li className="hover:text-white transition-colors">Vietnam (Haiphong Port)</li>
            </ul>
          </div>

          {/* 바로가기 링크 */}
          <div>
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/cars" className="hover:text-white transition-colors">
                  Search Inventory
                </Link>
              </li>
              <li>
                <Link href="/inquiry" className="hover:text-white transition-colors">
                  General Inquiry
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Buyer Portal
                </Link>
              </li>
              <li>
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors flex items-center gap-1 text-emerald-400 font-medium"
                >
                  WhatsApp Live Chat
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* 고객 지원 연락처 */}
          <div className="space-y-3">
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Support & Office</h3>
            <div className="flex items-start space-x-2.5 text-sm">
              <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <span>Incheon Port Export Complex, South Korea</span>
            </div>
            <div className="flex items-center space-x-2.5 text-sm">
              <Phone className="h-4 w-4 text-accent shrink-0" />
              <span>+82 10-0000-0000</span>
            </div>
            <div className="flex items-center space-x-2.5 text-sm">
              <Mail className="h-4 w-4 text-accent shrink-0" />
              <span>support@cartradekorea.com</span>
            </div>
          </div>

        </div>

        {/* 하단 바 (저작권 등) */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} Car Trade Korea Co., Ltd. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
