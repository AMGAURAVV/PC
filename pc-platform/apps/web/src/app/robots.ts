import { MetadataRoute } from 'next';
import { siteConfig } from '../lib/seo/site-config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/products',
          '/products/*',
          '/categories',
          '/categories/*',
          '/brands',
          '/brands/*',
          '/builder',
          '/community',
          '/community/*',
          '/blogs',
          '/blogs/*',
          '/deals',
          '/search',
        ],
        disallow: [
          '/account',
          '/account/*',
          '/cart',
          '/checkout',
          '/checkout/*',
          '/orders',
          '/orders/*',
          '/design-system',
          '/design-system/*',
          '/api/*',
          '/_next/*',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/account', '/cart', '/checkout', '/orders'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
