'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { dictionaries, Language } from './dictionary'
import { Currency, getExchangeRate, exchangeRateUpdatedAt } from './exchange-rates'

interface SettingsContextProps {
  language: Language
  currency: Currency
  setLanguage: (lang: Language) => void
  setCurrency: (curr: Currency) => void
  t: typeof dictionaries['en'] // 사전 번역 객체
  convertPrice: (usdVal: number) => string // 텍스트 가격 포맷팅 폴백 헬퍼
  exchangeRateUpdatedAt: string
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined)

const SUPPORTED_LANGUAGES: Language[] = ['en', 'ko', 'ar', 'ru', 'es', 'fr', 'pt', 'vi']
const SUPPORTED_CURRENCIES: Currency[] = ['USD', 'KRW', 'EUR', 'AED', 'SAR', 'JPY', 'VND', 'CLP']

export function GlobalSettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [currency, setCurrencyState] = useState<Currency>('USD')

  // 로컬 스토리지 데이터 로드 및 검증
  useEffect(() => {
    const savedLang = localStorage.getItem('global_language') as Language
    const savedCurr = localStorage.getItem('global_currency') as Currency
    
    // 지원하지 않는 구버전 언어 키가 저장되어 있으면 fallback 'en'으로 자동 리셋
    if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
      setLanguageState(savedLang)
    } else if (savedLang) {
      localStorage.setItem('global_language', 'en')
      setLanguageState('en')
    }

    if (savedCurr && SUPPORTED_CURRENCIES.includes(savedCurr)) {
      setCurrencyState(savedCurr)
    } else if (savedCurr) {
      localStorage.setItem('global_currency', 'USD')
      setCurrencyState('USD')
    }
  }, [])

  // 언어 변경 시 RTL 처리 포함
  const setLanguage = (lang: Language) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return
    setLanguageState(lang)
    localStorage.setItem('global_language', lang)
  }

  // 아랍어(ar)의 경우 HTML 문서의 텍스트 방향을 RTL로 설정
  useEffect(() => {
    if (language === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl')
      document.documentElement.setAttribute('lang', 'ar')
    } else {
      document.documentElement.setAttribute('dir', 'ltr')
      document.documentElement.setAttribute('lang', language)
    }
  }, [language])

  const setCurrency = (curr: Currency) => {
    if (!SUPPORTED_CURRENCIES.includes(curr)) return
    setCurrencyState(curr)
    localStorage.setItem('global_currency', curr)
  }

  // 1. 현재 언어의 사전 매핑 (누락 시 영어 사전에서 키 폴백 처리)
  const t = dictionaries[language] || dictionaries['en']

  // 2. 가격 환산 헬퍼 (텍스트 전용 폴백)
  const convertPrice = (usdVal: number): string => {
    const rate = getExchangeRate(currency)
    const converted = usdVal * rate

    if (currency === 'KRW') {
      if (language === 'ko') {
        const manWon = Math.round(converted / 10000)
        return `${manWon.toLocaleString()} 만원`
      }
      return `₩${Math.round(converted).toLocaleString()}`
    }

    // 국제 표준 통화 기호 및 포맷 출력
    const formatter = new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'JPY' || currency === 'VND' || currency === 'CLP' ? 0 : 2
    })
    return formatter.format(converted)
  }

  return (
    <SettingsContext.Provider 
      value={{ 
        language, 
        currency, 
        setLanguage, 
        setCurrency, 
        t, 
        convertPrice,
        exchangeRateUpdatedAt 
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a GlobalSettingsProvider')
  }
  return context
}
