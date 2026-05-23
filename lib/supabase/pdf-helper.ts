import { jsPDF } from 'jspdf'
import { createClient } from './client'

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

interface PDFPayload {
  quoteId: string
  buyerName: string
  buyerEmail: string
  whatsapp?: string
  carTitle: string
  carBrand: string
  carModel: string
  carYear: number
  carPriceUsd: number
  quoteDetail: QuoteDetail
  stock_number?: string
}

// 1. Quotation PDF 생성 및 업로드 함수
export async function createAndUploadQuotationPDF(payload: PDFPayload): Promise<string> {
  const doc = new jsPDF()
  const detail = payload.quoteDetail

  // 스타일 설정
  doc.setFont('helvetica', 'normal')
  
  // 헤더 로고 & 타이틀
  doc.setFontSize(22)
  doc.setTextColor(30, 41, 59) // slate-800
  doc.text('GLOBAL AUTO EXPORT', 14, 20)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139) // slate-500
  doc.text('Premium Used Vehicles & Global Logistics', 14, 26)
  
  doc.setFontSize(18)
  doc.setTextColor(217, 119, 6) // amber-600
  doc.text('OFFICIAL QUOTATION', 130, 20)
  
  // 구분선
  doc.setDrawColor(226, 232, 240)
  doc.line(14, 32, 196, 32)
  
  // 바이어 및 회사 정보
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text('FROM:', 14, 42)
  doc.setFont('helvetica', 'bold')
  doc.text('GLOBAL AUTO EXPORT LTD.', 14, 48)
  doc.setFont('helvetica', 'normal')
  doc.text('Incheon Port Yard 3, Incheon, South Korea', 14, 54)
  doc.text('Email: export@globalauto.com | WhatsApp: +82-10-1234-5678', 14, 60)

  doc.text('PREPARED FOR:', 110, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(payload.buyerName, 110, 48)
  doc.setFont('helvetica', 'normal')
  doc.text(`Email: ${payload.buyerEmail}`, 110, 54)
  doc.text(`WhatsApp: ${payload.whatsapp || 'N/A'}`, 110, 60)

  doc.line(14, 66, 196, 66)

  // 차량 및 거래조건
  doc.setFont('helvetica', 'bold')
  doc.text('VEHICLE DETAILS', 14, 76)
  doc.setFont('helvetica', 'normal')
  doc.text(`Model: ${payload.carTitle} (${payload.carYear})`, 14, 82)
  doc.text(`Brand / Spec: ${payload.carBrand} ${payload.carModel}`, 14, 88)
  
  doc.setFont('helvetica', 'bold')
  doc.text('TRADE TERMS', 110, 76)
  doc.setFont('helvetica', 'normal')
  doc.text(`Pricing Basis: FOB & CIF (${detail.terms} Terms)`, 110, 82)
  doc.text(`Validity Period: Until ${detail.quote_valid_until}`, 110, 88)

  doc.line(14, 95, 196, 95)

  // 상세 요금 명세서 테이블 표기
  doc.setFont('helvetica', 'bold')
  doc.text('PRICE & COST ITEMIZATION BREAKDOWN', 14, 105)
  
  const headers = ['No.', 'Description of Export Service / Cost Item', 'Amount (USD)']
  const rows = [
    ['1', 'Vehicle Price (FOB base value)', `$${detail.vehicle_price.toLocaleString()}`],
    ['2', 'Inland Transport (Yard to Incheon/Busan Port)', `$${detail.inland_transport_fee.toLocaleString()}`],
    ['3', 'Port Handling Charge (RORO loading fees)', `$${detail.port_handling_fee.toLocaleString()}`],
    ['4', 'Export Pre-Shipment Inspection Fee', `$${detail.inspection_fee.toLocaleString()}`],
    ['5', 'Export Documentation & Customs Clearance Fee', `$${detail.documentation_fee.toLocaleString()}`],
    ['', 'FOB Total Price (Sub-total)', `$${detail.fob_total.toLocaleString()}`],
    ['6', 'Ocean Freight Cost (Container / Vessel space)', `$${detail.ocean_freight.toLocaleString()}`],
    ['7', 'Marine Cargo Insurance Premium (CIF cover)', `$${detail.marine_insurance.toLocaleString()}`],
    ['8', 'International Bank Wire Routing Fee', `$${detail.bank_charge.toLocaleString()}`]
  ]

  let y = 115
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  // 헤더 드로잉
  doc.setFillColor(241, 245, 249)
  doc.rect(14, y, 182, 7, 'F')
  doc.setTextColor(30, 41, 59)
  doc.text(headers[0], 16, y + 5)
  doc.text(headers[1], 30, y + 5)
  doc.text(headers[2], 160, y + 5)
  
  y += 7
  doc.setFont('helvetica', 'normal')
  
  rows.forEach((row) => {
    // 서브토탈 강조 배경색
    if (row[0] === '') {
      doc.setFillColor(254, 243, 199) // amber bg
      doc.rect(14, y, 182, 7, 'F')
      doc.setFont('helvetica', 'bold')
    } else {
      doc.setFont('helvetica', 'normal')
    }

    doc.text(row[0], 16, y + 5)
    doc.text(row[1], 30, y + 5)
    doc.text(row[2], 160, y + 5)
    y += 7
  })

  // 최종 합계
  doc.line(14, y + 2, 196, y + 2)
  y += 10
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL CIF PRICE:', 14, y)
  
  const finalPrice = detail.terms === 'CIF' ? detail.cif_total : detail.fob_total
  doc.text(`$${finalPrice.toLocaleString()} USD`, 145, y)

  // 사인 안내
  y += 25
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Authorized Signature / Export Director', 130, y)
  doc.line(130, y + 10, 190, y + 10)

  // Blob 생성
  const pdfBlob = doc.output('blob')
  return await uploadPDFToStorage(payload.quoteId, 'Quotation', pdfBlob)
}

// 2. Proforma Invoice PDF 생성 및 업로드 함수
export async function createAndUploadInvoicePDF(payload: PDFPayload): Promise<string> {
  const doc = new jsPDF()
  const detail = payload.quoteDetail

  doc.setFont('helvetica', 'normal')
  
  // 헤더 로고 & 타이틀
  doc.setFontSize(22)
  doc.setTextColor(30, 41, 59)
  doc.text('GLOBAL AUTO EXPORT', 14, 20)
  
  doc.setFontSize(18)
  doc.setTextColor(15, 118, 110) // teal-700
  doc.text('PROFORMA INVOICE', 130, 20)
  
  doc.setDrawColor(226, 232, 240)
  doc.line(14, 32, 196, 32)
  
  // 거래 당사자
  doc.setFontSize(10)
  doc.text('EXPORTER (FROM):', 14, 42)
  doc.setFont('helvetica', 'bold')
  doc.text('GLOBAL AUTO EXPORT LTD.', 14, 48)
  doc.setFont('helvetica', 'normal')
  doc.text('Incheon Port Yard 3, Incheon, South Korea', 14, 54)
  doc.text('Tel: +82-10-1234-5678 | VAT ID: 120-81-12345', 14, 60)

  doc.text('CONSIGNEE (TO):', 110, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(payload.buyerName, 110, 48)
  doc.setFont('helvetica', 'normal')
  doc.text(`Email: ${payload.buyerEmail}`, 110, 54)
  doc.text(`WhatsApp: ${payload.whatsapp || 'N/A'}`, 110, 60)

  doc.line(14, 66, 196, 66)

  // 계약 메타데이터
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE / CONTRACT INFO', 14, 76)
  doc.setFont('helvetica', 'normal')
  doc.text(`PI Number: GAE-${payload.quoteId.slice(0, 8).toUpperCase()}`, 14, 82)
  doc.text(`Date of Issue: ${new Date().toISOString().split('T')[0]}`, 14, 88)
  
  doc.setFont('helvetica', 'bold')
  doc.text('SHIPPING DETAILS', 110, 76)
  doc.setFont('helvetica', 'normal')
  doc.text(`Port of Loading: Incheon/Busan Port, Korea`, 110, 82)
  doc.text(`Port of Discharge: ${detail.terms === 'CIF' ? 'Buyer Port' : 'FOB Base Port'}`, 110, 88)

  doc.line(14, 95, 196, 95)

  // 거래 내역 테이블
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIPTION OF CONTRACTED GOODS', 14, 105)
  
  const headers = ['Item No.', 'Vehicle Description & Specs', 'Qty', 'Unit Price', 'Total USD']
  const finalPrice = detail.terms === 'CIF' ? detail.cif_total : detail.fob_total
  const rows = [
    [
      '1', 
      `${payload.carTitle} (${payload.carYear} model, Brand: ${payload.carBrand})\nFrame No: ${payload.stock_number || 'N/A'}\nLogistics/Insurance condition: ${detail.terms}`, 
      '1', 
      `$${finalPrice.toLocaleString()}`, 
      `$${finalPrice.toLocaleString()}`
    ]
  ]

  let y = 115
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(241, 245, 249)
  doc.rect(14, y, 182, 7, 'F')
  doc.text(headers[0], 16, y + 5)
  doc.text(headers[1], 35, y + 5)
  doc.text(headers[120] ? 'Qty' : 'Qty', 115, y + 5)
  doc.text('Unit Price', 135, y + 5)
  doc.text('Total USD', 165, y + 5)

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(rows[0][0], 16, y + 5)
  doc.text(rows[0][1], 35, y + 5)
  doc.text(rows[0][2], 115, y + 5)
  doc.text(rows[0][3], 135, y + 5)
  doc.text(rows[0][4], 165, y + 5)

  // 구분선
  y += 18
  doc.line(14, y, 196, y)
  
  // 송금 은행 가이드 (Wire Transfer Instruction)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('BANK WIRE TRANSFER INSTRUCTION (IMPORTANT)', 14, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text('Please transfer the total amount to the exporter bank account below:', 14, y)
  
  y += 6
  doc.setFillColor(248, 250, 252) // light grey bg
  doc.rect(14, y, 182, 32, 'F')
  
  doc.setFont('helvetica', 'bold')
  doc.text('Beneficiary Bank:', 18, y + 6)
  doc.text('Account Number:', 18, y + 12)
  doc.text('SWIFT Code:', 18, y + 18)
  doc.text('Beneficiary Name:', 18, y + 24)

  doc.setFont('helvetica', 'normal')
  doc.text('KOREA EXIM BANK (SEOUL MAIN BRANCH)', 55, y + 6)
  doc.text('123-4567-8901-23 (USD Account Only)', 55, y + 12)
  doc.text('KOEXKRSEXXX', 55, y + 18)
  doc.text('GLOBAL AUTO EXPORT LTD.', 55, y + 24)

  // 유효기간 및 싸인
  y += 42
  doc.text(`This Proforma Invoice is valid until ${detail.quote_valid_until}`, 14, y)
  
  y += 15
  doc.text('Authorized Exporter Representative Signature', 120, y)
  doc.line(120, y + 10, 190, y + 10)

  // Blob 생성
  const pdfBlob = doc.output('blob')
  return await uploadPDFToStorage(payload.quoteId, 'Proforma_Invoice', pdfBlob)
}

// 3. 내부 공통 Supabase Storage 업로드 헬퍼
async function uploadPDFToStorage(quoteId: string, docName: string, blob: Blob): Promise<string> {
  const supabase = createClient()
  const fileName = `${quoteId}/${docName}_${Date.now()}.pdf`

  // Storage private bucket 'export-documents' 에 업로드
  const { error: uploadError } = await supabase.storage
    .from('export-documents')
    .upload(fileName, blob, {
      contentType: 'application/pdf',
      upsert: true
    })

  if (uploadError) throw uploadError

  // Signed URL 또는 Public URL을 가져옵니다. 
  // 여기서는 export-documents 가 Private 버킷이므로 Signed URL(60일 유효)을 생성하여 DB에 박아넣습니다.
  const { data: signedData, error: signError } = await supabase.storage
    .from('export-documents')
    .createSignedUrl(fileName, 60 * 24 * 3600) // 60일 유효

  if (signError) throw signError
  const fileUrl = signedData.signedUrl

  // export_documents 테이블에 생성 로그 및 링크 등록
  const { error: dbError } = await supabase
    .from('export_documents')
    .insert({
      quote_request_id: quoteId,
      document_name: docName.replace('_', ' '),
      file_url: fileUrl
    })

  if (dbError) throw dbError

  return fileUrl
}
