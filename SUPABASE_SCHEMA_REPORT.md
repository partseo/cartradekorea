# 데이터베이스 테이블 및 스키마 명세서 (SUPABASE_SCHEMA_REPORT.md)

본 문서는 플랫폼의 성능 극대화 및 보안 통제를 구축하기 위해 구현된 Supabase(PostgreSQL)의 릴레이션 테이블 정보, RLS 정책 및 인덱싱 설계도입니다.

---

## 1. 테이블 명세 (Tables Schema)

### ① `public.cars` (차량 기본 정보 테이블)
- **설명**: 매물의 기본 제원 및 판매 상태 정보가 보관되는 메인 테이블입니다.
- **주요 컬럼**:
  - `id`: uuid (Primary Key, default: `gen_random_uuid()`)
  - `title`: text (차량 대표명)
  - `brand`: text (브랜드)
  - `model`: text (모델명)
  - `year`: integer (연식)
  - `mileage`: integer (주행거리)
  - `fuel_type`: text (연료)
  - `transmission`: text (변속기)
  - `price_usd`: numeric (FOB 기준 수출가)
  - `price_krw`: numeric (내수용 원화 단가)
  - `status`: text (판매 상태: `available`, `reserved`, `sold`)
  - `stock_number`: text (재고 식별 번호 - Unique)
  - `photo_verified`: boolean (사진 실물 검증 여부)
  - `dealer_source`: text (매입 딜러처)
  - `main_image_url`: text (**신설 컬럼**: 리스트 페이지 1:N 조인 부하 제거를 위해 첫 번째 대표 WebP 이미지 주소를 직접 저장)

### ② `public.car_specs` (수출 기술 제원 테이블)
- **설명**: 바이어가 수입 통관 시 필요한 마스킹된 차대번호, 배기량, HS Code 등 12대 상세 필드가 기입되는 1:1 관계의 테이블입니다.
- **주요 컬럼**:
  - `car_id`: uuid (Primary Key, ForeignKey -> `public.cars.id` Cascade)
  - `engine_displacement`: text (배기량)
  - `drive_type`: text (구동 방식)
  - `color`: text (외관 색상)
  - `vin_partial`: text (마스킹 처리된 공개용 차대번호 일부)
  - `vehicle_location`: text (야드 주소)
  - `fob_port`: text (선적지 항구)
  - `steering_position`: text (좌/우핸들 여부: `LHD`, `RHD`)
  - `engine_number_partial`: text (엔진 번호 일부)
  - `hs_code`: text (관세율표 번호)
  - `export_certificate_status`: text (말소 증서 상태)

### ③ `public.car_images` (차량 갤러리 이미지 테이블)
- **설명**: 매물별 다중 갤러리 사진들의 Public Storage 주소 목록입니다.
- **주요 컬럼**:
  - `id`: uuid (Primary Key)
  - `car_id`: uuid (ForeignKey -> `public.cars.id` Cascade)
  - `image_url`: text (Storage WebP 압축본 주소)
  - `is_main`: boolean (대표 사진 여부)
  - `sort_order`: integer (슬라이더 노출 정렬 순서)

---

## 2. 데이터베이스 인덱스 (Database Indexes)

차량 검색 속도 저하 문제를 완전히 해결하기 위해 쿼리 수행 빈도와 조건절을 기반으로 신설된 복합 인덱스 목록입니다.

```sql
-- 1. cars 테이블의 status와 created_at 복합 인덱스 (차량 목록 기본 조회/정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_cars_status_created_at ON public.cars (status, created_at DESC);

-- 2. cars 테이블의 brand와 status 복합 인덱스 (브랜드별 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_cars_brand_status ON public.cars (brand, status);

-- 3. car_images 테이블의 car_id와 is_main 복합 인덱스 (메인 이미지 조회 최적화 - 상세 갤러리용)
CREATE INDEX IF NOT EXISTS idx_car_images_car_id_is_main ON public.car_images (car_id, is_main);
```

---

## 3. RLS 정책 및 데이터 보안 (Row Level Security)

데이터 노출 사고를 방지하기 위해 전체 테이블에 RLS를 활성화하고 역할군별 정책을 구성했습니다.

- **`cars`, `car_specs`, `car_images`**:
  - **SELECT**: 비인가 익명 사용자(바이어 포함)에게도 전체 허용.
  - **INSERT/UPDATE/DELETE**: `admin` 및 `staff` 롤을 소유한 운영 인증 사용자에게만 전권 허용.
- **`quote_requests`, `export_documents`**:
  - **SELECT**: 해당 견적을 요청한 본인(`auth.uid() = user_id`) 또는 관리자 그룹만 조회 가능.
  - **INSERT**: 비인가 바이어에게도 견적 신청을 위해 INSERT 허용하되, 생성 즉시 본인 데이터로만 묶이도록 RLS 바인딩 처리.
