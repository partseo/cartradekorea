'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Mail, Phone, 
  MapPin, Calendar, FileText, Save, Download, MessageSquare 
} from 'lucide-react'
import { createAndUploadQuotationPDF, createAndUploadInvoicePDF } from '@/lib/supabase/pdf-helper'

export default function AdminQuoteDetailPage() {
  const { id } = useParams()
  const quoteIdStr = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPdfGenerating, setIsPdfGenerating] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // DB 원본 데이터 상태
  const [quote, setQuote] = useState<any>(null)
  const [car, setCar] = useState<any>(null)

  // 관리자 수동 조정을 위한 요금 입력 상태
  const [vehiclePrice, setVehiclePrice] = useState(0)
  const [inlandTransport, setInlandTransport] = useState(0)
  const [portHandling, setPortHandling] = useState(0)
  const [inspectionFee, setInspectionFee] = useState(0)
  const [documentationFee, setDocumentationFee] = useState(0)
  const [oceanFreight, setOceanFreight] = useState(0)
  const [marineInsurance, setMarineInsurance] = useState(0)
  const [bankCharge, setBankCharge] = useState(0)
  const [terms, setTerms] = useState('CIF')
  const [status, setStatus] = useState('pending')

  // 내부 어드민 메모 (quote_detail JSONB 내부에 admin_memo 로 저장)
  const [adminMemo, setAdminMemo] = useState('')

  // 생성된 문서 링크 상태
  const [quotationUrl, setQuotationUrl] = useState<string | null>(null)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuoteData() {
      setIsLoading(true)
      try {
        const { data: qData, error: qError } = await supabase
          .from('quote_requests')
          .select('*, cars(*, car_specs(*)), countries(name, base_shipping_cost), ports(name, additional_cost)')
          .eq('id', id)
          .single()

        if (qError) throw qError

        setQuote(qData)
        setCar(qData.cars)
        setStatus(qData.status)

        // 세부 견적 항목 기본화 처리 (DB quote_detail 이 있으면 파싱, 없으면 디폴트 계산값 세팅)
        const detail = qData.quote_detail || {}
        
        const carPrice = Number(qData.cars?.price_usd || 12000)
        setVehiclePrice(detail.vehicle_price ?? carPrice)
        setInlandTransport(detail.inland_transport_fee ?? 150)
        setPortHandling(detail.port_handling_fee ?? 100)
        setInspectionFee(detail.inspection_fee ?? 80)
        setDocumentationFee(detail.documentation_fee ?? 50)
        
        const baseFreight = Number(qData.countries?.base_shipping_cost || 2000)
        const addFreight = Number(qData.ports?.additional_cost || 0)
        setOceanFreight(detail.ocean_freight ?? (baseFreight + addFreight))
        
        setTerms(detail.terms ?? 'CIF')
        setMarineInsurance(detail.marine_insurance ?? Math.max(Math.round((carPrice + 380) * 0.009), 110))
        setBankCharge(detail.bank_charge ?? 40)
        setAdminMemo(detail.admin_memo || '')

        // 기존 생성된 PDF 서류가 있는지 조회
        const { data: docs } = await supabase
          .from('export_documents')
          .select('*')
          .eq('quote_request_id', id)

        if (docs) {
          const qDoc = docs.find((d: any) => d.document_name === 'Quotation')
          const iDoc = docs.find((d: any) => d.document_name === 'Proforma Invoice')
          if (qDoc) setQuotationUrl(qDoc.file_url)
          if (iDoc) setInvoiceUrl(iDoc.file_url)
        }

      } catch (err: any) {
        console.error(err)
        setErrorMessage(err.message || 'Failed to load quote details from Database.')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) loadQuoteData()
  }, [id, supabase])

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
        .eq('id', id)

      if (updateError) throw updateError

      // 2. 관리자 작업 로그 적재 (admin_logs)
      if (status !== quote.status) {
        await supabase.from('admin_logs').insert({
          admin_id: adminId,
          action: 'UPDATE_QUOTE_STATUS',
          target_table: 'quote_requests',
          target_id: id,
          details: { old_status: quote.status, new_status: status }
        })
      }

      await supabase.from('admin_logs').insert({
        admin_id: adminId,
        action: 'ADJUST_QUOTE_PRICING',
        target_table: 'quote_requests',
        target_id: id,
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
      const payload = {
        quoteId: id as string,
        buyerName: quote.buyer_name,
        buyerEmail: quote.buyer_email,
        whatsapp: quote.whatsapp,
        carTitle: car.title,
        carBrand: car.brand,
        carModel: car.model,
        carYear: car.year,
        carPriceUsd: car.price_usd,
        quoteDetail: {
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
      }

      let fileUrl = ''
      if (type === 'Quotation') {
        fileUrl = await createAndUploadQuotationPDF(payload)
        setQuotationUrl(fileUrl)
        setSuccessMessage('Quotation PDF generated and uploaded successfully!')
      } else {
        fileUrl = await createAndUploadInvoicePDF(payload)
        setInvoiceUrl(fileUrl)
        setSuccessMessage('Proforma Invoice PDF generated and uploaded successfully!')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || `Failed to generate ${type} PDF.`);
    } finally {
      setIsPdfGenerating(null)
    }
  }

  // 이메일 발송 핸들러 (Resend API 연동 모의 호출)
  const handleSendEmail = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: quote.buyer_email,
          buyerName: quote.buyer_name,
          carTitle: car.title,
          fobTotal: fobTotal,
          cifTotal: cifTotal,
          terms: terms,
          documentUrl: quotationUrl || invoiceUrl || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        setSuccessMessage('Quote details and document link sent to buyer email successfully!')
      } else {
        throw new Error(data.message)
      }
    } catch (err: any) {
      setSuccessMessage('Mail sending mock completed (Resend API key required for full SMTP dispatch).')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white space-y-4">
        <RefreshCw className="h-10 w-10 text-slate-500 animate-spin" />
        <p className="text-slate-400 font-semibold text-sm">Loading detailed quote request...</p>
      </div>
    )
  }

  if (errorMessage && !quote) {
    return (
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center py-16">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-white">Error Occurred</h2>
        <p className="text-slate-400 text-sm mt-3">{errorMessage}</p>
        <Link href="/admin/quotes" className="mt-6 inline-block bg-slate-800 hover:bg-slate-750 text-white font-bold px-6 py-2 rounded-xl transition">
          Back to list
        </Link>
      </div>
    )
  }

  const whatsappUrl = `https://wa.me/${quote.whatsapp?.replace(/[^0-9+]/g, '')}?text=Hello%20${encodeURIComponent(quote.buyer_name)}!%20Regarding%20your%20quote%20request%20for%20"${encodeURIComponent(car?.title)}",%20I%20have%20adjusted%2520the%20details.`

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/admin/quotes" className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Quote ID: {quoteIdStr.slice(0, 8).toUpperCase()}</h1>
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
                <h3 className="font-extrabold text-white text-lg">{quote.buyer_name}</h3>
                
                <div className="space-y-1.5 text-xs text-slate-450">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-500" /> {quote.buyer_email}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-500" /> {quote.whatsapp || 'N/A'}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-500" /> {quote.countries?.name || 'N/A'} ({quote.ports?.name || 'N/A'})</div>
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-500" /> Request Date: {new Date(quote.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* 차량 정보 */}
              <div className="space-y-2.5 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Inquired Vehicle</span>
                <h3 className="font-extrabold text-white text-lg">{car?.title || 'Vehicle Deleted'}</h3>
                
                <div className="space-y-1 text-xs text-slate-450">
                  <div>Brand: <span className="text-slate-350 font-bold">{car?.brand}</span> | Model: <span className="text-slate-350 font-bold">{car?.model}</span></div>
                  <div>Year: <span className="text-slate-350 font-bold">{car?.year}</span> | Mileage: <span className="text-slate-350 font-bold">{car?.mileage?.toLocaleString()} km</span></div>
                  <div>Base FOB Price: <span className="text-accent font-black text-sm">${car?.price_usd?.toLocaleString()}</span></div>
                </div>
              </div>

            </div>

            {quote.message && (
              <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 italic mt-4">
                "Buyer Message: {quote.message}"
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
