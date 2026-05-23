import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, subject, htmlContent } = body

    const apiKey = process.env.RESEND_API_KEY

    // Resend API 연동이 안 된 로컬 개발 환경일 경우 시뮬레이션 성공 응답 반환
    if (!apiKey || apiKey === 're_your_api_key') {
      console.log('Simulating email send for developer demo. Key is empty.')
      return NextResponse.json({
        success: true,
        message: 'Simulated email sent successfully (Demo Mode)',
        simulated: true
      })
    }

    // Resend API에 이메일 발송 요청
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'GlobalAuto Export <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: htmlContent
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Resend API Error: ${errText}`)
    }

    const data = await res.json()

    return NextResponse.json({
      success: true,
      id: data.id,
      message: 'Email sent successfully via Resend API'
    })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to send email'
    }, { status: 500 })
  }
}
