'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-xs font-mono text-cyber-400 py-1" aria-label="Breadcrumb">
      <Link
        href="/"
        className="hover:text-cyan-400 transition-colors flex items-center gap-1"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Admin</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-cyber-600 shrink-0" />
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-cyan-400 transition-colors truncate">
                {item.label}
              </Link>
            ) : (
              <span className="text-white font-medium truncate">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
