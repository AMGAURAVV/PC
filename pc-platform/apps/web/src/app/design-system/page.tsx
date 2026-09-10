'use client';

import * as React from 'react';
import {
  Button,
  Badge,
  Price,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  ProductCard,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  SearchInput,
  FilterGroup,
  ActiveFiltersBar,
  Pagination,
  Breadcrumbs,
  useToast,
  Spinner,
  ProgressBar,
  ProductCardSkeleton,
  SpecsTableSkeleton,
  EmptyState,
  ErrorState,
  Label,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Slider,
} from '@pc-platform/ui';
import {
  Cpu,
  Zap,
  ShieldCheck,
  Layers,
  Sparkles,
  Sliders,
  FileCode,
  AlertCircle,
} from 'lucide-react';

export default function DesignSystemShowcasePage() {
  const { toast } = useToast();

  // State for interactive showcase
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [progressVal] = React.useState(68);
  const [sliderVal, setSliderVal] = React.useState([45000]);
  const [switchChecked, setSwitchChecked] = React.useState(true);
  const [checkboxChecked, setCheckboxChecked] = React.useState(true);
  const [radioSelected, setRadioSelected] = React.useState('am5');
  const [currentPage, setCurrentPage] = React.useState(1);

  // Active filters state
  const [activeFilters, setActiveFilters] = React.useState<Array<{ id: string; label: string; groupTitle?: string }>>([
    { id: 'cat-gpu', label: 'Graphics Cards', groupTitle: 'Category' },
    { id: 'sock-am5', label: 'AM5', groupTitle: 'Socket' },
    { id: 'mem-ddr5', label: 'DDR5', groupTitle: 'Memory' },
  ]);

  const [selectedChipsets, setSelectedChipsets] = React.useState<string[]>(['b650']);
  const [selectedMemory, setSelectedMemory] = React.useState<string[]>(['ddr5']);
  const [selectedFormFactors, setSelectedFormFactors] = React.useState<string[]>(['atx']);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Hero Banner */}
      <section className="relative rounded-3xl border border-cyber-800 bg-cyber-950/60 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="gaming" dot pulse>
              DESIGN SYSTEM v1.0
            </Badge>
            <Badge variant="compatible">
              SHADCN + RADIX + TAILWIND
            </Badge>
            <Badge variant="tech">
              TECHNICAL GAMING PALETTE
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono leading-tight">
            NEXUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">HARDWARE UI</span> FOUNDATION
          </h1>

          <p className="text-base sm:text-lg text-cyber-300 leading-relaxed">
            High-precision design system tailored for custom PC builders, hardware configurators, and gaming e-commerce. Built with extreme attention to visual energy, dark mode ergonomics, and micro-interactions.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="gaming"
              size="lg"
              onClick={() => {
                toast({
                  title: 'TELEMETRY SYNCED',
                  description: 'All design tokens and Radix primitives successfully initialized.',
                  variant: 'success',
                });
              }}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              TEST TOAST NOTIFICATION
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setModalOpen(true)}
              className="gap-2"
            >
              <Layers className="w-4 h-4" />
              LAUNCH MODAL DEMO
            </Button>
          </div>
        </div>
      </section>

      {/* Navigation Breadcrumbs Demo */}
      <section className="space-y-3">
        <h2 className="text-sm font-mono uppercase tracking-widest text-cyber-400 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          BREADCRUMBS NAVIGATION
        </h2>
        <div className="p-4 rounded-xl border border-cyber-800/80 bg-cyber-950/40">
          <Breadcrumbs
            items={[
              { label: 'Components', href: '/products' },
              { label: 'Processors', href: '/products?cat=cpu' },
              { label: 'AMD Ryzen 7 7800X3D' },
            ]}
          />
        </div>
      </section>

      {/* Section 1: Buttons & Badges */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            BUTTON VARIANTS & SIZES
          </h2>
          <p className="text-xs text-cyber-400 mt-1 font-mono">
            Full hierarchy from high-energy gaming actions to subtle ghost triggers.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-cyber-800 bg-cyber-950/40 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="gaming">Gaming Neon Action</Button>
            <Button variant="default">Primary Default</Button>
            <Button variant="secondary">Secondary Dark</Button>
            <Button variant="outline">Outline Technical</Button>
            <Button variant="ghost">Ghost Trigger</Button>
            <Button variant="danger">Destructive Action</Button>
            <Button variant="gaming" isLoading>Saving Build...</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-cyber-800/60">
            <span className="text-xs font-mono text-cyber-400 mr-2">SIZES:</span>
            <Button variant="outline" size="sm">Small (sm)</Button>
            <Button variant="outline" size="default">Default (md)</Button>
            <Button variant="outline" size="lg">Large (lg)</Button>
            <Button variant="outline" size="icon" aria-label="Settings">
              <Sliders className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Badges & Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-mono uppercase tracking-widest text-cyber-400">
            COMPATIBILITY & STATUS BADGES
          </h3>
          <div className="p-6 rounded-2xl border border-cyber-800 bg-cyber-950/40 flex flex-wrap gap-3">
            <Badge variant="compatible" dot>COMPATIBLE</Badge>
            <Badge variant="warning" dot>CHECK CLEARANCE</Badge>
            <Badge variant="incompatible" dot>INCOMPATIBLE SOCKET</Badge>
            <Badge variant="gaming" dot pulse>DDR5 6000MHz</Badge>
            <Badge variant="tech">PCIe 5.0 x16</Badge>
            <Badge variant="secondary">240W TDP</Badge>
            <Badge variant="outline">ATX 3.0 READY</Badge>
          </div>
        </div>
      </section>

      {/* Section 2: Product Cards & Pricing */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-400" />
              PRODUCT CARD & PRICE COMPONENT
            </h2>
            <p className="text-xs text-cyber-400 mt-1 font-mono">
              Hardware spec chips, authoritative compatibility pill, and INR currency formatting.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            id="cpu-1"
            name="AMD Ryzen 7 7800X3D Processor"
            slug="amd-ryzen-7-7800x3d"
            category="PROCESSORS"
            price={36999}
            compareAtPrice={44999}
            isCompatible={true}
            inStock={true}
            specs={[
              { label: 'Socket', value: 'AM5' },
              { label: 'Cores/Threads', value: '8C / 16T' },
              { label: 'Boost Clock', value: '5.0 GHz' },
              { label: 'L3 Cache', value: '96MB 3D' },
            ]}
          />

          <ProductCard
            id="gpu-1"
            name="NVIDIA GeForce RTX 4080 SUPER 16GB"
            slug="rtx-4080-super"
            category="GRAPHICS"
            price={104999}
            compareAtPrice={119999}
            isCompatible={null}
            inStock={true}
            specs={[
              { label: 'VRAM', value: '16GB GDDR6X' },
              { label: 'Power', value: '320W' },
              { label: 'Length', value: '310mm' },
              { label: 'Slots', value: '3.5 Slots' },
            ]}
          />

          <ProductCard
            id="ram-1"
            name="Corsair Dominator Titanium 32GB (2x16GB)"
            slug="corsair-dominator-titanium-32gb"
            category="MEMORY"
            price={15499}
            isCompatible={false}
            inStock={false}
            specs={[
              { label: 'Type', value: 'DDR5' },
              { label: 'Speed', value: '7200 MT/s' },
              { label: 'Latency', value: 'CL34' },
              { label: 'Profile', value: 'Intel XMP 3.0' },
            ]}
          />
        </div>
      </section>

      {/* Section 3: Tabs & Accordions */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            TABS & ACCORDION SYSTEM
          </h2>
          <p className="text-xs text-cyber-400 mt-1 font-mono">
            Accessible hardware specifications and technical FAQ disclosures.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl border border-cyber-800 bg-cyber-950/40 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyber-400">
              SPECIFICATION TABS
            </h3>
            <Tabs defaultValue="specs">
              <TabsList>
                <TabsTrigger value="specs">Hardware Specs</TabsTrigger>
                <TabsTrigger value="power">Power Budget</TabsTrigger>
                <TabsTrigger value="clearance">Clearances</TabsTrigger>
              </TabsList>
              <TabsContent value="specs" className="space-y-2 pt-2">
                <p className="text-xs text-cyber-400">
                  Authoritative telemetry extracted from component firmware and manufacturer datasheets.
                </p>
                <div className="divide-y divide-cyber-800/60 font-mono text-xs">
                  <div className="flex justify-between py-2">
                    <span className="text-cyber-500">Form Factor</span>
                    <span className="text-white font-medium">Standard ATX</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-cyber-500">PCIe Generation</span>
                    <span className="text-white font-medium">PCIe 5.0 x16 Primary</span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="power" className="pt-2 text-xs font-mono text-cyber-300">
                Estimated component power: <strong>120W TDP</strong>.
              </TabsContent>
              <TabsContent value="clearance" className="pt-2 text-xs font-mono text-cyber-300">
                CPU Cooler Max Height: <strong>175mm</strong>.
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-6 rounded-2xl border border-cyber-800 bg-cyber-950/40 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyber-400">
              TECHNICAL DISCLOSURES
            </h3>
            <Accordion type="single" collapsible defaultValue="rule-1">
              <AccordionItem value="rule-1">
                <AccordionTrigger>How does the compatibility engine verify RAM clearance?</AccordionTrigger>
                <AccordionContent>
                  The engine cross-references the RAM module height against the CPU cooler bottom fin stack clearance.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="rule-2">
                <AccordionTrigger>What triggers a PSU wattage recommendation headroom alert?</AccordionTrigger>
                <AccordionContent>
                  Modern high-end GPUs exhibit transient power spikes up to 2x TDP for milliseconds. Our engine calculates sustained load + 25-30% headroom.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Section 4: Search & Filters */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            SEARCH & FILTER SYSTEM
          </h2>
        </div>

        <div className="p-6 rounded-2xl border border-cyber-800 bg-cyber-950/40 space-y-6">
          <div className="max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search components (e.g. DDR5, RTX 4080, AM5)..."
            />
          </div>

          <ActiveFiltersBar
            filters={activeFilters}
            onRemove={(id) => {
              setActiveFilters(activeFilters.filter((f) => f.id !== id));
            }}
            onClearAll={() => setActiveFilters([])}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <FilterGroup
              title="CHIPSET FAMILIES"
              options={[
                { id: 'b650', label: 'AMD B650 / B650E', count: 24 },
                { id: 'x670e', label: 'AMD X670E', count: 18 },
                { id: 'z790', label: 'Intel Z790', count: 32 },
              ]}
              selectedValues={selectedChipsets}
              onChange={setSelectedChipsets}
            />

            <FilterGroup
              title="MEMORY STANDARD"
              options={[
                { id: 'ddr5', label: 'DDR5 Synchronous', count: 48 },
                { id: 'ddr4', label: 'DDR4 Legacy', count: 35 },
              ]}
              selectedValues={selectedMemory}
              onChange={setSelectedMemory}
            />

            <FilterGroup
              title="FORM FACTOR"
              options={[
                { id: 'atx', label: 'Standard ATX', count: 62 },
                { id: 'matx', label: 'Micro-ATX', count: 29 },
              ]}
              selectedValues={selectedFormFactors}
              onChange={setSelectedFormFactors}
            />
          </div>

          <div className="pt-6 border-t border-cyber-800 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={8}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </section>

      {/* Section 5: Form Controls */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-400" />
            FORM CONTROLS
          </h2>
        </div>

        <div className="p-6 rounded-2xl border border-cyber-800 bg-cyber-950/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label required>System Build Title</Label>
            <Input defaultValue="Apex Cyber Titan 2026" />
          </div>

          <div className="space-y-2">
            <Label>Form Factor Target</Label>
            <Select defaultValue="atx">
              <option value="atx">Standard ATX Mid Tower</option>
              <option value="matx">Micro-ATX Compact</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Slider
              label="Budget Target (INR)"
              min={20000}
              max={250000}
              step={5000}
              value={sliderVal}
              onValueChange={setSliderVal}
              formatValue={(val) => `₹${val.toLocaleString('en-IN')}`}
            />
          </div>

          <div className="space-y-2 flex flex-col justify-center">
            <Switch
              checked={switchChecked}
              onCheckedChange={setSwitchChecked}
              label="Filter Incompatible Hardware"
              description="Automatically hide parts failing physical or electrical checks."
            />
          </div>

          <div className="space-y-2 flex flex-col justify-center">
            <Checkbox
              checked={checkboxChecked}
              onCheckedChange={(checked) => setCheckboxChecked(Boolean(checked))}
              label="Include Overclocking Headroom (+150W)"
              description="Calculates additional power for unlocked multiplier CPUs."
            />
          </div>

          <div className="space-y-2">
            <Label>Processor Architecture</Label>
            <RadioGroup value={radioSelected} onValueChange={setRadioSelected}>
              <RadioGroupItem value="am5" label="AMD Socket AM5 (Zen 4 / Zen 5)" />
              <RadioGroupItem value="lga1700" label="Intel LGA1700 (13th / 14th Gen)" />
            </RadioGroup>
          </div>
        </div>
      </section>

      {/* Section 6: States & Skeletons */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            TELEMETRY STATES & SKELETONS
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductCardSkeleton />
          <SpecsTableSkeleton rows={4} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmptyState
            icon="cpu"
            title="NO COMPONENTS SELECTED"
            description="Start building your rig by selecting a processor from our verified hardware database."
            actionLabel="BROWSE PROCESSORS"
            onAction={() => {}}
          />

          <ErrorState
            title="THERMAL SIMULATION FAILED"
            message="Selected 360mm AIO radiator conflicts with optical drive bay configuration."
            errorCode="CLEARANCE_ERR_09"
            onRetry={() => {}}
          />
        </div>
      </section>

      {/* Modal Demo */}
      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 font-mono">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              COMPATIBILITY ENGINE SPECIFICATION
            </ModalTitle>
            <ModalDescription>
              Authoritative validation rules checked across your hardware selection.
            </ModalDescription>
          </ModalHeader>
          <div className="py-4 space-y-3 text-xs text-cyber-300 font-mono">
            <div className="p-3 rounded-lg bg-cyber-900 border border-cyber-800">
              <span className="text-cyan-400 font-bold">RULE #01:</span> CPU Socket ↔ Motherboard Socket matching.
            </div>
            <div className="p-3 rounded-lg bg-cyber-900 border border-cyber-800">
              <span className="text-cyan-400 font-bold">RULE #07:</span> GPU Physical Length ↔ Chassis Clearance check.
            </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              CLOSE
            </Button>
            <Button variant="gaming" onClick={() => setModalOpen(false)}>
              CONFIRM HARDWARE
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
