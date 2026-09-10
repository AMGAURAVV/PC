import * as React from 'react';
import { cn } from '../lib/utils';
import {
  Cpu,
  Layers,
  HardDrive,
  Zap,
  Box,
  Fan,
  ChevronRight,
  Flame,
  ShieldCheck,
} from 'lucide-react';

export interface MegaMenuItem {
  title: string;
  href: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface MegaMenuCategory {
  title: string;
  icon?: React.ReactNode;
  items: MegaMenuItem[];
  featured?: {
    title: string;
    description: string;
    href: string;
    imageUrl?: string;
    badge?: string;
  };
}

export interface MegaMenuProps {
  categories?: MegaMenuCategory[];
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const defaultHardwareCategories: MegaMenuCategory[] = [
  {
    title: 'Processors & Boards',
    icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    items: [
      { title: 'Intel Core 14th Gen', href: '/products?cat=cpu&brand=intel', badge: 'NEW' },
      { title: 'AMD Ryzen 9000 & 7000', href: '/products?cat=cpu&brand=amd', badge: 'HOT' },
      { title: 'Intel Z790 / B760 Motherboards', href: '/products?cat=motherboard&chipset=intel' },
      { title: 'AMD X670E / B650 Motherboards', href: '/products?cat=motherboard&chipset=amd' },
      { title: 'CPU Coolers & AIO Radiators', href: '/products?cat=cooler' },
    ],
    featured: {
      title: 'Ryzen 7 7800X3D',
      description: 'Ultimate 3D V-Cache gaming dominance at unmatched efficiency.',
      href: '/products/ryzen-7-7800x3d',
      badge: 'BEST GAMING CPU',
    },
  },
  {
    title: 'Graphics & Visuals',
    icon: <Layers className="w-4 h-4 text-purple-400" />,
    items: [
      { title: 'NVIDIA RTX 4090 / 4080 Super', href: '/products?cat=gpu&brand=nvidia', badge: 'TOP TIER' },
      { title: 'NVIDIA RTX 4070 Ti / 4070 Super', href: '/products?cat=gpu&brand=nvidia' },
      { title: 'AMD Radeon RX 7900 XTX / XT', href: '/products?cat=gpu&brand=amd' },
      { title: 'Creator & Workstation GPUs', href: '/products?cat=gpu&type=workstation' },
      { title: 'High-Refresh OLED Displays', href: '/products?cat=monitors' },
    ],
    featured: {
      title: 'GeForce RTX 4080 SUPER',
      description: 'DLSS 3.5 & Frame Generation with 16GB ultra-fast GDDR6X.',
      href: '/products/rtx-4080-super',
      badge: 'RECOMMENDED',
    },
  },
  {
    title: 'Memory & Storage',
    icon: <HardDrive className="w-4 h-4 text-emerald-400" />,
    items: [
      { title: 'DDR5 Gaming RAM (6000-7200MHz)', href: '/products?cat=ram&gen=ddr5', badge: 'DDR5' },
      { title: 'DDR4 Performance Kits', href: '/products?cat=ram&gen=ddr4' },
      { title: 'Gen5 NVMe SSDs (Up to 14,000MB/s)', href: '/products?cat=storage&gen=pcie5', badge: 'ULTRA' },
      { title: 'Gen4 NVMe M.2 SSDs', href: '/products?cat=storage&gen=pcie4' },
      { title: 'High-Capacity SATA & NAS Drives', href: '/products?cat=storage&type=sata' },
    ],
    featured: {
      title: 'Corsair Vengeance 32GB DDR5',
      description: '6000MT/s CL30 tuned with AMD EXPO & Intel XMP 3.0.',
      href: '/products/corsair-vengeance-ddr5',
    },
  },
  {
    title: 'Power & Chassis',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    items: [
      { title: 'ATX 3.0 PCIe 5.0 Power Supplies', href: '/products?cat=psu&standard=atx30', badge: 'ATX 3.0' },
      { title: '850W - 1200W Titanium / Platinum PSUs', href: '/products?cat=psu&wattage=850-1200' },
      { title: 'Panoramic Dual-Chamber Cases', href: '/products?cat=case&type=dual-chamber', badge: 'POPULAR' },
      { title: 'High-Airflow Mesh Cases', href: '/products?cat=case&type=mesh' },
      { title: 'RGB ARGB Performance Fans', href: '/products?cat=fans' },
    ],
    featured: {
      title: 'Lian Li O11 Vision',
      description: 'Three-sided borderless tempered glass with modular thermal layout.',
      href: '/products/lian-li-o11-vision',
    },
  },
];

export const MegaMenu: React.FC<MegaMenuProps> = ({
  categories = defaultHardwareCategories,
  isOpen = true,
  onClose,
  className,
}) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = React.useState<number>(0);
  const activeCategory = categories[activeCategoryIndex] || categories[0];

  if (!isOpen || !activeCategory) return null;

  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-cyber-800/80 bg-cyber-950/95 p-6 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all',
        className
      )}
      onMouseLeave={onClose}
    >
      <div className="grid grid-cols-12 gap-6">
        {/* Left column: Categories List */}
        <div className="col-span-3 space-y-1.5 border-r border-cyber-800/60 pr-4">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-cyber-400 px-3 pb-2">
            HARDWARE DIRECTORY
          </p>
          {categories.map((cat, idx) => {
            const isActive = idx === activeCategoryIndex;
            return (
              <button
                key={cat.title}
                onMouseEnter={() => setActiveCategoryIndex(idx)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left group',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-400 border-l-2 border-cyan-400'
                    : 'text-cyber-300 hover:text-white hover:bg-cyber-900/40'
                )}
              >
                <div className="flex items-center gap-2.5">
                  {cat.icon}
                  <span>{cat.title}</span>
                </div>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform text-cyber-500',
                    isActive && 'transform translate-x-1 text-cyan-400'
                  )}
                />
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-cyber-800/60 px-3">
            <a
              href="/pc-builder"
              className="flex items-center gap-2 text-xs font-mono font-medium text-cyan-400 hover:text-cyan-300 transition-colors py-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>LAUNCH CUSTOM BUILDER →</span>
            </a>
          </div>
        </div>

        {/* Middle column: Subcategory items */}
        <div className="col-span-5 space-y-2">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-cyber-400 pb-2">
            {activeCategory.title} SPECS & FAMILIES
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {activeCategory.items.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-cyber-900/50 transition-colors border border-transparent hover:border-cyber-800"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyber-600 group-hover:bg-cyan-400 transition-colors" />
                  <span className="text-sm font-medium text-cyber-200 group-hover:text-white transition-colors">
                    {item.title}
                  </span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Right column: Featured hardware spotlight */}
        <div className="col-span-4 pl-4 border-l border-cyber-800/60">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-cyber-400 pb-2 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            FEATURED SELECTION
          </p>
          {activeCategory.featured ? (
            <a
              href={activeCategory.featured.href}
              className="group block rounded-xl border border-cyber-800 bg-cyber-900/30 p-4 hover:border-cyan-500/50 transition-all relative overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
              {activeCategory.featured.badge && (
                <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold mb-3">
                  {activeCategory.featured.badge}
                </span>
              )}
              <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                {activeCategory.featured.title}
              </h4>
              <p className="text-xs text-cyber-400 mt-1.5 leading-relaxed">
                {activeCategory.featured.description}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-medium">
                <span>VIEW HARDWARE BENCHMARKS</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </a>
          ) : (
            <div className="p-4 rounded-xl border border-cyber-800/60 bg-cyber-900/20 text-center text-cyber-500 text-xs font-mono">
              COMPATIBILITY ASSURED
            </div>
          )}

          <div className="mt-4 p-3 rounded-lg bg-cyber-900/40 border border-cyber-800 flex items-center gap-2.5 text-xs text-cyber-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>All components verified via authoritative compatibility engine.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
