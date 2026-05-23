import type { Metadata } from 'next'
import Link from 'next/link'
import { Car, Star, CheckCircle, ArrowRight, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: "Kia Used Cars Export | Korean Kia Export Hub",
  description: "Buy certified Kia used cars directly from South Korea. Popular models: Sportage, Sorento, K5 (Optima), Picanto (Morning), and Bongo Trucks. Transparent FOB/CIF shipping quotes.",
  keywords: ["Kia used cars export", "buy used Kia from Korea", "used Kia Sportage export", "Korean Kia Bongo truck export"]
}

export default function UsedKiaExportPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || '821000000000'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello!%20I%20am%20interested%20in%20importing%20a%2520used%20Kia%20car%20from%20Korea.`

  const popularModels = [
    { name: 'Sportage & Sorento', segment: 'SUV Lineup', desc: 'World-renowned sport utility vehicles offering massive cabin space, durability, and robust common-rail diesel engines.' },
    { name: 'K5 (Optima)', segment: 'Mid-size Sedan', desc: 'Sleek design, fuel-efficient engines (Gasoline & LPG options), and high safety ratings.' },
    { name: 'Bongo 3 Truck', segment: 'Commercial Vehicle', desc: 'The backbone of cargo operations. Outstanding payload capability, reliable manual transmissions, and sturdy suspensions.' },
    { name: 'Picanto (Morning)', segment: 'City Car / Hatchback', desc: 'Extremely fuel-efficient, compact size for easy parking, and low customs duties due to small engine displacement.' }
  ]

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* 히어로 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800')] bg-cover" />
          <div className="relative z-10 space-y-4">
            <span className="bg-accent text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Brand Highlight</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Kia Used Cars Export (Direct from South Korea)
            </h1>
            <p className="text-slate-350 text-sm max-w-2xl leading-relaxed">
              Kia Motors is famous for its dynamic design, powerful engineering, and utility. We export inspected Kia passenger sedans, robust SUVs, and cargo commercial Bongo trucks directly from Korean yards to global ports.
            </p>
            <div className="pt-4 flex flex-wrap gap-3">
              <Link href="/cars?brand=Kia" className="bg-accent hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-md">
                Browse Kia Inventory
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span>Request Custom Sourcing</span>
              </a>
            </div>
          </div>
        </div>

        {/* 인기 기아 라인업 */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Car className="h-5 w-5 text-slate-500" /> Most Demanded Kia Export Models
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {popularModels.map((model, idx) => (
              <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm">{model.name}</h3>
                  <span className="bg-slate-200 text-slate-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{model.segment}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pt-1">{model.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 신뢰 가이드 */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Star className="h-5 w-5 text-slate-500" /> Why Export Kia from South Korea?
          </h2>
          <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
              <div><strong>Sturdy Build & Utility:</strong> Kia SUVs and Bongo trucks are highly appreciated in developing nations due to robust suspension and engine block durability.</div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
              <div><strong>Pre-Export Inspection:</strong> All exported Kia cars pass a strict 150-point technical check to confirm suspension, electronics, engine, and transmission are in top shape.</div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
              <div><strong>Left-Hand Drive (LHD):</strong> Built for Korean domestic use, these are native LHD vehicles, complying with import laws in Ghana, Nigeria, Libya, and Middle East.</div>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg">Looking for a Specific Kia Model?</h3>
          <p className="text-slate-500 text-xs max-w-lg mx-auto">Browse our live inventory to request CIF pricing, or consult our export managers directly via WhatsApp.</p>
          <Link href="/cars?brand=Kia" className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition shadow-md">
            <span>Search Kia Cars</span>
            <ArrowRight className="h-4 w-4 text-accent" />
          </Link>
        </div>

      </div>
    </div>
  )
}
