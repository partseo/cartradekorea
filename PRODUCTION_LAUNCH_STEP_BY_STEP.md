# 글로벌 중고차 수출 플랫폼 실운영 런칭 가이드라인 (PRODUCTION_LAUNCH_STEP_BY_STEP.md)

본 문서는 플랫폼의 개발 완료 후, 실제 운영 인프라(Cloudflare + Vercel + Supabase)를 구축하고 도메인 연결 및 GA4 연동을 통해 글로벌 상용 런칭을 완료하기까지의 12단계 실무 매뉴얼입니다.

---

## 1단계: 도메인 후보 선정 및 최종 결정

해외 바이어가 쉽게 기억하고 신뢰할 수 있는 도메인 주소를 확정하고 구매하는 단계입니다.

### 1) 도메인 선정 5대 기준
- **com 도메인 우선**: 글로벌 B2B 비즈니스의 신뢰성을 위해 다른 TLD(.net, .io, .kr 등)보다 `.com` 확보를 최우선시합니다.
- **영어권 직관성**: 바이어가 철자만 보고도 한국(Korea), 자동차(Car/Auto), 수출(Export/Trade)과 연관된 사이트임을 알 수 있어야 합니다.
- **최대 15자 내외**: 길고 복잡한 주소는 이메일 연동 및 모바일 입력 시 오타를 유발합니다.
- **하이픈(-) 지양**: 가능하면 하이픈이 없는 형태가 검색엔진 최적화(SEO) 및 브라우저 주소창 입력에 편리합니다.

### 2) 추천 도메인 후보군 예시
- `cartradekorea.com` (가장 직관적이며 글로벌형)
- `koreautotrade.com` (B2B 신뢰감 우선)
- `koreacarexport.com` (한국 원산지 강조형)
- `koreacartrade.com`
- `k-autoexport.com` (브랜드 특화형)

### 3) 도메인 구매처 추천
- 가비아, 고도몰, Google Domains(Squarespace) 또는 Cloudflare Registrar를 통해 원하는 후보군 중 구매 가능한 1개의 `.com` 주소를 즉시 낙찰 및 결제 완료합니다.

---

## 2단계: Cloudflare DNS 네임서버 및 SSL 연결 절차

도메인 보안(DDoS 방어, SSL 암호화)과 빠른 DNS 쿼리 반응을 위해 Cloudflare를 도메인 네임서버로 위임하는 절차입니다.

1. **Cloudflare 로그인 및 사이트 추가**:
   - Cloudflare Dashboard (`https://dash.cloudflare.com`)에 로그인 후 **Add a Site** 버튼을 클릭합니다.
   - 구매한 도메인 주소(예: `cartradekorea.com`)를 입력하고 무료 플랜(Free Plan)을 선택합니다.
2. **네임서버(Nameservers) 변경**:
   - Cloudflare가 제시하는 2개의 네임서버 주소(예: `alice.ns.cloudflare.com`, `bob.ns.cloudflare.com`)를 복사합니다.
   - 도메인을 구매한 대행업체(가비아 등) 사이트의 도메인 관리 메뉴로 이동하여 기존 네임서버 주소를 Cloudflare 네임서버로 변경 입력합니다.
   - *변경 전파에 약 10분~2시간 정도 소요되며 Cloudflare에서 Active 메일이 발신됩니다.*
3. **보안 SSL/TLS 모드 설정**:
   - Cloudflare 메뉴의 **SSL/TLS** > **Overview**로 이동하여 Encryption mode를 반드시 **Full (strict)**로 변경합니다. (보안이 취약한 Flexible 및 Off는 상용 운영 시 절대 금지합니다.)
   - **Edge Certificates** 메뉴에서 **Always Use HTTPS** 옵션을 활성화(ON) 상태로 켭니다.

---

## 3단계: Vercel Production 배포 및 도메인 연결 절차

프론트엔드 호스팅 플랫폼인 Vercel에 프로젝트 소스를 빌드 및 바인딩하는 절차입니다.

1. **GitHub 저장소 연동**:
   - Vercel Dashboard에 접속한 뒤 **Add New...** > **Project**를 클릭합니다.
   - 해당 GitHub의 `used-car-export-platform` 리포지토리를 선택하여 Import 합니다.
2. **빌드 설정 정의**:
   - **Framework Preset**: `Next.js` 확인.
   - **Build Command**: `npm run build` 확인.
   - **Output Directory**: `.next` 기본값 유지.
3. **첫 배포 실행**:
   - **Deploy** 버튼을 누르고 약 2~3분간 빌드 및 컴파일을 완료하여 Vercel 기본 주소(예: `used-car-export-platform.vercel.app`)로 접속이 정상 작동하는지 확인합니다.
4. **Vercel 커스텀 도메인 매핑**:
   - Vercel 프로젝트 화면의 **Settings** > **Domains** 메뉴로 이동합니다.
   - 구매한 최종 도메인 주소 `www.cartradekorea.com`을 입력하고 Add를 클릭합니다. (Vercel이 제시하는 DNS 정보: CNAME 레코드 이름 `www`, 값 `cname.vercel-dns.com`을 기록해 둡니다.)
5. **Cloudflare DNS 레코드 최종 주입**:
   - Cloudflare DNS 설정으로 돌아가 아래 CNAME 레코드 2개를 주입합니다.

| Type | Name | Target | Proxy Status |
| :--- | :---: | :--- | :---: |
| **CNAME** | `www` | `cname.vercel-dns.com` | **Proxied (오렌지 구름 켬)** |
| **CNAME** | `@` (root) | `cname.vercel-dns.com` | **Proxied (오렌지 구름 켬)** |

---

## 4단계: Supabase Production 프로젝트 생성 및 Schema 적용

운영용 데이터베이스와 인증, 스토리지 공간을 안전하게 생성하고 초기화하는 절차입니다.

1. **상용 프로젝트 생성**:
   - Supabase Dashboard (`https://supabase.com/dashboard`)에서 **New Project**를 누릅니다.
   - 프로젝트명(예: `Car Trade Korea Prod`)을 입력하고 데이터베이스 비밀번호를 안전하게 생성 및 메모해 둡니다. Region은 한국 리전(`Seoul`)을 지정합니다.
2. **Schema 배포 (마이그레이션)**:
   - 로컬 터미널에서 Supabase CLI를 운영 프로젝트와 연동합니다.
     ```bash
     supabase login
     supabase link --project-ref <PRODUCTION_PROJECT_REF_ID>
     # 로컬에서 작성 검증된 스키마 일괄 푸시
     supabase db push
     ```
3. **참조 기초 데이터 적재**:
   - Supabase SQL Editor 메뉴에 진입하여 `Open new query`를 누릅니다.
   - [seed_prod.sql](file:///c:/Users/User/Antigravity/used-car-export-platform/supabase/seed_prod.sql) 파일의 내용을 전체 복사하여 붙여넣고 **Run**을 눌러 실행합니다. (운영용 국가 및 항구 해상 운임 정보가 안전하게 적재됩니다.)

---

## 5단계: Vercel Production 환경변수 입력 절차

Vercel 서버에서 운영용 Supabase 및 서드파티 API(Resend 등)를 안전하게 인식하도록 상용 환경변수를 매핑합니다.

1. Vercel 프로젝트의 **Settings** > **Environment Variables**로 이동합니다.
2. 아래 환경변수 구분표를 참고하여 **Production** 체크박스만 활성화한 뒤 저장합니다.

| 환경변수명 | 브라우저 노출 | 권장 설정값 (Production) |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **가능** | `https://운영프로젝트ID.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **가능** | *운영 프로젝트의 anon public key 값* |
| `SUPABASE_SERVICE_ROLE_KEY` | **불가 (서버전용)** | *운영 프로젝트의 service_role secret key 값 (절대 NEXT_PUBLIC_ 금지)* |
| `NEXT_PUBLIC_SITE_URL` | **가능** | `https://www.cartradekorea.com` |
| `RESEND_API_KEY` | **불가 (서버전용)** | *운영용 Resend API Key* |
| `NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER` | **가능** | *실제 바이어 응대용 WhatsApp 번호 (e.g. 821000000000)* |

3. 저장 완료 후 **Deployments** 메뉴에서 최신 배포본의 **Redeploy** 단추를 눌러 환경 변수를 운영 런타임에 동적으로 주입합니다.

---

## 6단계: Storage 버킷 생성 및 권한 설정 정책 확인

이미지 및 기밀 PDF 계약서가 저장되는 Supabase Storage를 구성합니다.

1. Supabase Dashboard의 **Storage** 메뉴로 이동하여 아래 **3가지 버킷**을 순차 생성합니다.

- **`car-images`** (차량 매물 사진 보관소):
  - 설정: **Public** 활성화 (누구나 이미지를 불러와야 하므로 공개 버킷 설정).
- **`car-documents`** (성능 점검 기록부 PDF 보관소):
  - 설정: **Private**으로 설정 (비로그인 임의 접근 원천 차단).
- **`export-documents`** (견적서, Invoice, B/L 등 기밀 서류 보관소):
  - 설정: **Private**으로 설정 (바이어 본인 및 관리자 외 전면 조회 차단).

2. **버킷별 RLS Policy 적용**:
   - `car-images` 버킷 정책: 전체 SELECT 허용 / `created_by`가 관리자 역할인 프로필만 INSERT/DELETE 가능.
   - `export-documents` 및 `car-documents` 정책: 비인가 SELECT 전체 거부 / `pdf-helper.ts` 내부의 signed URL 발급 프로세스를 통해서만 60분 한시적으로 접근 가능하도록 체크.

---

## 7단계: 최초 관리자 계정 생성 및 admin 승격 절차

최초의 시스템 어드민을 데이터베이스에 승인하는 마스터 작업 지침입니다.

1. **사용자 가입**:
   - 운영 호스트 도메인 (`https://www.cartradekorea.com/register`)에 접속하여 최고 관리자용 이메일(예: `admin@cartradekorea.com`)로 신규 가입을 처리합니다.
2. **데이터베이스 SQL Editor 접속**:
   - Supabase Console의 **SQL Editor**로 이동해 신규 쿼리 창을 엽니다.
3. **어드민 권한 업데이트 및 이력 로그 수동 기록**:
   - 아래 쿼리를 기재하고 실행합니다.
     ```sql
     -- 1. profiles 테이블 내 관리자 권한 강제 승격
     UPDATE public.profiles 
     SET role = 'admin' 
     WHERE email = 'admin@cartradekorea.com';

     -- 2. 최초 1회 수동 승격에 대한 보안 감사 감사 로그 수집 기록
     INSERT INTO public.admin_logs (admin_id, action, target_table, record_id, details)
     VALUES (
       (SELECT id FROM public.profiles WHERE email = 'admin@cartradekorea.com'),
       'PROMOTE_INITIAL_ADMIN',
       'profiles',
       (SELECT id FROM public.profiles WHERE email = 'admin@cartradekorea.com'),
       '{"details": "System setup: Initial administrator role promoted via SQL Editor manually."}'
     );
     ```
4. **관리자 대시보드 검증**:
   - 어드민 주소 (`https://www.cartradekorea.com/admin`)로 진입 시 차단되지 않고 관리자 대시보드가 정상 렌더링되는지 확인합니다.

---

## 8단계: 실운영을 위한 실제 차량 10~20대 등록 기준

바이어 유입 및 SEO 노출을 위해 [VEHICLE_UPLOAD_RULE.md](file:///c:/Users/User/Antigravity/used-car-export-platform/VEHICLE_UPLOAD_RULE.md) 규칙에 의거해 실제 매물을 등록합니다.

- **권장 매물 등록 댓수**: **15대 내외**
- **브랜드 배분**: 현대차 7대 (싼타페, 투싼, 아반떼 등) / 기아차 7대 (스포티지, 쏘렌토, 포터, 봉고 트럭 등) / 제네시스 1대.
- **등록 필수 메타데이터 항목**:
  - 재고 번호 (e.g., `GAE-26-H-0001` 고유 구조로 부여)
  - LHD(좌핸들) 13대 / RHD(우핸들) 2대 테스트용 등록
  - 연료타입 (디젤, 가솔린) 및 트랜스미션 (자동, 수동) 다양성 확보
  - WebP 포맷팅된 차량 사진 최소 6장 이상 첨부
  - 차대번호 마스킹 처리된 `vin_partial` 기입 준수

---

## 9단계: 최종 관통 테스트 1회 (E2E 시나리오)

실제 오픈 전, 운영자와 바이어 관점에서 모든 거래 시나리오가 오차 없이 매끄럽게 수행되는지 관통 테스트를 수행합니다.

1. **바이어 관점 E2E**:
   - 비로그인 상태로 매물 조회 -> 회원 가입 -> 상세 스펙 및 6대 신뢰 배지 확인 -> 목적지 항구(Tema 등) 선택 후 FOB/CIF 실시간 예상 요율 계산 -> 견적 요청서 작성 및 제출 -> 마이페이지 견적 이력 현황 `Pending` 확인 -> 관심 스크랩 등록.
2. **관리자 관점 E2E**:
   - 관리자 로그인 -> 대시보드 실시간 견적 접수 확인 -> 견적 상세(`/admin/quotes/[id]`) 진입 -> 내륙 운송비 및 해상운임 세부 마크업 조정 후 저장 -> **Quotation PDF 생성** 및 **Proforma Invoice PDF 생성** 클릭 -> 바이어 이메일 발송 실행.
3. **보안 및 이메일 수신 E2E**:
   - 바이어 메일함 수신 확인 -> 메일 본문 signed URL 링크 클릭 후 PDF 정상 다운로드 점검 -> **1시간 이후 signed URL 만료 시 접근이 즉시 차단**되는지 세션 무효화 상태 체크.
   - 일반 바이어 계정으로 로그아웃/로그인 전환을 수행하며 타 바이어 견적 정보 호출 시 RLS 100% 에러 차단 확인.

---

## 10단계: Google Search Console 등록 및 Sitemap 제출 절차

포탈 검색 사이트에 플랫폼 경로가 효율적으로 수집되도록 색인을 연동하는 절차입니다.

1. **Search Console 추가**:
   - Google Search Console (`https://search.google.com/search-console`) 접속 후 **도메인 속성** 추가를 클릭하고 `cartradekorea.com`을 입력합니다.
2. **소유권 인증**:
   - 발급된 TXT 인증 레코드 주소를 복사합니다.
   - Cloudflare DNS 관리 메뉴로 이동하여 **TXT 레코드** (Name: `@`, Value: *복사한 인증값*)를 주입 후 저장합니다.
   - Search Console 화면에서 **확인**을 눌러 소유권 인증을 통과합니다.
3. **Sitemap 제출**:
   - Search Console 내의 **Sitemaps** 메뉴로 가셔서 `sitemap.xml`을 입력하고 제출합니다.
   - `sitemap.xml` 및 `robots.txt`가 라이브 도메인 상에서 정상 호출되는지 직접 주소창에 `https://www.cartradekorea.com/sitemap.xml`을 입력하여 로드 상태를 검토합니다.

---

## 11단계: GA4 / Vercel Analytics 연결 및 이벤트 검증 절차

마케팅 광고 효율 산정을 위해 사용자 유입 로그를 트래킹하는 단계입니다.

1. **GA4 속성 생성**:
   - Google Analytics 4 대시보드에 접속해 신규 속성을 만들고 웹 스트림을 등록하여 **측정 ID (`G-XXXXXXXXXX`)**를 발급받습니다.
2. **코드 주입 및 환경변수 설정**:
   - Vercel 환경 변수에 GA ID를 탑재하거나 Next.js Script 태그를 통해 GA4 추적 스크립트를 빌드 런타임에 삽입합니다.
3. **핵심 4대 마케팅 이벤트 추적 무결성 검사**:
   - 바이어 계정으로 접속하여 브라우저에서 아래 행동을 할 때, GA4 실시간 디버그 화면에 해당 이벤트가 정상 누적되는지 체크합니다.
     - **차량 상세 스펙 뷰**: `view_item` 이벤트 수집 확인.
     - **견적 요청 성공**: `generate_lead` 이벤트 수집 확인.
     - **WhatsApp 플로팅 클릭**: `contact_whatsapp` 이벤트 수집 확인.
     - **PDF Quotation/PI 다운로드**: `file_download` 이벤트 수집 확인.

---

## 12단계: 글로벌 B2B 마케팅 런칭 전 최종 체크리스트

모든 기술적 준비가 통과되었을 때 바이어 유입 마케팅을 전개하기 전, 마지막 마케팅 검문 단계입니다.

- [ ] **국가별 랜딩페이지 점검**: 가나 및 나이지리아 바이어 타겟 랜딩 페이지 내의 항구 정보와 프로세스 텍스트가 바이어 국가 정서에 맞게 자연스러운 영문/불어/아랍어로 번역 노출되는지 최종 검수했습니다.
- [ ] **브랜드 랜딩페이지 점검**: 현대/기아 브랜드별 검색 유입 랜딩 페이지가 SEO 키워드 노출에 최적화되었는지 헤딩 태그(`<h1>`)를 검사했습니다.
- [ ] **실시간 WhatsApp 상담 체계 구성**: 해외 바이어 문의 시, 담당 직원의 폰에 WhatsApp Business 앱이 깔려 있고 실시간 알림 소리가 켜져 있는지 기기 대기 상태를 검수했습니다.
- [ ] **구글 광고 (Google Ads) 소액 테스트 캠페인 가동**: 아프리카/중동 지역 대상 "Used Hyundai Cars from Korea" 키워드 기반으로 일 예산 10~20 USD 내외의 소액 검색 광고 캠페인을 가동해 첫 리드가 안전히 인입되는지 관찰 단계를 시작합니다.
