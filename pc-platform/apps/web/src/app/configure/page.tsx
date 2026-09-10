import type { Metadata } from 'next';
import { constructMetadata, JsonLd, generateBreadcrumbSchema } from '../../lib/seo';
import { ConfigureClient } from './configure-client';

export const metadata: Metadata = constructMetadata({
  title: 'Guided PC Configurator — Baseline Systems & Upgrade Matrix',
  description:
    'Choose your gaming or professional workflow use-case and customize verified base builds with step-by-step component upgrades.',
  canonicalPath: '/configure',
  keywords: [
    'guided PC configurator',
    'prebuilt PC customizer',
    'gaming PC configuration wizard',
    'workstation builder',
  ],
});

export default function ConfigurePage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Guided Configurator', url: '/configure' },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <ConfigureClient />
    </>
  );
}
