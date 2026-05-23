import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.globalautoexport.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/mypage/',
        '/api/',
        '/*.json$',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
