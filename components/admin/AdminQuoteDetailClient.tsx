'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, CheckCircle, AlertCircle, Mail, Phone, 
  MapPin, Calendar, FileText, Save, Download, MessageSquare 
} from 'lucide-react'
// PDF 생성 및 스토리지 연동은 서버 API를 통과하도록 이관됨 (jspdf 클라이언트 로드 배제)

interface AdminQuoteDetailClientProps {
  quoteId: string
  initialQuote: any
  initialCar: any
  initialDetail: {
    vehicle_price: number
    inland_transport_fee: number
    port_handling_fee: number
    inspection_fee: number
    documentation_fee: number
    ocean_freight: number
    marine_insurance: number
    bank_charge: number
    terms: string
    admin_memo: string
  }
  initialQuotationUrl: string | null
  initialInvoiceUrl: string | null
}

export default function AdminQuoteDetailClient({
  quoteId,
  initialQuote,
  initialCar,
  initialDetail,
  initialQuotationUrl,
  initialInvoiceUrl
}: AdminQuoteDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [isSaving, setIsSaving] = useState(false)
  const [isPdfGenerating, setIsPdfGenerating] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 관리자 수동 조정을 위한 요금 입력 상태
  const [vehiclePrice, setVehiclePrice] = useState(initialDetail.vehicle_price)
  const [inlandTransport, setInlandTransport] = useState(initialDetail.inland_transport_fee)
  const [portHandling, setPortHandling] = useState(initialDetail.port_handling_fee)
  const [inspectionFee, setInspectionFee] = useState(initialDetail.inspection_fee)
  const [documentationFee, setDocumentationFee] = useState(initialDetail.documentation_fee)
  const [oceanFreight, setOceanFreight] = useState(initialDetail.ocean_freight)
  const [marineInsurance, setMarineInsurance] = useState(initialDetail.marine_insurance)
  const [bankCharge, setBankCharge] = useState(initialDetail.bank_charge)
  const [terms, setTerms] = useState(initialDetail.terms)
  const [status, setStatus] = useState(initialQuote.status)

  // 내부 어드민 메모 (quote_detail JSONB 내부에 admin_memo 로 저장)
  const [adminMemo, setAdminMemo] = useState(initialDetail.admin_memo)

  // 생성된 문서 링크 상태
  const [quotationUrl, setQuotationUrl] = useState<string | null>(initialQuotationUrl)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(initialInvoiceUrl)

  // 수동 견적 변경 계산 합계
  const fobTotal = vehiclePrice + inlandTransport + portHandling + inspectionFee + documentationFee
  const cifTotal = fobTotal + oceanFreight + (terms === 'CIF' ? marineInsurance : 0) + bankCharge
  const finalCalculatedTotal = terms === 'CIF' ? cifTotal : fobTotal

  const handleSaveQuote = async () => {
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const adminId = session?.user?.id || null

      const updatedDetail = {
        vehicle_price: vehiclePrice,
        inland_transport_fee: inlandTransport,
        port_handling_fee: portHandling,
        inspection_fee: inspectionFee,
        documentation_fee: documentationFee,
        ocean_freight: oceanFreight,
        marine_insurance: terms === 'CIF' ? marineInsurance : 0,
        bank_charge: bankCharge,
        fob_total: fobTotal,
        cif_total: cifTotal,
        quote_valid_until: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
        terms,
        admin_memo: adminMemo
      }

      // 1. 견적 테이블 업데이트
      const { error: updateError } = await supabase
        .from('quote_requests')
        .update({
          quote_detail: updatedDetail,
          calculated_total_price: finalCalculatedTotal,
          status: status
        })
        .eq('id', quoteId)

      if (updateError) throw updateError

      // 2. 관리자 작업 로그 적재 (admin_logs)
      if (status !== initialQuote.status) {
        await supabase.from('admin_logs').insert({
          admin_id: adminId,
          action: 'UPDATE_QUOTE_STATUS',
          target_table: 'quote_requests',
          target_id: quoteId,
          details: { old_status: initialQuote.status, new_status: status }
        })
      }

      await supabase.from('admin_logs').insert({
        admin_id: adminId,
        action: 'ADJUST_QUOTE_PRICING',
        target_table: 'quote_requests',
        target_id: quoteId,
        details: { adjusted_price: finalCalculatedTotal, terms }
      })

      setSuccessMessage('Quote pricing and status updated successfully in Database.')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Failed to update quote requests.')
    } finally {
      setIsSaving(false)
    }
  }

  // PDF 문서 동적 생성 및 업로드 핸들러
  const handleGeneratePDF = async (type: 'Quotation' | 'Invoice') => {
    setIsPdfGenerating(type)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const pricingData = {
        vehicle_price: vehiclePrice,
        inland_transport_fee: inlandTransport,
        port_handling_fee: portHandling,
        inspection_fee: inspectionFee,
        documentation_fee: documentationFee,
        ocean_freight: oceanFreight,
        marine_insurance: terms === 'CIF' ? marineInsurance : 0,
        bank_charge: bankCharge,
        fob_total: fobTotal,
        cif_total: cifTotal,
        quote_valid_until: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
        terms
      }

      const res = await fetch('/api/admin/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quoteId,
          type: type,
          pricingData: pricingData
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to generate ${type} PDF.`)
      }

      const downloadUrl = `/api/documents/download?id=${data.documentId}`
      if (type === 'Quotation') {
        setQuotationUrl(downloadUrl)
        setSuccessMessage('Quotation PDF generated and uploaded successfully!')
      } else {
        setInvoiceUrl(downloadUrl)
        setSuccessMessage('Proforma Invoice PDF generated and uploaded successfully!')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || `Failed to generate ${type} PDF.`);
    } finally {
      setIsPdfGenerating(null)
    }
  }

  // 이메일 발송 핸들러 (실시간 동적 다운로드 주소 메일링 연동)
  const handleSendEmail = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const siteUrl = window.location.origin
      const docLink = quotationUrl || invoiceUrl || ''
      const fullDocumentUrl = docLink ? `${siteUrl}${docLink}` : ''

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: initialQuote.buyer_email,
          buyerName: initialQuote.buyer_name,
          carTitle: initialCar.title,
          fobTotal: fobTotal,
          cifTotal: cifTotal,
          terms: terms,
          documentUrl: fullDocumentUrl
        })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch email.')
      }

      if (data.simulated) {
        setSuccessMessage('Email dispatch simulated successfully (Development Mock Mode).')
      } else {
        setSuccessMessage('Quote details and document link sent to buyer email successfully via Resend!')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Failed to send email.')
    }
  }

  const whatsappUrl = `https://wa.me/${initialQuote.whatsapp?.replace(/[^0-9+]/g, '')}?text=Hello%20${encodeURIComponent(initialQuote.buyer_name)}!%20Regarding%20your%20quote%20request%20for%20"${encodeURIComponent(initialCar?.title)}",%20I%20have%20adjusted%2520the%20details.`

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/admin/quotes" className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Quote ID: {quoteId.slice(0, 8).toUpperCase()}</h1>
          <p className="text-slate-400 text-xs mt-0.5">Adjust export costs, generate quotation PDFs, and handle buyer interactions.</p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-xs rounded-lg p-3.5 flex items-start gap-2 shadow animate-in fade-in duration-200">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-950/40 border border-red-900/30 text-red-400 text-xs rounded-lg p-3.5 flex items-start gap-2 shadow animate-in fade-in duration-200">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 왼쪽 2열: 바이어/차량 정보 & 견적 세부 조정 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 바이어 & 차량 메타 카드 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 mb-4">Buyer & Vehicle Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 바이어 정보 */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Buyer Profile</span>
                <h3 className="font-extrabold text-white text-lg">{initialQuote.buyer_name}</h3>
                
                <div className="space-y-1.5 text-xs text-slate-450">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-500" /> {initialQuote.buyer_email}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-500" /> {initialQuote.whatsapp || 'N/A'}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-500" /> {initialQuote.countries?.name || 'N/A'} ({initialQuote.ports?.name || 'N/A'})</div>
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-500" /> Request Date: {new Date(initialQuote.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* 차량 정보 */}
              <div className="space-y-2.5 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Inquired Vehicle</span>
                <h3 className="font-extrabold text-white text-lg">{initialCar?.title || 'Vehicle Deleted'}</h3>
                
                <div className="space-y-1 text-xs text-slate-450">
                  <div>Brand: <span className="text-slate-350 font-bold">{initialCar?.brand}</span> | Model: <span className="text-slate-350 font-bold">{initialCar?.model}</span></div>
                  <div>Year: <span className="text-slate-350 font-bold">{initialCar?.year}</span> | Mileage: <span className="text-slate-350 font-bold">{initialCar?.mileage?.toLocaleString()} km</span></div>
                  <div>Base FOB Price: <span className="text-accent font-black text-sm">${initialCar?.price_usd?.toLocaleString()}</span></div>
                </div>
              </div>

            </div>

            {initialQuote.message && (
              <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 italic mt-4">
                "Buyer Message: {initialQuote.message}"
              </div>
            )}
          </div>

          {/* 견적 세부 조정 폼 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 mb-4">Export Quote Pricing Adjustments</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1. Vehicle FOB Price ($)</label>
                <input
                  type="number"
                  value={vehiclePrice}
                  onChange={(e) => setVehiclePrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">2. Inland Transport (Yard to Port) ($)</label>
                <input
                  type="number"
                  value={inlandTransport}
                  onChange={(e) => setInlandTransport(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">3. Port Handling Charge ($)</label>
                <input
                  type="number"
                  value={portHandling}
                  onChange={(e) => setPortHandling(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">4. Technical Inspection Fee ($)</label>
                <input
                  type="number"
                  value={inspectionFee}
                  onChange={(e) => setInspectionFee(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">5. Export Documentation Fee ($)</label>
                <input
                  type="number"
                  value={documentationFee}
                  onChange={(e) => setDocumentationFee(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white"
                />
              </div>
            </div>

            {/* FOB Sub total */}
            <div className="bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-850 flex justify-between items-center text-xs font-bold text-slate-300">
              <span>Adjusted FOB Total (Sub-total)</span>
              <span className="text-sm font-black text-white">${fobTotal.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">6. Ocean Freight Cost ($)</label>
                <input
                  type="number"
                  value={oceanFreight}
                  onChange={(e) => setOceanFreight(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">7. Marine Insurance ($)</label>
                <input
                  type="number"
                  value={marineInsurance}
                  onChange={(e) => setMarineInsurance(Number(e.target.value))}
                  disabled={terms !== 'CIF'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white disabled:bg-slate-900 disabled:text-slate-650"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">8. Bank Wiring Fee ($)</label>
                <input
                  type="number"
                  value={bankCharge}
                  onChange={(e) => setBankCharge(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white"
                />
              </div>
            </div>
          </div>

          {/* 내부 관리자 메모 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 mb-4">Internal Admin Memo</h2>
            <textarea
              rows={4}
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              placeholder="Write internal memo for staff and logistics manager. (This memo is stored securely in quote_detail)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent text-white"
            />
          </div>

        </div>

        {/* 오른쪽 1열: 상태 변경, 서류 생성 및 액션 */}
        <div className="space-y-6">
          
          {/* 상태 변경 패널 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 mb-4">Inquiry Control</h2>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inquiry Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none text-white cursor-pointer"
                >
                  <option value="pending">Pending (접수 대기)</option>
                  <option value="under_review">Under Review (검토 중)</option>
                  <option value="sent">Sent Quote (견적 발송)</option>
                  <option value="completed">Completed (계약 완료)</option>
                  <option value="cancelled">Cancelled (취소)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trade Pricing Basis</label>
                <select
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none text-white cursor-pointer"
                >
                  <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                  <option value="FOB">FOB (Free On Board)</option>
                </select>
              </div>

              {/* 최종 예상가 시각화 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center shadow-inner">
                <span className="text-[10px] text-slate-500 font-black block uppercase">Calculated Total</span>
                <span className="text-2xl font-black text-accent block mt-1">${finalCalculatedTotal.toLocaleString()}</span>
                <span className="text-[9px] text-slate-450 block mt-0.5">({terms} trade terms applied)</span>
              </div>

              <button
                onClick={handleSaveQuote}
                disabled={isSaving}
                className="w-full bg-accent hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl shadow transition duration-200 disabled:bg-slate-800 cursor-pointer flex items-center justify-center gap-1.5 text-sm"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Quote Settings'}</span>
              </button>
            </div>
          </div>

          {/* 수출 서류(PDF) 관리 패널 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 mb-4">Document Operations</h2>
            
            <div className="space-y-3.5">
              
              {/* 1. Quotation PDF */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-350">1. Quotation Sheet</span>
                  {quotationUrl ? (
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/25">Generated</span>
                  ) : (
                    <span className="bg-slate-800 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded">Not Built</span>
                  )}
                </div>
                
                {quotationUrl && (
                  <a
                    href={quotationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-semibold py-2 rounded-lg transition border border-slate-800 flex items-center justify-center gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Quotation</span>
                  </a>
                )}

                <button
                  onClick={() => handleGeneratePDF('Quotation')}
                  disabled={isPdfGenerating !== null}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{isPdfGenerating === 'Quotation' ? 'Generating...' : quotationUrl ? 'Regenerate Quotation' : 'Create Quotation'}</span>
                </button>
              </div>

              {/* 2. Proforma Invoice PDF */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-350">2. Proforma Invoice</span>
                  {invoiceUrl ? (
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/25">Generated</span>
                  ) : (
                    <span className="bg-slate-800 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded">Not Built</span>
                  )}
                </div>

                {invoiceUrl && (
                  <a
                    href={invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-semibold py-2 rounded-lg transition border border-slate-800 flex items-center justify-center gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Invoice (PI)</span>
                  </a>
                )}

                <button
                  onClick={() => handleGeneratePDF('Invoice')}
                  disabled={isPdfGenerating !== null}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{isPdfGenerating === 'Invoice' ? 'Generating...' : invoiceUrl ? 'Regenerate Invoice' : 'Create Proforma Invoice'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* 바이어 상호작용 액션 패널 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 mb-4">Buyer Interactions</h2>
            
            <div className="space-y-2.5">
              <button
                onClick={handleSendEmail}
                className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition cursor-pointer text-xs"
              >
                <Mail className="h-4 w-4 text-accent" />
                <span>Send Document Link to Email</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition cursor-pointer text-xs"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Consult on WhatsApp</span>
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
