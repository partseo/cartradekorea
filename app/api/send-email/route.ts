import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// HTML Escape 헬퍼 함수
function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: Request) {
  const startTime = performance.now()
  const requestId = request.headers.get('x-request-id') || Math.random().toString(36).substring(7)
  
  try {
    const supabase = await createClient()

    // 1. 로그인 사용자 확인 (비로그인 401 차단)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized (Please log in)' }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      })
    }

    // 2. DB profiles.role 강제 실시간 검증 (buyer/dealer 403 차단)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.json({ success: false, error: 'Forbidden (Admin or Staff access required)' }, { 
        status: 403,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      })
    }

    const body = await request.json()
    const { to, buyerName, carTitle, fobTotal, cifTotal, terms, documentUrl } = body

    if (!to || !buyerName || !carTitle) {
      return NextResponse.json({ success: false, error: 'Missing required parameters (to, buyerName, carTitle)' }, { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      })
    }

    // 3. documentUrl 보안 필터 검증 (비인가 외부 도메인 발송 방지)
    if (documentUrl) {
      try {
        if (documentUrl.startsWith('/')) {
          if (!documentUrl.startsWith('/api/documents/download')) {
            return NextResponse.json({ success: false, error: 'Forbidden document path' }, { status: 400 })
          }
        } else {
          const parsedUrl = new URL(documentUrl)
          const allowedHosts = ['www.cartradekorea.com', 'cartradekorea.com']
          if (process.env.NODE_ENV === 'development') {
            allowedHosts.push('localhost:3000')
          }
          if (process.env.NEXT_PUBLIC_SITE_URL) {
            try {
              const siteUrlObj = new URL(process.env.NEXT_PUBLIC_SITE_URL)
              allowedHosts.push(siteUrlObj.host)
            } catch (e) {}
          }
          if (!allowedHosts.includes(parsedUrl.host) || !parsedUrl.pathname.startsWith('/api/documents/download')) {
            return NextResponse.json({ success: false, error: 'Forbidden document host or path' }, { status: 400 })
          }
        }
      } catch (e) {
        return NextResponse.json({ success: false, error: 'Malformed document URL' }, { status: 400 })
      }
    }

    // 4. HTML 데이터 이스케이프(Escape) 처리
    const safeBuyerName = escapeHtml(buyerName)
    const safeCarTitle = escapeHtml(carTitle)
    const safeTerms = escapeHtml(terms || 'FOB')
    const safeDocumentUrl = documentUrl ? escapeHtml(documentUrl) : ''

    // 5. 이메일 제목 및 본문 HTML 템플릿 서버 사이드 구성
    const subject = `[Car Trade Korea] Official Quotation Update for ${safeCarTitle}`
    const finalPrice = safeTerms === 'CIF' ? cifTotal : fobTotal
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #334155;">
        <h2 style="color: #0f766e; margin-top: 0; font-size: 20px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">Car Trade Korea</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Dear <strong>${safeBuyerName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">We are pleased to send you the updated quotation sheet. The official pricing breakdown for your requested vehicle is as follows:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 18px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #1e293b; font-size: 16px; font-weight: 700;">${safeCarTitle}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 12px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Trade Terms:</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: bold; border-bottom: 1px solid #f1f5f9; text-align: right;">${safeTerms}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">FOB Total Price:</td>
              <td style="padding: 8px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9; text-align: right;">$${Number(fobTotal).toLocaleString()} USD</td>
            </tr>
            ${safeTerms === 'CIF' ? `
            <tr>
              <td style="padding: 12px 0; color: #0f766e; font-weight: bold; font-size: 16px;">CIF Total Price:</td>
              <td style="padding: 12px 0; color: #0f766e; font-weight: 900; font-size: 18px; text-align: right;">$${Number(cifTotal).toLocaleString()} USD</td>
            </tr>
            ` : `
            <tr>
              <td style="padding: 12px 0; color: #0f766e; font-weight: bold; font-size: 16px;">FOB Total Price:</td>
              <td style="padding: 12px 0; color: #0f766e; font-weight: 900; font-size: 18px; text-align: right;">$${Number(fobTotal).toLocaleString()} USD</td>
            </tr>
            `}
          </table>
        </div>

        ${safeDocumentUrl ? `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${safeDocumentUrl}" target="_blank" style="background-color: #d97706; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.2);">
            Download Official Quotation PDF
          </a>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 10px;">* Note: The document link generates a secure URL valid for 60 minutes only.</p>
        </div>
        ` : ''}

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; text-align: center; margin-bottom: 0;">
          Car Trade Korea | Email: <a href="mailto:export@cartradekorea.com" style="color: #0f766e; text-decoration: none;">export@cartradekorea.com</a><br/>
          Incheon Port Yard 3, Incheon, Republic of Korea.
        </p>
      </div>
    `

    const apiKey = process.env.RESEND_API_KEY
    const isDev = process.env.NODE_ENV === 'development'

    // 6. Resend API Key 미보유 시 예외 처리 분기
    if (!apiKey || apiKey === 're_your_api_key') {
      if (isDev) {
        const duration = performance.now() - startTime
        console.log(`[PERFORMANCE] API: send-email | Duration: ${duration.toFixed(1)}ms | Status: 200 (Demo Mode) | RequestID: ${requestId}`)
        
        return NextResponse.json({
          success: true,
          message: 'Simulated email sent successfully (Demo Mode)',
          simulated: true
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        })
      } else {
        throw new Error('Resend API key is missing on Production environment.')
      }
    }

    // 7. Resend API 정식 요청
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'Car Trade Korea <export@cartradekorea.com>',
        to: [to],
        subject: subject,
        html: htmlContent
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Resend API Dispatch Error: ${errText}`)
    }

    const data = await res.json()
    
    const duration = performance.now() - startTime
    console.log(`[PERFORMANCE] API: send-email | Duration: ${duration.toFixed(1)}ms | Status: 200 | RequestID: ${requestId}`)

    return NextResponse.json({
      success: true,
      id: data.id,
      message: 'Email sent successfully via Resend API'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })

  } catch (err: any) {
    const duration = performance.now() - startTime
    console.error(`[ERROR] API: send-email | Duration: ${duration.toFixed(1)}ms | RequestID: ${requestId} | Error: ${err.message}`)
    
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to send email'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })
  }
}

