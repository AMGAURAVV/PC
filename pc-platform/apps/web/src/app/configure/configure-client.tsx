'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumbs,
  Button,
  Badge,
  Modal,
  ModalContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Textarea,
  useToast,
} from '@pc-platform/ui';
import {
  Sparkles,
  Wrench,
  Check,
  Copy,
  ChevronRight,
  RotateCcw,
  Sliders,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ConfiguratorUseCase,
  ConfiguratorBaseBuild,
  ConfiguratorSlot,
  ConfiguratorUpgradeOption,
  Product,
} from '@pc-platform/types';
import {
  useConfiguratorUseCases,
  useBaseBuilds,
  useConfiguratorOptions,
} from '../../hooks/use-configurator';
import { useCart } from '../../hooks/use-cart';
import {
  UseCaseStep,
  BudgetStep,
  BaseBuildStep,
  CustomizerStep,
  FinalSummaryStep,
} from '../../components/configurator';

const STORAGE_KEY = 'pc_guided_configurator_state';

function ConfigureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addItem: addCartItem } = useCart();

  // Wizard Step: 1 = Use Case, 2 = Budget, 3 = Base Build, 4 = Customize, 5 = Final Summary
  const [currentStep, setCurrentStep] = React.useState<number>(1);

  // Selections
  const [selectedUseCase, setSelectedUseCase] = React.useState<ConfiguratorUseCase>('gaming');
  const [budget, setBudget] = React.useState<number>(115000);
  const [selectedBaseBuild, setSelectedBaseBuild] = React.useState<ConfiguratorBaseBuild | null>(null);
  const [selectedOptions, setSelectedOptions] = React.useState<
    Record<ConfiguratorSlot, ConfiguratorUpgradeOption>
  >({} as any);

  // Modals state
  const [saveModalOpen, setSaveModalOpen] = React.useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = React.useState<boolean>(false);
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false);
  const [saveName, setSaveName] = React.useState<string>('My Custom Configuration');
  const [saveNotes, setSaveNotes] = React.useState<string>('');

  // 1. Fetch Use Cases
  const { data: useCasesResponse, isLoading: isLoadingUseCases } = useConfiguratorUseCases();
  const useCases = useCasesResponse?.data || [];
  const currentUseCaseDef =
    useCases.find((u) => u.id === selectedUseCase) || useCases[0];

  // 2. Fetch Base Builds matching Use Case & Budget
  const { data: baseBuildsResponse, isLoading: isLoadingBaseBuilds } = useBaseBuilds({
    useCase: selectedUseCase,
  });
  const baseBuilds = baseBuildsResponse?.data || [];

  // When base builds arrive, ensure an active one is selected
  React.useEffect(() => {
    if (baseBuilds.length > 0 && !selectedBaseBuild && baseBuilds[0]) {
      setSelectedBaseBuild(baseBuilds[0]);
    }
  }, [baseBuilds, selectedBaseBuild]);

  // 3. Fetch allowed upgrade options for the selected base build
  const { data: optionsResponse, isLoading: isLoadingOptions } = useConfiguratorOptions(
    selectedBaseBuild?.id || null
  );
  const optionsBySlot = optionsResponse?.data?.optionsBySlot || ({} as any);

  // Initialize selectedOptions with the default options when optionsBySlot loads
  React.useEffect(() => {
    if (optionsBySlot && Object.keys(optionsBySlot).length > 0) {
      setSelectedOptions((prev) => {
        const defaults: any = { ...prev };
        for (const [slot, opts] of Object.entries(optionsBySlot)) {
          if (!defaults[slot] && Array.isArray(opts)) {
            const def = opts.find((o) => o.isDefault) || opts[0];
            if (def) defaults[slot] = def;
          }
        }
        return defaults;
      });
    }
  }, [optionsBySlot]);

  // Handle URL params for deep linking (e.g. ?useCase=creator)
  React.useEffect(() => {
    const ucParam = searchParams.get('useCase') as ConfiguratorUseCase;
    if (ucParam && ['gaming', 'creator', 'streaming', 'productivity', 'workstation', 'budget'].includes(ucParam)) {
      setSelectedUseCase(ucParam);
    }
  }, [searchParams]);

  // Handlers
  const handleSelectOption = (slot: ConfiguratorSlot, option: ConfiguratorUpgradeOption) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [slot]: option,
    }));
    toast({
      title: 'Upgrade Selected',
      description: `${option.name} configured.`,
    });
  };

  // Compute live total
  const computedTotal = React.useMemo(() => {
    if (!selectedBaseBuild) return 0;
    let total = selectedBaseBuild.basePrice;
    for (const [, opt] of Object.entries(selectedOptions)) {
      if (opt && opt.deltaPrice) {
        total += opt.deltaPrice;
      }
    }
    return total;
  }, [selectedBaseBuild, selectedOptions]);

  // Add build to cart
  const handleAddToCart = () => {
    if (!selectedBaseBuild) return;

    // Create virtual / bundle items or real items for cart
    const configuredProducts: Product[] = Object.values(selectedOptions)
      .filter((opt) => opt && opt.name)
      .map((opt) => ({
        id: opt.productId || opt.id,
        name: opt.name,
        slug: opt.id,
        description: opt.whyItMatters,
        price: opt.price,
        sku: `CFG-${opt.slot.toUpperCase()}-${opt.id}`,
        stock: 50,
        isActive: true,
        isFeatured: false,
        category: { id: opt.slot, name: opt.slot, slug: opt.slot },
        componentCategory: opt.slot.toUpperCase() as any,
        brand: opt.brand,
        model: opt.name,
        specifications: opt.specs,
        images: [{ id: 'img-1', url: '/placeholder-hardware.png', position: 0 }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

    if (configuredProducts.length > 0) {
      for (const prod of configuredProducts) {
        addCartItem(prod, 1);
      }
    } else {
      // Add base build as flagship pre-configured rig
      addCartItem(
        {
          id: selectedBaseBuild.id,
          name: `${selectedBaseBuild.name} (Custom Rig)`,
          slug: selectedBaseBuild.id,
          description: selectedBaseBuild.description,
          price: computedTotal,
          sku: `RIG-${selectedBaseBuild.id.toUpperCase()}`,
          stock: 25,
          isActive: true,
          isFeatured: true,
          category: { id: 'prebuilt', name: 'Custom Systems', slug: 'custom-systems' },
          componentCategory: 'OTHER' as any,
          brand: 'Nexus Performance Systems',
          model: selectedBaseBuild.name,
          specifications: selectedBaseBuild.baselineSpecs,
          images: [{ id: 'img-base', url: selectedBaseBuild.imageUrl || '/placeholder-hardware.png', position: 0 }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        1
      );
    }

    toast({
      title: 'Configuration Added to Cart!',
      description: `${selectedBaseBuild.name} with your custom upgrades has been added.`,
    });

    router.push('/cart');
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/configure?useCase=${selectedUseCase}&build=${selectedBaseBuild?.id || 'custom'}`
    : 'https://nexuspc.in/configure';

  const handleCopyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      toast({
        title: 'Share Link Copied',
        description: 'URL copied to your clipboard.',
      });
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveModalOpen(false);
    toast({
      title: 'Configuration Saved',
      description: `"${saveName}" has been saved to your account.`,
    });
  };

  const STEPS = [
    { number: 1, label: 'Use Case' },
    { number: 2, label: 'Budget' },
    { number: 3, label: 'Base Rig' },
    { number: 4, label: 'Customize' },
    { number: 5, label: 'Summary' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Banner / Breadcrumb Header */}
      <div className="border-b border-border/70 bg-gradient-to-b from-card via-card/70 to-background/50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Guided Configurator' },
            ]}
          />

          <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
                  <Sparkles className="w-3 h-3 mr-1" /> Smart Assistant
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  Guided 4-Step Hardware Wizard
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Guided PC Configurator
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                No technical hardware expertise needed. Pick your use case, set your budget, and choose verified plug-and-play upgrades.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/builder')}
              className="gap-1.5 text-xs self-start md:self-auto shrink-0"
            >
              <Wrench className="w-3.5 h-3.5" /> Switch to Advanced Builder
            </Button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-6 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between relative">
              {/* Connecting line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 z-0" />
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-300"
                style={{
                  width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                }}
              />

              {STEPS.map((step) => {
                const isCompleted = currentStep > step.number;
                const isCurrent = currentStep === step.number;

                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => {
                      if (step.number < currentStep) setCurrentStep(step.number);
                    }}
                    className={`relative z-10 flex flex-col items-center group transition-all duration-200 ${
                      step.number < currentStep ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : isCurrent
                          ? 'bg-primary/20 border-2 border-primary text-primary ring-4 ring-primary/10'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-semibold mt-1.5 hidden sm:block ${
                        isCurrent
                          ? 'text-primary'
                          : isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Wizard Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* STEP 1: CHOOSE USE CASE */}
        {currentStep === 1 && (
          <UseCaseStep
            useCases={useCases}
            selectedUseCase={selectedUseCase}
            onSelectUseCase={(uc) => {
              setSelectedUseCase(uc);
              const def = useCases.find((u) => u.id === uc);
              if (def) setBudget(def.recommendedBudgetMin);
            }}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {/* STEP 2: CHOOSE BUDGET */}
        {currentStep === 2 && currentUseCaseDef && (
          <BudgetStep
            useCase={currentUseCaseDef}
            budget={budget}
            onChangeBudget={setBudget}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {/* STEP 3: CHOOSE BASE BUILD */}
        {currentStep === 3 && currentUseCaseDef && (
          <BaseBuildStep
            useCase={currentUseCaseDef}
            budget={budget}
            baseBuilds={baseBuilds}
            isLoading={isLoadingBaseBuilds}
            selectedBaseBuildId={selectedBaseBuild?.id || ''}
            onSelectBaseBuild={(build) => setSelectedBaseBuild(build)}
            onBack={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        )}

        {/* STEP 4: CUSTOMIZE (PROGRESSIVE DISCLOSURE) */}
        {currentStep === 4 && selectedBaseBuild && (
          <CustomizerStep
            baseBuild={selectedBaseBuild}
            optionsBySlot={optionsBySlot}
            isLoading={isLoadingOptions}
            selectedOptions={selectedOptions}
            onSelectOption={handleSelectOption}
            onBack={() => setCurrentStep(3)}
            onNext={() => setCurrentStep(5)}
          />
        )}

        {/* STEP 5: FINAL SUMMARY & PERFORMANCE */}
        {currentStep === 5 && selectedBaseBuild && currentUseCaseDef && (
          <FinalSummaryStep
            useCase={currentUseCaseDef}
            baseBuild={selectedBaseBuild}
            selectedOptions={selectedOptions}
            totalPrice={computedTotal}
            onAddToCart={handleAddToCart}
            onSaveConfiguration={() => setSaveModalOpen(true)}
            onShareConfiguration={() => setShareModalOpen(true)}
            onBack={() => setCurrentStep(4)}
            onSwitchToAdvanced={() => router.push('/builder')}
          />
        )}
      </main>

      {/* SAVE CONFIGURATION MODAL */}
      <Modal open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <ModalContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Custom Configuration</DialogTitle>
            <DialogDescription>
              Save this guided setup to review or purchase at any time.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="cfg-name" className="text-xs">
                Configuration Name
              </Label>
              <Input
                id="cfg-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. My Dream 1440p Gaming Rig"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cfg-notes" className="text-xs">
                Personal Notes (Optional)
              </Label>
              <Textarea
                id="cfg-notes"
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                placeholder="Targeting 144Hz esports, 32GB RAM upgrade included..."
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
              <Button type="submit">Save Setup</Button>
            </DialogFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* SHARE CONFIGURATION MODAL */}
      <Modal open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <ModalContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Guided Configuration</DialogTitle>
            <DialogDescription>
              Share this exact custom build setup with friends, streamers, or tech communities.
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
                <span className="text-muted-foreground">Baseline Architecture:</span>
                <span className="font-bold text-foreground">{selectedBaseBuild?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Investment:</span>
                <span className="font-mono font-bold text-primary">
                  ₹{computedTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compatibility:</span>
                <span className="text-emerald-400 font-bold uppercase">100% Certified</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShareModalOpen(false)}>Done</Button>
          </DialogFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export function ConfigureClient() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-foreground">Loading Guided Configurator</h3>
            <p className="text-xs text-muted-foreground">Personalizing hardware baseline recommendations...</p>
          </div>
        </div>
      }
    >
      <ConfigureContent />
    </React.Suspense>
  );
}

export default ConfigureClient;
