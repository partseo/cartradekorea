import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 다음으로 시작하는 경로를 제외한 모든 요청 경로에 미들웨어를 적용합니다:
     * - _next/static (정적 파일들)
     * - _next/image (이미지 최적화 파일들)
     * - favicon.ico (파비콘 파일)
     * - public 폴더 밑의 모든 정적 이미지/에셋 파일들
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
