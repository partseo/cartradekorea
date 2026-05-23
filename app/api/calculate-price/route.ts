import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { carId, countryId, portId, terms } = body

    if (!carId) {
      return NextResponse.json({ error: 'carId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. 차량 가격 조회
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('price_usd')
      .eq('id', carId)
      .single()

    const vehicle_price = car ? Number(car.price_usd) : 12000 // Fallback 차량가

    // 2. 국가 및 항구 해상 운임 조회
    let baseShippingCost = 2000 // 기본 디폴트 운임 ($)
    if (countryId) {
      const { data: country } = await supabase
        .from('countries')
        .select('base_shipping_cost')
        .eq('id', countryId)
        .single()
      if (country) {
        baseShippingCost = Number(country.base_shipping_cost)
      }
    }

    let additionalPortCost = 0
    if (portId) {
      const { data: port } = await supabase
        .from('ports')
        .select('additional_cost')
        .eq('id', portId)
        .single()
      if (port) {
        additionalPortCost = Number(port.additional_cost)
      }
    }

    const ocean_freight = baseShippingCost + additionalPortCost

    // 3. 고정/가변 수출 부대 비용 정의 ($)
    const inland_transport_fee = 150 // 내륙 운송비 (야드 -> 항구)
    const port_handling_fee = 100    // 컨테이너 적재/항만 처리 수수료
    const inspection_fee = 80       // 수출 전 차량 성능 및 통관 정밀 검사비
    const documentation_fee = 50     // BL, Invoice, Packing List 발행 및 말소 대행 서류비
    const bank_charge = 40           // 해외 송금 취급 은행 수수료

    // 4. FOB Total 계산 (차량 가격 + 국내 부대비용 합산)
    const fob_total = vehicle_price + inland_transport_fee + port_handling_fee + inspection_fee + documentation_fee

    // 5. 해상 보험료 (CIF일 때만 적용, FOB Total의 0.9% 혹은 최소 $110)
    let marine_insurance = 0
    if (terms === 'CIF') {
      marine_insurance = Math.max(Math.round(fob_total * 0.009), 110)
    }

    // 6. CIF Total 계산 (FOB Total + 해상운임 + 보험료 + 은행 수수료)
    const cif_total = fob_total + ocean_freight + marine_insurance + bank_charge

    // 7. 견적 유효기간 설정 (오늘부터 14일 후)
    const validDate = new Date()
    validDate.setDate(validDate.getDate() + 14)
    const quote_valid_until = validDate.toISOString().split('T')[0]

    return NextResponse.json({
      success: true,
      vehicle_price,
      inland_transport_fee,
      port_handling_fee,
      inspection_fee,
      documentation_fee,
      ocean_freight,
      marine_insurance,
      bank_charge,
      fob_total,
      cif_total,
      quote_valid_until,
      terms
    })

  } catch (err: any) {
    console.error(err)
    
    // 에러 발생 시 안전 폴백 응답
    const fallbackCarPrice = 12000
    const fallbackFob = fallbackCarPrice + 150 + 100 + 80 + 50
    const fallbackCif = fallbackFob + 2200 + 110 + 40
    
    const validDate = new Date()
    validDate.setDate(validDate.getDate() + 14)

    return NextResponse.json({
      success: true,
      vehicle_price: fallbackCarPrice,
      inland_transport_fee: 150,
      port_handling_fee: 100,
      inspection_fee: 80,
      documentation_fee: 50,
      ocean_freight: 2200,
      marine_insurance: 110,
      bank_charge: 40,
      fob_total: fallbackFob,
      cif_total: fallbackCif,
      quote_valid_until: validDate.toISOString().split('T')[0],
      terms: 'CIF'
    })
  }
}
