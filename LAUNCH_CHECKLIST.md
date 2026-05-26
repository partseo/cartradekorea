# 글로벌 중고차 수출 플랫폼 출시 체크리스트 (LAUNCH_CHECKLIST.md)

본 문서는 상용 런칭 시점 전후로 안정성, 보안, 기능 무결성을 완벽하게 보장하기 위해 반드시 수행해야 하는 단계별 수동 검증 명세서입니다.

---

## 1. 사전 배포 검증 단계 (Pre-Launch)

상용 코드가 릴리즈 브랜치(`main`/`master`)로 병합되기 전 검사합니다.

- [ ] **로컬 프로덕션 빌드 성공 여부**:
  - 로컬 환경에서 `npm run build`를 수행하여 TypeScript 컴파일러 에러 및 static path 최적화 에러가 전혀 없음을 확인했습니다.
- [ ] **환경변수 노출 검증**:
  - `git grep` 명령어로 `SUPABASE_SERVICE_ROLE_KEY` 및 `RESEND_API_KEY` 문자열이 클라이언트 컴포넌트(`'use client'`) 파일에 잘못 기입되어 하드코딩되거나, `NEXT_PUBLIC_` 접두사로 선언된 부분이 없음을 교차 검증했습니다.
- [ ] **.gitignore 규칙 정상 작동**:
  - 터미널에서 `.env.local` 및 개발용 설정 파일들이 git tracking 대상에서 완전히 제외되어 변경 내역(git status)에 검출되지 않음을 보장합니다.
- [ ] **Supabase Storage 버킷 수동 생성 확인**:
  - 상용 Supabase Console의 Storage 메뉴에서 다음 4가지 버킷이 용도 및 공개 여부 정책에 맞게 수동 생성되어 있음을 확인했습니다:
    * **`car-images`**: Public (웹 노출용 압축 WebP 차량 이미지)
    * **`car-originals`**: Private (원본 차량 이미지 보관용 - 선택 옵션)
    * **`car-documents`**: Private (성능점검표 및 검증 서류)
    * **`export-documents`**: Private (수출용 PDF 견적서 및 Proforma Invoice)

---

## 2. 배포 당일 라이브 검증 단계 (Launch Day)

Vercel 프로덕션 도메인 릴리즈 직후 라이브 브라우저 환경에서 직접 검수합니다.

### 1) HTTPS 및 SSL 접속 확인
- [ ] **Full (strict) 활성화 및 브라우저 검사**:
  - Cloudflare 및 Vercel 연동 도메인 접속 시 SSL 인증서(Let's Encrypt / Cloudflare Edge)가 정상 인식되어 주소창에 "자물쇠 아이콘"이 표시되는지 확인합니다.
  - 브라우저 콘솔에서 혼합 콘텐츠(Mixed Content, HTTPS 페이지에서 HTTP 이미지/API 로드) 오류 경고가 일절 없음을 확인합니다.

### 2) 역할별 RLS 보안 정책 검증 테스트
각기 다른 권한을 부여한 5개 테스트 계정(비로그인, Buyer, Dealer, Staff, Admin)을 준비한 후 아래 시나리오를 강제로 실행하여 에러 응답(401, 403 또는 RLS 차단)을 받는지 검수합니다.

| 검증 ID | 테스트 주체 | 시도할 행위 | 기대 결과 | 통과 여부 |
| :---: | :--- | :--- | :---: | :---: |
| **RLS-01** | **비로그인 사용자** | `/admin` 대시보드 강제 주소 입력 진입 | 로그인 화면으로 강제 추방 | [ ] |
| **RLS-02** | **비로그인 사용자** | `car-documents` 버킷 PDF URL 강제 접근 | Access Denied 또는 Link Expired | [ ] |
| **RLS-03** | **비로그인 사용자** | `cars` 테이블의 차량 목록 및 이미지 조회 | 정상 출력 (Public Read 통과) | [ ] |
| **RLS-04** | **General Buyer** | `/admin/cars/new` 및 `/admin/quotes` 접근 | 403 Forbidden 및 차단 | [ ] |
| **RLS-05** | **General Buyer** | 타인의 견적 이력(`/mypage` 또는 API) 강제 호출 | RLS 정책에 의해 데이터 0건 반환 | [ ] |
| **RLS-06** | **Dealer** | 로그인 후 차량 가격 조회 | USD/KRW 등 딜러 전용 혜택가 유효성 검사 | [ ] |
| **RLS-07** | **Staff** | `/admin` 대시보드 진입 후 차량 정보 수정 | 정상 작동 (Update 성공) | [ ] |
| **RLS-08** | **Staff** | 관리자 권한 강제 변경 시도 | RLS 정책에 의해 차단 | [ ] |
| **RLS-09** | **Admin** | 전체 견적 조회 및 다른 관리자 권한 제어 | 전체 작동 허용 | [ ] |

### 3) 핵심 API 엔드포인트 및 기능 무결성 검증
- [ ] **10대 세분화 요금 연동**:
  - 차량 상세에서 임의 국가(예: 가나) 선택 후 CIF 요금 조회를 눌렀을 때, `api/calculate-price` 호출이 지연 없이 성공하고 FOB 가격, 해상 운임비, 보험료, 관세 핸들링비 등 10개 항목이 1원/1달러 단위까지 실시간으로 계산되는지 검수합니다.
- [ ] **PDF 견적서/PI 실시간 렌더링 및 다운로드**:
  - 관리자 대시보드 견적 상세 페이지(`/admin/quotes/[id]`)에서 **Quotation PDF 생성** 버튼을 클릭합니다.
  - Supabase Storage `export-documents` 내부에 `[quote_id]/Quotation_*.pdf` 구조로 정상 바이너리가 업로드되었는지 확인합니다.
  - 다운로드 시 Public URL이 아닌 60분 제한의 **Signed URL** 형태로 변환되어 브라우저에서 읽어지고, 60분 이후에는 해당 URL을 통한 임의 접근이 차단되는지 확인합니다.
- [ ] **알림 이메일 자동 발송**:
  - 견적서 전송을 트리거한 뒤, 바이어 이메일함에 `Resend`가 제공하는 고화질 템플릿의 이메일이 정확하게 수신되는지 확인합니다. (다운로드 하이퍼링크의 토큰 만료 및 SSL 링크 정상 작동 확인)

---

## 3. 사후 모니터링 검증 단계 (Post-Launch)

런칭 완료 후 지속적인 무결성 관찰 항목입니다.

- [ ] **Supabase Daily Backup 작동 검수**:
  - 런칭 24시간 이후 Supabase Project Dashboard의 **Database** > **Backups** 탭에서 첫 일일 백업 본이 예정대로 정상 생성되었는지 확인합니다.
- [ ] **Vercel Functions/Edge Logs 에러 모니터링**:
  - 런칭 초기에 대량 트래픽 인입 시 Edge Route Handler(`calculate-price`, `send-email`) 실행 중 타임아웃(Vercel의 10초~60초 실행 한계) 또는 런타임 Crash 로그가 쌓이지 않는지 Vercel Integration Console의 Real-time logs 모니터를 점검합니다.
- [ ] **Google Search Console 등록 및 상태 검사**:
  - `sitemap.xml` 제출을 완료하고 수집 "성공" 상태가 뜨는지 확인합니다.
  - `robots.txt`에 명시된 차단 경로(`/admin` 등)가 정상 작동하는지 확인합니다.
  - 가나/나이지리아/현대/기아 마케팅 랜딩 페이지 4종이 정상 인덱싱되는지 확인합니다.
- [ ] **Google Analytics 또는 Vercel Analytics 이벤트 추적 검증**:
  - 차량 상세 조회 이벤트(View Car Spec)가 정상 집계되는지 확인합니다.
  - 견적 요청 완료 이벤트(Submit Quote Request) 수신을 점검합니다.
  - WhatsApp 플로팅 버튼 클릭 수(WhatsApp Click) 이벤트 수집을 확인합니다.
  - PDF Quotation 및 PI 서류 다운로드 단추 클릭 이벤트(PDF Download Click) 작동을 확인합니다.
