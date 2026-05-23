-- 1. 기초 수출 국가 데이터 삽입 (GHA, NGA, LBY, VNM)
-- base_shipping_cost: 기본 해상 컨테이너/RORO 운송비 기준 ($)
INSERT INTO public.countries (name, code, base_shipping_cost) VALUES
('Vietnam', 'VNM', 1200.00),
('Ghana', 'GHA', 2500.00),
('Nigeria', 'NGA', 2700.00),
('Libya', 'LBY', 1900.00)
ON CONFLICT (name) DO UPDATE SET base_shipping_cost = EXCLUDED.base_shipping_cost;

-- 2. 각 국가별 항구 정보 삽입
-- country_id 조회를 통한 매핑 및 additional_cost(항구별 요율 차이) 설정
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
