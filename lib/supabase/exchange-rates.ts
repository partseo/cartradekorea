export type Currency = 'USD' | 'KRW' | 'EUR' | 'AED' | 'SAR' | 'JPY' | 'VND' | 'CLP';

export const exchangeRateUpdatedAt = '2026-05-23';

// 1 USD 기준 고정 환율 테이블
export const exchangeRates: Record<Currency, number> = {
  USD: 1.0,
  KRW: 1380.0,
  EUR: 0.92,
  AED: 3.67,
  SAR: 3.75,
  JPY: 156.0,
  VND: 25400.0,
  CLP: 910.0,
};

/**
 * 추후 실시간 환율 API 등으로 확장이 가능하도록 환율 조회 함수로 캡슐화
 */
export function getExchangeRate(targetCurrency: Currency): number {
  return exchangeRates[targetCurrency] || 1.0;
}
