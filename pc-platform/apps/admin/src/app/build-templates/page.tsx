'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Plus, Edit2, Eye, Layers } from 'lucide-react';
import { Button, Badge, Price, Card, CardHeader, CardTitle, CardContent } from '@pc-platform/ui';
import { getAdminBaseBuilds, getAdminUseCases } from '../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';

const FALLBACK_BUILDS = [
  {
    id: 'base-gaming-1',
    name: '1080p Esports Dominator',
    useCase: 'Gaming',
    tier: 'Entry Champion',
    basePrice: 58000,
    targetResolution: '1080p 144Hz',
    description: 'Ryzen 5 7600 + RTX 4060 8GB with 16GB DDR5 memory',
    baselineSpecs: {
      cpu: 'Ryzen 5 7600',
      gpu: 'RTX 4060 8GB',
      ram: '16GB DDR5-5600',
      storage: '1TB NVMe Gen4',
      psu: '650W Bronze',
    },
  },
  {
    id: 'base-gaming-2',
    name: '1440p High Refresh Battlestation',
    useCase: 'Gaming',
    tier: 'Sweet Spot',
    basePrice: 115000,
    targetResolution: '1440p Ultra 165Hz',
    description: 'Ryzen 7 7800X3D + RTX 4070 Super 12GB with 32GB DDR5 memory',
    baselineSpecs: {
      cpu: 'Ryzen 7 7800X3D',
      gpu: 'RTX 4070 Super 12GB',
      ram: '32GB DDR5-6000',
      storage: '2TB NVMe Gen4',
      psu: '750W Gold',
    },
  },
  {
    id: 'base-creator-1',
    name: '4K Video Editing Workhorse',
    useCase: 'Creator',
    tier: 'Production Grade',
    basePrice: 165000,
    targetResolution: '4K Premiere / DaVinci',
    description: 'Intel Core i9-14900K + RTX 4080 Super 16GB with 64GB DDR5 memory',
    baselineSpecs: {
      cpu: 'Core i9-14900K',
      gpu: 'RTX 4080 Super 16GB',
      ram: '64GB DDR5-6000',
      storage: '4TB Dual NVMe',
      psu: '850W Gold ATX 3.0',
    },
  },
];

export default function AdminBuildTemplatesPage() {
  const { data: baseBuildsResp, isLoading } = useQuery({
    queryKey: ['admin-base-builds'],
    queryFn: getAdminBaseBuilds,
  });

  const builds = baseBuildsResp?.data || FALLBACK_BUILDS;

  const columns: ColumnDef<any>[] = [
    {
      key: 'name',
      header: 'Build Template Name',
      sortable: true,
      cell: (b) => (
        <div>
          <div className="font-mono font-bold text-white">{b.name}</div>
          <div className="text-[10px] font-mono text-cyber-500">{b.description}</div>
        </div>
      ),
    },
    {
      key: 'useCase',
      header: 'Use Case',
      sortable: true,
      cell: (b) => (
        <Badge variant="tech" className="font-mono text-[10px]">
          {b.useCase}
        </Badge>
      ),
    },
    {
      key: 'tier',
      header: 'Tier Level',
      sortable: true,
      cell: (b) => (
        <span className="font-mono text-xs text-cyber-300">{b.tier}</span>
      ),
    },
    {
      key: 'basePrice',
      header: 'Base Investment',
      sortable: true,
      cell: (b) => <Price amount={b.basePrice} size="sm" />,
    },
    {
      key: 'targetResolution',
      header: 'Target Resolution',
      cell: (b) => (
        <Badge variant="secondary" className="font-mono text-[10px]">
          {b.targetResolution}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Build Templates' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            CURATED BASE RIG TEMPLATES
          </h1>
          <p className="text-xs text-cyber-400 mt-1">
            Pre-configured hardware combinations consumed by the beginner-friendly Guided Configurator (/configure).
          </p>
        </div>
      </div>

      <AdminDataTable
        data={builds}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Filter build templates by name, use case, or tier..."
        searchFilter={(b, q) =>
          b.name.toLowerCase().includes(q) ||
          b.useCase.toLowerCase().includes(q) ||
          b.tier.toLowerCase().includes(q)
        }
      />
    </div>
  );
}
