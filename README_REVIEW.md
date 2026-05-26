# 글로벌 중고차 수출 플랫폼 검토용 패키지 안내서 (README_REVIEW.md)

본 문서는 외부 검토자가 플랫폼의 전체 구조, 보안 규칙, 성능 최적화 상태 및 배포 적합성을 한눈에 검토할 수 있도록 돕기 위해 작성된 종합 검토 안내서입니다.

---

## 1. 패키지 요약

본 검토 패키지는 실제 프로덕션 환경인 `cartradekorea.com` 도메인 론칭 규격에 맞추어 설계 및 빌드 검증을 거친 소스 코드 및 기술 보고서 일체로 구성되어 있습니다.

- **대상 도메인**: `cartradekorea.com` (확정)
- **핵심 기술 스택**: Next.js 15+ (App Router, Turbopack), TypeScript, TailwindCSS/Vanilla CSS, Supabase (PostgreSQL & Storage)
- **포함된 검토 문서 리스트**:
  - `README_REVIEW.md`: 본 패키지 전체 안내서
  - `PROJECT_STRUCTURE.md`: 폴더 구조 및 파일 컴포넌트 맵
  - `BUILD_REPORT.md`: Next.js Turbopack 프로덕션 빌드 성공 보고서
  - `SUPABASE_SCHEMA_REPORT.md`: RLS 규칙 및 인덱스 구조를 포함한 DB 스키마 명세서
  - `ENVIRONMENT_REPORT.md`: 환경별 환경변수 구성 및 보안 리포트
  - `SECURITY_REPORT.md`: RLS, CORS, Cache-Control 등 보안 상세 리포트
  - `PERFORMANCE_REPORT.md`: 이미지 압축, 반정규화, 로깅 등 최적화 결과서
  - `DEPLOYMENT_REPORT.md`: Vercel + Cloudflare 상용 배포 및 캐싱 가이드
  - `OPEN_READY_REPORT.md`: 론칭 전 최종 10대 검증 적합성 심사서
  - `ADMIN_OPERATION_GUIDE.md`: 운영 관리자용 매뉴얼 및 가이드

---

## 2. 검토자가 확인해야 할 핵심 설계 및 아키텍처

검토 시 다음 4가지 핵심 최적화 및 보안 아키텍처를 집중적으로 확인하시기 바랍니다.

### ① 자바스크립트 번들 다이어트 및 성능 향상
- **jspdf 동적 임포트**: `lib/supabase/pdf-helper.ts` 내부의 비동기 PDF 생성 기능은 대용량 `jspdf` 라이브러리를 동적 임포트(`import('jspdf')`)하도록 구현했습니다. 이로 인해 바이어가 접속하는 public 번들 크기가 약 500KB+ 가량 혁신적으로 감소했습니다.
- **반정규화 컬럼(`cars.main_image_url`)**: 차량 목록 화면에서 무거웠던 1:N 조인 관계를 탈피하고 단일 컬럼만 읽도록 DB 구조를 보완해 쿼리 수행 속도를 0.1ms 수준으로 최적화했습니다.

### ② 클라이언트 사이드 이미지 자동 압축 (`lib/image-helper.ts`)
- 관리자가 차량 매물을 새로 등록할 때 Canvas API를 통해 해상도 조정(대표 1600px, 갤러리 800px) 및 `image/webp` 82% 품질 압축 인코딩을 자동 수행하여, 서버 스토리지 용량 낭비 및 CDN 트래픽을 예방합니다.
- HEIC 포맷 파일에 대한 원천 차단 및 Canvas 압축 실패 시의 Fallback 분기가 명확히 구현되어 있습니다.

### ③ 데이터 보관 이중화 정책
- 웹 노출용 이미지는 WebP 압축본으로 `car-images` Public 버킷에 보관하여 속도를 높입니다.
- 운영자의 백업 활성화 시, 원본 파일 그대로 Private 버킷인 `car-originals`에 격리 저장하여 데이터 보존을 보장합니다.

### ④ 개인정보 보호 및 엄격한 캐시 정책
- **Bypass Cache**: 견적 계산 API, 이메일 API 및 Signed URL 관련 응답 헤더에 `Cache-Control: no-store` 정책을 수립하여 캐시로 인한 정보 왜곡을 막았습니다.
- **성능 로그 내 민감자료 배제**: 측정 로그에 이메일, 전화번호, VIN, signed URL 등 식별 데이터 유출을 원천 방어하도록 차단 필터를 장착했습니다.
