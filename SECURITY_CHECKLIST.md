# 글로벌 중고차 수출 플랫폼 운영 보안 체크리스트 (SECURITY_CHECKLIST.md)

본 문서는 상용(Production) 라이브 서비스의 기밀성, 무결성, 가용성을 위협하는 취약점과 키 유출 사고를 방지하기 위해 상시 유지해야 하는 인프라/애플리케이션 보안 체크리스트입니다.

---

## 1. 자격 증명 및 API Key 관리 정책

시스템에서 사용되는 모든 API Key와 토큰은 탈취 시 시스템 전권을 탈취당할 위험이 있으므로 수명 주기 관리를 시행합니다.

- [ ] **NEXT_PUBLIC_ 접두사 엄격 관리**:
  - `NEXT_PUBLIC_`으로 시작하는 모든 환경 변수는 브라우저 빌드 결과물에 텍스트 형태로 임베딩되어 공개됩니다.
  - 차량 사진 조회 및 바이어 API 호출을 위한 `NEXT_PUBLIC_SUPABASE_URL` 및 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 외의 기타 모든 관리자 키는 절대 `NEXT_PUBLIC_`으로 선언되어서는 안 됩니다.
- [ ] **Vercel Server-side Variables 적용**:
  - `SUPABASE_SERVICE_ROLE_KEY` 및 `RESEND_API_KEY`는 서버의 Node.js 런타임 환경에서만 호출되도록 Vercel Project Settings에서 Client-side 노출 체크를 비활성화한 상태로 저장되었습니다.
- [ ] **정기적인 키 회전 (Key Rotation) 정책**:
  - **주기**: **매 6개월** 1회 정기 실행.
  - **트리거 조건**: 보안 담당자나 운영 인프라 변경 시, 또는 API 오용 경고 발생 시 즉시 실행.
  - **절차**:
    1. Supabase Dashboard의 **Settings** > **API** 메뉴에서 `Roll key`를 수행하여 신규 Anon / Service Role Key를 발급받습니다.
    2. Vercel 환경 변수의 값을 신규 키로 즉시 교체합니다.
    3. Production 서비스가 정상 작동하는지 `LAUNCH_CHECKLIST.md`에 근거하여 즉각적인 검증을 완료합니다.

---

## 2. Supabase 인프라 및 DB 접근 제어

데이터베이스 및 스토리지의 중앙 통제판인 Supabase Dashboard의 관리 자격 증명을 보호합니다.

- [ ] **어드민 계정 MFA(다요소 인증) 필수 설정**:
  - Supabase Dashboard 및 GitHub 계정에 접속하는 모든 인프라 담당 운영진은 모바일 OTP(Google Authenticator 등) 기반의 **2FA / MFA 인증**을 필수로 구성해야 합니다.
  - 패스워드는 최소 16자리 이상의 영문 대소문자, 숫자, 특수문자 조합을 사용합니다.
- [ ] **DB Connection String 통제**:
  - 운영 DB에 직접 쿼리를 처리하는 PostgreSQL Connection String (`postgresql://...`) 정보는 외부에 공개하지 않으며, 특정 외부 협력 개발자의 접속이 필요할 시 Supabase settings에서 IP 화이트리스트를 지정하여 허용된 IP에서만 커넥션을 맺도록 설정합니다.

---

## 3. Storage 보안 및 RLS 작동 검사

자료 저장소의 오용을 원천 차단하기 위한 보안 세팅 항목입니다.

- [ ] **Private 버킷 접근 불가 테스트**:
  - 브라우저 시크릿 창을 열어 로그인하지 않은 상태에서 `export-documents` 및 `car-documents` 버킷 내의 파일 물리 주소로 접근을 시도했을 때, 반드시 `400 Bad Request`, `401 Unauthorized` 또는 `AccessDenied` XML 응답이 떨어지는지 점검합니다.
- [ ] **Signed URL 시간 제어**:
  - Private 서류의 signed URL은 만료 시간 파라미터(`expiresIn`)가 최대 **3600초 (1시간)**를 넘지 않도록 코드로 하드 리밋(Hard Limit)을 설정하여 장기적인 링크 탈취 공격을 방어합니다.
- [ ] **RLS(Row Level Security) 상태 감시**:
  - `cars`, `profiles`, `quote_requests`, `export_documents` 등 모든 핵심 테이블의 RLS 상태가 `Enabled` 인지 Supabase Table Editor에서 확인합니다.
  - RLS가 비활성화되면(Disabled) 익명의 바이어가 타인의 개인정보 및 서류 경로를 전부 조회할 수 있으므로, 매 마일스톤 업데이트 후 RLS 설정 여부를 감시합니다.
