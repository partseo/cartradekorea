# 글로벌 중고차 수출 플랫폼 운영 배포 전 최종 체크리스트

실서버(Production) 배포 및 실운영 개시 전, 안정성과 보안, 글로벌 사용자 경험 향상을 위해 반드시 검수해야 할 체크리스트입니다.

---

## 1. 데이터베이스 & 보안 설정 (Supabase)

- [ ] **RLS(Row Level Security) 정책 재검증**:
  - [ ] `profiles` 테이블이 본인 이외의 사용자에게 노출되지 않는지 확인.
  - [ ] `admin_logs` 테이블의 SELECT 권한이 오직 `admin` 역할만 접근 가능한지 확인.
- [ ] **Supabase API Key 이중 체크**:
  - [ ] 프론트엔드(`Client Component`)에서 `service_role` 키가 직접 사용되지 않는지 확인 (반드시 `.env.local`에서 노출 금지, 서버 사이드 또는 Edge Functions에서만 사용).
  - [ ] `anon` 퍼블릭 키만 클라이언트 사이드 빌드에 포함되는지 확인.
- [ ] **Storage 버킷 권한 및 CORS**:
  - [ ] `car-images` 버킷이 Public 상태이며 업로드 정책이 맞춤 설정되어 있는지 확인.
  - [ ] `export-documents` 및 `car-documents` 버킷이 Private 상태인지 확인 (조회 시 반드시 `createSignedUrl`로 인증 세션 경유하여 임시 서명 토큰 발행하도록 구성).
  - [ ] 운영 도메인에 대한 CORS 허용 정책 설정.

---

## 2. 도메인 & SSL 보안

- [ ] **도메인 연결 및 SSL 인증서**:
  - [ ] `Vercel` 또는 `Cloudflare Pages`에 운영 도메인(e.g., `www.cartradekorea.com`) 바인딩 완료.
  - [ ] HTTPS (SSL) 인증서 발급 및 강제 리다이렉트 활성화 상태 점검.
- [ ] **환경 변수 업데이트 (`.env.production`)**:
  - [ ] `NEXT_PUBLIC_SITE_URL`에 로컬 호스트(`localhost:3000`) 대신 실제 운영 도메인(`https://www.cartradekorea.com`)이 입력되어 있는지 확인.

---

## 3. 이메일 & WhatsApp 연동

- [ ] **Resend API 연동 (이메일 발송)**:
  - [ ] Resend Dashboard에서 발송용 도메인 TXT/MX 레코드 DNS 인증 완료.
  - [ ] `RESEND_API_KEY` 환경 변수가 운영 Vercel 환경 변수에 올바르게 주입되었는지 확인.
  - [ ] 견적 요청 시 관리자 메일 및 바이어 메일로 정상 전송 테스트 통과 확인.
- [ ] **WhatsApp API / 링커 번호 설정**:
  - [ ] `NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER`에 실제 딜러/상담원 국가 코드를 포함한 WhatsApp 비즈니스 번호가 정상 등록되었는지 확인.

---

## 4. 다국어 / 통화 전환 최종 검수

- [ ] **기존 스토리지 값 호환성 (Fallback)**:
  - [ ] 기존 잘못된 언어 키(`hi`, `zh` 등)가 로컬 스토리지에 남아있을 때 에러 없이 `en`으로 정상 리셋 리턴되는지 확인.
- [ ] **아랍어(ar) RTL 레이아웃**:
  - [ ] 아랍어 선택 시 전체 GNB 및 인벤토리 상세 뷰의 텍스트가 오른쪽에서 왼쪽(RTL)으로 정렬되며 깨짐 현상이 없는지 확인.
- [ ] **다중 통화 환산 포맷**:
  - [ ] VND, JPY, CLP 등 소수점이 불필요한 통화와 EUR, USD 등 소수점이 필요한 통화의 포맷팅(PriceDisplay 컴포넌트) 무결성 확인.
  - [ ] `exchange-rates.ts` 파일의 환율 최종 업데이트 기준일이 최신인지 확인.

---

## 5. SEO & 마케팅 유입 설정

- [ ] **Robots.txt & Sitemap.xml**:
  - [ ] `/robots.txt` 및 `/sitemap.xml` 경로가 정상 기동되어 XML 파일이 정상 발행되는지 확인.
  - [ ] `/admin` 경로가 robots.txt에서 크롤링 Disallow 설정으로 보호되고 있는지 확인.
- [ ] **국가별/브랜드별 랜딩 페이지**:
  - [ ] `/export-to-ghana`, `/export-to-nigeria`, `/used-hyundai-export`, `/used-kia-export` 페이지가 검색 크롤러 유입용 키워드로 정상 작성되었는지 확인.
- [ ] **동적 메타데이터 검증**:
  - [ ] 차량 상세 페이지 접근 시 `generateMetadata` 함수가 차량 브랜드 및 모델명을 기준으로 동적 meta title 및 description을 오류 없이 생성하는지 확인.
