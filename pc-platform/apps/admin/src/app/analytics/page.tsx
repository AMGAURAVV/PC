'use client';

import * as React from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Users, ArrowUpRight, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Price, Badge } from '@pc-platform/ui';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';

const CATEGORY_SHARE = [
  { category: 'Graphics Cards (GPU)', share: 44, amount: 2152480, color: 'bg-cyan-500' },
  { category: 'CPU Processors', share: 22, amount: 1076240, color: 'bg-blue-500' },
  { category: 'Motherboards', share: 12, amount: 587040, color: 'bg-purple-500' },
  { category: 'RAM Memory', share: 9, amount: 440280, color: 'bg-emerald-500' },
  { category: 'Storage NVMe', share: 7, amount: 342440, color: 'bg-amber-500' },
  { category: 'Power Supplies', share: 6, amount: 293520, color: 'bg-rose-500' },
];

const TOP_PRODUCTS = [
  { name: 'NVIDIA GeForce RTX 4070 Super', sku: 'GPU-RTX-4070S', units: 48, revenue: 2880000 },
  { name: 'AMD Ryzen 7 7800X3D', sku: 'CPU-AMD-7800X3D', units: 42, revenue: 1680000 },
  { name: 'Intel Core i7-14700K', sku: 'CPU-INTEL-14700K', units: 36, revenue: 1260000 },
  { name: 'Corsair Vengeance RGB DDR5 32GB', sku: 'RAM-COR-DDR5-32', units: 58, revenue: 609000 },
  { name: 'Samsung 990 PRO 2TB NVMe Gen4', sku: 'SSD-SAM-990P-2T', units: 51, revenue: 841500 },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Platform Analytics & Business Intelligence' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            COMMERCE ANALYTICS & TELEMETRY
          </h1>
          <p className="text-xs text-cyber-400 mt-1">
            Real-time business performance, revenue composition by hardware category, and sales velocity.
          </p>
        </div>

        <Badge variant="tech" className="font-mono text-xs">
          30-DAY REPORTING CYCLE
        </Badge>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="technical">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-mono uppercase">
              Average Order Value (AOV)
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white flex items-center justify-between">
              <Price amount={114200} size="lg" />
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-cyber-400 font-mono">
              <span className="text-emerald-400 font-bold">+12.8%</span> rig bundle growth
            </div>
          </CardContent>
        </Card>

        <Card variant="technical">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-mono uppercase">
              Cart-to-Order Conversion
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white flex items-center justify-between">
              <span>3.82%</span>
              <ShoppingCart className="w-5 h-5 text-purple-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-cyber-400 font-mono">
              Industry benchmark: 2.1%
            </div>
          </CardContent>
        </Card>

        <Card variant="technical">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-mono uppercase">
              Compatibility Gate Rejections
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white flex items-center justify-between">
              <span>0.0%</span>
              <Cpu className="w-5 h-5 text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-emerald-400 font-mono">
              Zero invalid hardware dispatched
            </div>
          </CardContent>
        </Card>

        <Card variant="technical">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-mono uppercase">
              Repeat Rig Enthusiasts
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white flex items-center justify-between">
              <span>24.6%</span>
              <Users className="w-5 h-5 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-cyber-400 font-mono">
              Secondary component upgrades
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        {/* Category Revenue Distribution */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-sm text-white">REVENUE BY HARDWARE CATEGORY</CardTitle>
            <CardDescription className="text-xs">
              Relative contribution of each component category to gross platform GMV.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {CATEGORY_SHARE.map((item) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium">{item.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-cyber-400">₹{item.amount.toLocaleString('en-IN')}</span>
                    <span className="text-cyan-400 font-bold w-10 text-right">{item.share}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-cyber-900 overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${item.share}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Selling Hardware */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-sm text-white">TOP HARDWARE BY SALES VELOCITY</CardTitle>
            <CardDescription className="text-xs">
              Highest grossing SKUs in the current 30-day fulfillment cycle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-cyber-800/60">
              {TOP_PRODUCTS.map((prod, idx) => (
                <div key={prod.sku} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-bold text-cyber-500">#{idx + 1}</span>
                    <div>
                      <div className="font-bold text-white line-clamp-1">{prod.name}</div>
                      <div className="text-[10px] text-cyber-500">{prod.sku}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-cyan-400">
                      ₹{prod.revenue.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-cyber-400">{prod.units} units sold</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
