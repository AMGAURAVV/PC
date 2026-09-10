import * as React from 'react';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Badge } from './badge';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterGroupProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  defaultExpanded?: boolean;
  searchable?: boolean;
}

export function FilterGroup({
  title,
  options,
  selectedValues,
  onChange,
  defaultExpanded = true,
  searchable = false,
}: FilterGroupProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const [search, setSearch] = React.useState('');

  const filteredOptions = searchable && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggleOption = (id: string) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter((v) => v !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  return (
    <div className="border-b border-border/60 py-3.5">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-foreground hover:text-cyan-400 transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground',
            isExpanded && 'rotate-180',
          )}
        />
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {searchable && options.length > 6 && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="h-8 w-full rounded border border-border/70 bg-cyber-900 px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan-500/60 focus:outline-none mb-2"
            />
          )}

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
            {filteredOptions.map((opt) => {
              const isChecked = selectedValues.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 select-none"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(opt.id)}
                      className="h-3.5 w-3.5 rounded border-border/80 bg-cyber-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className={cn(isChecked && 'text-foreground font-medium')}>
                      {opt.label}
                    </span>
                  </div>

                  {opt.count !== undefined && (
                    <span className="text-[11px] font-mono text-muted-foreground/60">
                      {opt.count}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export interface ActiveFilterTag {
  id: string;
  label: string;
  groupTitle?: string;
}

export interface ActiveFiltersBarProps {
  filters: ActiveFilterTag[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFiltersBar({
  filters,
  onRemove,
  onClearAll,
  className,
}: ActiveFiltersBarProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2 py-2', className)}>
      <span className="text-xs text-muted-foreground font-medium">Active:</span>

      {filters.map((f) => (
        <Badge
          key={f.id}
          variant="tech"
          className="gap-1 pl-2 pr-1 py-0.5 text-xs border-cyan-500/40 text-cyan-300"
        >
          {f.groupTitle && <span className="text-muted-foreground mr-1">{f.groupTitle}:</span>}
          {f.label}
          <button
            type="button"
            onClick={() => onRemove(f.id)}
            className="hover:bg-cyan-500/20 rounded p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="xs"
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-rose-400 ml-1"
      >
        Clear all
      </Button>
    </div>
  );
}
