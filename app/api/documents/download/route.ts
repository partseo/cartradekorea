import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const startTime = performance.now()
  const requestId = Math.random().toString(36).substring(7)
  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get('id')

  if (!documentId) {
    return new NextResponse('Missing document ID', { status: 400 })
  }

  try {
    const supabase = await createClient()

    // 1. 로그인한 사용자 조회
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new NextResponse('Unauthorized (Please log in first)', { status: 401 })
    }

    // 2. 문서 정보 조회 (file_path 및 quote_request_id 확인)
    const { data: doc, error: docError } = await supabase
      .from('export_documents')
      .select('file_path, quote_request_id')
      .eq('id', documentId)
      .single()

    if (docError || !doc || !doc.file_path) {
      return new NextResponse('Document not found or invalid path', { status: 404 })
    }

    // 3. 사용자 권한 DB 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'buyer'
    const isAdminOrStaff = role === 'admin' || role === 'staff'

    // 4. 일반 바이어인 경우 본인 견적서 관련 서류인지 확인
    if (!isAdminOrStaff) {
      const { data: quote, error: quoteError } = await supabase
        .from('quote_requests')
        .select('buyer_id')
        .eq('id', doc.quote_request_id)
        .single()

      if (quoteError || !quote || quote.buyer_id !== user.id) {
        return new NextResponse('Forbidden (You do not have access to this document)', { status: 403 })
      }
    }

    // 5. 60분 유효한 signed URL 실시간 생성
    const { data: signedData, error: signError } = await supabase.storage
      .from('export-documents')
      .createSignedUrl(doc.file_path, 3600) // 3600초 = 60분

    if (signError || !signedData?.signedUrl) {
      throw new Error(signError?.message || 'Failed to create signed URL')
    }

    const duration = performance.now() - startTime
    console.log(`[PERFORMANCE] API: documents-download | Duration: ${duration.toFixed(1)}ms | Status: 302 | RequestID: ${requestId}`)

    // 6. 생성된 signed URL로 리다이렉트
    return NextResponse.redirect(signedData.signedUrl, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })

  } catch (err: any) {
    const duration = performance.now() - startTime
    console.log(`[PERFORMANCE] API: documents-download | Duration: ${duration.toFixed(1)}ms | Status: 500 | RequestID: ${requestId} | ErrorCode: DOWNLOAD_FAIL`)
    return new NextResponse(err.message || 'Internal Server Error', { status: 500 })
  }
}
