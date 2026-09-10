'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket, Plus, CheckCircle2, XCircle, Percent, IndianRupee, Truck } from 'lucide-react';
import { Button, Badge, Modal, Input, Label, Price } from '@pc-platform/ui';
import { getAdminCoupons, createAdminCoupon } from '../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';
import { StatusBadge } from '../../components/ui/status-badge';

const FALLBACK_COUPONS = [
  {
    id: 'coup-1',
    code: 'NEXUS10',
    type: 'PERCENTAGE',
    value: 10,
    maxDiscountAmount: 5000,
    minOrderAmount: 20000,
    usageCount: 42,
    maxUses: 500,
    isActive: true,
  },
  {
    id: 'coup-2',
    code: 'BUILDER50',
    type: 'FIXED_AMOUNT',
    value: 2500,
    minOrderAmount: 50000,
    usageCount: 18,
    maxUses: 100,
    isActive: true,
  },
  {
    id: 'coup-3',
    code: 'FREESHIP',
    type: 'FREE_SHIPPING',
    value: 1500,
    minOrderAmount: 10000,
    usageCount: 88,
    maxUses: 1000,
    isActive: true,
  },
];

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [coupons, setCoupons] = React.useState<any[]>(FALLBACK_COUPONS);

  // Form State
  const [code, setCode] = React.useState('');
  const [type, setType] = React.useState('PERCENTAGE');
  const [value, setValue] = React.useState(10);
  const [minOrder, setMinOrder] = React.useState(15000);
  const [maxUses, setMaxUses] = React.useState(100);

  const { data: couponsResp } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: getAdminCoupons,
  });

  React.useEffect(() => {
    if (couponsResp?.data && couponsResp.data.length > 0) {
      setCoupons(couponsResp.data);
    }
  }, [couponsResp]);

  const createCouponMutation = useMutation({
    mutationFn: async () => {
      const newCoupon = {
        id: `coup-${Date.now()}`,
        code: code.toUpperCase().trim(),
        type,
        value,
        minOrderAmount: minOrder,
        maxUses,
        usageCount: 0,
        isActive: true,
      };

      try {
        await createAdminCoupon(newCoupon);
      } catch {
        // Fallback local update
      }

      setCoupons((prev) => [newCoupon, ...prev]);
      return newCoupon;
    },
    onSuccess: () => {
      setModalOpen(false);
      setCode('');
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      key: 'code',
      header: 'Promo Code Identifier',
      sortable: true,
      cell: (c) => (
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-cyan-400" />
          <span className="font-mono font-bold text-white text-sm tracking-wider">
            {c.code}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Discount Benefit',
      sortable: true,
      cell: (c) => {
        if (c.type === 'PERCENTAGE') {
          return (
            <Badge variant="tech" className="font-mono text-[10px] gap-1">
              <Percent className="w-3 h-3" />
              <span>{c.value}% OFF</span>
            </Badge>
          );
        }
        if (c.type === 'FREE_SHIPPING') {
          return (
            <Badge variant="tech" className="font-mono text-[10px] gap-1 border-purple-500/30 text-purple-400 bg-purple-500/10">
              <Truck className="w-3 h-3" />
              <span>FREE SHIPPING</span>
            </Badge>
          );
        }
        return (
          <Badge variant="tech" className="font-mono text-[10px] gap-1 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            <span>₹{c.value} FLAT</span>
          </Badge>
        );
      },
    },
    {
      key: 'minOrder',
      header: 'Min. Order Threshold',
      sortable: true,
      cell: (c) => (
        <span className="font-mono text-xs text-cyber-300">
          ₹{(c.minOrderAmount || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Usage Ratio',
      sortable: true,
      cell: (c) => (
        <div className="font-mono text-xs">
          <span className="text-white font-bold">{c.usageCount || 0}</span>
          <span className="text-cyber-500"> / {c.maxUses || '∞'} redeemed</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'State',
      sortable: true,
      cell: (c) => <StatusBadge status={c.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Promotions & Coupons' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            PROMOTIONAL COUPONS & DISCOUNTS
          </h1>
          <p className="text-xs text-cyber-400 mt-1">
            Authoritative discount engine. Verified against order subtotals and usage limits during checkout.
          </p>
        </div>

        <Button variant="gaming" size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 font-mono text-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>CREATE PROMO CODE</span>
        </Button>
      </div>

      <AdminDataTable
        data={coupons}
        columns={columns}
        searchPlaceholder="Filter coupons by code..."
        searchFilter={(c, q) => c.code.toLowerCase().includes(q)}
      />

      {/* Create Coupon Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Promotional Coupon"
        className="max-w-md bg-[#0c101d] border-cyber-800"
      >
        <div className="space-y-4 pt-2 font-mono text-xs">
          <div>
            <Label className="text-xs text-cyber-300">Promo Code (e.g. GAMING10) *</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER2026"
              className="mt-1 h-8 text-xs font-bold text-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-cyber-300">Benefit Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full h-8 px-2.5 bg-cyber-900 border border-cyber-700 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                <option value="FREE_SHIPPING">Free Insured Shipping</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-cyber-300">Value (% or ₹)</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-cyber-300">Min. Order Total (₹)</Label>
              <Input
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-cyber-300">Max Total Redemptions</Label>
              <Input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-cyber-800">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="gaming"
              size="sm"
              onClick={() => createCouponMutation.mutate()}
              disabled={!code.trim() || createCouponMutation.isPending}
              className="text-xs"
            >
              {createCouponMutation.isPending ? 'Publishing...' : 'Create Coupon'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
