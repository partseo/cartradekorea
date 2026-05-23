import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 이 함수 호출을 통해 토큰 만료 여부를 검사하고 필요 시 자동 갱신합니다.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. 관리자 권한 필요한 경로 보호 (/admin)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // 미들웨어의 지연 및 RLS 꼬임을 방지하기 위해 user_metadata 내의 role을 기반으로 1차 고속 검증합니다.
    // 실시간 DB 검증 및 상세 오류 디버깅은 클라이언트인 AdminLayout(layout.tsx)에서 처리합니다.
    const metaRole = user.user_metadata?.role
    if (metaRole !== 'admin' && metaRole !== 'staff') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // 2. 마이페이지 보호 (/mypage)
  if (request.nextUrl.pathname.startsWith('/mypage')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
