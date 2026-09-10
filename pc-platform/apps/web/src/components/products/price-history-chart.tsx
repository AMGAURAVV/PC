'use client';

import * as React from 'react';
import {
  TrendingDown,
  TrendingUp,
  History,
  Calendar,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Tag,
} from 'lucide-react';
import { Badge, Button, Price } from '@pc-platform/ui';
import type { PriceHistoryRecord, ProductPriceSummary } from '@pc-platform/types';

interface PriceHistoryChartProps {
  summary?: ProductPriceSummary | null | undefined;
  isLoading?: boolean | undefined;
  productName?: string | undefined;
}

type TimeRange = '30D' | '90D' | '180D' | '1Y' | 'ALL';

export function PriceHistoryChart({
  summary,
  isLoading = false,
  productName,
}: PriceHistoryChartProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>('ALL');
  const [hoveredPoint, setHoveredPoint] = React.useState<{
    x: number;
    y: number;
    item: PriceHistoryRecord;
  } | null>(null);

  const rawHistory = summary?.priceHistory || [];

  // Filter history according to selected time range
  const filteredHistory = React.useMemo(() => {
    if (!rawHistory.length) return [];

    // Sort ascending by effective date for charting
    const sorted = [...rawHistory].sort(
      (a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime(),
    );

    if (timeRange === 'ALL') return sorted;

    const now = Date.now();
    let cutoffDays = 30;
    if (timeRange === '90D') cutoffDays = 90;
    if (timeRange === '180D') cutoffDays = 180;
    if (timeRange === '1Y') cutoffDays = 365;

    const cutoffTime = now - cutoffDays * 24 * 60 * 60 * 1000;
    const filtered = sorted.filter(
      (item) => new Date(item.effectiveDate).getTime() >= cutoffTime,
    );

    // If filtered is empty or only 1 item, return at least the latest records for context
    return filtered.length > 0 ? filtered : sorted.slice(-3);
  }, [rawHistory, timeRange]);

  // Derived metrics
  const currentPrice = summary?.currentPrice || (filteredHistory[filteredHistory.length - 1]?.price ?? 0);
  const lowestPrice = summary?.lowestPrice || (filteredHistory.length ? Math.min(...filteredHistory.map((h) => h.price)) : 0);
  const highestPrice = summary?.highestPrice || (filteredHistory.length ? Math.max(...filteredHistory.map((h) => h.price)) : 0);
  const averagePrice = summary?.averagePrice || Math.round((currentPrice + lowestPrice + highestPrice) / 3);

  const isAtAllTimeLow = currentPrice > 0 && currentPrice <= lowestPrice;
  const discountFromPeak =
    highestPrice > currentPrice
      ? Math.round(((highestPrice - currentPrice) / highestPrice) * 100)
      : 0;

  // Chart coordinates calculation
  const width = 800;
  const height = 260;
  const padding = { top: 30, right: 40, bottom: 40, left: 70 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const chartData = React.useMemo(() => {
    if (filteredHistory.length === 0) return [];

    // If only 1 data point, synthesize a baseline from 30 days prior for visual continuity
    let points = filteredHistory;
    if (points.length === 1) {
      const single = points[0]!;
      const priorDate = new Date(new Date(single.effectiveDate).getTime() - 86400000 * 30).toISOString();
      points = [
        {
          ...single,
          id: 'synthetic-baseline',
          effectiveDate: priorDate,
        },
        single,
      ];
    }

    const minAmount = Math.floor(Math.min(...points.map((p) => p.price)) * 0.95);
    const maxAmount = Math.ceil(Math.max(...points.map((p) => p.price)) * 1.05) || 100;
    const amountRange = maxAmount - minAmount || 1;

    const minTime = new Date(points[0]!.effectiveDate).getTime();
    const maxTime = Math.max(
      new Date(points[points.length - 1]!.effectiveDate).getTime(),
      Date.now(),
    );
    const timeSpan = maxTime - minTime || 1;

    return points.map((item) => {
      const t = new Date(item.effectiveDate).getTime();
      const x = padding.left + ((t - minTime) / timeSpan) * chartW;
      const y = padding.top + chartH - ((item.price - minAmount) / amountRange) * chartH;
      return { x, y, item, minAmount, maxAmount };
    });
  }, [filteredHistory, chartW, chartH]);

  // Generate SVG path strings
  const { linePath, areaPath } = React.useMemo(() => {
    if (chartData.length === 0) return { linePath: '', areaPath: '' };

    let lPath = `M ${chartData[0]!.x} ${chartData[0]!.y}`;
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1]!;
      const curr = chartData[i]!;
      // Step line to represent discrete price levels
      lPath += ` L ${curr.x} ${prev.y} L ${curr.x} ${curr.y}`;
    }

    const first = chartData[0]!;
    const last = chartData[chartData.length - 1]!;
    const baselineY = padding.top + chartH;

    const aPath = `${lPath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;

    return { linePath: lPath, areaPath: aPath };
  }, [chartData, padding.top, chartH]);

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-cyber-800 bg-cyber-950/60 space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-cyber-900 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-20 bg-cyber-900 rounded-xl" />
          <div className="h-20 bg-cyber-900 rounded-xl" />
          <div className="h-20 bg-cyber-900 rounded-xl" />
        </div>
        <div className="h-64 bg-cyber-900/60 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyber-950/90 to-[#070a14] space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-mono font-bold text-white tracking-wide">
              HISTORICAL PRICE TRACKER & TELEMETRY
            </h3>
            {isAtAllTimeLow && (
              <Badge variant="success" className="text-[10px] font-mono px-2 py-0.5">
                ALL-TIME LOW
              </Badge>
            )}
          </div>
          <p className="text-xs text-cyber-400 font-mono">
            Authoritative append-only price records. Evaluated daily across vendor channels.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-cyber-900/80 p-1 rounded-lg border border-cyber-800">
          {(['30D', '90D', '180D', '1Y', 'ALL'] as TimeRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                timeRange === range
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-cyber-400 hover:text-white hover:bg-cyber-800/50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl border border-cyber-800 bg-cyber-900/40 space-y-1">
          <div className="text-[11px] font-mono text-cyber-400 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span>Current Active Rate</span>
          </div>
          <div className="text-lg sm:text-xl font-mono font-bold text-white">
            <Price amount={currentPrice} size="lg" />
          </div>
          <div className="text-[10px] font-mono text-cyber-500">
            {isAtAllTimeLow ? 'Best price ever recorded' : 'Live catalog selling rate'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-1">
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Historical Lowest</span>
          </div>
          <div className="text-lg sm:text-xl font-mono font-bold text-emerald-300">
            <Price amount={lowestPrice} size="lg" />
          </div>
          <div className="text-[10px] font-mono text-emerald-400/80">
            {discountFromPeak > 0 ? `-${discountFromPeak}% below peak` : 'Benchmark floor'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-1">
          <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Historical Highest</span>
          </div>
          <div className="text-lg sm:text-xl font-mono font-bold text-rose-300">
            <Price amount={highestPrice} size="lg" />
          </div>
          <div className="text-[10px] font-mono text-rose-400/80">
            Peak historical launch / supply rate
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/10 space-y-1">
          <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pricing Advisory</span>
          </div>
          <div className="text-sm font-mono font-bold text-cyan-300 pt-1">
            {isAtAllTimeLow
              ? 'OPTIMAL BUY TIME'
              : currentPrice <= averagePrice
                ? 'FAIR VALUE TIER'
                : 'PREMIUM DEMAND'}
          </div>
          <div className="text-[10px] font-mono text-cyan-400/80">
            Avg: ₹{averagePrice.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative border border-cyber-800/80 rounded-xl bg-[#090d18] p-3 overflow-hidden">
        {chartData.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto min-w-[550px] overflow-visible select-none"
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Price Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding.top + chartH * (1 - ratio);
                const min = chartData[0]?.minAmount || 0;
                const max = chartData[0]?.maxAmount || 100;
                const val = Math.round(min + ratio * (max - min));
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      fill="#64748b"
                      className="text-[10px] font-mono"
                    >
                      ₹{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {areaPath && <path d={areaPath} fill="url(#priceGradient)" />}

              {/* Price Step Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points */}
              {chartData.map((pt, idx) => {
                const isLowest = pt.item.price === lowestPrice;
                const isHighest = pt.item.price === highestPrice;
                const isHovered = hoveredPoint?.item.id === pt.item.id;

                let strokeColor = '#06b6d4';
                let fillColor = '#0e1726';
                if (isLowest) {
                  strokeColor = '#10b981';
                  fillColor = '#064e3b';
                } else if (isHighest) {
                  strokeColor = '#f43f5e';
                  fillColor = '#881337';
                }

                return (
                  <g
                    key={pt.item.id || idx}
                    className="cursor-pointer transition-transform"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Ring for lowest or highest */}
                    {(isLowest || isHighest || isHovered) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 9 : 7}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        opacity={isHovered ? 0.8 : 0.4}
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : 4}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth="2"
                    />
                  </g>
                );
              })}

              {/* Hover Indicator Vertical Line */}
              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1={padding.top}
                  x2={hoveredPoint.x}
                  y2={padding.top + chartH}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}
            </svg>
          </div>
        ) : (
          <div className="py-12 text-center text-cyber-500 font-mono text-xs">
            No historical price change data recorded yet for this component.
          </div>
        )}

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute z-10 pointer-events-none p-2.5 rounded-lg border border-cyan-500/40 bg-cyber-950/95 shadow-xl backdrop-blur font-mono text-xs text-white"
            style={{
              left: Math.min(Math.max(10, hoveredPoint.x - 70), width - 180),
              top: Math.max(10, hoveredPoint.y - 85),
            }}
          >
            <div className="text-[10px] text-cyber-400">
              {new Date(hoveredPoint.item.effectiveDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            <div className="text-sm font-bold text-cyan-300 mt-0.5">
              ₹{hoveredPoint.item.price.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
              <span className="px-1.5 py-0.2 rounded bg-cyber-800 text-cyber-300">
                {hoveredPoint.item.source}
              </span>
              {hoveredPoint.item.isCorrection && (
                <span className="px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300">
                  CORRECTED
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chronological Event Timeline / Change Log */}
      {filteredHistory.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-mono font-bold text-cyber-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>RECORDED PRICE EVENTS & CHANGE LOG</span>
          </div>

          <div className="rounded-xl border border-cyber-800/80 bg-cyber-950/60 overflow-hidden">
            <table className="w-full text-left text-xs font-mono divide-y divide-cyber-800/60">
              <thead className="bg-cyber-900/60 text-cyber-400 text-[11px]">
                <tr>
                  <th className="p-3">Effective Date</th>
                  <th className="p-3">Price Rate</th>
                  <th className="p-3 hidden sm:table-cell">End Date</th>
                  <th className="p-3">Source & Context</th>
                  <th className="p-3 hidden md:table-cell">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-800/40">
                {filteredHistory
                  .slice()
                  .reverse()
                  .map((item, idx) => {
                    const isLowest = item.price === lowestPrice;
                    const isHighest = item.price === highestPrice;
                    return (
                      <tr key={item.id || idx} className="hover:bg-cyber-900/40 transition-colors">
                        <td className="p-3 text-white font-medium">
                          {new Date(item.effectiveDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-cyan-300">
                              ₹{item.price.toLocaleString('en-IN')}
                            </span>
                            {isLowest && (
                              <Badge variant="success" className="text-[9px] px-1.5 py-0">
                                LOWEST
                              </Badge>
                            )}
                            {isHighest && (
                              <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                                PEAK
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-cyber-400 hidden sm:table-cell">
                          {item.endDate
                            ? new Date(item.endDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Active (Now)'}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-semibold text-cyber-200">
                              {item.reason || item.source}
                            </span>
                            <span className="text-[10px] text-cyber-500">{item.source}</span>
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          {item.isCorrection ? (
                            <div className="flex items-center gap-1 text-amber-400 text-[10px]">
                              <AlertCircle className="w-3 h-3" />
                              <span>Admin Corrected</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-cyber-400 text-[10px]">
                              <ShieldCheck className="w-3 h-3 text-cyan-400" />
                              <span>Immutable</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
