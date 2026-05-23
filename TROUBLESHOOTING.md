# 글로벌 중고차 수출 플랫폼 장애 복구 및 대응 매뉴얼 (TROUBLESHOOTING.md)

본 문서는 플랫폼 운영 중 발생할 수 있는 주요 시스템 장애, 보안 사고(키 탈취 등), 그리고 애플리케이션 오류 발생 시 신속하게 복구하기 위한 즉각 대응 가이드라인입니다.

---

## 1. 보안 사고: 민감 API Key 노출 시 비상 대응 절차

`SUPABASE_SERVICE_ROLE_KEY` 또는 `RESEND_API_KEY`가 GitHub Public 커밋 혹은 클라이언트 로그를 통해 노출되었음이 확인되었을 때, 지체 없이 10분 이내에 아래 절차를 개시하십시오.

### 1단계: Supabase API Key 회전 (Rotation)
1. **Supabase Console** (`https://supabase.com/dashboard`)에 접속합니다.
2. 해당 Production 프로젝트의 **Project Settings** > **API** 메뉴로 신속히 진입합니다.
3. **JWT Settings** 영역에서 **JWT Secret** 옆에 위치한 **`Change JWT Secret`** 또는 **`Roll keys`** 버튼을 클릭합니다.
4. 이 작업을 수행하면 기존에 발행된 모든 Anon Key 및 Service Role Key가 즉시 무효화됩니다.
5. 새로 발급된 `anon key` 및 `service_role key` 문자열을 복사합니다.

### 2단계: Resend API Key 무효화 및 재발급
1. **Resend Dashboard** (`https://resend.com`)에 로그인합니다.
2. **API Keys** 메뉴로 이동합니다.
3. 노출된 API Key 이름 우측의 **Delete** 또는 **Revoke**를 실행하여 즉시 작동을 중단시킵니다.
4. **Create API Key**를 클릭하여 새로운 메일 전송 전용 API Key를 생성하고 복사합니다.

### 3단계: Vercel 환경 변수 업데이트 및 즉시 재배포
1. **Vercel Dashboard**에 접속하여 해당 프로젝트의 **Settings** > **Environment Variables**로 이동합니다.
2. 기존 등록된 `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` 값을 새로 복사한 값으로 편집하여 저장합니다.
3. **Deployments** 탭으로 이동하여 최신 커밋 우측의 점 세개 아이콘을 누르고 **Redeploy**를 실행합니다. (환경 변수 갱신본을 운영 런타임에 즉시 반영하기 위함)
4. 재배포가 완료되면 바이어 화면 및 어드민 기능이 정상 작동하는지 `LAUNCH_CHECKLIST.md`를 바탕으로 즉시 긴급 교차 검증을 수행합니다.

---

## 2. 데이터베이스(DB) 및 Migration 장애 복구 가이드

운영 마이그레이션(`supabase db push`) 실행 중 스키마 에러가 나거나 잘못된 데이터 조작(DML)으로 사이트가 정상 작동하지 않을 때의 대처법입니다.

### 1) DB 스키마 롤백 절차
운영 배포 시 특정 마이그레이션이 비정상적으로 동작하여 사이트 다운을 유발한 경우:

1. **상태 진단**:
   ```bash
   # 적용 완료된 migration 이력과 원격 DB의 상태 비교
   supabase migration list
   ```
2. **이전 마이그레이션으로 롤백**:
   - 로컬 마이그레이션 폴더에서 오류를 유발한 최신 `.sql` 파일을 임시 분리 또는 제거합니다.
   - 이전 스키마 덤프 또는 수동 백업 덤프(`manual_dump_YYYYMMDD.sql`)를 SQL Editor 혹은 CLI로 리스토어(Restore) 처리합니다.
   - 롤백 덤프 실행 명령어 예시:
     ```bash
     psql -h db.<PRODUCTION_PROJECT_REF_ID>.supabase.co -U postgres -d postgres -f backups/manual_dump_restore_target.sql
     ```

### 2) RLS 규칙 오동작으로 인한 접근 제한 복구
바이어가 차량 목록을 볼 수 없거나 로그인이 불가할 때:
1. Supabase Dashboard의 **SQL Editor**로 이동합니다.
2. RLS 정책이 꼬였거나 비정상 접근 통제가 되고 있다면 즉시 기본 RLS 정책이 정상 상태인지 조회합니다.
   ```sql
   -- 각 테이블 RLS 활성화 상태 재검토
   ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
   ```
3. `LAUNCH_CHECKLIST.md`에 명시된 5개 그룹 역할별 테스트 시나리오를 CLI 또는 로컬 스테이징에서 재현해 원인을 즉각 특정합니다.

---

## 3. 상용 로그 및 모니터링 분석 체계

원인 미상의 500 내부 에러 또는 사용자 이탈 현상 발생 시 로그 검사 가이드라인입니다.

| 장애 영역 | 진단 방법 / 확인 위치 | 해결 절차 |
| :--- | :--- | :--- |
| **프론트엔드 오류** | **Vercel Deployment Logs** | 클라이언트 브라우저에서 발생한 JS 에러 추적 및 Hydration 매칭 실패 진단 |
| **API Endpoints** | **Vercel Function Logs** | `api/calculate-price` 혹은 `api/send-email` 내부의 서드파티 응답 지연/포맷 파싱 에러 추적 |
| **DB 및 RLS 정책** | **Supabase API Gateway Logs** | RLS 차단으로 인해 `status: 403` 또는 빈 배열이 반환되는 쿼리 내역 진단 |
| **Storage 권한** | **Supabase Storage Logs** | `export-documents` 업로드 실패(413 Payload Too Large 또는 403 Permission Denied) 로그 확인 |
| **이메일 발송 실패** | **Resend Delivery Logs** | Resend API 대시보드 내의 Bounced(반송), Rejected(거부) 내역 검사 및 도메인 SPF/DKIM 메타레코드 누락 여부 확인 |
| **어드민 권한 조작** | **`public.admin_logs` 테이블 조회** | 관리자가 의도하지 않게 특정 스태프 계정을 잘못 승격/강등 시켰는지 감사 내역 조회 |
