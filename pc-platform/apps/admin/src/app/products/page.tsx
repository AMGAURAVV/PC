'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Archive,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Layers,
} from 'lucide-react';
import { Button, Badge, Price } from '@pc-platform/ui';
import {
  getAdminProducts,
  deleteAdminProduct,
  publishAdminProduct,
  archiveAdminProduct,
} from '../../lib/api/admin-api';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { StatusBadge } from '../../components/ui/status-badge';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();

  // Dialog State
  const [deleteTarget, setDeleteTarget] = React.useState<any | null>(null);
  const [bulkDeleteItems, setBulkDeleteItems] = React.useState<any[] | null>(null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => getAdminProducts({ limit: 100 }),
  });

  const products = productsData?.data || [];

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteTarget(null);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      key: 'name',
      header: 'Component / SKU',
      sortable: true,
      cell: (p) => (
        <div className="flex flex-col">
          <Link
            href={`/products/${p.id}`}
            className="font-mono font-semibold text-white hover:text-cyan-400 transition-colors line-clamp-1"
          >
            {p.name}
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyber-500">
            <span>SKU: {p.sku || 'N/A'}</span>
            <span>•</span>
            <span>MOD: {p.model || 'Standard'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      cell: (p) => (
        <Badge variant="secondary" className="font-mono text-[10px]">
          {p.category || 'HARDWARE'}
        </Badge>
      ),
    },
    {
      key: 'brand',
      header: 'Brand',
      sortable: true,
      cell: (p) => (
        <span className="font-mono text-cyber-300">
          {p.brand?.name || p.brandName || 'Standard'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Active Price',
      sortable: true,
      cell: (p) => {
        const rawPrice = p.price || (p.prices?.[0]?.amount ? Number(p.prices[0].amount) / 100 : 0);
        return <Price amount={rawPrice} size="sm" />;
      },
    },
    {
      key: 'stockStatus',
      header: 'Stock Level',
      sortable: true,
      cell: (p) => {
        const available = p.availableStock ?? (p.inventory?.quantity || 10);
        let status = 'IN_STOCK';
        if (available <= 0) status = 'OUT_OF_STOCK';
        else if (available <= 5) status = 'LOW_STOCK';
        return (
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-[11px] font-mono text-cyber-400">({available} units)</span>
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Catalog Status',
      sortable: true,
      cell: (p) => (
        <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/products/${p.id}`}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-cyber-400 hover:text-white" title="Edit Component">
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          </Link>

          {p.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => archiveMutation.mutate(p.id)}
              className="h-7 w-7 p-0 text-cyber-400 hover:text-amber-400"
              title="Archive from Live Storefront"
            >
              <Archive className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => publishMutation.mutate(p.id)}
              className="h-7 w-7 p-0 text-cyber-400 hover:text-emerald-400"
              title="Publish to Live Storefront"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(p)}
            className="h-7 w-7 p-0 text-cyber-400 hover:text-rose-400"
            title="Delete Component"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Hardware Products' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
              HARDWARE CATALOG MANAGEMENT
            </h1>
            <Badge variant="tech">LIVE INGESTION</Badge>
          </div>
          <p className="text-xs text-cyber-400 mt-1">
            Maintain technical attributes, SKU identifiers, inventory bindings, and compatibility metadata.
          </p>
        </div>

        <Link href="/products/new">
          <Button variant="gaming" size="sm" className="gap-1.5 font-mono text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>NEW COMPONENT</span>
          </Button>
        </Link>
      </div>

      {/* Main Data Table */}
      <AdminDataTable
        data={products}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by Name, SKU, Chipset, or Model..."
        searchFilter={(item, q) =>
          item.name.toLowerCase().includes(q) ||
          (item.sku && item.sku.toLowerCase().includes(q)) ||
          (item.model && item.model.toLowerCase().includes(q))
        }
        facetFilters={[
          {
            key: 'category',
            label: 'Category',
            options: [
              { label: 'CPU Processors', value: 'CPU' },
              { label: 'Graphics Cards', value: 'GPU' },
              { label: 'Motherboards', value: 'MOTHERBOARD' },
              { label: 'RAM Memory', value: 'RAM' },
              { label: 'Storage Drives', value: 'STORAGE' },
              { label: 'Power Supplies', value: 'PSU' },
              { label: 'PC Cases', value: 'CASE' },
              { label: 'Coolers & AIO', value: 'COOLER' },
            ],
          },
        ]}
        bulkActions={[
          {
            label: 'Publish Selected',
            icon: CheckCircle2,
            onClick: async (selected) => {
              for (const item of selected) {
                await publishMutation.mutateAsync(item.id);
              }
            },
          },
          {
            label: 'Archive Selected',
            icon: Archive,
            onClick: async (selected) => {
              for (const item of selected) {
                await archiveMutation.mutateAsync(item.id);
              }
            },
          },
          {
            label: 'Delete Selected',
            icon: Trash2,
            isDestructive: true,
            onClick: (selected) => setBulkDeleteItems(selected),
          },
        ]}
        pageSize={12}
      />

      {/* Single Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        title="Delete Hardware Component?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will unlink active price records and remove it from compatibility checks.`}
        confirmText="Delete Component"
        confirmationWord="DELETE"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(bulkDeleteItems && bulkDeleteItems.length > 0)}
        onClose={() => setBulkDeleteItems(null)}
        onConfirm={async () => {
          if (bulkDeleteItems) {
            for (const item of bulkDeleteItems) {
              await deleteMutation.mutateAsync(item.id);
            }
            setBulkDeleteItems(null);
          }
        }}
        title={`Delete ${bulkDeleteItems?.length || 0} Selected Components?`}
        description="This action cannot be undone. All selected components will be purged from the active catalog and inventory tracking."
        confirmText="Purge Selected"
        confirmationWord="PURGE"
        isDestructive={true}
      />
    </div>
  );
}
