'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, CheckCircle2, XCircle, Trash2, MessageSquare, Flag } from 'lucide-react';
import { Button, Badge } from '@pc-platform/ui';
import { getAdminReviews, deleteAdminReview } from '../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { StatusBadge } from '../../components/ui/status-badge';

const MOCK_REVIEWS = [
  {
    id: 'rev-1',
    productName: 'NVIDIA GeForce RTX 4080 Super',
    author: 'dev_gaurav@example.com',
    rating: 5,
    title: 'Flawless 4K performance',
    comment: 'Runs Cyberpunk at 4K Ultra with full path tracing at 85+ FPS with DLSS 3.5. Temperatures never exceed 64C.',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rev-2',
    productName: 'Intel Core i9-14900K',
    author: 'builder_99@example.com',
    rating: 4,
    title: 'Beast of a CPU but needs 360mm AIO',
    comment: 'Make sure your BIOS is updated to latest microcode. Extreme multicore performance in Blender.',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'rev-3',
    productName: 'Corsair Vengeance RGB DDR5 32GB',
    author: 'gamer_alok@example.com',
    rating: 2,
    title: 'XMP profile unstable on early BIOS',
    comment: 'Had to manually tune timings to get stable 6000MHz boot.',
    status: 'FLAGGED',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();

  const [reviews, setReviews] = React.useState<any[]>(MOCK_REVIEWS);
  const [deleteTarget, setDeleteTarget] = React.useState<any | null>(null);

  const deleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeleteTarget(null);
  };

  const updateReviewStatus = (id: string, status: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'productName',
      header: 'Component Reviewed',
      sortable: true,
      cell: (r) => (
        <div>
          <div className="font-mono font-bold text-white line-clamp-1">{r.productName}</div>
          <div className="text-[10px] font-mono text-cyber-500">By: {r.author}</div>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-1 font-mono text-amber-400">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span className="font-bold text-xs">{r.rating}/5</span>
        </div>
      ),
    },
    {
      key: 'content',
      header: 'Review Content',
      cell: (r) => (
        <div className="max-w-md">
          <div className="font-mono text-xs font-semibold text-white">{r.title}</div>
          <p className="text-xs text-cyber-300 line-clamp-2 mt-0.5">{r.comment}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Moderation Status',
      sortable: true,
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Moderation Actions',
      className: 'text-right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {r.status !== 'APPROVED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateReviewStatus(r.id, 'APPROVED')}
              className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-500/10"
              title="Approve Review"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </Button>
          )}

          {r.status !== 'FLAGGED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateReviewStatus(r.id, 'FLAGGED')}
              className="h-7 w-7 p-0 text-amber-400 hover:bg-amber-500/10"
              title="Flag Review for Verification"
            >
              <Flag className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(r)}
            className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10"
            title="Delete Review"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Product Reviews' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            HARDWARE REVIEWS & USER MODERATION
          </h1>
          <p className="text-xs text-cyber-400 mt-1">
            Moderate submitted community hardware feedback, benchmark reports, and ratings.
          </p>
        </div>
      </div>

      <AdminDataTable
        data={reviews}
        columns={columns}
        searchPlaceholder="Filter reviews by product, title, or author..."
        searchFilter={(r, q) =>
          r.productName.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q)
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteReview(deleteTarget.id);
        }}
        title="Delete Customer Review?"
        description="Are you sure you want to permanently remove this review from the public storefront?"
        confirmText="Delete Review"
        isDestructive={true}
      />
    </div>
  );
}
