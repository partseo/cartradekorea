# 프로젝트 폴더 구조 및 모듈 매핑 (PROJECT_STRUCTURE.md)

본 문서는 글로벌 중고차 수출 플랫폼의 전체 소스 코드 디렉터리 구조와 주요 컴포넌트, 유틸리티의 역할을 한눈에 파악할 수 있도록 정리한 아키텍처 트리입니다.

---

## 1. 전체 디렉터리 트리

```text
used-car-export-platform/
├── app/                        # Next.js App Router 페이지 및 API 라우트
│   ├── admin/                  # 관리자 대시보드 및 운영 페이지 (/admin/*)
│   │   ├── cars/               # 매물 관리 (등록/수정)
│   │   │   ├── edit/[id]/      # 매물 정보 텍스트 수정 페이지
│   │   │   ├── new/            # 매물 신규 등록 페이지 (자동 압축/이중 스토리지 적용)
│   │   │   └── page.tsx        # 매물 목록 및 상태 관리
│   │   ├── inquiries/          # 바이어 문의 내역 관리
│   │   ├── quotes/             # 견적서 관리 및 조율
│   │   ├── layout.tsx          # 관리자 공통 레이아웃 (force-dynamic 캐시 배제 지정)
│   │   └── page.tsx            # 관리자 홈 대시보드
│   ├── api/                    # 백엔드 Serverless Edge API 라우트 (/api/*)
│   │   ├── calculate-price/    # 10대 비용 항목 실시간 연산 API (Cache-Control: no-store)
│   │   └── send-email/         # Resend API 기반 이메일 전송 API (Cache-Control: no-store)
│   ├── cars/                   # 바이어 인벤토리 및 차량 정보 공개 페이지
│   │   ├── [id]/               # 차량 상세 정보 (모든 갤러리 이미지 로드)
│   │   │   └── page.tsx        # ISR/SSR 페이지 엔트리
│   │   ├── CarsClient.tsx      # 목록 클라이언트 (main_image_url 단일 조회, 12개 페이지네이션)
│   │   └── page.tsx            # inventory 페이지 엔트리 (revalidate = 180초 캐싱)
│   ├── layout.tsx              # 전역 공통 루트 레이아웃
│   ├── page.tsx                # 홈페이지 엔트리 (revalidate = 300초 캐싱)
│   ├── sitemap.ts              # SEO sitemap 자동 제너레이터
│   └── robots.txt              # 크롤러 수집 가이드
│
├── components/                 # 공통 UI 및 어드민 전용 레이아웃 컴포넌트
│   ├── admin/                  # 관리자 화면 구성용 클라이언트 컴포넌트
│   │   └── AdminQuoteDetailClient.tsx # 견적 상세 조율 및 PDF (pdf-helper.ts 연동) 처리
│   └── common/                 # 범용 컴포넌트 (PriceDisplay 등)
│
├── lib/                        # 공통 비즈니스 로직 및 Supabase 연동 유틸리티
│   ├── supabase/               # Supabase DB & Storage 인터페이스
│   │   ├── client.ts           # Browser side Supabase 클라이언트
│   │   ├── server.ts           # Server side Supabase 클라이언트
│   │   └── pdf-helper.ts       # jsPDF 동적 임포트 기반 견적서/PI PDF 변환 및 Storage 업로드
│   └── image-helper.ts         # Browser Canvas API 기반 WebP 자동 압축 및 예외 fallback 헬퍼
│
├── supabase/                   # Supabase 로컬 개발 및 마이그레이션 관리 폴더
│   ├── migrations/             # DB 버전 관리 마이그레이션 SQL 스크립트
│   │   ├── 00000000000000_init.sql # 초기 테이블 구성 및 RLS 설정
│   │   ├── 20260523080000_update_export_fields.sql # 12대 수출 필드 신설
│   │   └── 20260524100000_add_main_image_url.sql # 대표 이미지 반정규화 마이그레이션 SQL
│   ├── seed_prod.sql           # 상용 데이터베이스 적재용 참조 데이터 시드
│   └── seed_dev.sql            # 로컬 개발용 가상 차량 데이터 시드
│
├── public/                     # 정적 에셋 (로고, 로컬 이미지, 파비콘 등)
│
├── next.config.ts              # Next.js 프레임워크 설정 (remotePatterns 최적화 적용)
├── package.json                # 의존성 패키지 관리 파일
├── tsconfig.json               # TypeScript 컴파일 설정
└── PERFORMANCE_REPORT.md       # 1차/2차 성능 개선 통합 보고서
```

---

## 2. 주요 성능 최적화 모듈 매핑

1. **[image-helper.ts](file:///c:/Users/User/Antigravity/used-car-export-platform/lib/image-helper.ts)**:
   - 차량 이미지 자동 변환/압축용 코어 파일입니다. 브라우저에서 Canvas를 이용해 이미지를 WebP로 가공합니다.
2. **[20260524100000_add_main_image_url.sql](file:///c:/Users/User/Antigravity/used-car-export-platform/supabase/migrations/20260524100000_add_main_image_url.sql)**:
   - 1:N 조인을 탈피하기 위해 `cars` 테이블에 대표 이미지 경로를 이중화해두는 SQL 마이그레이션 파일입니다.
3. **[pdf-helper.ts](file:///c:/Users/User/Antigravity/used-car-export-platform/lib/supabase/pdf-helper.ts)**:
   - jspdf 라이브러리를 동적 임포트하여 초기 public 자바스크립트 용량을 제어하는 성능 모듈입니다.
4. **[CarsClient.tsx](file:///c:/Users/User/Antigravity/used-car-export-platform/app/cars/CarsClient.tsx)**:
   - main_image_url 조회 및 12개 range 페이지네이션(Load More)을 구현해 데이터 전송량을 최소화한 클라이언트 파일입니다.
