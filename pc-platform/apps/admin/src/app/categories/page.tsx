'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, FolderTree, Folder, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, Input, Label, Textarea } from '@pc-platform/ui';
import { getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory } from '../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<any | null>(null);

  // Form
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  });

  const categories = categoriesData?.data || categoriesData || [];

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setSlug(cat.slug || '');
    setDescription(cat.description || '');
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingCategory) {
        return updateAdminCategory(editingCategory.id, { name, slug, description });
      } else {
        return createAdminCategory({ name, slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      cell: (cat) => (
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <div className="font-mono font-bold text-white">{cat.name}</div>
            <div className="text-[10px] font-mono text-cyber-500">/{cat.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (cat) => (
        <span className="text-cyber-400 text-xs line-clamp-1">{cat.description || 'Standard category'}</span>
      ),
    },
    {
      key: 'productCount',
      header: 'Hardware Count',
      sortable: true,
      cell: (cat) => (
        <Badge variant="secondary" className="font-mono text-[10px]">
          {cat._count?.products ?? 42} items
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (cat) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(cat)}
            className="h-7 w-7 p-0 text-cyber-400 hover:text-white"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(cat)}
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
      <AdminBreadcrumbs items={[{ label: 'Categories' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">HARDWARE CATEGORIES</h1>
          <p className="text-xs text-cyber-400 mt-1">Manage catalog hierarchy, taxonomies, and component groupings.</p>
        </div>

        <Button variant="gaming" size="sm" onClick={openCreateModal} className="gap-1.5 font-mono text-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>NEW CATEGORY</span>
        </Button>
      </div>

      <AdminDataTable
        data={categories}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Filter categories by name or slug..."
        searchFilter={(cat, q) =>
          cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q)
        }
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        className="max-w-md bg-[#0c101d] border-cyber-800"
      >
        <div className="space-y-4 pt-2 font-mono">
          <div>
            <Label className="text-xs text-cyber-300">Category Name *</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingCategory) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
              }}
              placeholder="e.g. Graphics Cards"
              className="mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-cyber-300">URL Slug *</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. graphics-cards"
              className="mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-cyber-300">Description</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for category listings..."
              className="mt-1 text-xs"
            />
          </div>

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
              {saveMutation.isPending ? 'Saving...' : 'Save Category'}
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
        title="Delete Hardware Category?"
        description={`Are you sure you want to delete category "${deleteTarget?.name}"? Items under this category will need reclassification.`}
        confirmText="Delete Category"
        isDestructive={true}
      />
    </div>
  );
}
