-- 1. cars 테이블에 main_image_url 컬럼 추가
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS main_image_url TEXT;

-- 2. 기존 차량 데이터에 대해 대표 이미지 URL로 마이그레이션 수행
-- car_images 테이블에서 is_main = true 이거나, 가장 먼저 등록된 이미지(sort_order가 가장 낮은 이미지)를 가져와 업데이트
UPDATE public.cars c
SET main_image_url = (
  SELECT image_url
  FROM public.car_images img
  WHERE img.car_id = c.id
  ORDER BY img.is_main DESC, img.sort_order ASC, img.created_at ASC
  LIMIT 1
)
WHERE c.main_image_url IS NULL;
