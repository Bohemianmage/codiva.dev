import type { MetadataRoute } from 'next';
import { marketingBaseUrl } from '@/lib/ops/host';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/empleos/interna', '/ops/', '/api/', '/dashboard', '/p/'],
    },
    sitemap: `${marketingBaseUrl()}/sitemap.xml`,
  };
}
