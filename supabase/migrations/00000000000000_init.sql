-- 1. 사용자 역할 정의 ENUM 생성
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'dealer', 'buyer');
CREATE TYPE car_status AS ENUM ('available', 'reserved', 'sold');
CREATE TYPE quote_status AS ENUM ('pending', 'under_review', 'sent', 'completed', 'cancelled');
CREATE TYPE shipment_stage AS ENUM ('booking', 'port_delivery', 'customs', 'on_vessel', 'arrived');

-- 2. profiles (회원 프로필)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    phone_number TEXT,
    whatsapp TEXT,
    role user_role NOT NULL DEFAULT 'buyer',
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. countries (수출 가능 국가)
CREATE TABLE public.countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code VARCHAR(3) NOT NULL UNIQUE, -- 예: USA, KOR, GHA
    base_shipping_cost NUMERIC DEFAULT 0 NOT NULL, -- 기본 해상 운임
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. ports (항구 정보)
CREATE TABLE public.ports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    additional_cost NUMERIC DEFAULT 0 NOT NULL, -- 항구별 추가 할증료
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. cars (차량 기본 정보)
CREATE TABLE public.cars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    mileage INTEGER NOT NULL, -- km 단위
    fuel_type TEXT NOT NULL,
    transmission TEXT NOT NULL,
    price_usd NUMERIC NOT NULL,
    price_krw NUMERIC NOT NULL,
    status car_status NOT NULL DEFAULT 'available',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. car_images (차량 이미지)
CREATE TABLE public.car_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL, -- Supabase Storage Public URL
    is_main BOOLEAN DEFAULT false NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. car_specs (차량 상세 사양)
CREATE TABLE public.car_specs (
    car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE PRIMARY KEY,
    engine_displacement TEXT, -- 배기량 (cc)
    drive_type TEXT,          -- 구동방식 (2WD, 4WD 등)
    color TEXT,
    accident_history TEXT,    -- 사고유무 요약
    seating_capacity INTEGER,
    options TEXT[],           -- 옵션 배열 (가죽시트, 네비 등)
    description TEXT,         -- 차량 소개글
    inspection_sheet_url TEXT -- 성능점검표 PDF 경로
);

-- 8. quote_requests (견적 요청)
CREATE TABLE public.quote_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    whatsapp TEXT,
    destination_country_id UUID REFERENCES public.countries(id),
    destination_port_id UUID REFERENCES public.ports(id),
    message TEXT,
    status quote_status NOT NULL DEFAULT 'pending',
    calculated_total_price NUMERIC, -- 차량가 + 운임 + 보험료
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. export_documents (수출서류 관리)
CREATE TABLE public.export_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_request_id UUID REFERENCES public.quote_requests(id) ON DELETE CASCADE NOT NULL,
    document_name TEXT NOT NULL, -- Proforma Invoice, Packing List, BL 등
    file_url TEXT NOT NULL,      -- Storage Private URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. shipments (선적 진행 현황)
CREATE TABLE public.shipments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_request_id UUID REFERENCES public.quote_requests(id) ON DELETE CASCADE NOT NULL,
    stage shipment_stage NOT NULL DEFAULT 'booking',
    vessel_name TEXT,
    etd DATE, -- 출발 예정일
    eta DATE, -- 도착 예정일
    tracking_number TEXT,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. inquiries (일반 문의)
CREATE TABLE public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. favorites (관심 차량)
CREATE TABLE public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (user_id, car_id)
);

-- 13. admin_logs (관리자 작업 로그)
CREATE TABLE public.admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'CREATE_CAR', 'UPDATE_QUOTE' 등
    target_table TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 14. 자동 updated_at 갱신 트리거 생성
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_cars_modtime BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_quote_requests_modtime BEFORE UPDATE ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_shipments_modtime BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 15. Auth Sign-up 트리거를 통한 public.profiles 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'buyer'::user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 16. 모든 테이블 RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- 헬퍼 함수: 현재 요청자의 역할(role) 가져오기
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 17. profiles RLS 정책
CREATE POLICY "누구나 자신의 프로필 확인 가능" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "본인 정보 수정 가능" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "관리자는 모든 프로필 보기 가능" ON public.profiles FOR SELECT USING (public.get_my_role() = 'admin');
CREATE POLICY "관리자는 프로필 수정 가능" ON public.profiles FOR UPDATE USING (public.get_my_role() = 'admin');

-- 18. cars / car_images / car_specs RLS 정책
CREATE POLICY "누구나 차량 조회 가능" ON public.cars FOR SELECT USING (true);
CREATE POLICY "누구나 이미지 조회 가능" ON public.car_images FOR SELECT USING (true);
CREATE POLICY "누구나 상세스펙 조회 가능" ON public.car_specs FOR SELECT USING (true);

CREATE POLICY "관리자 및 딜러만 차량 등록/수정/삭제" ON public.cars 
    FOR ALL USING (public.get_my_role() IN ('admin', 'staff', 'dealer'));
CREATE POLICY "관리자 및 딜러만 이미지 관리" ON public.car_images 
    FOR ALL USING (public.get_my_role() IN ('admin', 'staff', 'dealer'));
CREATE POLICY "관리자 및 딜러만 스펙 관리" ON public.car_specs 
    FOR ALL USING (public.get_my_role() IN ('admin', 'staff', 'dealer'));

-- 19. quote_requests RLS 정책
CREATE POLICY "바이어는 본인 견적만 조회" ON public.quote_requests FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "바이어는 견적 요청 작성 가능" ON public.quote_requests FOR INSERT WITH CHECK (true); -- 비회원 견적도 허용하기 위해 true로 설정 (익명 견적 가능)
CREATE POLICY "관리자 및 직원은 모든 견적 조회/수정" ON public.quote_requests 
    FOR ALL USING (public.get_my_role() IN ('admin', 'staff'));

-- 20. export_documents RLS 정책
CREATE POLICY "견적 요청 소유 바이어는 관련 서류 조회 가능" ON public.export_documents 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quote_requests 
            WHERE id = quote_request_id AND buyer_id = auth.uid()
        )
    );
CREATE POLICY "관리자 및 직원은 서류 전체 권한" ON public.export_documents 
    FOR ALL USING (public.get_my_role() IN ('admin', 'staff'));

-- 21. shipments RLS 정책
CREATE POLICY "바이어는 본인 선적 현황 조회 가능" ON public.shipments 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quote_requests 
            WHERE id = quote_request_id AND buyer_id = auth.uid()
        )
    );
CREATE POLICY "관리자 및 직원은 선적 현황 관리 가능" ON public.shipments 
    FOR ALL USING (public.get_my_role() IN ('admin', 'staff'));

-- 22. inquiries RLS 정책
CREATE POLICY "누구나 일반 문의 작성 가능" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "본인 문의만 조회 가능" ON public.inquiries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "관리자 및 직원은 문의 전체 관리" ON public.inquiries 
    FOR ALL USING (public.get_my_role() IN ('admin', 'staff'));

-- 23. favorites RLS 정책
CREATE POLICY "본인 관심 차량 조회/등록/삭제" ON public.favorites 
    FOR ALL USING (auth.uid() = user_id);

-- 24. admin_logs RLS 정책
CREATE POLICY "관리자만 로그 조회 가능" ON public.admin_logs 
    FOR SELECT USING (public.get_my_role() = 'admin');
CREATE POLICY "시스템 백엔드 로그 입력 허용" ON public.admin_logs 
    FOR INSERT WITH CHECK (true);
