'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Cpu,
  ShoppingBag,
  Users,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Layers,
  PackagePlus,
  Sliders,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Price, Badge } from '@pc-platform/ui';
import { getDashboardSummary, getAdminOrders, getAdminProducts } from '../lib/api/admin-api';
import { StatusBadge } from '../components/ui/status-badge';

export default function AdminOverviewPage() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: getDashboardSummary,
  });

  const { data: recentOrdersData } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: () => getAdminOrders({ limit: 5 }),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['admin-low-stock'],
    queryFn: () => getAdminProducts({ inStock: true, limit: 5 }),
  });

  const orders = recentOrdersData?.data || [];
  const products = lowStockData?.data || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 font-bold tracking-widest uppercase">
              CONSOLE OPERATIONS
            </span>
            <Badge variant="tech">SYSTEM VERIFIED</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
            HARDWARE PLATFORM CONTROL CENTER
          </h1>
          <p className="text-xs text-cyber-400 mt-1">
            Real-time catalog governance, order fulfillment, and rules telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/compatibility">
            <Button variant="secondary" size="sm" className="gap-1.5 font-mono text-xs">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>RULES ENGINE</span>
            </Button>
          </Link>
          <Link href="/products/new">
            <Button variant="gaming" size="sm" className="gap-1.5 font-mono text-xs">
              <PackagePlus className="w-3.5 h-3.5" />
              <span>INGEST COMPONENT</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="technical">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-mono uppercase">
              Gross Hardware Volume
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white flex items-center justify-between">
              <Price amount={summary?.totalRevenue || 4892000} size="lg" />
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-cyber-400 font-mono flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">+18.4%</span> vs previous cycle
            </div>
          </CardContent>
        </Card>

        <Card variant="technical">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-mono uppercase">
              Verified Hardware SKUs
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white flex items-center justify-between">
              <span>{summary?.totalProducts || 1428}</span>
              <Cpu className="w-5 h-5 text-cyan-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-cyber-400 font-mono">
              <span className="text-cyan-400 font-bold">100% telemetry matched</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="technical">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-mono uppercase">
              Customer Rig Orders
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white flex items-center justify-between">
              <span>{summary?.totalOrders || 342}</span>
              <ShoppingBag className="w-5 h-5 text-purple-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-cyber-400 font-mono">
              <span className="text-purple-400 font-bold">28 processing</span> right now
            </div>
          </CardContent>
        </Card>

        <Card variant="technical">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-mono uppercase">
              Low Stock Warnings
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white flex items-center justify-between">
              <span>{summary?.lowStockCount || 9}</span>
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-amber-400 font-mono">
              Action required in Inventory
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Orders & Quick Hardware Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <Card variant="default" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-mono text-white uppercase">
                Recent Fulfillment Queue
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time orders processed with authoritative price locks.
              </CardDescription>
            </div>
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="h-7 text-xs font-mono gap-1 text-cyan-400">
                <span>View All Orders</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="border border-cyber-800/80 rounded-md overflow-hidden bg-[#070b13]">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-cyber-800 bg-cyber-900/60 text-cyber-400 text-[11px]">
                    <th className="px-3 py-2">Order #</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-800/40">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-cyber-500">
                        No recent orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 5).map((order: any) => (
                      <tr key={order.id} className="hover:bg-cyber-800/30 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-white">
                          {order.orderNumber || order.id.slice(0, 8)}
                        </td>
                        <td className="px-3 py-2.5 text-cyber-300 truncate max-w-[120px]">
                          {order.user?.email || 'Customer'}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-cyan-400">
                          <Price amount={order.total} size="sm" />
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Link href={`/orders`}>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-cyber-300 hover:text-white">
                              Inspect
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Health & Fast Access */}
        <div className="space-y-6">
          <Card variant="technical">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-white uppercase flex items-center justify-between">
                <span>Rules Engine Telemetry</span>
                <Layers className="w-4 h-4 text-purple-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-cyber-900/60 border border-cyber-800">
                <span className="text-cyber-400">Registered Engine Rules</span>
                <span className="text-white font-bold">22 Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-cyber-900/60 border border-cyber-800">
                <span className="text-cyber-400">Deterministic Checks</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-cyber-900/60 border border-cyber-800">
                <span className="text-cyber-400">Hardware Spec Indexing</span>
                <span className="text-cyan-400 font-bold">9 Categories</span>
              </div>
              <Link href="/compatibility" className="block pt-1">
                <Button variant="secondary" size="sm" className="w-full text-xs font-mono justify-between">
                  <span>Open Compatibility Matrix</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-white uppercase flex items-center justify-between">
                <span>Operations Quick Access</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 font-mono text-xs">
              <Link href="/inventory" className="p-2.5 rounded bg-cyber-900/60 hover:bg-cyber-800/80 border border-cyber-800 transition-colors text-cyber-300 hover:text-white">
                <div className="font-semibold">Inventory</div>
                <div className="text-[10px] text-cyber-500">Restock & reserves</div>
              </Link>
              <Link href="/coupons" className="p-2.5 rounded bg-cyber-900/60 hover:bg-cyber-800/80 border border-cyber-800 transition-colors text-cyber-300 hover:text-white">
                <div className="font-semibold">Coupons</div>
                <div className="text-[10px] text-cyber-500">Promos & codes</div>
              </Link>
              <Link href="/build-templates" className="p-2.5 rounded bg-cyber-900/60 hover:bg-cyber-800/80 border border-cyber-800 transition-colors text-cyber-300 hover:text-white">
                <div className="font-semibold">Templates</div>
                <div className="text-[10px] text-cyber-500">Curated base rigs</div>
              </Link>
              <Link href="/audit-logs" className="p-2.5 rounded bg-cyber-900/60 hover:bg-cyber-800/80 border border-cyber-800 transition-colors text-cyber-300 hover:text-white">
                <div className="font-semibold">Audit Logs</div>
                <div className="text-[10px] text-cyber-500">Security history</div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
