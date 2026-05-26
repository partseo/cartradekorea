# Production 배포 및 Supabase 적용 체크리스트 (PRODUCTION_APPLY_CHECKLIST.md)

본 문서는 `cartradekorea.com` 상용 서비스 개시를 위한 프로덕션 인프라 구축 및 데이터베이스 마이그레이션 적용 순서와 환경 설정을 정리한 운영 매뉴얼입니다.

---

## [1 단계] Supabase Production 프로젝트 구성 및 DB 구축

### 1. Supabase Production 프로젝트 생성
* Supabase 대시보드에서 실 서비스용 새 프로젝트를 생성합니다.
* 데이터베이스 리전은 웹 애플리케이션 및 주요 고객군과 가장 가까운 위치(예: `ap-northeast-2` 서울)로 선택하는 것을 권장합니다.

### 2. DB 마이그레이션(Migration) 및 시드 데이터 적용 순서
* 신규 Supabase Production 프로젝트는 빈 데이터베이스이므로, 다음 순서대로 SQL 스크립트를 누락 없이 순차적으로 적용해야 합니다.
  1. **`00000000000000_init.sql`**
     - 기본 테이블(cars, profiles, export_documents, admin_logs 등), 관계(F.K), 트리거 및 초기 RLS 보안 정책을 생성합니다.
  2. **`20260523080000_update_export_fields.sql`**
     - 수출 운영 고도화를 위한 차량 상세 필드를 확장합니다.
  3. **`20260524090000_add_performance_indexes.sql`**
     - 조회 성능 최적화를 위한 데이터베이스 인덱스를 신설합니다.
  4. **`20260524100000_add_main_image_url.sql`**
     - 차량 목록 조회 성능 캐싱을 위한 `main_image_url` 대표 이미지 컬럼을 추가합니다.
  5. **`20260524110000_update_rls_policies.sql`**
     - 딜러(Dealer) 권한을 본인 등록 매물로 한정 격리하고, `admin_logs` 테이블의 무제한 INSERT 취약점을 해결합니다.
  6. **`20260524120000_add_file_path_to_export_documents.sql`**
     - 서류 임시 signed URL 발급 시 DB 하드코딩 제거를 위한 `export_documents.file_path` 컬럼을 생성합니다.
  7. **`seed_prod.sql`**
     - 상거래 관리를 위한 전용 국가/항구/물류 요율 기초 마스터 데이터를 적재합니다.

### 3. `export_documents` 테이블의 `file_path` 컬럼 존재 여부 최종 확인
* 모든 데이터베이스 구성 및 마이그레이션이 완료되면, 운영 DB에 `file_path` 컬럼이 정상 안착했는지 다음 SQL 쿼리로 확인합니다.
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'export_documents' AND column_name = 'file_path';
  ```
* 결과로 `file_path` 행이 반드시 조회되어야 합니다. (해당 컬럼이 누락될 경우 PDF 서류 동적 다운로드 API가 오작동합니다.)

---

## [2 단계] Storage 버킷 생성 및 RLS 정책 설정

Supabase Storage 대시보드로 이동하여 다음 4개의 버킷을 생성하고 권한(Public/Private)을 올바르게 설정합니다.

| 버킷명 | 공개 여부 (Public/Private) | 주 용도 |
| :--- | :---: | :--- |
| **`car-images`** | **Public** | 바이어 노출용 차량 갤러리 및 외관 압축 이미지 |
| **`car-originals`** | **Private** | 차량 내부 보관용 원본 이미지 (필요시 선택적 업로드) |
| **`car-documents`** | **Private** | 차량 검증 보고서 및 성능점검표 원본 문서 파일 |
| **`export-documents`**| **Private** | 바이어용으로 발행된 견적서 및 Invoice PDF (60분 임시 URL 조회 대상) |

> [!CAUTION]
> `car-originals`, `car-documents`, `export-documents` 버킷은 절대로 Public으로 설정해서는 안 되며, 외부 다이렉트 URL 접근이 기본 차단되어야 합니다.

---

## [3 단계] Vercel Production 환경변수 설정

Vercel의 상용 프로젝트 설정으로 이동하여 다음과 같이 상용(Production) 전용 환경변수를 등록합니다. (Development/Preview 환경 변수와 엄격히 구분하여 입력해야 함)

```env
# Supabase Production 접속 정보
NEXT_PUBLIC_SUPABASE_URL=https://[prod-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[prod-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[prod-service-role-key] # 절대 NEXT_PUBLIC_ 접두사 사용 금지

# 메일 발송 서비스 API 키
RESEND_API_KEY=re_[prod-resend-api-key]

# 사이트 상용 URL 정보 (이메일 및 signed URL 도메인 화이트리스트 검증용)
NEXT_PUBLIC_SITE_URL=https://www.cartradekorea.com
```

---

## [4 단계] 도메인 연결 및 Cloudflare DNS 설정

### 1. Vercel 도메인 매핑
* Vercel Project Settings > Domains 페이지에서 `cartradekorea.com` 및 `www.cartradekorea.com`을 추가합니다.
* `cartradekorea.com`으로 인입되는 트래픽은 `www.cartradekorea.com`으로 301 리다이렉트되도록 매핑합니다.

### 2. Cloudflare DNS 및 SSL/TLS 레코드 설정
* Cloudflare 관리자 콘솔에서 Vercel이 제시하는 CNAME 및 A 레코드를 올바르게 기입합니다.
* **SSL/TLS 암호화 모드**: 원본 서버(Vercel) 간의 종단간 암호화를 위해 **Full (strict)** 모드로 설정합니다.
* **보안/방화벽 규칙**: http 요청을 강제로 https로 업그레이드하는 설정을 적용합니다.

### 3. SPF / DKIM / DMARC 이메일 인증 레코드 등록
* Resend 이메일 발송의 신뢰성을 확보하고 해외 수신자(Gmail, Outlook 등) 스팸함 필터링을 방어하기 위해 Cloudflare DNS에 Resend가 발급하는 SPF, DKIM 및 DMARC TXT 레코드를 모두 등록 및 검증 완료합니다.

---

## [5 단계] 관리자 계정 생성 및 최종 서비스 관통 검증

배포가 성공적으로 완료되면 아래 절차에 따라 상용 사이트 가동 최종 테스트를 진행합니다.

1. **최초 어드민 계정 생성**:
   * 상용 사이트의 `/register`를 통해 관리자 이메일 주소로 신규 가입을 진행합니다.
   * Supabase SQL Editor를 통해 가입된 사용자의 역할을 admin으로 업그레이드합니다:
     ```sql
     UPDATE public.profiles SET role = 'admin' WHERE email = 'export@cartradekorea.com';
     ```
2. **어드민 로그인 및 차량 등록**:
   * `/login`으로 로그인한 뒤, 관리자 대시보드 `/admin/cars/new`에서 샘플 차량을 등록합니다.
   * 대표 이미지 업로드 및 WebP 압축 저장 여부를 Storage 버킷에서 확인합니다.
3. **견적서 발행 및 이메일 수신 테스트**:
   * 일반 회원 계정으로 차량 견적 신청을 생성합니다.
   * 관리자 계정으로 견적을 조율한 뒤 **Quotation PDF를 생성**하고 바이어에게 이메일로 발행합니다.
   * 바이어 이메일로 송신된 **Download** 버튼을 클릭하여 `https://www.cartradekorea.com/api/documents/download?id=...` API를 통해 60분 임시 URL로 PDF가 정상 다운로드되는지 최종 확인합니다.
