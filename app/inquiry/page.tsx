'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Send, MailCheck, AlertCircle, RefreshCw, MessageSquare, User, CheckCircle2, Pencil } from 'lucide-react'

// Zod 유효성 스키마
const inquirySchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  subject: z.string().min(4, { message: 'Subject must be at least 4 characters.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' })
})

type InquiryFormValues = z.infer<typeof inquirySchema>

export default function InquiryPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [prefilled, setPrefilled] = useState<{ name: boolean; email: boolean }>({ name: false, email: false })
  const [loggedInUser, setLoggedInUser] = useState<{ name: string; email: string } | null>(null)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  })

  // 로그인된 사용자 정보 자동 불러오기 (세션 + profiles 테이블 병렬 조회)
  useEffect(() => {
    let cancelled = false
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          if (!cancelled) setIsLoadingUser(false)
          return
        }

        const user = session.user

        // profiles 테이블에서 저장된 정보 조회
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, whatsapp, company_name')
          .eq('id', user.id)
          .single()

        if (cancelled) return

        // 우선순위: profiles 테이블 > user_metadata > 이메일 앞부분
        const resolvedName =
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          ''
        const resolvedEmail =
          profile?.email ||
          user.email ||
          ''

        const filled = { name: !!resolvedName, email: !!resolvedEmail }
        setPrefilled(filled)
        setLoggedInUser({ name: resolvedName, email: resolvedEmail })
        if (resolvedName) setValue('name', resolvedName)
        if (resolvedEmail) setValue('email', resolvedEmail)
      } catch {
        // 비로그인 상태 - 정상 처리
      } finally {
        if (!cancelled) setIsLoadingUser(false)
      }
    }
    loadUser()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


  const onSubmit = async (values: InquiryFormValues) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const { error } = await supabase
        .from('inquiries')
        .insert({
          user_id: session?.user?.id || null,
          name: values.name,
          email: values.email,
          subject: values.subject,
          message: values.message,
          is_resolved: false
        })

      if (error) throw error
      setSubmitSuccess(true)
    } catch (err: any) {
      console.error(err)
      setSubmitSuccess(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-xl text-center py-16 animate-in zoom-in-95 duration-200">
        <MailCheck className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-900">문의가 전송되었습니다!</h2>
        <p className="text-slate-500 text-sm mt-3 px-2 leading-relaxed">
          메시지가 접수되었습니다. 영업 담당자가 24시간 이내에 이메일로 답변 드리겠습니다.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-8 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg text-sm transition cursor-pointer"
        >
          홈으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="flex-grow bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-lg">
        
        {/* 헤더 */}
        <div className="text-center mb-8 border-b border-slate-100 pb-6">
          <MessageSquare className="h-10 w-10 text-secondary mx-auto mb-2" />
          <h1 className="text-2xl font-extrabold text-slate-900">수출 에이전트에게 문의하기</h1>
          <p className="text-slate-500 text-xs mt-1">파트너십, 대량 구매, 또는 일반 문의 사항을 보내주세요.</p>
        </div>

        {/* 로딩 스켈레톤 */}
        {isLoadingUser && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <div className="w-4 h-4 bg-slate-200 rounded-full animate-pulse shrink-0" />
            <div className="h-3 bg-slate-200 rounded animate-pulse w-48" />
          </div>
        )}

        {/* 로그인 사용자 안내 배너 */}
        {!isLoadingUser && loggedInUser && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-emerald-700">
              <span className="font-bold">{loggedInUser.name}</span>님, 저장된 정보를 자동으로 불러왔습니다. 수정이 필요하면 직접 변경하세요.
            </span>
          </div>
        )}

        {submitError && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3.5 mb-6 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* 내 이름 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">내 이름</label>
              {!isLoadingUser && (
                prefilled.name
                  ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><CheckCircle2 className="h-3 w-3" />저장된 정보</span>
                  : <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500"><Pencil className="h-3 w-3" />직접 입력 필요</span>
              )}
            </div>
            {isLoadingUser ? (
              <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <input
                type="text"
                {...register('name')}
                placeholder="성함을 입력해 주세요"
                className={`w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 transition ${
                  prefilled.name
                    ? 'bg-emerald-50 border border-emerald-200 focus:ring-emerald-300'
                    : 'bg-blue-50 border border-blue-200 focus:ring-blue-300'
                }`}
              />
            )}
            {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name.message}</p>}
          </div>

          {/* 내 이메일 주소 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">내 이메일 주소</label>
              {!isLoadingUser && (
                prefilled.email
                  ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><CheckCircle2 className="h-3 w-3" />저장된 정보</span>
                  : <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500"><Pencil className="h-3 w-3" />직접 입력 필요</span>
              )}
            </div>
            {isLoadingUser ? (
              <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <input
                type="email"
                {...register('email')}
                placeholder="이메일 주소를 입력해 주세요"
                className={`w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 transition ${
                  prefilled.email
                    ? 'bg-emerald-50 border border-emerald-200 focus:ring-emerald-300'
                    : 'bg-blue-50 border border-blue-200 focus:ring-blue-300'
                }`}
              />
            )}
            {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email.message}</p>}
          </div>

          {/* 문의 제목 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">문의 제목</label>
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500"><Pencil className="h-3 w-3" />직접 입력 필요</span>
            </div>
            <input
              type="text"
              {...register('subject')}
              placeholder="파트너십 문의 / 대량 선적 요청..."
              className="w-full bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800 transition"
            />
            {errors.subject && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.subject.message}</p>}
          </div>

          {/* 문의 내용 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">문의 내용</label>
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500"><Pencil className="h-3 w-3" />직접 입력 필요</span>
            </div>
            <textarea
              rows={5}
              {...register('message')}
              placeholder="문의 내용을 상세히 적어주세요. 차종, 목적지 항구 등이 있으면 함께 기재해 주세요."
              className="w-full bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800 transition"
            />
            {errors.message && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.message.message}</p>}
          </div>

          {/* 전송 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting || isLoadingUser}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>전송 중...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>문의 보내기</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  )
}
