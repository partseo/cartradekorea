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

  // 2. 권한 검증 (메타데이터 및 DB)
  const metaRole = user.user_metadata?.role || 'None'
  let dbRole = 'None'
  let dbError = null
  let isUserAdmin = metaRole === 'admin' || metaRole === 'staff'

  // 메타데이터에 권한이 없는 경우에만 동기식 DB 2차 검증을 수행합니다.
  if (!isUserAdmin) {
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
  } else {
    // 메타데이터로 우선 통과되었더라도, 디버그 데이터 구색을 맞추기 위해 조용히 DB 조회를 해 둡니다.
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile) {
        dbRole = profile.role || 'None'
      }
    } catch (e) {
      // 에러 시 무시
    }
  }

  const debugInfo = {
    email: user.email || 'N/A',
    uid: user.id,
    metaRole: metaRole,
    dbRole: dbRole,
    errorMsg: isUserAdmin 
      ? 'None' 
      : `허용되지 않은 역할(Role)입니다. (필요: admin/staff, 현재: meta=${metaRole}, db=${dbRole})`
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
