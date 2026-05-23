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
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  full_name: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  company_name: z.string().optional(),
  whatsapp: z.string().optional(),
  role: z.enum(['buyer', 'dealer']),
  country: z.string().min(2, { message: 'Please enter your country.' })
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

      setSuccessMessage('Registration successful! Please check your email for the confirmation link.')
      
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 3000)

    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during registration.')
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
