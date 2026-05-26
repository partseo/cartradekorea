# 운영 배포 및 Cloudflare 캐싱 보고서 (DEPLOYMENT_REPORT.md)

본 문서는 플랫폼을 상용 호스팅 서버(Vercel)에 탑재하고, Cloudflare CDN 프록시 망을 경유시켜 보안과 도메인 캐싱을 최적화하기 위한 배포 명세 보고서입니다.

---

## 1. 상용 배포 아키텍처

플랫폼은 Vercel Edge 네트워크와 Cloudflare DNS 프록시를 이중 결합하여 고가용성과 디도스(DDoS) 방어, 전 세계 바이어 접속 레이턴시를 최소화합니다.

```text
 바이어 (Client) 
       │ (HTTPS / TLS 1.3)
       ▼
 ┌──────────────┐
 │  Cloudflare  │ (DNS Proxy, SSL Full Strict)
 └──────┬───────┘
        │ (Bypass / Cache Edge Rules)
        ▼
 ┌──────────────┐
 │    Vercel    │ (Edge Host, Node Serverless API)
 └──────┬───────┘
        ├────────────────────────┐
        ▼                        ▼
 ┌──────────────┐         ┌──────────────┐
 │   Supabase   │ (DB)    │   Supabase   │ (Storage)
 └──────────────┘         └──────────────┘
```

---

## 2. Cloudflare 캐시 규칙 설정 규격 (Cache Rules)

바이어 페이지의 프리렌더링 정적 파일은 가깝게 캐싱하고, 관리자 페이지 및 개인 API는 캐싱을 바이패스(Bypass)하도록 지정한 규칙 명세입니다.

### Rule ①: 정적 에셋 및 차량 이미지 캐시 활성화 (Cache Always)
- **목적**: 빌드 정적 파일 및 차량 WebP 압축본을 CDN Edge에 캐싱하여 서버 트래픽 비용을 차단하고 0.2초 로딩을 달성합니다.
- **매칭 조건 (Expression)**:
  `http.request.uri.path starts_with "/_next/static/" or http.request.uri.path starts_with "/images/" or http.request.uri.path starts_with "/storage/v1/object/public/car-images/"`
- **캐시 설정**:
  - Cache Status: **Eligible for cache (캐시 허용)**
  - Edge TTL: **1개월**
  - Browser TTL: **1개월**

### Rule ②: API 및 관리자/보안 서류 캐시 제외 (Bypass Cache)
- **목적**: 견적 계산기 API, 이메일 전송 API, 관리자 대시보드 및 Storage 임시 서명 토큰 주소(`signed URL`)의 데이터 왜곡 및 타인 오인 노출을 원천 방지합니다.
- **매칭 조건 (Expression)**:
  `http.request.uri.path starts_with "/api/" or http.request.uri.path starts_with "/admin/" or http.request.uri.path contains "token" or http.request.uri.query contains "token"`
- **캐시 설정**:
  - Cache Status: **Bypass cache (캐시 제외)**

---

## 3. SSL/TLS 종단 암호화 및 Vercel 설정

- **암호화 레벨**: **Full (strict)**
  - Cloudflare와 Vercel Origin 간에 각각 독립적으로 신뢰된 SSL 인증서(Let's Encrypt 및 Cloudflare CA)를 매핑하여 중간 도청 공격을 원천 방어합니다.
- **Vercel 도메인 연동**:
  - `www.cartradekorea.com`을 메인 상용 호스트로 바인딩하고, non-www 주소 `cartradekorea.com` 유입 시 `www` 주소로 **301 Redirect** 처리하여 SEO 검색 가치를 집중시킵니다.
- **환경 변수 격리**:
  - `SUPABASE_SERVICE_ROLE_KEY` 및 `RESEND_API_KEY`와 같이 데이터베이스 전권을 조작할 수 있는 비밀키는 빌드 시에 평문 디스크립션을 제거하고 오직 Vercel Production Settings 내부에서만 복호화되어 동작하도록 설정하였습니다.
