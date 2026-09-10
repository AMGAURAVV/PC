import * as React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  showHomeIcon?: boolean;
}

export function Breadcrumbs({
  items,
  showHomeIcon = true,
  className,
  ...props
}: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-muted-foreground', className)} {...props}>
      <ol className="flex items-center flex-wrap gap-1.5">
        {showHomeIcon && (
          <li className="inline-flex items-center">
            <a
              href="/"
              className="inline-flex items-center gap-1 hover:text-cyan-400 transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Home</span>
            </a>
          </li>
        )}

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="inline-flex items-center gap-1.5">
              {(showHomeIcon || idx > 0) && (
                <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              )}

              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="hover:text-cyan-400 transition-colors font-medium truncate max-w-[150px] sm:max-w-xs"
                >
                  {item.label}
                </a>
              ) : (
                <span className={cn('truncate max-w-[180px] sm:max-w-sm', isLast && 'text-foreground font-semibold')}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
