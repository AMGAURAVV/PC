'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Boxes, Plus, AlertTriangle, ShieldCheck, RefreshCw, Warehouse, Search } from 'lucide-react';
import { Button, Badge, Modal, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@pc-platform/ui';
import { getAdminProducts, updateAdminInventory } from '../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';
import { StatusBadge } from '../../components/ui/status-badge';

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();

  const [restockItem, setRestockItem] = React.useState<any | null>(null);
  const [addQty, setAddQty] = React.useState<number>(10);
  const [newThreshold, setNewThreshold] = React.useState<number>(3);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-inventory-products'],
    queryFn: () => getAdminProducts({ limit: 100 }),
  });

  const products = productsData?.data || [];

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ invId, quantity, lowStockThreshold }: { invId: string; quantity: number; lowStockThreshold: number }) => {
      return updateAdminInventory(invId, { quantity, lowStockThreshold });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setRestockItem(null);
    },
  });

  const openRestockModal = (product: any) => {
    setRestockItem(product);
    setAddQty(10);
    const inv = product.inventory?.[0] || product.inventory;
    setNewThreshold(inv?.lowStockThreshold || 3);
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'name',
      header: 'Component / SKU',
      sortable: true,
      cell: (p) => (
        <div>
          <div className="font-mono font-semibold text-white">{p.name}</div>
          <div className="text-[10px] font-mono text-cyber-500">
            SKU: {p.sku || 'N/A'} • {p.category}
          </div>
        </div>
      ),
    },
    {
      key: 'totalStock',
      header: 'Warehouse Total',
      sortable: true,
      cell: (p) => {
        const inv = p.inventory?.[0] || p.inventory;
        const total = inv?.quantity ?? 10;
        return (
          <span className="font-mono font-bold text-white text-sm">
            {total} units
          </span>
        );
      },
    },
    {
      key: 'reservedStock',
      header: 'Pending Reserves',
      sortable: true,
      cell: (p) => {
        const inv = p.inventory?.[0] || p.inventory;
        const reserved = inv?.reservedQty ?? 0;
        return (
          <span className={`font-mono text-xs ${reserved > 0 ? 'text-amber-400 font-bold' : 'text-cyber-500'}`}>
            {reserved} held
          </span>
        );
      },
    },
    {
      key: 'availableStock',
      header: 'Available Stock',
      sortable: true,
      cell: (p) => {
        const inv = p.inventory?.[0] || p.inventory;
        const total = inv?.quantity ?? 10;
        const reserved = inv?.reservedQty ?? 0;
        const avail = Math.max(0, total - reserved);

        let status = 'IN_STOCK';
        if (avail <= 0) status = 'OUT_OF_STOCK';
        else if (avail <= 5) status = 'LOW_STOCK';

        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-emerald-400">{avail}</span>
            <StatusBadge status={status} />
          </div>
        );
      },
    },
    {
      key: 'location',
      header: 'Fulfillment Bay',
      cell: (p) => {
        const inv = p.inventory?.[0] || p.inventory;
        return (
          <span className="font-mono text-[11px] text-cyber-400 flex items-center gap-1">
            <Warehouse className="w-3 h-3 text-cyan-500" />
            <span>{inv?.locationCode || 'WH-BLR-01'}</span>
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Stock Actions',
      className: 'text-right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openRestockModal(p)}
            className="h-7 text-xs font-mono gap-1 text-cyan-300"
          >
            <Plus className="w-3 h-3" />
            <span>Restock</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Warehouse & Inventory' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
              WAREHOUSE STOCK & INVENTORY RESERVES
            </h1>
            <Badge variant="tech">REAL-TIME SYNC</Badge>
          </div>
          <p className="text-xs text-cyber-400 mt-1">
            Atomically locks units during checkout. Released upon cancellation and committed on payment confirmation.
          </p>
        </div>
      </div>

      <AdminDataTable
        data={products}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Filter inventory by SKU, component, or warehouse..."
        searchFilter={(p, q) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
        }
        facetFilters={[
          {
            key: 'category',
            label: 'Category',
            options: [
              { label: 'CPUs', value: 'CPU' },
              { label: 'GPUs', value: 'GPU' },
              { label: 'Motherboards', value: 'MOTHERBOARD' },
              { label: 'Memory', value: 'RAM' },
              { label: 'Storage', value: 'STORAGE' },
              { label: 'PSU', value: 'PSU' },
            ],
          },
        ]}
      />

      {/* Restock Modal */}
      <Modal
        open={Boolean(restockItem)}
        onClose={() => setRestockItem(null)}
        title="Restock Hardware Component"
        className="max-w-md bg-[#0c101d] border-cyber-800"
      >
        {restockItem && (
          <div className="space-y-4 pt-2 font-mono text-xs">
            <div className="p-3 bg-cyber-900/60 rounded border border-cyber-800">
              <div className="font-bold text-white line-clamp-1">{restockItem.name}</div>
              <div className="text-[10px] text-cyber-400 mt-0.5">SKU: {restockItem.sku}</div>
            </div>

            <div>
              <Label className="text-xs text-cyber-300">Units to Add to Current Stock</Label>
              <Input
                type="number"
                value={addQty}
                onChange={(e) => setAddQty(Number(e.target.value))}
                className="mt-1 h-8 text-xs font-bold text-emerald-400"
              />
              <div className="flex gap-2 mt-2">
                {[5, 10, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAddQty(preset)}
                    className="px-2 py-0.5 rounded bg-cyber-800 hover:bg-cyber-700 text-[10px] text-cyber-300"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-cyber-300">Low Stock Alert Threshold</Label>
              <Input
                type="number"
                value={newThreshold}
                onChange={(e) => setNewThreshold(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-cyber-800">
              <Button variant="ghost" size="sm" onClick={() => setRestockItem(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="gaming"
                size="sm"
                onClick={() => {
                  const inv = restockItem.inventory?.[0] || restockItem.inventory;
                  const currentQty = inv?.quantity ?? 10;
                  const invId = inv?.id || 'inv-default';
                  updateInventoryMutation.mutate({
                    invId,
                    quantity: currentQty + addQty,
                    lowStockThreshold: newThreshold,
                  });
                }}
                disabled={updateInventoryMutation.isPending}
                className="text-xs"
              >
                {updateInventoryMutation.isPending ? 'Updating...' : 'Commit Stock'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
