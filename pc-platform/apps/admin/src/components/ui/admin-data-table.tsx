'use client';

import * as React from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Filter,
  X,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Button, Badge } from '@pc-platform/ui';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  cell: (item: T, index: number) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FacetFilter<T> {
  key: keyof T;
  label: string;
  options: FilterOption[];
}

import type { LucideIcon } from 'lucide-react';

export interface BulkAction<T> {
  label: string;
  icon?: LucideIcon;
  isDestructive?: boolean;
  onClick: (selected: T[]) => void;
}

interface AdminDataTableProps<T extends { id: string | number }> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  facetFilters?: FacetFilter<T>[];
  bulkActions?: BulkAction<T>[];
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  totalCount?: number;
}

export function AdminDataTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchFilter,
  facetFilters,
  bulkActions,
  pageSize = 10,
  emptyMessage = 'No records found matching criteria.',
  onRowClick,
  isLoading = false,
}: AdminDataTableProps<T>) {
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string | number>>(new Set());
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = React.useState(1);

  // 1. Filter by Search Query
  const filteredBySearch = React.useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();

    if (searchFilter) {
      return data.filter((item) => searchFilter(item, q));
    }

    // Default fallback: search all string / number fields
    return data.filter((item) =>
      Object.values(item).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(q),
      ),
    );
  }, [data, search, searchFilter]);

  // 2. Filter by Facet Dropdowns
  const filteredByFacets = React.useMemo(() => {
    let result = filteredBySearch;
    for (const [key, value] of Object.entries(activeFilters)) {
      if (value && value !== 'ALL') {
        result = result.filter((item) => String((item as any)[key]) === value);
      }
    }
    return result;
  }, [filteredBySearch, activeFilters]);

  // 3. Sorting
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredByFacets;

    return [...filteredByFacets].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredByFacets, sortKey, sortDirection]);

  // 4. Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handle Sort Toggle
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Row Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length && paginatedData.length > 0) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set<string | number>();
      paginatedData.forEach((item) => newSet.add(item.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelectOne = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectedItems = React.useMemo(() => {
    return data.filter((item) => selectedIds.has(item.id));
  }, [data, selectedIds]);

  return (
    <div className="space-y-4 font-sans">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cyber-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 pl-8 pr-7 bg-cyber-900/80 border border-cyber-800 rounded-md text-xs font-mono text-white placeholder-cyber-500 focus:outline-none focus:border-cyan-500/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-cyber-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Faceted Filters */}
          {facetFilters?.map((filter) => (
            <select
              key={String(filter.key)}
              value={activeFilters[String(filter.key)] || 'ALL'}
              onChange={(e) => {
                setActiveFilters({
                  ...activeFilters,
                  [String(filter.key)]: e.target.value,
                });
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 bg-cyber-900/80 border border-cyber-800 rounded-md text-xs font-mono text-cyber-300 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All {filter.label}s</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        {/* Count Telemetry */}
        <div className="text-[11px] font-mono text-cyber-400 flex items-center gap-2 self-end sm:self-auto">
          <span>
            Showing <strong className="text-white">{sortedData.length}</strong> records
          </span>
          {Object.values(activeFilters).some((v) => v !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilters({})}
              className="h-7 text-[10px] text-cyber-400 hover:text-white px-1.5"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Sticky Bulk Action Bar */}
      {bulkActions && selectedIds.size > 0 && (
        <div className="bg-cyan-950/60 border border-cyan-500/40 rounded-lg p-2.5 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-[11px]">
              {selectedIds.size}
            </span>
            <span>selected across catalog</span>
          </div>

          <div className="flex items-center gap-2">
            {bulkActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Button
                  key={idx}
                  variant={action.isDestructive ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => action.onClick(selectedItems)}
                  className="h-7 text-xs font-mono gap-1"
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{action.label}</span>
                </Button>
              );
            })}

            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] font-mono text-cyber-400 hover:text-white underline ml-2"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="border border-cyber-800/80 rounded-lg overflow-hidden bg-[#090d16]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-cyber-800/80 bg-cyber-900/50 text-cyber-400 font-mono text-[11px] uppercase tracking-wider">
                {bulkActions && (
                  <th className="w-10 px-3 py-2.5 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="text-cyber-400 hover:text-white transition-colors"
                      title="Select all on page"
                    >
                      {selectedIds.size > 0 && selectedIds.size === paginatedData.length ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`px-4 py-2.5 font-semibold ${
                      col.sortable
                        ? 'cursor-pointer select-none hover:text-cyan-400 transition-colors'
                        : ''
                    } ${col.className || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-cyber-500">
                          {sortKey === col.key ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-cyan-400" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 text-cyber-600" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-cyber-800/40">
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {bulkActions && <td className="px-3 py-3 w-10"><div className="w-4 h-4 bg-cyber-800 rounded mx-auto" /></td>}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-3.5 bg-cyber-800/60 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (bulkActions ? 1 : 0)}
                    className="px-4 py-12 text-center text-cyber-500 font-mono"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onRowClick?.(item)}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/30 text-white'
                          : 'hover:bg-cyber-800/30 text-cyber-300'
                      } ${onRowClick ? 'cursor-pointer' : ''}`}
                    >
                      {bulkActions && (
                        <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => toggleSelectOne(item.id, e)}
                            className="text-cyber-400 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Square className="w-4 h-4 text-cyber-600" />
                            )}
                          </button>
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                          {col.cell(item, index)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-cyber-800/80 bg-[#070b13] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-cyber-400">
          <div>
            Showing{' '}
            <span className="text-white">
              {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="text-white">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{' '}
            of <span className="text-white">{sortedData.length}</span> records
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 w-7 p-0"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            <span className="px-2 text-xs">
              Page <span className="text-white">{currentPage}</span> of{' '}
              <span className="text-white">{totalPages}</span>
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-7 w-7 p-0"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
