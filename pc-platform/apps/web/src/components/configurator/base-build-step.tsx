'use client';

import * as React from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Cpu,
  HardDrive,
  Layers,
  Database,
  Fan,
  Box,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { ConfiguratorBaseBuild, UseCaseDefinition } from '@pc-platform/types';
import { Button, Badge, Price, Skeleton, EmptyState } from '@pc-platform/ui';

interface BaseBuildStepProps {
  useCase: UseCaseDefinition;
  budget: number;
  baseBuilds: ConfiguratorBaseBuild[];
  isLoading: boolean;
  selectedBaseBuildId: string;
  onSelectBaseBuild: (build: ConfiguratorBaseBuild) => void;
  onBack: () => void;
  onNext: () => void;
}

export function BaseBuildStep({
  useCase,
  budget,
  baseBuilds,
  isLoading,
  selectedBaseBuildId,
  onSelectBaseBuild,
  onBack,
  onNext,
}: BaseBuildStepProps) {
  const selectedBuild =
    baseBuilds.find((b) => b.id === selectedBaseBuildId) || baseBuilds[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
          <Sparkles className="w-3 h-3 mr-1" /> Step 3 of 4
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Choose your baseline configuration
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Expert-engineered starting configurations for <strong className="text-primary">{useCase.name}</strong> around ₹{budget.toLocaleString('en-IN')}. Every build has been physically and thermally verified. You can customize any part in the next step.
        </p>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-border/60 bg-card space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-1/2" />
              <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : baseBuilds.length === 0 ? (
        <EmptyState
          title="No baseline builds found for this exact filter"
          description="Try broadening your budget or choose a different use case."
          actionLabel="View All Base Builds"
          onAction={onBack}
        />
      ) : (
        /* Base Builds Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {baseBuilds.map((build) => {
            const isSelected = (selectedBuild?.id || selectedBaseBuildId) === build.id;

            return (
              <div
                key={build.id}
                onClick={() => onSelectBaseBuild(build)}
                className={`group cursor-pointer rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/40 shadow-xl shadow-primary/10'
                    : 'border-border/80 bg-card hover:border-primary/40 hover:shadow-lg'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                      {build.tier}
                    </Badge>
                    {isSelected && (
                      <Badge variant="success" className="text-[10px] font-mono gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <Check className="w-3 h-3" /> Selected
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-foreground group-hover:text-primary transition-colors">
                      {build.name}
                    </h3>
                    <p className="text-xs font-mono text-emerald-400 mt-0.5">
                      Target: {build.targetResolution}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {build.description}
                    </p>
                  </div>

                  {/* Core Hardware Highlights */}
                  <div className="space-y-2 pt-3 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Cpu className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate text-foreground font-medium">{build.baselineSpecs.cpu}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HardDrive className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate text-foreground font-medium">{build.baselineSpecs.gpu}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layers className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{build.baselineSpecs.ram}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Database className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{build.baselineSpecs.storage}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Price & Button */}
                <div className="p-5 bg-muted/20 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                      Base System Price
                    </span>
                    <Price amount={build.basePrice} size="lg" className="font-extrabold text-foreground" />
                  </div>

                  <Button
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBaseBuild(build);
                    }}
                    className="gap-1 text-xs font-semibold"
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Budget</span>
        </Button>

        <Button
          size="lg"
          disabled={!selectedBuild}
          onClick={onNext}
          className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
        >
          <span>Customize Components</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
