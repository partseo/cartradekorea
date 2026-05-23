'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Car, Lock, Mail, AlertCircle, RefreshCw } from 'lucide-react'

// Zod 유효성 스키마
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' })
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      })

      if (error) throw error

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.')
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
          <h1 className="text-xl font-bold text-slate-900">Sign In to Your Account</h1>
          <p className="text-slate-500 text-xs mt-1">Access quotes, document status, and favorite cars.</p>
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
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
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>

        </form>

        {/* 회원가입 유도 */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <span>Don't have an account? </span>
          <Link href="/register" className="font-bold text-secondary hover:text-blue-700 transition">
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  )
}
