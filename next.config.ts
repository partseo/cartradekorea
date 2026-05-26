import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // ── 허용 외부 도메인 ──────────────────────────────────────────
    remotePatterns: [
      {
        // Supabase Storage Public 이미지 (차량 사진 저장소)
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Unsplash (개발/폴백 이미지용)
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],

    // ── 이미지 포맷 우선순위 (AVIF > WebP > JPEG) ────────────────
    formats: ["image/avif", "image/webp"],

    // ── 디바이스 반응형 이미지 크기 (모바일→데스크탑) ──────────────
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // ── 이미지 품질 기본값 (80 = 품질/용량 최적 균형점) ─────────
    minimumCacheTTL: 86400, // 24시간 캐시
  },
};

export default nextConfig;
