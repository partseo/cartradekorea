import { NextResponse } from 'next/server'

function clearCookiesResponse(request: Request, redirectUrl?: string) {
  // 로그인 페이지로 리다이렉트하는 응답 생성 또는 JSON 응답 생성
  const response = redirectUrl 
    ? NextResponse.redirect(new URL(redirectUrl, request.url))
    : NextResponse.json({ success: true })
  
  // 요청 헤더에서 브라우저의 쿠키 목록을 가져옵니다.
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').map(c => c.split('=')[0].trim())
  
  // Supabase 인증 관련 쿠키를 모두 강제 만료시킵니다.
  for (const name of cookies) {
    if (name.startsWith('sb-') || name.includes('auth') || name.includes('session') || name === 'supabase-key') {
      // 1. 기본 경로 쿠키 삭제
      response.cookies.set(name, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
        sameSite: 'lax',
        secure: true
      })
      // 2. 도메인 지정 쿠키 삭제 (도메인이 꼬였을 경우 대응)
      response.cookies.set(name, '', {
        path: '/',
        domain: '.cartradekorea.com',
        expires: new Date(0),
        maxAge: 0,
        sameSite: 'lax',
        secure: true
      })
      response.cookies.set(name, '', {
        path: '/',
        domain: 'cartradekorea.com',
        expires: new Date(0),
        maxAge: 0,
        sameSite: 'lax',
        secure: true
      })
    }
  }
  
  return response
}

export async function GET(request: Request) {
  return clearCookiesResponse(request, '/login')
}

export async function POST(request: Request) {
  return clearCookiesResponse(request)
}
