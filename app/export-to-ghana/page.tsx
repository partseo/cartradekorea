import type { Metadata } from 'next'
import Link from 'next/link'
import { Ship, ShieldCheck, FileText, ArrowRight, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: "Used Car Export to Ghana | Korean Used Cars to Tema Port",
  description: "Export high-quality Korean used cars to Ghana. Reliable shipping to Tema Port & Takoradi Port. Complete RORO container rate, technical inspection sheets, and clearance guides.",
  keywords: ["used car export to Ghana", "Korean used cars in Ghana", "buy cars from South Korea to Tema", "Hyundai export to Ghana"]
}

export default function ExportToGhanaPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || '821000000000'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello!%20I%20want%20to%20inquire%20about%20exporting%20a%20used%20car%20to%20Ghana.`

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* 히어로 영역 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800')] bg-cover" />
          <div className="relative z-10 space-y-4">
            <span className="bg-accent text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Ghana Market Guide</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Export High-Quality Used Cars to Ghana (Tema & Takoradi)
            </h1>
            <p className="text-slate-350 text-sm max-w-2xl leading-relaxed">
              We specialize in shipping top-grade Hyundai, Kia, and Genesis used vehicles from Incheon Port directly to Tema Port, Ghana. Enjoy transparent ocean freight, verified documents, and professional support.
            </p>
            <div className="pt-4 flex flex-wrap gap-3">
              <Link href="/cars?brand=Hyundai" className="bg-accent hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-md">
                Browse Hyundai Cars
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span>Chat with Ghana Agent</span>
              </a>
            </div>
          </div>
        </div>

        {/* 물류 및 해상 운송 정보 */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Ship className="h-5 w-5 text-slate-500" /> Sea Logistics & Freight Rates to Ghana
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Tema Port (Main Hub)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Most popular route for RORO and Container consolidated shipping. Customs clearance is highly optimized here.</p>
              <div className="pt-2 flex justify-between text-xs font-bold">
                <span className="text-slate-400">Est. Freight (RORO)</span>
                <span className="text-slate-800">$2,500 USD</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Transit Period</span>
                <span className="text-slate-800">Approx. 40 Days</span>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Takoradi Port</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Secondary gateway for Western Ghana regions. Suitable for container shipments.</p>
              <div className="pt-2 flex justify-between text-xs font-bold">
                <span className="text-slate-400">Est. Freight (RORO)</span>
                <span className="text-slate-800">$2,600 USD</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Transit Period</span>
                <span className="text-slate-800">Approx. 43 Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* 규제 및 가이드라인 */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" /> Ghana Import Regulation & Rules
          </h2>
          <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
              <div><strong>Age Limit:</strong> Ghana enforces a penalties scheme on vehicles older than 10 years. Vehicles between 1 to 5 years old are subject to lower duties. We recommend exporting vehicles made after 2017.</div>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
              <div><strong>Left-Hand Drive (LHD):</strong> Ghana regulations strictly require LHD (Left-Hand Drive) configurations. All our Korean domestic vehicles are native LHD, fully compatible.</div>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
              <div><strong>Custom Documents Provided:</strong> We supply a complete set of Telex Release BL (Bill of Lading), Proforma & Commercial Invoice, Packing List, and original Technical Performance Sheets to ensure smooth clearing at Tema Customs.</div>
            </li>
          </ul>
        </div>

        {/* FAQ CTA */}
        <div className="text-center space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg">Ready to Import to Ghana?</h3>
          <p className="text-slate-500 text-xs max-w-lg mx-auto">Get your customized FOB or CIF quote calculation immediately by requesting on any vehicle in our catalog.</p>
          <Link href="/cars" className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition shadow-md">
            <span>Explore Certified Inventory</span>
            <ArrowRight className="h-4 w-4 text-accent" />
          </Link>
        </div>

      </div>
    </div>
  )
}
