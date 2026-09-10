'use client';

import * as React from 'react';
import { Badge } from '@pc-platform/ui';

export type StatusType =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DRAFT'
  | 'ARCHIVED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'APPROVED'
  | 'REJECTED'
  | 'FLAGGED';

interface StatusBadgeProps {
  status: string | StatusType;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const norm = String(status).toUpperCase();

  switch (norm) {
    case 'ACTIVE':
    case 'CONFIRMED':
    case 'DELIVERED':
    case 'IN_STOCK':
    case 'APPROVED':
      return (
        <Badge
          variant="tech"
          className={`text-[10px] font-mono px-2 py-0.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 ${className}`}
        >
          {norm.replace(/_/g, ' ')}
        </Badge>
      );

    case 'PENDING':
    case 'PROCESSING':
    case 'LOW_STOCK':
      return (
        <Badge
          variant="secondary"
          className={`text-[10px] font-mono px-2 py-0.5 border-amber-500/30 text-amber-400 bg-amber-500/10 ${className}`}
        >
          {norm.replace(/_/g, ' ')}
        </Badge>
      );

    case 'SHIPPED':
      return (
        <Badge
          variant="tech"
          className={`text-[10px] font-mono px-2 py-0.5 border-cyan-500/30 text-cyan-400 bg-cyan-500/10 ${className}`}
        >
          SHIPPED
        </Badge>
      );

    case 'CANCELLED':
    case 'REJECTED':
    case 'OUT_OF_STOCK':
    case 'FLAGGED':
      return (
        <Badge
          variant="destructive"
          className={`text-[10px] font-mono px-2 py-0.5 border-rose-500/30 text-rose-400 bg-rose-500/10 ${className}`}
        >
          {norm.replace(/_/g, ' ')}
        </Badge>
      );

    case 'DRAFT':
    case 'INACTIVE':
    case 'ARCHIVED':
    default:
      return (
        <Badge
          variant="secondary"
          className={`text-[10px] font-mono px-2 py-0.5 border-cyber-700 text-cyber-400 bg-cyber-800/40 ${className}`}
        >
          {norm.replace(/_/g, ' ')}
        </Badge>
      );
  }
}
