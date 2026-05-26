// ✅ jspdf 동적 import — 바이어 public 번들에서 제외
// import { jsPDF } from 'jspdf'  ← 정적 import 제거 (번들 500KB+ 감소)

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

// 환경변수 기반 회사 설정 정보 취득 헬퍼
function getCompanyConfig() {
  return {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Car Trade Korea',
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'export@cartradekorea.com',
    whatsapp: process.env.NEXT_PUBLIC_COMPANY_WHATSAPP || '+82-10-0000-0000',
    address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || 'Incheon Port Yard 3, Incheon, South Korea',
    vatId: process.env.NEXT_PUBLIC_COMPANY_VAT_ID || '120-81-12345'
  }
}

// 1. Quotation PDF 생성 함수 (바이트 데이터 반환)
export async function generateQuotationPDF(payload: PDFPayload): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const detail = payload.quoteDetail
  const company = getCompanyConfig()

  // 스타일 설정
  doc.setFont('helvetica', 'normal')
  
  // 헤더 로고 & 타이틀
  doc.setFontSize(22)
  doc.setTextColor(30, 41, 59) // slate-800
  doc.text(company.name.toUpperCase(), 14, 20)
  
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
  doc.text(`${company.name} LTD.`, 14, 48)
  doc.setFont('helvetica', 'normal')
  doc.text(company.address, 14, 54)
  doc.text(`Email: ${company.email} | WhatsApp: ${company.whatsapp}`, 14, 60)

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

  // ArrayBuffer로 변환하여 반환
  const pdfBytes = doc.output('arraybuffer')
  return new Uint8Array(pdfBytes)
}

// 2. Proforma Invoice PDF 생성 함수 (바이트 데이터 반환)
export async function generateInvoicePDF(payload: PDFPayload): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const detail = payload.quoteDetail
  const company = getCompanyConfig()

  doc.setFont('helvetica', 'normal')
  
  // 헤더 로고 & 타이틀
  doc.setFontSize(22)
  doc.setTextColor(30, 41, 59)
  doc.text(company.name.toUpperCase(), 14, 20)
  
  doc.setFontSize(18)
  doc.setTextColor(15, 118, 110) // teal-700
  doc.text('PROFORMA INVOICE', 130, 20)
  
  doc.setDrawColor(226, 232, 240)
  doc.line(14, 32, 196, 32)
  
  // 거래 당사자
  doc.setFontSize(10)
  doc.text('EXPORTER (FROM):', 14, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(`${company.name} LTD.`, 14, 48)
  doc.setFont('helvetica', 'normal')
  doc.text(company.address, 14, 54)
  doc.text(`Tel: ${company.whatsapp} | VAT ID: ${company.vatId}`, 14, 60)

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
  doc.text('Qty', 115, y + 5)
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
  
  // 송금 은행 가이드 (보안 강화를 위해 민감한 실계좌번호 노출을 환경변수 또는 계약 후 개별송부로 전환)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('BANK WIRE TRANSFER INSTRUCTION (SECURITY REASSURED)', 14, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text('To assure transaction security, official bank wire info is sent individually.', 14, y)
  
  y += 6
  doc.setFillColor(248, 250, 252) // light grey bg
  doc.rect(14, y, 182, 32, 'F')
  
  doc.setFont('helvetica', 'bold')
  doc.text('Exporters Bank Routing Info:', 18, y + 6)
  doc.text('Official Account Details:', 18, y + 12)
  doc.text('Notice:', 18, y + 18)
  doc.text('Beneficiary Name:', 18, y + 24)

  doc.setFont('helvetica', 'normal')
  doc.text(process.env.NEXT_PUBLIC_BANK_NAME || 'KOREA EXIM BANK (SEOUL BRANCH)', 75, y + 6)
  doc.text('To be shared separately after contract check (계약 체결 후 별도 제공)', 75, y + 12)
  doc.text('Please verify matching wire bank names with export@cartradekorea.com', 75, y + 18)
  doc.text(`${company.name} CO., LTD.`, 75, y + 24)

  // 유효기간 및 싸인
  y += 42
  doc.text(`This Proforma Invoice is valid until ${detail.quote_valid_until}`, 14, y)
  
  y += 15
  doc.text('Authorized Exporter Representative Signature', 120, y)
  doc.line(120, y + 10, 190, y + 10)

  // ArrayBuffer로 변환하여 반환
  const pdfBytes = doc.output('arraybuffer')
  return new Uint8Array(pdfBytes)
}

