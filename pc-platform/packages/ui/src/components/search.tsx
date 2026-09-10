import * as React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SearchSuggestion {
  id: string;
  title: string;
  category?: string | undefined;
  price?: number | undefined;
  slug?: string | undefined;
}

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  onSearch?: ((query: string) => void) | undefined;
  onClear?: (() => void) | undefined;
  onSelectSuggestion?: ((item: SearchSuggestion) => void) | undefined;
  suggestions?: SearchSuggestion[] | undefined;
  isLoading?: boolean | undefined;
  shortcutHint?: string | undefined;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  onClear,
  onSelectSuggestion,
  suggestions = [],
  isLoading = false,
  shortcutHint = 'Ctrl+K',
  className,
  placeholder = 'Search components (e.g. RTX 4080, AM5, DDR5)...',
  onKeyDown,
  ...props
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (val: string) => {
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    onChange?.(val);
    onSearch?.(val);
  };

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(value);
      setIsOpen(false);
    }
    onKeyDown?.(e);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />

        <input
          type="text"
          value={value}
          onChange={(e) => {
            handleChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'h-11 w-full rounded-lg border border-border/70 bg-cyber-900/90 pl-10 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500/80 focus:outline-none focus:ring-1 focus:ring-cyan-500/80 transition-all font-sans',
            className,
          )}
          {...props}
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={() => {
                handleChange('');
                onClear?.();
              }}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {shortcutHint && (
            <kbd className="hidden sm:inline-flex items-center rounded border border-border/80 bg-cyber-800 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              {shortcutHint}
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-lg border border-border/80 bg-cyber-900 shadow-2xl animate-fade-in">
          <ul className="max-h-72 overflow-y-auto divide-y divide-border/40 py-1">
            {suggestions.map((item) => (
              <li
                key={item.id}
                onClick={() => {
                  onSelectSuggestion?.(item);
                  setIsOpen(false);
                }}
                className="flex items-center justify-between px-3.5 py-2.5 hover:bg-cyber-800/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  {item.category && (
                    <span className="shrink-0 text-[10px] font-mono font-semibold uppercase bg-cyber-800 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">
                      {item.category}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm text-foreground truncate">{item.title}</span>
                </div>

                {item.price !== undefined && (
                  <span className="shrink-0 font-mono text-xs font-semibold text-slate-300">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
