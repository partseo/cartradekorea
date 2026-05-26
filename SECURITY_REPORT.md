# 플랫폼 애플리케이션 및 인프라 보안 보고서 (SECURITY_REPORT.md)

본 문서는 중고차 수출 플랫폼의 상용 론칭 시 바이어 개인 정보의 기밀성과 기밀 서류의 유출 방지를 달성하기 위해 적용된 RLS, 스토리지 접근 차단, 로그 마스킹 및 캐시 암호화 보안 체계에 대한 보고서입니다.

---

## 1. 5대 역할군별 RLS (Row Level Security) 접근 차단

데이터베이스의 비인가 접근 및 타인의 견적서 임의 수정 리스크를 완화하기 위해 적용된 통제 매트릭스 결과입니다.

| 역할군 (Role) | `cars` / `car_images` 조회 | `car_specs` 조회 | `cars` / `car_images` / `car_specs` 수정 및 삭제 | `quote_requests` (견적요청) 제어 | `/admin` 대시보드 접근 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **비로그인 (익명)** | **허용** (공개 매물) | **허용** (스펙 조회) | **차단** (권한 없음) | **차단** (가입 필요) | **즉시 차단** (Redirect) |
| **바이어 (Buyer)** | **허용** | **허용** | **차단** | **본인 신청 내역만 조회** (타인 데이터 차단) | **즉시 차단** |
| **딜러 (Dealer)** | **허용** (우대가 노출) | **허용** | **본인 차량(created_by = auth.uid())만 허용** | **본인 견적서만 제어** | **즉시 차단** |
| **스태프 (Staff)** | **허용** | **허용** | **전체 차량/이미지/스펙 수정 권한 허용** | **전체 조회 및 피드백 허용** | **허용** (DB profiles 실시간 검증) |
| **어드민 (Admin)** | **허용** | **허용** | **전체 수정 및 삭제 권한 허용** | **전체 조회/수정/삭제 권한** | **허용** (DB profiles 실시간 검증) |

- **Dealer 권한 완전 격리**:
  - 기존 딜러가 전체 차량 및 타인의 이미지/상세 스펙을 조작할 수 있는 리스크를 제거하기 위해, RLS 정책에 `created_by = auth.uid()` 조건을 결합했습니다. 딜러는 오직 자신이 올린 차량만 관리할 수 있으며, 타인의 매물 수정/삭제 요청은 DB 레벨에서 엄격히 차단됩니다.
- **admin_logs 테이블 보안 잠금**:
  - `admin_logs` 테이블의 무단 로그 주입 리스크를 제거하기 위해 `INSERT WITH CHECK (true)`를 제거하고, 오직 `admin` 및 `staff` 역할의 사용자만 직접 INSERT할 수 있도록 강화했습니다. 시스템 자동 로그는 서버 API 측에서 `service_role`을 통해 기록되므로 일반 사용자의 임의 로그 삽입 공격을 철저하게 방어합니다.

---

## 2. Private Storage 및 Signed URL 만료 정책

차량의 정밀 성능검사 서류(`car-documents`) 및 공식 견적서/PI 인보이스(`export-documents`), 원본 이미지 백업(`car-originals`)은 기밀성 유지가 핵심이므로 다음과 같은 통제 정책을 구성했습니다.

- **Public 접근 완전 비허용 (Private Bucket)**:
  - 브라우저 시크릿 창 등을 통해 파일 주소(물리 URL)로 접근할 때 무조건 `403 Forbidden` 또는 `AccessDenied` 에러가 떨어지도록 버킷 권한(ACL)을 잠갔습니다.
- **DB 내 signed URL 전체 경로 보관 폐지**:
  - DB `export_documents` 테이블에 60일 유효한 signed URL 주소를 통째로 저장하던 기존 구조를 폐기하고, 스토리지 내부의 고유 상대 경로인 `file_path`만 보관하도록 전향했습니다.
- **실시간 동적 다운로드 API 및 권한 재검증**:
  - 서류 다운로드 요청 시, 다운로드 엔드포인트 `/api/documents/download?id=[document_id]`를 호출하게 됩니다. 해당 API는 서버사이드에서 세션을 재검사하여 요청자가 `admin`/`staff` 권한을 가졌거나 해당 견적서 소유 바이어(`buyer_id = auth.uid()`)인 경우에만 **60분(3600초) 유효**한 signed URL을 생성해 리다이렉트합니다.
  - signed URL 전체가 로그나 DB에 장기 보관되지 않아 서류 유출 리스크를 근본적으로 해소했습니다.

---

## 3. 관리자 권한 검증 고도화 (DB profiles.role 강제화)

- **user_metadata 신뢰 배제**:
  - 클라이언트 사이드 변조 가능성 및 오래된 세션 메타데이터(Stale Metadata) 오용으로 인한 비관리자의 어드민 진입 위협을 차단하기 위해, Next.js 미들웨어(`middleware.ts`) 및 어드민 레이아웃(`app/admin/layout.tsx`)에서 `user.user_metadata.role` 우선 통과 조건을 전면 철회했습니다.
- **실시간 DB 조회 강제**:
  - 어드민 경로 진입 및 API 호출 시, 무조건 Supabase DB의 `public.profiles.role` 값을 조회하여 사용자가 실제 `admin` 혹은 `staff` 상태인지 확인한 후 처리를 계속합니다.
  - 이를 통해 관리자 권한이 박탈된 딜러/바이어 계정이 캐시된 세션 정보로 어드민 대시보드에 부정 접속하는 문제를 원천 봉쇄했습니다.
- **어드민 디버그 진단 패널 노출 통제**:
  - 어드민 레이아웃 하단에 상세 계정 UUID 및 메타 권한 등을 노출하던 디버그 영역에 대해 `process.env.NODE_ENV === 'development'` 조건을 추가했습니다. 상용(Production) 서비스로 동작할 때는 디버그 패널이 원천 렌더링되지 않아 보안 정보 수집 행위를 철저히 통제합니다.

---

## 4. 이메일 발송 API (`/api/send-email`) 보안 강화

B2B 견적 전달을 위해 사용하는 이메일 전송 API에 대해 비인가 외부 호출 및 악용 리스크를 완화하기 위한 보안 필터를 적용했습니다:

- **인증 및 역할 검증**:
  - API 내부에서 Supabase Auth 세션을 엄격히 조회하여 비인가 사용자는 `401 Unauthorized`로, 일반 바이어/딜러 역할군은 `403 Forbidden` 상태 코드로 즉각 거부합니다.
- **파라미터 이스케이프(HTML Escape)**:
  - HTML 본문에 결합되는 바이어 이름, 차량명, 약관 정보 등의 텍스트에 HTML escape를 적용하여 XSS(크로스 사이트 스크립팅) 공격을 예방합니다.
- **문서 URL 화이트리스트 필터**:
  - 메일에 동적으로 결합되는 서류 링크(`documentUrl`)가 외부 악성 도메인을 가리키지 못하도록 화이트리스트를 검사합니다.
  - 상대 경로(`/`)로 들어올 때는 오직 `/api/documents/download` 경로만 승인하고, 절대 경로일 때는 `cartradekorea.com` 등 지정 도메인에 수렴하고 경로 역시 서류 다운로드 API로 시작하는 경우에만 허용하여 스팸 메일 우회 주입 시도를 완전 차단합니다.

---

## 5. 애플리케이션 로그 내 민감 정보 마스킹 및 차단 정책

Vercel 콘솔 및 외부 모니터링 로그 저장소에 사용자의 민감한 정보가 보관되어 발생하는 2차 개인정보 누출 사고를 차단합니다.

- **성능 및 예외 로깅 시 차단 대상**:
  - 바이어 이메일 주소 (`buyer email`)
  - WhatsApp/전화번호 (`whatsapp / phone number`)
  - 차량의 오리지널 전체 차대번호 (`VIN`)
  - Storage의 Signed URL 전체 주소 및 토큰 전문 (마스킹 또는 relative path만 기록)
  - Supabase Service Role Key 및 DB 패스워드
  - 바이어 실제 이름 및 상세 견적 단가 내역
  - 다운로드 문서 고유 ID (`DocumentID`) - 보안 감사 스펙에 맞게 성능 로그 수집 제외 완료
- **로그 허용 정보**:
  - 호출 경로/API 이름 (`route`)
  - 처리 속도 (`duration ms`)
  - 응답 코드 (`status code`)
  - 임의로 발급된 난수 요청 식별값 (`request id`)
  - 예외 발생 시 에러 코드 (`error code`)

---

## 6. API 캐싱 무력화 (`Cache-Control: no-store`)

견적 계산 API, 이메일 전송 API, PDF 생성 로직 등 실시간 개인 정보 처리가 들어가는 Edge Route에는 HTTP 프로토콜의 캐싱 헤더를 거부하도록 설정했습니다.
- **적용 헤더**:
  `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
- **의도**: 브라우저나 중간 프록시 서버, CDN(Cloudflare)에서 API 결과를 캐시하고 있다가 타 바이어에게 동일한 가격이나 개인 견적서 정보를 오인 노출하는 인시던트를 완벽하게 차단합니다.
