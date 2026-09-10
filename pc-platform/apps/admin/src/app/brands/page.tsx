'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Building2, ExternalLink, Globe } from 'lucide-react';
import { Button, Badge, Modal, Input, Label, Textarea } from '@pc-platform/ui';
import { getAdminBrands, createAdminBrand, updateAdminBrand, deleteAdminBrand } from '../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { StatusBadge } from '../../components/ui/status-badge';

export default function AdminBrandsPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingBrand, setEditingBrand] = React.useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<any | null>(null);

  // Form
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);

  const { data: brandsData, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => getAdminBrands(),
  });

  const brands = brandsData?.data || brandsData || [];

  const openCreateModal = () => {
    setEditingBrand(null);
    setName('');
    setSlug('');
    setWebsite('');
    setCountry('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (b: any) => {
    setEditingBrand(b);
    setName(b.name || '');
    setSlug(b.slug || '');
    setWebsite(b.website || '');
    setCountry(b.country || '');
    setIsActive(Boolean(b.isActive));
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingBrand) {
        return updateAdminBrand(editingBrand.id, { name, slug, website, country, isActive });
      } else {
        return createAdminBrand({
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          website,
          country,
          isActive,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      key: 'name',
      header: 'Manufacturer Brand',
      sortable: true,
      cell: (b) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-cyber-900 border border-cyber-700 flex items-center justify-center font-mono font-bold text-cyan-400 text-xs shrink-0">
            {b.name?.slice(0, 2).toUpperCase() || 'BR'}
          </div>
          <div>
            <div className="font-mono font-bold text-white">{b.name}</div>
            <div className="text-[10px] font-mono text-cyber-500">/{b.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'country',
      header: 'Origin / HQ',
      sortable: true,
      cell: (b) => (
        <span className="font-mono text-cyber-300 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-cyber-500" />
          <span>{b.country || 'Global'}</span>
        </span>
      ),
    },
    {
      key: 'website',
      header: 'Official Portal',
      cell: (b) =>
        b.website ? (
          <a
            href={b.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span className="truncate max-w-[180px]">{b.website.replace(/^https?:\/\//, '')}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : (
          <span className="text-cyber-500 text-xs font-mono">-</span>
        ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      cell: (b) => <StatusBadge status={b.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (b) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(b)}
            className="h-7 w-7 p-0 text-cyber-400 hover:text-white"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(b)}
            className="h-7 w-7 p-0 text-cyber-400 hover:text-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Hardware Brands' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">HARDWARE MANUFACTURERS & BRANDS</h1>
          <p className="text-xs text-cyber-400 mt-1">Manage approved component vendors, warranty origins, and brand portals.</p>
        </div>

        <Button variant="gaming" size="sm" onClick={openCreateModal} className="gap-1.5 font-mono text-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>NEW BRAND</span>
        </Button>
      </div>

      <AdminDataTable
        data={brands}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Filter brands by name, country, or slug..."
        searchFilter={(b, q) =>
          b.name.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q) ||
          (b.country && b.country.toLowerCase().includes(q))
        }
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBrand ? 'Edit Hardware Brand' : 'Register New Brand'}
        className="max-w-md bg-[#0c101d] border-cyber-800"
      >
        <div className="space-y-4 pt-2 font-mono">
          <div>
            <Label className="text-xs text-cyber-300">Brand Name *</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingBrand) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
              }}
              placeholder="e.g. ASUS, Corsair, MSI, Seasonic"
              className="mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-cyber-300">URL Slug *</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. asus"
              className="mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-cyber-300">Country of Origin / HQ</Label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Taiwan, USA, Japan"
              className="mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-cyber-300">Official Website URL</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.asus.com"
              className="mt-1 h-8 text-xs"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded bg-cyber-900 border-cyber-700 text-cyan-500"
            />
            <span className="text-xs text-cyber-300">Active Vendor Partner</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-cyber-800">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="gaming"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={!name.trim() || saveMutation.isPending}
              className="text-xs"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Brand'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        title="Delete Brand?"
        description={`Are you sure you want to remove brand "${deleteTarget?.name}"?`}
        confirmText="Delete Brand"
        isDestructive={true}
      />
    </div>
  );
}
