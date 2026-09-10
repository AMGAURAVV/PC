'use client';

import * as React from 'react';
import {
  Breadcrumbs,
  Badge,
  Button,
  SearchInput,
  Select,
  Slider,
  EmptyState,
  ErrorState,
} from '@pc-platform/ui';
import {
  Cpu,
  Layers,
  Heart,
  MessageSquare,
  Eye,
  SlidersHorizontal,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useCommunityBuilds, useCommunityFilters } from '../../hooks/use-community';

export function CommunityClient() {
  const [search, setSearch] = React.useState('');
  const [sort, setSort] = React.useState<'featured' | 'popular' | 'latest' | 'price_asc' | 'price_desc'>('featured');
  const [selectedUseCase, setSelectedUseCase] = React.useState('');
  const [selectedGpu, setSelectedGpu] = React.useState('');
  const [selectedCpu, setSelectedCpu] = React.useState('');
  const [priceBudget, setPriceBudget] = React.useState<[number, number]>([0, 500000]);

  const { data: filtersResponse } = useCommunityFilters();
  const filterMeta = filtersResponse?.data;

  const { data: buildsResponse, isLoading, isError, refetch } = useCommunityBuilds({
    search: search || undefined,
    sort,
    useCase: selectedUseCase || undefined,
    gpu: selectedGpu || undefined,
    cpu: selectedCpu || undefined,
    minPrice: priceBudget[0] > 0 ? priceBudget[0] : undefined,
    maxPrice: priceBudget[1] < 500000 ? priceBudget[1] : undefined,
  });

  const builds = buildsResponse?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Community Showcase' },
        ]}
      />

      {/* Hero Banner */}
      <div className="relative rounded-3xl border border-border/80 bg-gradient-to-r from-purple-950/40 via-cyber-950 to-cyan-950/40 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-cyber-900/80 px-3.5 py-1.5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-300">
              COMMUNITY RIG SHOWCASE
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-mono leading-tight tracking-tight">
            COMMUNITY BUILDS &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400">
              CUSTOM SYSTEMS
            </span>
          </h1>

          <p className="text-sm sm:text-base text-cyber-300 leading-relaxed">
            Browse enthusiast custom rigs published by verified builders. Filter by graphics card, CPU platform, budget, or workload use-case with verified parts compatibility.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a href="/builder">
              <Button variant="gaming" size="sm" className="font-mono text-xs gap-1.5">
                <span>CREATE & PUBLISH YOUR BUILD</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-2xl border border-border/80 bg-cyber-950/60">
        {/* Search */}
        <div className="md:col-span-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search builds by name, CPU, GPU..."
            className="w-full"
          />
        </div>

        {/* Sort Filter */}
        <div className="md:col-span-2">
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="h-10 text-xs font-mono"
          >
            <option value="featured">★ Featured Rigs</option>
            <option value="popular">🔥 Most Popular</option>
            <option value="latest">⏱ Latest Releases</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </Select>
        </div>

        {/* Use Case */}
        <div className="md:col-span-2">
          <Select
            value={selectedUseCase}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedUseCase(e.target.value)}
            className="h-10 text-xs font-mono"
          >
            <option value="">All Use Cases</option>
            {(filterMeta?.useCases || ['Gaming', 'Workstation', 'Content Creation', 'Budget Esports', 'AI/ML']).map((uc: string) => (
              <option key={uc} value={uc}>{uc}</option>
            ))}
          </Select>
        </div>

        {/* GPU Filter */}
        <div className="md:col-span-2">
          <Select
            value={selectedGpu}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedGpu(e.target.value)}
            className="h-10 text-xs font-mono"
          >
            <option value="">All GPUs</option>
            {(filterMeta?.gpus || ['RTX 4090', 'RTX 4080 Super', 'RTX 4070 Ti Super', 'RX 7900 XTX']).map((gpu: string) => (
              <option key={gpu} value={gpu}>{gpu}</option>
            ))}
          </Select>
        </div>

        {/* CPU Filter */}
        <div className="md:col-span-2">
          <Select
            value={selectedCpu}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCpu(e.target.value)}
            className="h-10 text-xs font-mono"
          >
            <option value="">All CPUs</option>
            {(filterMeta?.cpus || ['Ryzen 7 7800X3D', 'Core i7-14700K', 'Core i9-14900K', 'Ryzen 9 7950X3D']).map((cpu: string) => (
              <option key={cpu} value={cpu}>{cpu}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Builds Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 rounded-2xl bg-cyber-900/60 border border-border/60 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="SHOWCASE TELEMETRY ERROR"
          message="Failed to retrieve community builds. Please verify your connection."
          onRetry={() => refetch()}
        />
      ) : builds.length === 0 ? (
        <EmptyState
          icon="cpu"
          title="NO BUILDS FOUND"
          description="Try broadening your search query or reset your filters."
          actionLabel="RESET FILTERS"
          onAction={() => {
            setSearch('');
            setSelectedUseCase('');
            setSelectedGpu('');
            setSelectedCpu('');
            setSort('featured');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {builds.map((build: any, idx: number) => {
            const heroImage =
              build.images && build.images.length > 0
                ? build.images[0]
                : 'https://storage.googleapis.com/pc-platform-assets/builds/default-build.jpg';

            return (
              <article
                key={build.id}
                className="group rounded-2xl border border-border/70 bg-cyber-950/80 overflow-hidden hover:border-cyan-500/60 transition-all duration-300 flex flex-col shadow-lg hover:shadow-glow-cyan/15"
              >
                {/* Image Stage */}
                <a
                  href={`/community/builds/${build.slug}`}
                  className="relative aspect-video w-full overflow-hidden bg-cyber-900/80 block"
                >
                  <img
                    src={heroImage}
                    alt={build.name}
                    loading={idx < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={idx < 2 ? 'high' : 'auto'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="gaming" className="text-[10px] font-mono font-bold">
                      {build.useCase}
                    </Badge>
                    {build.isFeatured && (
                      <Badge variant="warning" className="text-[10px] font-mono font-bold">
                        FEATURED
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-cyber-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-border/60 text-xs font-mono font-bold text-cyan-400">
                    ₹{Number(build.totalPrice).toLocaleString('en-IN')}
                  </div>
                </a>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <a href={`/community/builds/${build.slug}`}>
                      <h2 className="text-base font-bold font-mono text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {build.name}
                      </h2>
                    </a>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {build.description || `Custom ${build.useCase} build featuring top-tier components.`}
                    </p>
                  </div>

                  {/* Core Specs Chips */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-cyber-300 bg-cyber-900/40 p-2.5 rounded-xl border border-border/60">
                    <div className="flex items-center gap-1.5 truncate">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{build.cpuName || 'High-End CPU'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{build.gpuName || 'Discrete GPU'}</span>
                    </div>
                  </div>

                  {/* Author & Metrics Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs font-mono text-muted-foreground">
                    <span className="truncate">By {build.author?.firstName || 'Builder'}</span>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-rose-400">
                        <Heart className="w-3.5 h-3.5 fill-rose-400/30" />
                        {build.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {build.commentCount}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
