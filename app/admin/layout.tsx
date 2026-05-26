import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. 서버사이드에서 즉각 세션 로드 (딜레이 및 무한 Pending 없음)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // 로그인 안 되어 있으면 로그인 페이지로 추방
    redirect('/login')
  }

  // 2. 권한 검증 (DB profiles.role 강제화)
  const metaRole = user.user_metadata?.role || 'None'
  let dbRole = 'None'
  let dbError = null
  let isUserAdmin = false

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error) throw error
    dbRole = profile?.role || 'None'
    isUserAdmin = dbRole === 'admin' || dbRole === 'staff'
  } catch (err: any) {
    dbError = err.message || 'Unknown database error'
    dbRole = `조회 실패 (${dbError})`
  }

  // 어드민/스태프 권한이 아니면 메인 화면으로 리다이렉트
  if (!isUserAdmin) {
    redirect('/')
  }

  const debugInfo = {
    email: user.email || 'N/A',
    uid: user.id,
    metaRole: metaRole, // 표시/디버그용으로만 유지
    dbRole: dbRole,
    errorMsg: 'None'
  }

  return (
    <AdminLayoutClient
      user={user}
      isAdmin={isUserAdmin}
      debugInfo={debugInfo}
    >
      {children}
    </AdminLayoutClient>
  )
}
