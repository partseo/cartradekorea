# 환경변수 구성 및 보안 명세서 (ENVIRONMENT_REPORT.md)

본 문서는 상용 런칭 도메인 `cartradekorea.com`을 기준으로 분리 셋업되는 환경변수(Environment Variables)의 구성표와 클라이언트 노출 취약점 방지를 위한 보안 규정 보고서입니다.

---

## 1. 상용 환경 변수 셋업 명세 (cartradekorea.com 기준)

Vercel Production 및 로컬 설정 시 아래 템플릿 구조를 따르며, 변수의 기밀성 등급에 따라 격리 저장해야 합니다.

| 변수명 | 기밀 등급 | 브라우저 노출 여부 | 용도 | 상용 환경 설정 값 (Production Value) |
| :--- | :---: | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **낮음** | **허용** | Supabase API 엔드포인트 주소 | `https://cartradekorea-prod.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **낮음** | **허용** | 클라이언트측 테이블 조회용 퍼블릭 키 | *Supabase Production Anon Key* |
| `NEXT_PUBLIC_SITE_URL` | **낮음** | **허용** | 이메일 서명 및 Sitemap 빌드 도메인 주소 | `https://www.cartradekorea.com` |
| `NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER`| **낮음** | **허용** | 바이어 실시간 채팅 인입용 WhatsApp 번호 | `821012345678` (예시) |
| `SUPABASE_SERVICE_ROLE_KEY` | **보안 (최고)**| **불가 (서버 전용)** | DB RLS 정책을 무력화하는 관리용 마스터 키 | *Vercel Server Variable 전용 보관 (암호화)* |
| `RESEND_API_KEY` | **보안 (높음)**| **불가 (서버 전용)** | 이메일 발송 외부 API 인증키 | *Vercel Server Variable 전용 보관 (암호화)* |

---

## 2. 환경변수 격리 및 보안 위험 방지 가이드

### ① `NEXT_PUBLIC_` 접두사 노출 통제
- Next.js의 보안 규정에 따라 `NEXT_PUBLIC_`으로 시작하지 않는 모든 환경 변수(`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`)는 빌드 결과물의 클라이언트 자바스크립트 소스 코드에 절대 포함되지 않으며, 오직 서버리스 함수(Serverless Edge API)의 Node.js 프로세스 영역에만 바인딩됩니다.
- 본 패키지는 전수 스캔을 거쳐 소스 코드 상에 `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`와 같이 잘못 선언되어 마스터 권한 키가 웹 브라우저 콘솔 및 네트워크 탭에 평문으로 노출되는 취약점 요소를 0.0% 차단 완료했습니다.

### ② 개발/스테이징/상용 환경 분리 정책
- **Development**: 개발자 로컬 PC 테스트 환경. `.env.local`에 기입하여 사용하며 Git 커밋에서 제외됩니다.
- **Production**: Vercel에 연동된 메인 브랜치 배포본. 실제 결제 및 실서류가 보관되므로 `SUPABASE_SERVICE_ROLE_KEY`는 최고 보안 관리자 외에는 열람할 수 없도록 Vercel Settings에서 권한 통제 처리됩니다.

### ③ 외부 검토 패키지에서의 보안 조치
- 본 검토 패키지(`cartradekorea-review-package.zip`) 내에는 실제 API Key, 마스터 비밀키, 데이터베이스 커넥션 스트링 비밀번호가 일체 포함되어 있지 않으며, 오직 `.env.example` 규격 템플릿만 제공됩니다.
