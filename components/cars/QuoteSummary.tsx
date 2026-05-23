'use client'

import React from 'react'
import PriceDisplay from '@/components/common/PriceDisplay'
import { FileText, ShieldAlert, Calendar, Printer } from 'lucide-react'

interface QuoteDetail {
  vehicle_price: number
  inland_transport_fee: number
  port_handling_fee: number
  inspection_fee: number
  documentation_fee: number
  ocean_freight: number
  marine_insurance: number
  bank_charge: number
  fob_total: number
  cif_total: number
  quote_valid_until: string
  terms: string
}

interface QuoteSummaryProps {
  detail: QuoteDetail
  buyerName?: string
  carTitle?: string
}

export default function QuoteSummary({ detail, buyerName, carTitle }: QuoteSummaryProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white max-w-xl mx-auto space-y-6">
      
      {/* 타이틀 헤더 */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-accent" />
          <div>
            <h3 className="text-lg font-black tracking-tight">Proforma Quotation</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estimated breakdown</p>
          </div>
        </div>
        <span className="bg-accent/15 text-accent text-xs font-black px-2.5 py-1 rounded-md border border-accent/20">
          {detail.terms} Pricing
        </span>
      </div>

      {/* 요약 기본 정보 */}
      {(buyerName || carTitle) && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
          {buyerName && (
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Prepared For</span>
              <span className="text-slate-200 font-extrabold">{buyerName}</span>
            </div>
          )}
          {carTitle && (
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Vehicle Inquiry</span>
              <span className="text-slate-200 font-extrabold">{carTitle}</span>
            </div>
          )}
        </div>
      )}

      {/* 상세 명세서 테이블 */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Detail Cost Itemization</h4>
        
        <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850 text-sm">
          
          <div className="flex justify-between py-1 border-b border-slate-850/50">
            <span className="text-slate-300 font-semibold">1. Vehicle price (FOB base)</span>
            <PriceDisplay priceUsd={detail.vehicle_price} className="font-bold text-slate-100" />
          </div>

          <div className="flex justify-between py-1 border-b border-slate-850/50">
            <span className="text-slate-400">2. Inland Transport (Yard to Port)</span>
            <PriceDisplay priceUsd={detail.inland_transport_fee} className="font-semibold text-slate-300" />
          </div>

          <div className="flex justify-between py-1 border-b border-slate-850/50">
            <span className="text-slate-400">3. Port Handling Charge</span>
            <PriceDisplay priceUsd={detail.port_handling_fee} className="font-semibold text-slate-300" />
          </div>

          <div className="flex justify-between py-1 border-b border-slate-850/50">
            <span className="text-slate-400">4. Export Inspection Fee</span>
            <PriceDisplay priceUsd={detail.inspection_fee} className="font-semibold text-slate-300" />
          </div>

          <div className="flex justify-between py-1 border-b border-slate-850/50 text-xs text-slate-450 italic">
            <span className="text-slate-400 font-medium">5. Export Documentation Fee</span>
            <PriceDisplay priceUsd={detail.documentation_fee} className="font-semibold text-slate-300" />
          </div>

          {/* FOB Total 중간 합산 */}
          <div className="flex justify-between py-2 border-t border-b border-slate-800 bg-slate-900/30 px-2 rounded mt-1">
            <span className="text-accent font-extrabold text-xs uppercase tracking-wide">FOB Total Amount</span>
            <PriceDisplay priceUsd={detail.fob_total} className="font-black text-accent text-sm" />
          </div>

          <div className="flex justify-between py-1 border-b border-slate-850/50 mt-1">
            <span className="text-slate-400">6. Ocean Freight Cost (RORO/Container)</span>
            <PriceDisplay priceUsd={detail.ocean_freight} className="font-semibold text-slate-300" />
          </div>

          <div className="flex justify-between py-1 border-b border-slate-850/50">
            <span className="text-slate-400">7. Marine Insurance Premium</span>
            <PriceDisplay priceUsd={detail.marine_insurance} className="font-semibold text-slate-300" />
          </div>

          <div className="flex justify-between py-1">
            <span className="text-slate-400">8. Bank Wiring Handling Fee</span>
            <PriceDisplay priceUsd={detail.bank_charge} className="font-semibold text-slate-300" />
          </div>

        </div>
      </div>

      {/* 최종 합산 (FOB vs CIF 에 따른 가이드) */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 flex items-center justify-between shadow-inner">
        <div>
          <span className="text-xs text-slate-400 font-bold block uppercase">Total Quote Amount</span>
          <span className="text-[10px] text-slate-500 font-semibold">(FOB + Freight + Insurance + Fees)</span>
        </div>
        <PriceDisplay 
          priceUsd={detail.terms === 'CIF' ? detail.cif_total : detail.fob_total} 
          className="text-3xl font-black text-accent tracking-tight" 
        />
      </div>

      {/* 유효기간 경고 배너 */}
      <div className="flex items-center gap-3 bg-amber-950/20 border border-amber-900/30 text-amber-300 p-4 rounded-xl text-xs leading-relaxed">
        <Calendar className="h-5 w-5 shrink-0 text-accent" />
        <div>
          <span className="font-black block mb-0.5">Quotation Validity</span>
          This quotation is calculated based on current freight rates. Valid until <span className="font-extrabold text-white underline">{detail.quote_valid_until}</span>.
        </div>
      </div>

    </div>
  )
}
