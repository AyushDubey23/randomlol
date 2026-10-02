import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/view', '/api/'],
    },
    sitemap: 'https://hridaybajaj.com/sitemap.xml',
  }
}
