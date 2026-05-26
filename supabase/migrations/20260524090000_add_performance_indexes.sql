-- 1. cars 테이블의 status와 created_at 복합 인덱스 (차량 목록 기본 조회/정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_cars_status_created_at ON public.cars (status, created_at DESC);

-- 2. cars 테이블의 brand와 status 복합 인덱스 (브랜드별 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_cars_brand_status ON public.cars (brand, status);

-- 3. car_images 테이블의 car_id와 is_main 복합 인덱스 (메인 이미지 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_car_images_car_id_is_main ON public.car_images (car_id, is_main);
