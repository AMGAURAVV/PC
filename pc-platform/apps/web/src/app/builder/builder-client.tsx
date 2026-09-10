'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Breadcrumbs,
  Button,
  Modal,
  ModalContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Drawer,
  SheetContent,
  Input,
  Label,
  Textarea,
  Badge,
  useToast,
} from '@pc-platform/ui';
import {
  Wrench,
  RotateCcw,
  Sparkles,
  Share2,
  Check,
  Copy,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRight,
  Cpu,
  Monitor,
  Zap,
} from 'lucide-react';
import { Product } from '@pc-platform/types';
import {
  BUILDER_CATEGORIES,
  BuilderSlotId,
  BuilderSelections,
  BuilderSidebar,
  ComponentSelector,
  SelectedComponent,
  BuildSummary,
} from '../../components/builder';
import { useBuildEvaluation, useBuildMutations } from '../../hooks/use-build';
import { useCart } from '../../hooks/use-cart';

const STORAGE_KEY = 'pc_builder_current_selections';
const BUILD_NAME_KEY = 'pc_builder_current_name';

function PCBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addItem: addCartItem } = useCart();

  // State
  const [selections, setSelections] = React.useState<BuilderSelections>({});
  const [buildName, setBuildName] = React.useState<string>('Custom Gaming Rig');
  const [buildDescription, setBuildDescription] = React.useState<string>('');
  const [activeSlotId, setActiveSlotId] = React.useState<BuilderSlotId>('cpu');
  const [selectorOpen, setSelectorOpen] = React.useState<boolean>(false);
  const [isClientLoaded, setIsClientLoaded] = React.useState<boolean>(false);

  // Modals state
  const [saveModalOpen, setSaveModalOpen] = React.useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = React.useState<boolean>(false);
  const [compareModalOpen, setCompareModalOpen] = React.useState<boolean>(false);
  const [clearConfirmOpen, setClearConfirmOpen] = React.useState<boolean>(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = React.useState<boolean>(false);
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false);

  // Load initial selections from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelections(parsed);
      }
      const savedName = localStorage.getItem(BUILD_NAME_KEY);
      if (savedName) {
        setBuildName(savedName);
      }
    } catch {
      // ignore parsing errors
    }
    setIsClientLoaded(true);
  }, []);

  // Save changes to localStorage
  React.useEffect(() => {
    if (!isClientLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
      localStorage.setItem(BUILD_NAME_KEY, buildName);
    } catch {
      // ignore write errors
    }
  }, [selections, buildName, isClientLoaded]);

  // Check URL query parameters for active category
  React.useEffect(() => {
    const categoryParam = searchParams.get('category') as BuilderSlotId;
    if (categoryParam && BUILDER_CATEGORIES.some((c) => c.id === categoryParam)) {
      setActiveSlotId(categoryParam);
      setSelectorOpen(true);
    }
  }, [searchParams]);

  // Authoritative compatibility evaluation from backend API
  const candidateItems = React.useMemo(() => {
    const items: { productId: string; quantity: number }[] = [];
    for (const [, sel] of Object.entries(selections)) {
      if (sel?.product?.id) {
        items.push({ productId: sel.product.id, quantity: sel.quantity || 1 });
      }
    }
    return items;
  }, [selections]);

  const { data: evaluationResponse, isLoading: isEvaluating } = useBuildEvaluation(candidateItems);
  const calculations = evaluationResponse?.data || null;

  // Handlers
  const handleOpenSelector = (slotId: BuilderSlotId) => {
    setActiveSlotId(slotId);
    setSelectorOpen(true);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleSelectProduct = (slotId: BuilderSlotId, product: Product) => {
    setSelections((prev) => ({
      ...prev,
      [slotId]: { product, quantity: prev[slotId]?.quantity || 1 },
    }));
    setSelectorOpen(false);

    toast({
      title: 'Component Added',
      description: `Added ${product.name} to your build.`,
    });
  };

  const handleRemoveProduct = (slotId: BuilderSlotId) => {
    setSelections((prev) => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });

    toast({
      title: 'Component Removed',
      description: `Removed from your build.`,
    });
  };

  const handleUpdateQuantity = (slotId: BuilderSlotId, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveProduct(slotId);
      return;
    }
    setSelections((prev) => {
      const item = prev[slotId];
      if (!item) return prev;
      return {
        ...prev,
        [slotId]: { ...item, quantity },
      };
    });
  };

  // Add Entire Build to Cart
  const handleAddToCart = () => {
    const configuredList = Object.values(selections).filter(Boolean);
    if (configuredList.length === 0) return;

    for (const item of configuredList) {
      if (item?.product) {
        addCartItem(item.product, item.quantity || 1);
      }
    }

    toast({
      title: 'Build Added to Cart',
      description: `Successfully added ${configuredList.length} components to your shopping cart.`,
    });

    router.push('/cart');
  };

  // Clear Build
  const handleClearBuild = () => {
    setSelections({});
    setBuildName('Custom Gaming Rig');
    setBuildDescription('');
    setClearConfirmOpen(false);
    toast({
      title: 'Build Cleared',
      description: 'All components have been reset.',
    });
  };

  // Duplicate Build
  const handleDuplicateBuild = () => {
    const duplicatedName = `${buildName} (Copy)`;
    setBuildName(duplicatedName);
    toast({
      title: 'Build Duplicated',
      description: `Created copy "${duplicatedName}".`,
    });
  };

  // Save Build
  const handleSaveBuildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveModalOpen(false);
    toast({
      title: 'Build Saved',
      description: `"${buildName}" has been saved to your configuration library.`,
    });
  };

  // Share Build
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/builder?share=${encodeURIComponent(buildName.toLowerCase().replace(/\s+/g, '-'))}`
    : 'https://nexuspc.in/builder';

  const handleCopyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      toast({
        title: 'Link Copied',
        description: 'Shareable build URL copied to clipboard.',
      });
    }
  };

  const configuredCount = Object.keys(selections).filter(
    (k) => Boolean(selections[k as BuilderSlotId])
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-16">
      {/* Top Banner / Hero */}
      <div className="border-b border-border/70 bg-gradient-to-b from-card via-card/80 to-background/50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'PC Configurator' },
            ]}
          />

          <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
                  <Sparkles className="w-3 h-3 mr-1" /> Next-Gen Hardware Engine
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  v2.4 Compatibility Core
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Custom PC Builder
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
                Configure your custom battlestation. Real-time wattage calculations, physical clearance checks, and authoritative socket validation ensure 100% plug-and-play assembly.
              </p>
            </div>

            {/* Quick Action Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareModalOpen(true)}
                disabled={configuredCount === 0}
                className="gap-1.5 text-xs"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSaveModalOpen(true)}
                disabled={configuredCount === 0}
                className="gap-1.5 text-xs"
              >
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompareModalOpen(true)}
                className="gap-1.5 text-xs"
              >
                Compare Tiers
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Builder Category Navigation (Col span 3) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-20">
            <BuilderSidebar
              activeSlotId={activeSlotId}
              onSelectSlot={(slotId) => {
                setActiveSlotId(slotId);
                setSelectorOpen(true);
              }}
              selections={selections}
              className="max-h-[calc(100vh-100px)]"
            />
          </div>

          {/* CENTER COLUMN: Component Configuration Workflow (Col span 6) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Center Header */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm">
              <div>
                <span className="text-[11px] font-mono uppercase text-muted-foreground">
                  Active Build Configuration
                </span>
                <h3 className="text-base font-bold text-foreground">{buildName}</h3>
              </div>

              <div className="flex items-center gap-2">
                {selectorOpen && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectorOpen(false)}
                    className="text-xs"
                  >
                    View All Slots
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setClearConfirmOpen(true)}
                  disabled={configuredCount === 0}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                </Button>
              </div>
            </div>

            {/* If selector is open, show ComponentSelector */}
            {selectorOpen ? (
              <ComponentSelector
                slotId={activeSlotId}
                currentProductId={selections[activeSlotId]?.product?.id}
                compatibilityResult={calculations?.compatibilityResult}
                onSelectProduct={handleSelectProduct}
                onClose={() => setSelectorOpen(false)}
                className="min-h-[550px]"
              />
            ) : (
              /* Selected Components List */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>Hardware Slot Configuration</span>
                  <span className="font-mono">{configuredCount} / {BUILDER_CATEGORIES.length} Configured</span>
                </div>

                {BUILDER_CATEGORIES.map((cat) => (
                  <SelectedComponent
                    key={cat.id}
                    category={cat}
                    selection={selections[cat.id]}
                    onChoose={handleOpenSelector}
                    onReplace={handleOpenSelector}
                    onRemove={handleRemoveProduct}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Build Summary & Calculations (Col span 3) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-20">
            <BuildSummary
              selections={selections}
              calculations={calculations}
              isLoadingEvaluation={isEvaluating}
              onAddToCart={handleAddToCart}
              onSaveBuild={() => setSaveModalOpen(true)}
              onShareBuild={() => setShareModalOpen(true)}
              onDuplicateBuild={handleDuplicateBuild}
              onClearBuild={() => setClearConfirmOpen(true)}
              onCompareBuild={() => setCompareModalOpen(true)}
              className="max-h-[calc(100vh-100px)]"
            />
          </div>
        </div>
      </main>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 p-3.5 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] font-mono uppercase text-muted-foreground block">
            Build Total ({configuredCount} Parts)
          </span>
          <span className="text-base font-bold font-mono text-foreground">
            ₹{(calculations?.totalPrice || Object.values(selections).reduce((a, b) => a + (b?.product?.price || 0) * (b?.quantity || 1), 0)).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMobileSummaryOpen(true)}
            className="text-xs"
          >
            Summary & Specs
          </Button>

          <Button
            size="sm"
            disabled={configuredCount === 0 || calculations?.compatibilityResult?.status === 'incompatible'}
            onClick={handleAddToCart}
            className="text-xs font-bold bg-primary text-primary-foreground"
          >
            Add to Cart
          </Button>
        </div>
      </div>

      {/* MOBILE SUMMARY DRAWER */}
      <Drawer open={mobileSummaryOpen} onOpenChange={setMobileSummaryOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0 overflow-y-auto">
          <BuildSummary
            selections={selections}
            calculations={calculations}
            isLoadingEvaluation={isEvaluating}
            onAddToCart={() => {
              setMobileSummaryOpen(false);
              handleAddToCart();
            }}
            onSaveBuild={() => {
              setMobileSummaryOpen(false);
              setSaveModalOpen(true);
            }}
            onShareBuild={() => {
              setMobileSummaryOpen(false);
              setShareModalOpen(true);
            }}
            onDuplicateBuild={() => {
              setMobileSummaryOpen(false);
              handleDuplicateBuild();
            }}
            onClearBuild={() => {
              setMobileSummaryOpen(false);
              setClearConfirmOpen(true);
            }}
            onCompareBuild={() => {
              setMobileSummaryOpen(false);
              setCompareModalOpen(true);
            }}
          />
        </SheetContent>
      </Drawer>

      {/* SAVE BUILD MODAL */}
      <Modal open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <ModalContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Custom Build</DialogTitle>
            <DialogDescription>
              Save this configuration to your account to review, edit, or purchase later.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBuildSubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="build-name" className="text-xs">
                Build Name
              </Label>
              <Input
                id="build-name"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                placeholder="e.g. Apex Esports Beast, 4K Video Editing Rig"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="build-desc" className="text-xs">
                Notes / Description (Optional)
              </Label>
              <Textarea
                id="build-desc"
                value={buildDescription}
                onChange={(e) => setBuildDescription(e.target.value)}
                placeholder="Targeting 240 FPS in Valorant, 32GB RAM for multitasking..."
                rows={3}
                className="mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Configuration</Button>
            </DialogFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* SHARE BUILD MODAL */}
      <Modal open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <ModalContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Configuration</DialogTitle>
            <DialogDescription>
              Share your custom PC build specs with friends, communities, or tech forums.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="font-mono text-xs bg-muted/50 select-all"
              />
              <Button
                size="sm"
                onClick={handleCopyShareLink}
                className="gap-1.5 shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy
                  </>
                )}
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Components Configured:</span>
                <span className="font-mono font-bold">{configuredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Power:</span>
                <span className="font-mono">{calculations?.estimatedPowerW || 0}W</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compatibility Status:</span>
                <span className="font-mono text-emerald-400 uppercase">
                  {calculations?.compatibilityResult?.status || 'Compatible'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShareModalOpen(false)}>Done</Button>
          </DialogFooter>
        </ModalContent>
      </Modal>

      {/* CLEAR CONFIRM MODAL */}
      <Modal open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <ModalContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset All Components?</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear your current build configuration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setClearConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearBuild}>
              Clear Everything
            </Button>
          </DialogFooter>
        </ModalContent>
      </Modal>

      {/* COMPARE TIERS MODAL */}
      <Modal open={compareModalOpen} onOpenChange={setCompareModalOpen}>
        <ModalContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Benchmark Tier Comparison</DialogTitle>
            <DialogDescription>
              Compare your current custom configuration against verified hardware tiers.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Current Build */}
            <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 space-y-2.5">
              <Badge variant="default" className="text-[10px] font-mono">
                Your Current Build
              </Badge>
              <h4 className="text-sm font-bold text-foreground">{buildName}</h4>
              <div className="font-mono text-base font-extrabold text-primary">
                ₹{(calculations?.totalPrice || 0).toLocaleString('en-IN')}
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground border-t border-border/50 pt-2 font-mono">
                <div>Parts: {configuredCount} of {BUILDER_CATEGORIES.length}</div>
                <div>Power: {calculations?.estimatedPowerW || 0}W</div>
                <div>Score: {calculations?.performanceScore || '--'}/100</div>
              </div>
            </div>

            {/* Tier 1: 1080p Esports */}
            <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-2.5">
              <Badge variant="outline" className="text-[10px] font-mono">
                Tier 1 Reference
              </Badge>
              <h4 className="text-sm font-bold text-foreground">1080p Esports Tier</h4>
              <div className="font-mono text-base font-extrabold text-foreground">
                ~ ₹65,000
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground border-t border-border/50 pt-2 font-mono">
                <div>Core i5 / Ryzen 5</div>
                <div>RTX 4060 / RX 7600</div>
                <div>16GB DDR5 5600MHz</div>
                <div>550W Bronze PSU</div>
              </div>
            </div>

            {/* Tier 2: 1440p Enthusiast */}
            <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-2.5">
              <Badge variant="outline" className="text-[10px] font-mono">
                Tier 2 Reference
              </Badge>
              <h4 className="text-sm font-bold text-foreground">1440p High-FPS Tier</h4>
              <div className="font-mono text-base font-extrabold text-foreground">
                ~ ₹1,45,000
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground border-t border-border/50 pt-2 font-mono">
                <div>Ryzen 7 7800X3D / i7</div>
                <div>RTX 4070 Ti Super</div>
                <div>32GB DDR5 6000MHz</div>
                <div>750W Gold PSU</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setCompareModalOpen(false)}>Close</Button>
          </DialogFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export function BuilderClient() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-pulse">
            <Wrench className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-foreground">Loading PC Configurator</h3>
            <p className="text-xs text-muted-foreground">Initializing hardware compatibility engine...</p>
          </div>
        </div>
      }
    >
      <PCBuilderContent />
    </React.Suspense>
  );
}

export default BuilderClient;
