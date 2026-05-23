'use client'

import React from 'react'
import { useSettings } from '@/lib/supabase/settings-context'
import { getExchangeRate } from '@/lib/supabase/exchange-rates'

interface PriceDisplayProps {
  priceUsd: number
  className?: string
}

export default function PriceDisplay({ priceUsd, className = '' }: PriceDisplayProps) {
  const { language, currency } = useSettings()

  // 1. 환율 가져오기 (만약 통화 키가 비정상이거나 없으면 USD(1.0) fallback)
  const rate = getExchangeRate(currency)
  const convertedPrice = priceUsd * rate

  // 2. 한국어('ko')이면서 'KRW' 통화인 경우 중고차 업계 관례에 맞게 "X,XXX 만원"으로 출력
  if (currency === 'KRW' && language === 'ko') {
    const manWon = Math.round(convertedPrice / 10000)
    return (
      <span className={className}>
        {manWon.toLocaleString()} <span className="text-xs font-normal">만원</span>
      </span>
    )
  }

  // 3. 통화별 소수점 자릿수 결정 (원화, 엔화, 동화, 칠레페소는 소수점 제외)
  const hasNoDecimals = ['KRW', 'JPY', 'VND', 'CLP'].includes(currency)
  
  // 4. 국제 표준 포맷팅 (Intl.NumberFormat 사용)
  try {
    const formatter = new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: hasNoDecimals ? 0 : 2,
    })
    return <span className={className}>{formatter.format(convertedPrice)}</span>
  } catch (error) {
    // 포맷 도중 에러가 나거나 브라우저에서 통화를 지원 안 하는 경우 기본 USD fallback 표기
    return <span className={className}>${priceUsd.toLocaleString()}</span>
  }
}
