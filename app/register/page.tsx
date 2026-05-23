'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Car, UserCheck, AlertCircle, RefreshCw } from 'lucide-react'

// Zod 회원가입 검증 스키마 (z.enum의 컴파일 매개변수 에러 수정)
const registerSchema = z.object({
  email: z.string().email({ message: '올바른 이메일 주소를 입력해 주세요.' }),
  password: z.string().min(6, { message: '비밀번호는 최소 6글자 이상이어야 합니다.' }),
  full_name: z.string().min(2, { message: '이름은 최소 2글자 이상이어야 합니다.' }),
  company_name: z.string().optional(),
  whatsapp: z.string().optional(),
  role: z.enum(['buyer', 'dealer']),
  country: z.string().min(2, { message: '국가를 입력해 주세요.' })
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      company_name: '',
      whatsapp: '',
      role: 'buyer',
      country: ''
    }
  })

  const getFriendlyErrorMessage = (message: string) => {
    if (!message) return '회원가입 중 오류가 발생했습니다.'
    
    const lowerMessage = message.toLowerCase()
    
    if (
      lowerMessage.includes('already registered') || 
      lowerMessage.includes('user already exists') || 
      lowerMessage.includes('already exists') ||
      lowerMessage.includes('duplicate key')
    ) {
      return '이미 가입된 이메일 주소입니다. 로그인 페이지를 이용하시거나 다른 이메일로 가입해 주세요.'
    }
    
    if (lowerMessage.includes('database error saving new user')) {
      return '이미 등록된 이메일이거나 데이터베이스 저장 과정에서 오류가 발생했습니다. (이미 동일한 이메일로 가입되어 있을 수 있으니 로그인을 시도해 보세요.)'
    }
    
    if (lowerMessage.includes('password should be at least')) {
      const match = message.match(/\d+/)
      const length = match ? match[0] : '6'
      return `비밀번호는 최소 ${length}글자 이상이어야 합니다.`
    }
    
    if (lowerMessage.includes('password should contain')) {
      return '비밀번호가 보안 규칙에 맞지 않습니다. 대문자, 소문자, 숫자, 특수문자를 적절히 조합해 주세요.'
    }
    
    if (lowerMessage.includes('rate limit')) {
      return '요청 횟수 초과입니다. 잠시 후 다시 시도해 주세요.'
    }
    
    return `회원가입 오류: ${message}`
  }

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            role: values.role,
            company_name: values.company_name,
            whatsapp: values.whatsapp,
            country: values.country
          }
        }
      })

      if (error) throw error

      setSuccessMessage('회원가입이 완료되었습니다! 가입 승인 및 설정을 위해 메일을 확인하시거나 관리자에게 문의해 주세요.')
      
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 3000)

    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err.message))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-grow bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-lg">
        
        {/* 헤더 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold tracking-wider text-slate-900 mb-3">
            <Car className="h-7 w-7 text-accent" />
            <span className="font-extrabold uppercase">GLOBAL<span className="text-accent">AUTO</span></span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Create Buyer or Dealer Account</h1>
          <p className="text-slate-500 text-xs mt-1">Register to start requesting quotes and manage your shipments.</p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3.5 mb-6 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg p-3.5 mb-6 flex items-start gap-2">
            <UserCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* 가입 구분 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Type (Role)</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer font-semibold text-sm text-slate-700">
                <input
                  type="radio"
                  value="buyer"
                  {...register('role')}
                  className="mr-2 text-secondary accent-secondary"
                />
                <span>Foreign Buyer</span>
              </label>
              <label className="flex items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer font-semibold text-sm text-slate-700">
                <input
                  type="radio"
                  value="dealer"
                  {...register('role')}
                  className="mr-2 text-secondary accent-secondary"
                />
                <span>Domestic Dealer</span>
              </label>
            </div>
            {errors.role && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.role.message}</p>}
          </div>

          {/* 이름 & 이메일 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                {...register('full_name')}
                placeholder="Your full name"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800"
              />
              {errors.full_name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email.message}</p>}
            </div>
          </div>

          {/* 비밀번호 & 국가 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                {...register('password')}
                placeholder="Min 6 characters"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Country</label>
              <input
                type="text"
                {...register('country')}
                placeholder="e.g. Ghana, Vietnam"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800"
              />
              {errors.country && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.country.message}</p>}
            </div>
          </div>

          {/* 회사명 & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name (Optional)</label>
              <input
                type="text"
                {...register('company_name')}
                placeholder="e.g. Auto Imports Ltd"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp Number (Optional)</label>
              <input
                type="tel"
                {...register('whatsapp')}
                placeholder="e.g. +233 24 123 4567"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* 가입 완료 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Registering Account...</span>
              </>
            ) : (
              <span>Register Account</span>
            )}
          </button>

        </form>

        {/* 로그인 유도 */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <span>Already have an account? </span>
          <Link href="/login" className="font-bold text-secondary hover:text-blue-700 transition">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  )
}
