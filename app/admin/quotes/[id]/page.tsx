import { createClient } from '@/lib/supabase/server'
import AdminQuoteDetailClient from '@/components/admin/AdminQuoteDetailClient'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  let quote: any = null
  let car: any = null
  let detail: any = null
  let quotationUrl: string | null = null
  let invoiceUrl: string | null = null
  let errorMessage: string | null = null

  try {
    const { data: qData, error: qError } = await supabase
      .from('quote_requests')
      .select('*, cars(*, car_specs(*)), countries(name, base_shipping_cost), ports(name, additional_cost)')
      .eq('id', id)
      .single()

    if (qError) throw qError

    quote = qData
    car = qData.cars

    // 세부 견적 항목 기본화 처리 (DB quote_detail 이 있으면 파싱, 없으면 디폴트 계산값 세팅)
    const d = qData.quote_detail || {}
    const carPrice = Number(qData.cars?.price_usd || 12000)
    const baseFreight = Number(qData.countries?.base_shipping_cost || 2000)
    const addFreight = Number(qData.ports?.additional_cost || 0)

    detail = {
      vehicle_price: d.vehicle_price ?? carPrice,
      inland_transport_fee: d.inland_transport_fee ?? 150,
      port_handling_fee: d.port_handling_fee ?? 100,
      inspection_fee: d.inspection_fee ?? 80,
      documentation_fee: d.documentation_fee ?? 50,
      ocean_freight: d.ocean_freight ?? (baseFreight + addFreight),
      terms: d.terms ?? 'CIF',
      marine_insurance: d.marine_insurance ?? Math.max(Math.round((carPrice + 380) * 0.009), 110),
      bank_charge: d.bank_charge ?? 40,
      admin_memo: d.admin_memo || ''
    }

    // 기존 생성된 PDF 서류가 있는지 조회
    const { data: docs } = await supabase
      .from('export_documents')
      .select('*')
      .eq('quote_request_id', id)

    if (docs) {
      const qDoc = docs.find((doc: any) => doc.document_name === 'Quotation')
      const iDoc = docs.find((doc: any) => doc.document_name === 'Proforma Invoice')
      if (qDoc) quotationUrl = `/api/documents/download?id=${qDoc.id}`
      if (iDoc) invoiceUrl = `/api/documents/download?id=${iDoc.id}`
    }

  } catch (err: any) {
    console.error('Failed to load quote details on server:', err)
    errorMessage = err.message || 'Failed to load quote details from Database.'
  }

  if (errorMessage && !quote) {
    return (
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center py-16">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-white">Error Occurred</h2>
        <p className="text-slate-400 text-sm mt-3">{errorMessage}</p>
        <Link href="/admin/quotes" className="mt-6 inline-block bg-slate-800 hover:bg-slate-750 text-white font-bold px-6 py-2 rounded-xl transition cursor-pointer">
          Back to list
        </Link>
      </div>
    )
  }

  return (
    <AdminQuoteDetailClient
      quoteId={id}
      initialQuote={quote}
      initialCar={car}
      initialDetail={detail}
      initialQuotationUrl={quotationUrl}
      initialInvoiceUrl={invoiceUrl}
    />
  )
}
