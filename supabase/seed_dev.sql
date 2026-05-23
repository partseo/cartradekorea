-- 1. 기초 국가 및 항구 데이터 삽입 (seed_prod.sql과 동일)
INSERT INTO public.countries (name, code, base_shipping_cost) VALUES
('Vietnam', 'VNM', 1200.00),
('Ghana', 'GHA', 2500.00),
('Nigeria', 'NGA', 2700.00),
('Libya', 'LBY', 1900.00)
ON CONFLICT (name) DO UPDATE SET base_shipping_cost = EXCLUDED.base_shipping_cost;

DO $$
DECLARE
    vnm_id UUID;
    gha_id UUID;
    nga_id UUID;
    lby_id UUID;
BEGIN
    SELECT id INTO vnm_id FROM public.countries WHERE code = 'VNM';
    SELECT id INTO gha_id FROM public.countries WHERE code = 'GHA';
    SELECT id INTO nga_id FROM public.countries WHERE code = 'NGA';
    SELECT id INTO lby_id FROM public.countries WHERE code = 'LBY';

    IF vnm_id IS NOT NULL THEN
        INSERT INTO public.ports (country_id, name, additional_cost) VALUES
        (vnm_id, 'Haiphong Port', 0.00),
        (vnm_id, 'Ho Chi Minh Port', 150.00)
        ON CONFLICT DO NOTHING;
    END IF;

    IF gha_id IS NOT NULL THEN
        INSERT INTO public.ports (country_id, name, additional_cost) VALUES
        (gha_id, 'Tema Port', 0.00),
        (gha_id, 'Takoradi Port', 100.00)
        ON CONFLICT DO NOTHING;
    END IF;

    IF nga_id IS NOT NULL THEN
        INSERT INTO public.ports (country_id, name, additional_cost) VALUES
        (nga_id, 'Lagos Port (Apapa)', 0.00),
        (nga_id, 'Tin Can Island Port', 50.00)
        ON CONFLICT DO NOTHING;
    END IF;

    IF lby_id IS NOT NULL THEN
        INSERT INTO public.ports (country_id, name, additional_cost) VALUES
        (lby_id, 'Tripoli Port', 0.00),
        (lby_id, 'Benghazi Port', 120.00)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 2. 테스트용 프로필 데이터 삽입 (관리자/딜러/바이어 모의 계정)
-- 실제 auth.users에 계정이 등록되어야 참조 무결성(FK)이 유지되나, 
-- 로컬 개발 단계에서 쿼리 검증을 위해 임시 UUID로 프로필만 강제 삽입 또는 auth 스키마 연동 필요.
-- RLS 우회 및 어드민 페이지 접근 테스트용 프로필을 삽입합니다. (개발용)
-- (만약 auth.users가 비어 있다면 FK 제약조건이 발생하므로, profiles 테이블 구조상 Auth Users를 직접 참조하고 있으므로
--  Auth 연동 없이 profiles 데이터만 생성하기는 어려움. 따라서 cars 및 기타 데이터 삽입 시 created_by는 NULL로 지정 가능하게 되어 있음.)

-- 3. 테스트용 차량 데이터 (cars)
-- 신규 컬럼(stock_number, photo_verified, dealer_source) 포함
INSERT INTO public.cars (id, title, brand, model, year, mileage, fuel_type, transmission, price_usd, price_krw, status, stock_number, photo_verified, dealer_source) VALUES
('avante-2020-0000-0000-000000000001', 'Hyundai Avante 1.6 Smart', 'Hyundai', 'Avante', 2020, 45000, 'Gasoline', 'Automatic', 11500, 15500000, 'available', 'ST-HY-001', true, 'Incheon Dealer A'),
('sportage-2019-0000-0000-000000000002', 'Kia Sportage 2.0 Trendy', 'Kia', 'Sportage', 2019, 68000, 'Diesel', 'Automatic', 14200, 19100000, 'available', 'ST-KI-002', true, 'Busan Dealer B'),
('grandeur-2021-0000-0000-000000000003', 'Hyundai Grandeur 2.5 Premium', 'Hyundai', 'Grandeur', 2021, 32000, 'Gasoline', 'Automatic', 21000, 28350000, 'available', 'ST-HY-003', false, 'Incheon Dealer A'),
('k5-2020-0000-0000-000000000004', 'Kia K5 2.0 Signature', 'Kia', 'K5', 2020, 52000, 'LPG', 'Automatic', 13800, 18630000, 'available', 'ST-KI-004', true, 'Incheon Dealer A')
ON CONFLICT (id) DO NOTHING;

-- 4. 테스트용 차량 상세 사양 데이터 (car_specs)
-- 신규 컬럼(vin_partial, vehicle_location, fob_port, steering_position, engine_number_partial, hs_code, inspection_report_url, export_certificate_status) 포함
INSERT INTO public.car_specs (car_id, engine_displacement, drive_type, color, accident_history, seating_capacity, options, description, inspection_sheet_url, vin_partial, vehicle_location, fob_port, steering_position, engine_number_partial, hs_code, export_certificate_status) VALUES
('avante-2020-0000-0000-000000000001', '1598cc', '2WD', 'Polar White', 'No accidents', 5, ARRAY['Smart Key', 'Navigation', 'Leather Seats', 'Rear Camera'], 'Superb condition Avante.', '/temp/report1.pdf', 'KMHDK41D1LU******', 'Incheon Port Yard 3', 'Incheon Port', 'LHD', 'G4FL-123***', '8703.22.9000', 'completed'),
('sportage-2019-0000-0000-000000000002', '1995cc', '2WD', 'Steel Gray', 'Minor bumper scratch', 5, ARRAY['Sunroof', 'Navigation', 'Heated Seats', 'Smart Cruise'], 'Spacious Kia SUV.', '/temp/report2.pdf', 'KPTC3C1C2KA******', 'Busan Port Yard 1', 'Busan Port', 'LHD', 'D4HA-456***', '8703.32.9000', 'completed'),
('grandeur-2021-0000-0000-000000000003', '2497cc', '2WD', 'Midnight Black', 'No accidents', 5, ARRAY['Heated Seats', 'Ventilated Seats', 'Panoramic Sunroof', 'Lane Assist'], 'Luxurious sedan in perfect shape.', '/temp/report3.pdf', 'KMHFC41B1MU******', 'Incheon Port Yard 3', 'Incheon Port', 'LHD', 'G4KN-789***', '8703.23.9000', 'pending'),
('k5-2020-0000-0000-000000000004', '1999cc', '2WD', 'Gravity Blue', '1 minor fender replacement', 5, ARRAY['Smart Key', 'Heated Steering Wheel', 'Apple CarPlay'], 'Fuel-efficient LPG model.', '/temp/report4.pdf', 'KPTD4C1B1LU******', 'Incheon Port Yard 2', 'Incheon Port', 'LHD', 'L4NA-990***', '8703.22.9000', 'completed')
ON CONFLICT (car_id) DO NOTHING;
