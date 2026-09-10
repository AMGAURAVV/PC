'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Eye,
  CheckCircle2,
  Truck,
  XCircle,
  Package,
  CreditCard,
  MapPin,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Button, Badge, Modal, Price } from '@pc-platform/ui';
import { getAdminOrders, updateAdminOrderStatus } from '../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';
import { StatusBadge } from '../../components/ui/status-badge';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();

  const [selectedOrder, setSelectedOrder] = React.useState<any | null>(null);
  const [cancelOrderTarget, setCancelOrderTarget] = React.useState<any | null>(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => getAdminOrders({ limit: 100 }),
  });

  const orders = ordersData?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAdminOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      if (selectedOrder) {
        setSelectedOrder(null);
      }
      setCancelOrderTarget(null);
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      key: 'orderNumber',
      header: 'Order Reference',
      sortable: true,
      cell: (o) => (
        <div>
          <div className="font-mono font-bold text-white">
            {o.orderNumber || o.id.slice(0, 10)}
          </div>
          <div className="text-[10px] font-mono text-cyber-500">
            {new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      cell: (o) => (
        <div className="font-mono text-xs">
          <div className="text-white font-medium">{o.user?.email || 'Valued Customer'}</div>
          <div className="text-[10px] text-cyber-500">
            {o.shippingAddress?.city || 'India'}
          </div>
        </div>
      ),
    },
    {
      key: 'itemsCount',
      header: 'Hardware Parts',
      cell: (o) => (
        <Badge variant="secondary" className="font-mono text-[10px]">
          {(o.items || []).length} items
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Total Locked (INR)',
      sortable: true,
      cell: (o) => (
        <div className="font-mono font-bold text-cyan-400">
          <Price amount={o.total} size="sm" />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Fulfillment Status',
      sortable: true,
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: 'actions',
      header: 'Fulfillment Actions',
      className: 'text-right',
      cell: (o) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedOrder(o)}
            className="h-7 text-xs font-mono gap-1 text-cyan-300"
          >
            <Eye className="w-3 h-3" />
            <span>Manage</span>
          </Button>

          {o.status === 'PENDING' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCancelOrderTarget(o)}
              className="h-7 text-xs font-mono text-rose-400 hover:bg-rose-500/10"
              title="Cancel Order and Release Hold"
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Orders & Fulfillment' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
              CUSTOMER RIG ORDERS & FULFILLMENT
            </h1>
            <Badge variant="tech">AUTHORITATIVE PIPELINE</Badge>
          </div>
          <p className="text-xs text-cyber-400 mt-1">
            Status workflow transitions automatically trigger inventory commit, release, and shipping state machines.
          </p>
        </div>
      </div>

      <AdminDataTable
        data={orders}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Filter orders by number, customer email, or city..."
        searchFilter={(o, q) =>
          (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
          (o.user?.email && o.user.email.toLowerCase().includes(q)) ||
          (o.shippingAddress?.city && o.shippingAddress.city.toLowerCase().includes(q))
        }
        facetFilters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Pending', value: 'PENDING' },
              { label: 'Confirmed', value: 'CONFIRMED' },
              { label: 'Processing', value: 'PROCESSING' },
              { label: 'Shipped', value: 'SHIPPED' },
              { label: 'Delivered', value: 'DELIVERED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ],
          },
        ]}
      />

      {/* Manage Order Modal */}
      <Modal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details: ${selectedOrder?.orderNumber || selectedOrder?.id}`}
        className="max-w-2xl bg-[#0c101d] border-cyber-800"
      >
        {selectedOrder && (
          <div className="space-y-6 pt-2 font-mono text-xs">
            {/* Status Transition Bar */}
            <div className="p-3 bg-cyber-900/60 rounded-lg border border-cyber-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-cyber-400 uppercase">Current Order Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyber-400">Advance Workflow:</span>
                {selectedOrder.status === 'PENDING' && (
                  <Button
                    variant="gaming"
                    size="sm"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedOrder.id, status: 'CONFIRMED' })
                    }
                    className="text-xs h-7 gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Confirm & Commit Stock</span>
                  </Button>
                )}
                {selectedOrder.status === 'CONFIRMED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedOrder.id, status: 'PROCESSING' })
                    }
                    className="text-xs h-7 gap-1"
                  >
                    <Package className="w-3 h-3" />
                    <span>Send to Assembly</span>
                  </Button>
                )}
                {selectedOrder.status === 'PROCESSING' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedOrder.id, status: 'SHIPPED' })
                    }
                    className="text-xs h-7 gap-1"
                  >
                    <Truck className="w-3 h-3" />
                    <span>Mark Shipped</span>
                  </Button>
                )}
                {selectedOrder.status === 'SHIPPED' && (
                  <Button
                    variant="gaming"
                    size="sm"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedOrder.id, status: 'DELIVERED' })
                    }
                    className="text-xs h-7 gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Mark Delivered</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Line Items Snapshot */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase mb-2">
                Immutable Line Items Snapshot
              </h4>
              <div className="border border-cyber-800 rounded-lg overflow-hidden divide-y divide-cyber-800/60 bg-[#070b13]">
                {(selectedOrder.items || []).map((item: any) => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-white">{item.productName}</div>
                      <div className="text-[10px] text-cyber-500">
                        SKU: {item.sku || 'N/A'} • Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <Price amount={item.unitPrice} size="sm" />
                      <div className="text-[10px] text-cyber-500">
                        Total: ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="p-3 bg-cyber-900/60 rounded-lg border border-cyber-800 space-y-1.5">
              <div className="flex justify-between text-cyber-400">
                <span>Subtotal:</span>
                <span>₹{(selectedOrder.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount Applied:</span>
                  <span>-₹{selectedOrder.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-cyber-400">
                <span>Shipping:</span>
                <span>₹{(selectedOrder.shippingCost || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-cyber-800">
                <span>Grand Total:</span>
                <span className="text-cyan-400">₹{(selectedOrder.total || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Order Confirmation */}
      <ConfirmDialog
        open={Boolean(cancelOrderTarget)}
        onClose={() => setCancelOrderTarget(null)}
        onConfirm={() => {
          if (cancelOrderTarget) {
            updateStatusMutation.mutate({ id: cancelOrderTarget.id, status: 'CANCELLED' });
          }
        }}
        title="Cancel Customer Order?"
        description={`Are you sure you want to cancel order ${cancelOrderTarget?.orderNumber}? This will immediately release all held inventory back to the active catalog.`}
        confirmText="Cancel Order & Release Stock"
        confirmationWord="CANCEL"
        isDestructive={true}
      />
    </div>
  );
}
