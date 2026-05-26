-- 1. 기존 광범위한 딜러 RLS 정책 DROP
DROP POLICY IF EXISTS "관리자 및 딜러만 차량 등록/수정/삭제" ON public.cars;
DROP POLICY IF EXISTS "관리자 및 딜러만 이미지 관리" ON public.car_images;
DROP POLICY IF EXISTS "관리자 및 딜러만 스펙 관리" ON public.car_specs;
DROP POLICY IF EXISTS "시스템 백엔드 로그 입력 허용" ON public.admin_logs;

-- 2. cars 테이블 RLS 정책 보강
-- 관리자 및 직원은 모든 차량 등록/수정/삭제 가능
CREATE POLICY "관리자 및 직원은 모든 차량 관리 가능" ON public.cars 
    FOR ALL 
    TO authenticated 
    USING (public.get_my_role() IN ('admin', 'staff'))
    WITH CHECK (public.get_my_role() IN ('admin', 'staff'));

-- 딜러는 자신이 등록한 차량만 등록/수정/삭제 가능
CREATE POLICY "딜러는 본인 차량만 관리 가능" ON public.cars 
    FOR ALL 
    TO authenticated 
    USING (public.get_my_role() = 'dealer' AND created_by = auth.uid())
    WITH CHECK (public.get_my_role() = 'dealer' AND created_by = auth.uid());


-- 3. car_images 테이블 RLS 정책 보강
-- 관리자 및 직원은 모든 차량 이미지 관리 가능
CREATE POLICY "관리자 및 직원은 모든 차량 이미지 관리 가능" ON public.car_images 
    FOR ALL 
    TO authenticated 
    USING (public.get_my_role() IN ('admin', 'staff'))
    WITH CHECK (public.get_my_role() IN ('admin', 'staff'));

-- 딜러는 본인이 등록한 차량의 이미지만 관리 가능
CREATE POLICY "딜러는 본인 차량의 이미지 관리 가능" ON public.car_images 
    FOR ALL 
    TO authenticated 
    USING (
        public.get_my_role() = 'dealer' 
        AND EXISTS (
            SELECT 1 FROM public.cars 
            WHERE id = car_images.car_id 
            AND created_by = auth.uid()
        )
    )
    WITH CHECK (
        public.get_my_role() = 'dealer' 
        AND EXISTS (
            SELECT 1 FROM public.cars 
            WHERE id = car_images.car_id 
            AND created_by = auth.uid()
        )
    );


-- 4. car_specs 테이블 RLS 정책 보강
-- 관리자 및 직원은 모든 차량 스펙 관리 가능
CREATE POLICY "관리자 및 직원은 모든 차량 스펙 관리 가능" ON public.car_specs 
    FOR ALL 
    TO authenticated 
    USING (public.get_my_role() IN ('admin', 'staff'))
    WITH CHECK (public.get_my_role() IN ('admin', 'staff'));

-- 딜러는 본인이 등록한 차량의 스펙만 관리 가능
CREATE POLICY "딜러는 본인 차량의 스펙 관리 가능" ON public.car_specs 
    FOR ALL 
    TO authenticated 
    USING (
        public.get_my_role() = 'dealer' 
        AND EXISTS (
            SELECT 1 FROM public.cars 
            WHERE id = car_specs.car_id 
            AND created_by = auth.uid()
        )
    )
    WITH CHECK (
        public.get_my_role() = 'dealer' 
        AND EXISTS (
            SELECT 1 FROM public.cars 
            WHERE id = car_specs.car_id 
            AND created_by = auth.uid()
        )
    );


-- 5. admin_logs 테이블 RLS 정책 보강 (임의 로그 주입 방지)
-- 관리자 및 직원만 로그를 직접 등록할 수 있도록 수정 (서버-사이드 service_role 호출은 RLS를 우회하므로 허용됨)
CREATE POLICY "관리자 및 직원만 로그 등록 가능" ON public.admin_logs 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (public.get_my_role() IN ('admin', 'staff'));
