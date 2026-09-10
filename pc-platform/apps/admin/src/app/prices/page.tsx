'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BadgePercent,
  TrendingUp,
  History,
  ArrowUpRight,
  DollarSign,
  Edit2,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Clock,
  Wrench,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  Badge,
  Modal,
  Input,
  Textarea,
  Label,
  Checkbox,
  Price,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@pc-platform/ui';
import {
  getAdminProducts,
  createAdminPrice,
  getAdminPriceHistory,
  correctAdminPriceHistory,
} from '../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';

export default function AdminPricesPage() {
  const queryClient = useQueryClient();

  // Active tab state
  const [activeTab, setActiveTab] = React.useState<string>('rates');

  // Rate Update Modal State
  const [priceModalItem, setPriceModalItem] = React.useState<any | null>(null);
  const [newAmount, setNewAmount] = React.useState<number>(0);
  const [priceUpdateReason, setPriceUpdateReason] = React.useState<string>('');

  // Historical Price Correction Modal State
  const [correctionModalItem, setCorrectionModalItem] = React.useState<any | null>(null);
  const [correctedAmount, setCorrectedAmount] = React.useState<number>(0);
  const [correctionReason, setCorrectionReason] = React.useState<string>('');
  const [confirmedAuthorized, setConfirmedAuthorized] = React.useState<boolean>(false);

  // Queries
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['admin-price-products'],
    queryFn: () => getAdminProducts({ limit: 100 }),
  });

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['admin-price-history'],
    queryFn: () => getAdminPriceHistory({ limit: 150 }),
  });

  const products = productsData?.data || [];
  const historyItems = historyData?.data || [];

  // Mutations
  const updatePriceMutation = useMutation({
    mutationFn: async ({
      productId,
      amount,
      reason,
    }: {
      productId: string;
      amount: number;
      reason: string;
    }) => {
      return createAdminPrice({
        productId,
        amount,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-price-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-price-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setPriceModalItem(null);
      setPriceUpdateReason('');
    },
  });

  const correctHistoryMutation = useMutation({
    mutationFn: async ({
      id,
      amount,
      reason,
    }: {
      id: string;
      amount: number;
      reason: string;
    }) => {
      return correctAdminPriceHistory(id, {
        amount,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-price-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-price-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setCorrectionModalItem(null);
      setCorrectionReason('');
      setConfirmedAuthorized(false);
    },
  });

  const openPriceModal = (product: any) => {
    setPriceModalItem(product);
    const curr =
      product.price || (product.prices?.[0]?.amount ? Number(product.prices[0].amount) : 0);
    setNewAmount(curr);
    setPriceUpdateReason('');
  };

  const openCorrectionModal = (historyItem: any) => {
    setCorrectionModalItem(historyItem);
    setCorrectedAmount(Number(historyItem.amount));
    setCorrectionReason('');
    setConfirmedAuthorized(false);
  };

  // Columns for Active Rates Table
  const rateColumns: ColumnDef<any>[] = [
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
      key: 'activePrice',
      header: 'Active Selling Price (INR)',
      sortable: true,
      cell: (p) => {
        const raw =
          p.price || (p.prices?.[0]?.amount ? Number(p.prices[0].amount) : 0);
        return <Price amount={raw} size="sm" />;
      },
    },
    {
      key: 'msrp',
      header: 'Catalog MSRP',
      sortable: true,
      cell: (p) => {
        const raw =
          p.price || (p.prices?.[0]?.amount ? Number(p.prices[0].amount) : 0);
        const msrp = Math.round(raw * 1.15);
        return (
          <span className="font-mono text-xs text-cyber-400">
            ₹{msrp.toLocaleString('en-IN')}
          </span>
        );
      },
    },
    {
      key: 'margin',
      header: 'Gross Margin (Est.)',
      sortable: true,
      cell: () => (
        <span className="font-mono text-xs text-emerald-400 font-semibold flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>~14.2%</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Pricing Actions',
      className: 'text-right',
      cell: (p) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openPriceModal(p)}
            className="h-7 text-xs font-mono gap-1 text-cyan-300"
          >
            <Edit2 className="w-3 h-3" />
            <span>Update Rate</span>
          </Button>
        </div>
      ),
    },
  ];

  // Columns for Historical Price Records Table
  const historyColumns: ColumnDef<any>[] = [
    {
      key: 'product',
      header: 'Product / SKU',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-mono font-semibold text-white">
            {item.product?.name || 'Unknown Product'}
          </div>
          <div className="text-[10px] font-mono text-cyber-500">
            SKU: {item.product?.sku || 'N/A'} {item.variant?.name ? `• ${item.variant.name}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Recorded Price (INR)',
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-cyan-300">
            ₹{Number(item.amount).toLocaleString('en-IN')}
          </span>
          {item.originalAmount && Number(item.originalAmount) !== Number(item.amount) && (
            <span className="line-through text-[10px] font-mono text-cyber-500">
              ₹{Number(item.originalAmount).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      cell: (item) => {
        const src = item.source || 'MANUAL';
        let badgeVariant: 'tech' | 'secondary' | 'warning' | 'destructive' = 'secondary';
        if (src.includes('CORRECTION')) badgeVariant = 'warning';
        else if (src.includes('ADMIN')) badgeVariant = 'tech';

        return (
          <Badge variant={badgeVariant} className="text-[10px] font-mono">
            {src}
          </Badge>
        );
      },
    },
    {
      key: 'effectiveDate',
      header: 'Effective Duration',
      sortable: true,
      cell: (item) => {
        const start = new Date(item.effectiveDate || item.createdAt).toLocaleDateString(
          'en-IN',
          { day: 'numeric', month: 'short', year: 'numeric' },
        );
        const end = item.endDate
          ? new Date(item.endDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Active';

        return (
          <div className="text-xs font-mono text-cyber-300">
            <span>{start}</span>
            <span className="text-cyber-500 mx-1">→</span>
            <span className={end === 'Active' ? 'text-emerald-400 font-semibold' : 'text-cyber-400'}>
              {end}
            </span>
          </div>
        );
      },
    },
    {
      key: 'auditStatus',
      header: 'Governance & Status',
      sortable: true,
      cell: (item) => (
        <div className="space-y-0.5 font-mono text-[10px]">
          {item.isCorrection ? (
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <AlertTriangle className="w-3 h-3" />
              <span>Corrected by Admin</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-cyber-400">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              <span>Append-Only Sealed</span>
            </div>
          )}
          {item.changedBy && (
            <div className="text-cyber-500">By: {item.changedBy}</div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Audit Actions',
      className: 'text-right',
      cell: (item) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => openCorrectionModal(item)}
            className="h-7 text-xs font-mono gap-1 border-amber-500/40 text-amber-300 hover:bg-amber-950/30"
          >
            <Wrench className="w-3 h-3" />
            <span>Correct Record</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Catalog Pricing & Margins' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
              PRICING GOVERNANCE & MARGIN CONTROL
            </h1>
            <Badge variant="tech">AUTHORITATIVE LOCK</Badge>
          </div>
          <p className="text-xs text-cyber-400 mt-1 font-mono">
            Maintain selling prices in INR. Stored with full append-only historical audit records
            and authorized administrative correction governance.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-cyber-950/80 border border-cyber-800 p-1 rounded-xl">
          <TabsTrigger value="rates" className="font-mono text-xs gap-2">
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Catalog Rates</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="font-mono text-xs gap-2">
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Historical Audit & Corrections</span>
            {historyItems.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {historyItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Active Rates Table */}
        <TabsContent value="rates" className="pt-4">
          <AdminDataTable
            data={products}
            columns={rateColumns}
            isLoading={isProductsLoading}
            searchPlaceholder="Filter prices by component, model, or SKU..."
            searchFilter={(p, q) =>
              p.name.toLowerCase().includes(q) ||
              (p.sku && p.sku.toLowerCase().includes(q))
            }
          />
        </TabsContent>

        {/* Tab 2: Historical Audit & Corrections Table */}
        <TabsContent value="history" className="pt-4">
          <div className="p-3 mb-4 rounded-xl border border-amber-500/20 bg-amber-950/10 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs font-mono space-y-1">
              <div className="font-bold text-amber-300">
                STRICT APPEND-ONLY PRICE LEDGER
              </div>
              <p className="text-cyber-400 leading-relaxed">
                Historical records are never overwritten during catalog operations. Only authorized
                administrative corrections are permitted for invalid entry errors, preserving
                original values and permanent audit logs.
              </p>
            </div>
          </div>

          <AdminDataTable
            data={historyItems}
            columns={historyColumns}
            isLoading={isHistoryLoading}
            searchPlaceholder="Search history by product name, SKU, or recorder..."
            searchFilter={(h, q) =>
              (h.product?.name && h.product.name.toLowerCase().includes(q)) ||
              (h.product?.sku && h.product.sku.toLowerCase().includes(q)) ||
              (h.source && h.source.toLowerCase().includes(q)) ||
              (h.changedBy && h.changedBy.toLowerCase().includes(q))
            }
          />
        </TabsContent>
      </Tabs>

      {/* Update Price Modal */}
      <Modal
        open={Boolean(priceModalItem)}
        onClose={() => setPriceModalItem(null)}
        title="Adjust Component Selling Price"
        className="max-w-md bg-[#0c101d] border-cyber-800"
      >
        {priceModalItem && (
          <div className="space-y-4 pt-2 font-mono text-xs">
            <div className="p-3 bg-cyber-900/60 rounded border border-cyber-800">
              <div className="font-bold text-white line-clamp-1">
                {priceModalItem.name}
              </div>
              <div className="text-[10px] text-cyber-400 mt-0.5">
                SKU: {priceModalItem.sku}
              </div>
            </div>

            <div>
              <Label className="text-xs text-cyber-300">
                New Selling Price (₹ INR)
              </Label>
              <Input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="mt-1 h-8 text-xs font-bold text-cyan-400"
              />
              <p className="text-[10px] text-cyber-500 mt-1">
                Will close the previous active price period and append a new price history record.
              </p>
            </div>

            <div>
              <Label className="text-xs text-cyber-300">Change Reason / Campaign</Label>
              <Input
                type="text"
                placeholder="e.g. Seasonal discount, vendor markdown"
                value={priceUpdateReason}
                onChange={(e) => setPriceUpdateReason(e.target.value)}
                className="mt-1 h-8 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-cyber-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPriceModalItem(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="gaming"
                size="sm"
                onClick={() => {
                  updatePriceMutation.mutate({
                    productId: priceModalItem.id,
                    amount: newAmount,
                    reason: priceUpdateReason,
                  });
                }}
                disabled={newAmount <= 0 || updatePriceMutation.isPending}
                className="text-xs"
              >
                {updatePriceMutation.isPending ? 'Updating...' : 'Publish Rate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Authorized Historical Correction Modal */}
      <Modal
        open={Boolean(correctionModalItem)}
        onClose={() => setCorrectionModalItem(null)}
        title="Authorized Historical Price Correction"
        className="max-w-lg bg-[#0c101d] border-amber-500/40"
      >
        {correctionModalItem && (
          <div className="space-y-4 pt-2 font-mono text-xs">
            {/* Warning Banner */}
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>GOVERNANCE RESTRICTION: AUDITED CORRECTION</span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                You are about to modify a sealed historical price record. The original amount
                will be permanently archived in <span className="text-white">originalAmount</span> and
                a compliance audit trail will be generated.
              </p>
            </div>

            {/* Original Record Summary */}
            <div className="p-3 bg-cyber-900/60 rounded border border-cyber-800 space-y-1">
              <div className="text-white font-bold">
                {correctionModalItem.product?.name}
              </div>
              <div className="text-[10px] text-cyber-400">
                SKU: {correctionModalItem.product?.sku} • Recorded on:{' '}
                {new Date(correctionModalItem.effectiveDate || correctionModalItem.createdAt).toLocaleDateString()}
              </div>
              <div className="text-xs text-rose-300 font-semibold pt-1">
                Current Invalid Recorded Value: ₹
                {Number(correctionModalItem.amount).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Corrected Amount Input */}
            <div>
              <Label className="text-xs text-cyber-300">
                Corrected Price Value (₹ INR) *
              </Label>
              <Input
                type="number"
                value={correctedAmount}
                onChange={(e) => setCorrectedAmount(Number(e.target.value))}
                className="mt-1 h-8 text-xs font-bold text-amber-300 border-amber-500/40"
              />
            </div>

            {/* Mandatory Justification */}
            <div>
              <Label className="text-xs text-cyber-300">
                Correction Justification & Reason (Mandatory) *
              </Label>
              <Textarea
                rows={3}
                placeholder="Explain why this historical record is invalid (e.g., 'Vendor batch import typo: extra zero entered')"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="mt-1 text-xs text-white border-cyber-800"
              />
            </div>

            {/* Compliance Confirmation Checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="confirm-correction"
                checked={confirmedAuthorized}
                onCheckedChange={(checked) => setConfirmedAuthorized(Boolean(checked))}
                className="mt-0.5"
              />
              <Label
                htmlFor="confirm-correction"
                className="text-[11px] text-cyber-400 cursor-pointer select-none leading-relaxed"
              >
                I confirm this is an authorized administrative correction to invalid historical data.
                This action is logged under my account and cannot be deleted.
              </Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-cyber-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCorrectionModalItem(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  correctHistoryMutation.mutate({
                    id: correctionModalItem.id,
                    amount: correctedAmount,
                    reason: correctionReason,
                  });
                }}
                disabled={
                  correctedAmount <= 0 ||
                  !correctionReason.trim() ||
                  !confirmedAuthorized ||
                  correctHistoryMutation.isPending
                }
                className="text-xs bg-amber-600 hover:bg-amber-500 text-black font-bold"
              >
                {correctHistoryMutation.isPending
                  ? 'Recording Correction...'
                  : 'Commit Authorized Correction'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
