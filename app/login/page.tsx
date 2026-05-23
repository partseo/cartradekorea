'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Car, Lock, Mail, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react'

// Zod 유효성 스키마
const loginSchema = z.object({
  email: z.string().email({ message: '올바른 이메일 주소를 입력해 주세요.' }),
  password: z.string().min(6, { message: '비밀번호는 최소 6글자 이상이어야 합니다.' })
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // 로그인 세션 생성을 실시간 감지하여 즉시 관리자 페이지로 리다이렉트하는 안전 장치
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        window.location.href = '/admin'
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const getFriendlyErrorMessage = (message: string) => {
    if (!message) return '로그인 중 오류가 발생했습니다.'
    
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid credentials')) {
      return '이메일 주소 또는 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.'
    }
    
    if (lowerMessage.includes('email not confirmed')) {
      return '이메일 인증이 완료되지 않았습니다. 메일함의 인증 링크를 클릭하시거나 관리자에게 문의해 주세요.'
    }
    
    if (lowerMessage.includes('rate limit')) {
      return '요청 횟수 초과입니다. 잠시 후 다시 시도해 주세요.'
    }
    
    return `로그인 오류: ${message}`
  }

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      })

      if (error) throw error

      // 로그인 성공 시 세션이 꼬이는 것을 방지하고 바로 대시보드로 이동하기 위해 강제 페이지 이동(Hard Navigation)을 사용합니다.
      window.location.href = '/admin'
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err.message))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-grow bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-lg">
        
        {/* 로고 및 제목 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold tracking-wider text-slate-900 mb-3">
            <Car className="h-7 w-7 text-accent animate-bounce" />
            <span className="font-extrabold uppercase">GLOBAL<span className="text-accent">AUTO</span></span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">계정에 로그인하세요</h1>
          <p className="text-slate-500 text-xs mt-1">견적, 문서 상태, 관심 차량 확인 등에 접근하세요.</p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3.5 mb-6 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* 이메일 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">이메일 주소</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email.message}</p>}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white text-slate-800"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password.message}</p>}
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>로그인 중...</span>
              </>
            ) : (
              <span>로그인</span>
            )}
          </button>

        </form>

        {/* 회원가입 유도 */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <span>계정이 없으신가요? </span>
          <Link href="/register" className="font-bold text-secondary hover:text-blue-700 transition">
            계정 생성
          </Link>
        </div>

      </div>
    </div>
  )
}
