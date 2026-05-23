-- 1. cars 테이블에 수출 운영용 필드 추가
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS stock_number TEXT UNIQUE;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS photo_verified BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS dealer_source TEXT;

-- 2. car_specs 테이블에 수출 운영용 필드 추가
ALTER TABLE public.car_specs ADD COLUMN IF NOT EXISTS vin_partial TEXT;
ALTER TABLE public.car_specs ADD COLUMN IF NOT EXISTS vehicle_location TEXT;
ALTER TABLE public.car_specs ADD COLUMN IF NOT EXISTS fob_port TEXT;
ALTER TABLE public.car_specs ADD COLUMN IF NOT EXISTS steering_position TEXT DEFAULT 'LHD' NOT NULL;
ALTER TABLE public.car_specs ADD COLUMN IF NOT EXISTS engine_number_partial TEXT;
ALTER TABLE public.car_specs ADD COLUMN IF NOT EXISTS hs_code TEXT;
ALTER TABLE public.car_specs ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;
ALTER TABLE public.car_specs ADD COLUMN IF NOT EXISTS export_certificate_status TEXT DEFAULT 'pending' NOT NULL;

-- 3. quote_requests 테이블에 견적 수동 조정 상세 내역 저장을 위한 JSONB 컬럼 추가
ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS quote_detail JSONB;
