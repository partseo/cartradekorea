import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuotationPDF, generateInvoicePDF } from '@/lib/supabase/pdf-helper'

export async function POST(request: Request) {
  const startTime = performance.now()
  const requestId = request.headers.get('x-request-id') || Math.random().toString(36).substring(7)

  try {
    const supabase = await createClient()

    // 1. 세션 사용자 및 어드민 권한 체크
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. 요청 파라미터 파싱
    const body = await request.json()
    const { quoteId, type, pricingData } = body

    if (!quoteId || !type || !pricingData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. 견적 요청 및 차량 데이터 조회
    const { data: quote, error: quoteError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 })
    }

    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('*')
      .eq('id', quote.car_id)
      .single()

    if (carError || !car) {
      return NextResponse.json({ error: 'Car details not found' }, { status: 404 })
    }

    // 4. PDF 생성 Payload 조립
    const payload = {
      quoteId,
      buyerName: quote.buyer_name,
      buyerEmail: quote.buyer_email,
      whatsapp: quote.whatsapp,
      carTitle: car.title,
      carBrand: car.brand,
      carModel: car.model,
      carYear: car.year,
      carPriceUsd: car.price_usd,
      quoteDetail: {
        vehicle_price: pricingData.vehicle_price,
        inland_transport_fee: pricingData.inland_transport_fee,
        port_handling_fee: pricingData.port_handling_fee,
        inspection_fee: pricingData.inspection_fee,
        documentation_fee: pricingData.documentation_fee,
        ocean_freight: pricingData.ocean_freight,
        marine_insurance: pricingData.marine_insurance,
        bank_charge: pricingData.bank_charge,
        fob_total: pricingData.fob_total,
        cif_total: pricingData.cif_total,
        quote_valid_until: pricingData.quote_valid_until,
        terms: pricingData.terms
      }
    }

    // 5. PDF 바이너리 생성 (jsPDF 서버 사이드 동적 실행)
    let pdfBytes: Uint8Array
    if (type === 'Quotation') {
      pdfBytes = await generateQuotationPDF(payload)
    } else if (type === 'Invoice') {
      pdfBytes = await generateInvoicePDF(payload)
    } else {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    // 6. Supabase Storage (Private: export-documents) 에 PDF 파일 저장
    const fileName = `${quoteId}/${type}_${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('export-documents')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // 7. DB export_documents 테이블에 파일 경로(file_path) 등록
    // file_url 컬럼은 하드코딩 signed URL을 방지하기 위해 빈 문자열로 처리하거나 null로 채움
    const { data: insertedDoc, error: dbError } = await supabase
      .from('export_documents')
      .insert({
        quote_request_id: quoteId,
        document_name: type.replace('_', ' '),
        file_path: fileName
      })
      .select('id')
      .single()

    if (dbError || !insertedDoc) {
      throw new Error(`Database registration failed: ${dbError?.message}`)
    }

    const duration = performance.now() - startTime
    console.log(`[PERFORMANCE] API: generate-pdf | Duration: ${duration.toFixed(1)}ms | Status: 200 | RequestID: ${requestId}`)

    return NextResponse.json({
      success: true,
      documentId: insertedDoc.id,
      filePath: fileName
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })

  } catch (err: any) {
    const duration = performance.now() - startTime
    console.error(`[ERROR] API: generate-pdf | Duration: ${duration.toFixed(1)}ms | RequestID: ${requestId} | Error: ${err.message}`)
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal Server Error'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })
  }
}
