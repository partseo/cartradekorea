-- 1. export_documents 테이블에 file_path 컬럼 추가 (Storage 내의 실제 보관 경로를 담기 위함)
ALTER TABLE public.export_documents ADD COLUMN IF NOT EXISTS file_path TEXT;

-- 2. 기존 file_url 컬럼을 NULL 허용으로 변경 (임시 signed URL의 DB 하드코딩 제거 및 마이그레이션 대비)
ALTER TABLE public.export_documents ALTER COLUMN file_url DROP NOT NULL;
