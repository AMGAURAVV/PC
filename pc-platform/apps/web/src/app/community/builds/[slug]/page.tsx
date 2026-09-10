import type { Metadata } from 'next';
import {
  constructMetadata,
  JsonLd,
  generateBuildSchema,
  generateBreadcrumbSchema,
  siteConfig,
} from '../../../../lib/seo';
import { BuildDetailClient } from './build-detail-client';

export const revalidate = 60;

interface BuildPageProps {
  params: {
    slug: string;
  };
}

async function fetchBuild(slug: string) {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/community/builds/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: BuildPageProps): Promise<Metadata> {
  const build = await fetchBuild(params.slug);

  if (!build) {
    const formattedTitle = params.slug.replace(/-/g, ' ').toUpperCase();
    return constructMetadata({
      title: `${formattedTitle} — Community PC Build`,
      description: 'Explore custom community PC builds on PC Platform.',
      canonicalPath: `/community/builds/${params.slug}`,
    });
  }

  const authorName = build.author ? `${build.author.firstName} ${build.author.lastName}` : 'Community Builder';
  const heroImage = build.images?.[0] || siteConfig.ogImage;
  const title = `${build.name} — ₹${Number(build.totalPrice).toLocaleString('en-IN')} ${build.useCase} PC Build`;
  const description =
    build.description ||
    `Verified custom PC build by ${authorName}. Configured with ${build.cpuName || 'High-End CPU'} and ${build.gpuName || 'Discrete GPU'}. Complete parts specification, pricing, and compatibility audit.`;

  return constructMetadata({
    title,
    description,
    image: heroImage,
    canonicalPath: `/community/builds/${params.slug}`,
    keywords: [
      build.name,
      `${build.useCase} PC build`,
      build.cpuName || '',
      build.gpuName || '',
      'custom PC specs',
      'PC builder showcase India',
    ].filter(Boolean),
  });
}

export default async function BuildPage({ params }: BuildPageProps) {
  const build = await fetchBuild(params.slug);
  const buildName = build?.name || params.slug.replace(/-/g, ' ').toUpperCase();

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Community Showcase', url: '/community' },
    { name: buildName, url: `/community/builds/${params.slug}` },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  const buildSchema = build
    ? generateBuildSchema({
        name: build.name,
        description: build.description,
        image: build.images?.[0],
        totalPrice: build.totalPrice,
        currency: build.currency || 'INR',
        authorName: build.author ? `${build.author.firstName} ${build.author.lastName}` : 'Community Builder',
        useCase: build.useCase,
        cpuName: build.cpuName,
        gpuName: build.gpuName,
        components: build.components,
        url: `/community/builds/${params.slug}`,
      })
    : null;

  return (
    <>
      <JsonLd data={buildSchema ? [buildSchema, breadcrumbSchema] : [breadcrumbSchema]} />
      <BuildDetailClient slug={params.slug} initialBuild={build} />
    </>
  );
}
