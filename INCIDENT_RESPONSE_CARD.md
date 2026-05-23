# 긴급 장애 대응 가이드 (INCIDENT_RESPONSE_CARD.md)

본 카드는 플랫폼 라이브 운영 중 시스템 장애 및 보안 비상사태가 발생했을 때, 운영진이 지체 없이 즉각적으로 대처할 수 있도록 행동 강령을 한 장으로 요약한 비상 대응 매뉴얼입니다.

---

## 🚨 장애 상황별 긴급 대처 행동 요령

### 1. 사이트 접속 불가 (System Down)
- **증상**: 메인 웹페이지가 로드되지 않거나 브라우저 502/504 Gateway Error가 발생할 때.
- **조치 순서**:
  1. **Vercel Status** (`https://www.vercel-status.com`)에 접속하여 호스팅 플랫폼 글로벌 네트워크에 광범위한 장애가 있는지 1차 점검합니다.
  2. Vercel Console에 로그인하여 **Deployments** 상태를 보고 최신 배포 런타임 Crash가 났는지 검사합니다.
  3. Cloudflare Dashboard의 DNS 프록시 설정(오렌지 구름)을 임시 바이패스(Bypass, DNS Only) 모드로 변경하여 네트워크 구간 오류인지 교차 검증합니다.

### 2. 데이터베이스 접속 오류 (Database Connection Timeout)
- **증상**: 페이지는 열리나 차량 데이터가 전혀 로드되지 않거나 로그인 시 무한 대기가 발생할 때.
- **조치 순서**:
  1. **Supabase Status** (`https://status.supabase.com`)에 접속하여 DB 원격 인스턴스 서버 상태를 점검합니다.
  2. Supabase Dashboard의 **Project Settings** > **Database** 메뉴에서 DB CPU/Memory 부하가 100%에 달했는지 확인하고, 쿼리 락(Lock)이 걸렸다면 해당 커넥션을 강제 Kill 합니다.
  3. 로컬 백업 폴더의 최신 dump SQL을 활용해 긴급 스키마 복원 준비 절차([TROUBLESHOOTING.md](file:///c:/Users/User/Antigravity/used-car-export-platform/TROUBLESHOOTING.md))에 착수합니다.

### 3. 바이어 견적서/PI 이메일 발송 실패 (Email Routing Failure)
- **증상**: 견적 상세에서 전송 버튼을 눌렀으나 전송 실패 배지가 뜨거나 바이어가 수신받지 못할 때.
- **조치 순서**:
  1. **Resend Dashboard** (`https://resend.com/emails`)의 로그를 확인하여 Bounced(반송) 또는 SPF/DKIM 도메인 인증 오류인지 판별합니다.
  2. [QUOTE_PROCESS_GUIDE.md](file:///c:/Users/User/Antigravity/used-car-export-platform/QUOTE_PROCESS_GUIDE.md) 지침에 따라 관리자 페이지에서 견적서의 **Signed URL** 링크 주소를 복사해 바이어의 **WhatsApp으로 수동 즉시 발송**하여 딜레이를 방어합니다.

### 4. PDF 견적서 생성 실패 (PDF Generation Failure)
- **증상**: 버튼 클릭 시 PDF 생성이 진행되지 않거나 서버 500 API 오류가 응답될 때.
- **조치 순서**:
  1. Vercel Console의 **Function Logs**에서 `/api/calculate-price` 혹은 PDF 생성 헬퍼 관련 TypeScript 런타임 에러 로그가 존재하는지 라인 단위로 조회합니다.
  2. Supabase Storage `export-documents` 버킷 용량이 찼거나 DB Insert 실패(FK 제약 조건 등)가 났는지 Supabase API Logs를 추적합니다.

### 5. 파일 접근 에러 및 권한 위반 (Access Denied / Storage Error)
- **증상**: 바이어가 본인의 PDF 서류나 성능점검표 다운로드 시 접근 거부 오류가 뜰 때.
- **조치 순서**:
  1. Supabase Dashboard의 **Storage**로 이동하여 `car-documents` 및 `export-documents` 버킷의 ACL 정책이 **Private**으로 명확히 활성화되어 있는지 확인합니다.
  2. 다운로드 링크 생성 함수의 signed URL 유효시간 파라미터가 비정상적으로 만료되었는지(또는 0으로 지정되었는지) 코드를 재검증합니다.

### 6. 자격 증명 및 API Key 유출 의심 (Credential Leakage)
- **증상**: GitHub Public 저장소에 `.env` 키가 커밋되었거나 프론트엔드 네트워크 탭에 `SUPABASE_SERVICE_ROLE_KEY`가 평문 검출될 때.
- **조치 순서**:
  1. 지체 없이 즉각 [TROUBLESHOOTING.md](file:///c:/Users/User/Antigravity/used-car-export-platform/TROUBLESHOOTING.md)의 **1. API Key 회전 절차**를 즉각 수행합니다. (Supabase JWT Secret 변경 및 Resend API Key 삭제/재발급)
  2. Vercel Project Settings에서 신규 API Key를 교체 저장하고 즉각 **Redeploy**를 수행하여 운영 환경을 10분 내로 정상 안전화합니다.

### 7. 관리자 계정 탈취 의심 (Admin Hijacking)
- **증상**: 의도하지 않은 매물 삭제가 일어나거나 미승인 계정이 어드민 권한으로 갱신되었을 때.
- **조치 순서**:
  1. 데이터베이스 SQL Editor에 접속하여 탈취 의심 계정을 즉각 비활성화하거나 권한을 강등합니다.
     ```sql
     -- 강제 강등 및 로그인 비활성화 예시
     UPDATE public.profiles SET role = 'buyer' WHERE email = 'hijacked-admin@example.com';
     ```
  2. 최고 소유자 계정의 패스워드를 20자리 이상의 복잡한 무작위 문자로 즉각 교체하고 Supabase Dashboard MFA(다요소 인증) OTP를 즉시 재설정하여 공격자의 세션을 강제 만료시킵니다.
  3. `public.admin_logs` 테이블을 전수 조회하여 침입자가 조작한 차량/견적 데이터를 추적 롤백합니다.
