/**
 * Site configuration and SEO constants
 */

export const siteConfig = {
  name: 'PC Platform',
  legalName: 'PC Platform Technologies Pvt. Ltd.',
  shortName: 'NexusRigs',
  tagline: 'Precision PC Systems & Authoritative Compatibility Engine',
  description:
    'India\'s premier custom PC building platform. Configure hardware with guaranteed socket, PCIe, and thermal compatibility, track price history, and browse verified community builds.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://pcplatform.in',
  ogImage: '/images/og-default.png',
  links: {
    twitter: 'https://twitter.com/pcplatform',
    github: 'https://github.com/pc-platform',
    youtube: 'https://youtube.com/@pcplatform',
  },
  twitterHandle: '@pcplatform',
  locale: 'en_IN',
  currency: 'INR',
  contact: {
    email: 'support@pcplatform.in',
    phone: '+91-1800-PC-RIGS',
  },
} as const;

/**
 * Helper to construct an absolute canonical URL from a relative or absolute path
 */
export function absoluteUrl(path: string = ''): string {
  if (!path || path === '/') {
    return siteConfig.url;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url}${cleanPath}`;
}
