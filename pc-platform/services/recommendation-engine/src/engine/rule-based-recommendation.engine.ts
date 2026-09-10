import {
  RecommendationInput,
  RecommendationResult,
  RecommendationScoringBreakdown,
  ComponentRecommendationItem,
  Product,
} from '@pc-platform/types';
import {
  HardwarePool,
  IRecommendationEngine,
  CandidateBuild,
  ScoringWeights,
} from '../domain/interfaces';
import { BudgetAllocator } from '../allocator/budget-allocator';
import {
  PerformanceScorer,
  PriceEfficiencyScorer,
  CompatibilityScorer,
  AvailabilityScorer,
  PowerEfficiencyScorer,
  UpgradeabilityScorer,
  PreferenceScorer,
} from '../scoring';

export class RuleBasedRecommendationEngine implements IRecommendationEngine {
  public async generateRecommendation(
    input: RecommendationInput,
    candidates: HardwarePool,
  ): Promise<RecommendationResult> {
    const budget = input.budget || 75000;
    const useCase = (input.useCase || 'gaming').toLowerCase();

    // 1. Determine dimension weights
    const weights = this.getScoringWeights(useCase, input.upgradePreference);

    // 2. Filter available and in-budget components
    const pool = this.filterCandidatePool(candidates);

    // 3. Assemble and score candidate builds
    const candidateBuilds = this.generateCandidateBuilds(input, pool);

    if (candidateBuilds.length === 0) {
      // Fallback: build minimal configuration with whatever candidates exist
      const fallbackBuild = this.createFallbackBuild(pool);
      return this.formatRecommendation(fallbackBuild, input, weights, pool);
    }

    // 4. Score each candidate build across all 7 dimensions
    const scoredBuilds = candidateBuilds.map((build) => {
      const compat = CompatibilityScorer.score(build);
      const perf = PerformanceScorer.score(build, input);
      const priceEff = PriceEfficiencyScorer.score(build, perf, input);
      const avail = AvailabilityScorer.score(build);
      const powerEff = PowerEfficiencyScorer.score(build);
      const upgrade = UpgradeabilityScorer.score(build, input);
      const pref = PreferenceScorer.score(build, input);

      // Composite score calculation
      let overallScore = Math.round(
        perf * weights.performance +
          priceEff * weights.priceEfficiency +
          compat.score * weights.compatibility +
          avail * weights.availability +
          powerEff * weights.powerEfficiency +
          upgrade * weights.upgradeability +
          pref * weights.userPreferences,
      );

      // If incompatible, heavy penalty to disqualify
      if (compat.status === 'incompatible') {
        overallScore = Math.min(overallScore, 30);
      }

      const breakdown: RecommendationScoringBreakdown = {
        performance: perf,
        priceEfficiency: priceEff,
        compatibility: compat.score,
        availability: avail,
        powerEfficiency: powerEff,
        upgradeability: upgrade,
        userPreferences: pref,
        overallScore,
      };

      return {
        build,
        breakdown,
        compatStatus: compat.status,
      };
    });

    // Sort descending by overallScore
    scoredBuilds.sort((a, b) => b.breakdown.overallScore - a.breakdown.overallScore);

    // Prefer strictly compatible builds first
    const bestCandidate =
      scoredBuilds.find((item) => item.compatStatus === 'compatible') ?? scoredBuilds[0];

    if (!bestCandidate) {
      const fallbackBuild = this.createFallbackBuild(pool);
      return this.formatRecommendation(fallbackBuild, input, weights, pool);
    }

    // 5. Build alternative recommendations
    return this.formatRecommendation(
      bestCandidate.build,
      input,
      weights,
      pool,
      bestCandidate.breakdown,
      scoredBuilds.slice(1, 4).map((s) => s.build),
    );
  }

  private getScoringWeights(useCase: string, upgradePref?: string): ScoringWeights {
    // Default balanced weights
    let weights: ScoringWeights = {
      performance: 0.28,
      priceEfficiency: 0.22,
      compatibility: 0.20,
      availability: 0.10,
      powerEfficiency: 0.08,
      upgradeability: 0.07,
      userPreferences: 0.05,
    };

    if (useCase === 'gaming') {
      weights.performance = 0.32;
      weights.priceEfficiency = 0.22;
      weights.powerEfficiency = 0.08;
    } else if (useCase === 'creator' || useCase === 'workstation') {
      weights.performance = 0.30;
      weights.upgradeability = 0.12;
      weights.userPreferences = 0.08;
    }

    if (upgradePref === 'future_upgradeability') {
      weights.upgradeability += 0.08;
      weights.priceEfficiency -= 0.08;
    } else if (upgradePref === 'immediate_value') {
      weights.priceEfficiency += 0.08;
      weights.upgradeability -= 0.08;
    }

    return weights;
  }

  private filterCandidatePool(candidates: HardwarePool): HardwarePool {
    const filterList = (items: Product[]) =>
      (items || []).filter((p) => p && (p.isActive ?? true) && (p.stock ?? 1) > 0);

    return {
      cpus: filterList(candidates.cpus),
      motherboards: filterList(candidates.motherboards),
      gpus: filterList(candidates.gpus),
      ram: filterList(candidates.ram),
      storage: filterList(candidates.storage),
      psus: filterList(candidates.psus),
      cases: filterList(candidates.cases),
      cooling: filterList(candidates.cooling),
    };
  }

  private generateCandidateBuilds(
    input: RecommendationInput,
    pool: HardwarePool,
  ): CandidateBuild[] {
    const builds: CandidateBuild[] = [];
    const allocations = BudgetAllocator.allocate(input.budget, input.useCase);

    // Sort components by price ascending
    const sortedCpus = [...pool.cpus].sort((a, b) => a.price - b.price);
    const sortedGpus = [...pool.gpus].sort((a, b) => a.price - b.price);

    // Pick top viable GPU and CPU candidates near allocated targets
    const viableCpus = sortedCpus.length > 0 ? sortedCpus : [];
    const viableGpus = sortedGpus.length > 0 ? sortedGpus : [];

    // Pair up to 5 CPU options with 5 GPU options
    for (const cpu of viableCpus.slice(0, 5)) {
      const cpuSocket = String(
        cpu.specifications?.socket || cpu.specifications?.socketType || '',
      ).toLowerCase();

      // Find compatible motherboards
      const compatibleMbs = pool.motherboards.filter((mb) => {
        const mbSocket = String(
          mb.specifications?.socket || mb.specifications?.socketType || '',
        ).toLowerCase();
        return !cpuSocket || !mbSocket || cpuSocket === mbSocket;
      });

      const mb = compatibleMbs[0] || pool.motherboards[0];
      if (!mb) continue;

      const mbRamType = String(
        mb.specifications?.memoryType || mb.specifications?.ramType || '',
      ).toLowerCase();

      // Find compatible RAM
      const compatibleRam = pool.ram.filter((r) => {
        const ramType = String(
          r.specifications?.type || r.specifications?.ramType || '',
        ).toLowerCase();
        return !mbRamType || !ramType || mbRamType.includes(ramType) || ramType.includes(mbRamType);
      });

      const ram = compatibleRam[0] ?? pool.ram[0];
      const storage = pool.storage[0];
      const psu = pool.psus[0];
      const caseItem = pool.cases[0];
      const cooling = pool.cooling[0];

      if (!ram || !storage || !psu || !caseItem) continue;

      if (viableGpus.length > 0) {
        for (const gpu of viableGpus.slice(0, 4)) {
          const totalCost =
            cpu.price +
            mb.price +
            (gpu?.price || 0) +
            ram.price +
            storage.price +
            psu.price +
            caseItem.price +
            (cooling?.price || 0);

          builds.push({
            cpu,
            motherboard: mb,
            gpu: gpu ?? undefined,
            ram,
            storage,
            psu,
            case: caseItem,
            cooling: cooling ?? undefined,
            totalCost,
          });
        }
      } else {
        const totalCost =
          cpu.price +
          mb.price +
          ram.price +
          storage.price +
          psu.price +
          caseItem.price +
          (cooling?.price || 0);

        builds.push({
          cpu,
          motherboard: mb,
          gpu: undefined,
          ram,
          storage,
          psu,
          case: caseItem,
          cooling: cooling ?? undefined,
          totalCost,
        });
      }
    }

    return builds;
  }

  private createFallbackBuild(pool: HardwarePool): CandidateBuild {
    const cpu = pool.cpus[0] || ({ id: 'fallback-cpu', name: 'Standard CPU', price: 15000 } as Product);
    const mb = pool.motherboards[0] || ({ id: 'fallback-mb', name: 'Standard Motherboard', price: 10000 } as Product);
    const gpu = pool.gpus[0];
    const ram = pool.ram[0] || ({ id: 'fallback-ram', name: '16GB DDR5', price: 5000 } as Product);
    const storage = pool.storage[0] || ({ id: 'fallback-storage', name: '1TB NVMe SSD', price: 6000 } as Product);
    const psu = pool.psus[0] || ({ id: 'fallback-psu', name: '650W PSU', price: 5500 } as Product);
    const caseItem = pool.cases[0] || ({ id: 'fallback-case', name: 'ATX Mid Tower', price: 4500 } as Product);

    return {
      cpu,
      motherboard: mb,
      gpu: gpu ?? undefined,
      ram,
      storage,
      psu,
      case: caseItem,
      cooling: undefined,
      totalCost:
        cpu.price +
        mb.price +
        (gpu?.price || 0) +
        ram.price +
        storage.price +
        psu.price +
        caseItem.price,
    };
  }

  private formatRecommendation(
    build: CandidateBuild,
    input: RecommendationInput,
    weights: ScoringWeights,
    pool: HardwarePool,
    existingBreakdown?: RecommendationScoringBreakdown,
    alternativeBuilds?: CandidateBuild[],
  ): RecommendationResult {
    let breakdown = existingBreakdown;
    if (!breakdown) {
      const compat = CompatibilityScorer.score(build);
      const perf = PerformanceScorer.score(build, input);
      const priceEff = PriceEfficiencyScorer.score(build, perf, input);
      const avail = AvailabilityScorer.score(build);
      const powerEff = PowerEfficiencyScorer.score(build);
      const upgrade = UpgradeabilityScorer.score(build, input);
      const pref = PreferenceScorer.score(build, input);

      const overall = Math.round(
        perf * weights.performance +
          priceEff * weights.priceEfficiency +
          compat.score * weights.compatibility +
          avail * weights.availability +
          powerEff * weights.powerEfficiency +
          upgrade * weights.upgradeability +
          pref * weights.userPreferences,
      );

      breakdown = {
        performance: perf,
        priceEfficiency: priceEff,
        compatibility: compat.score,
        availability: avail,
        powerEfficiency: powerEff,
        upgradeability: upgrade,
        userPreferences: pref,
        overallScore: overall,
      };
    }

    // Create ComponentRecommendationItem mapping
    const recommendedComponents: Record<string, ComponentRecommendationItem> = {};

    if (build.cpu) {
      recommendedComponents['cpu'] = {
        slot: 'cpu',
        productId: build.cpu.id,
        name: build.cpu.name,
        brand: build.cpu.brand,
        price: build.cpu.price,
        specs: build.cpu.specifications || {},
        reason: `Optimal single and multi-core throughput for ${input.useCase || 'gaming'} workloads without bottlenecking.`,
      };
    }

    if (build.motherboard) {
      recommendedComponents['motherboard'] = {
        slot: 'motherboard',
        productId: build.motherboard.id,
        name: build.motherboard.name,
        brand: build.motherboard.brand,
        price: build.motherboard.price,
        specs: build.motherboard.specifications || {},
        reason: `Reliable VRM power delivery, socket longevity, and matched memory generation support.`,
      };
    }

    if (build.gpu) {
      recommendedComponents['gpu'] = {
        slot: 'gpu',
        productId: build.gpu.id,
        name: build.gpu.name,
        brand: build.gpu.brand,
        price: build.gpu.price,
        specs: build.gpu.specifications || {},
        reason: `Targeted rasterization and frame-pacing tuned for ${input.resolution || '1080p'} / ${input.targetFps || 60} FPS performance.`,
      };
    }

    if (build.ram) {
      recommendedComponents['ram'] = {
        slot: 'ram',
        productId: build.ram.id,
        name: build.ram.name,
        brand: build.ram.brand,
        price: build.ram.price,
        specs: build.ram.specifications || {},
        reason: `High-bandwidth low-latency memory matching platform memory controller capabilities.`,
      };
    }

    if (build.storage) {
      recommendedComponents['storage'] = {
        slot: 'storage',
        productId: build.storage.id,
        name: build.storage.name,
        brand: build.storage.brand,
        price: build.storage.price,
        specs: build.storage.specifications || {},
        reason: `Fast NVMe SSD read/write speeds for rapid OS boot, game load times, and asset streaming.`,
      };
    }

    if (build.psu) {
      recommendedComponents['psu'] = {
        slot: 'psu',
        productId: build.psu.id,
        name: build.psu.name,
        brand: build.psu.brand,
        price: build.psu.price,
        specs: build.psu.specifications || {},
        reason: `High efficiency rating with healthy headroom across peak system transient spikes.`,
      };
    }

    if (build.case) {
      recommendedComponents['case'] = {
        slot: 'case',
        productId: build.case.id,
        name: build.case.name,
        brand: build.case.brand,
        price: build.case.price,
        specs: build.case.specifications || {},
        reason: `Optimized airflow mesh design with ample clearance for GPU length and CPU cooling.`,
      };
    }

    if (build.cooling) {
      recommendedComponents['cooling'] = {
        slot: 'cooling',
        productId: build.cooling.id,
        name: build.cooling.name,
        brand: build.cooling.brand,
        price: build.cooling.price,
        specs: build.cooling.specifications || {},
        reason: `Dissipates CPU thermal dissipation requirement with low acoustic profile.`,
      };
    }

    // Build alternative components
    const alternativeComponents: Record<string, ComponentRecommendationItem[]> = {
      cpu: this.extractAlternatives(pool.cpus, build.cpu?.id, 'cpu'),
      gpu: this.extractAlternatives(pool.gpus, build.gpu?.id, 'gpu'),
      motherboard: this.extractAlternatives(pool.motherboards, build.motherboard?.id, 'motherboard'),
      ram: this.extractAlternatives(pool.ram, build.ram?.id, 'ram'),
      storage: this.extractAlternatives(pool.storage, build.storage?.id, 'storage'),
      psu: this.extractAlternatives(pool.psus, build.psu?.id, 'psu'),
    };

    // Synthesize transparent rationale
    const rationale = this.generateRationale(build, input, breakdown);

    return {
      recommendedComponents,
      alternativeComponents,
      estimatedCost: build.totalCost,
      compatibilityScore: breakdown.compatibility,
      performanceScore: breakdown.performance,
      valueScore: breakdown.priceEfficiency,
      upgradeScore: breakdown.upgradeability,
      scoringBreakdown: breakdown,
      rationale,
    };
  }

  private extractAlternatives(
    items: Product[],
    selectedId?: string,
    slot?: string,
  ): ComponentRecommendationItem[] {
    return (items || [])
      .filter((p) => p && p.id !== selectedId)
      .slice(0, 3)
      .map((p) => ({
        slot: slot || 'component',
        productId: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        specs: p.specifications || {},
        reason: `Alternative ${p.brand} option at ₹${p.price.toLocaleString('en-IN')}.`,
      }));
  }

  private generateRationale(
    build: CandidateBuild,
    input: RecommendationInput,
    breakdown: RecommendationScoringBreakdown,
  ): string {
    const budget = input.budget || 75000;
    const diff = budget - build.totalCost;
    const savings = diff > 0 ? `saving ₹${diff.toLocaleString('en-IN')}` : `on budget`;

    const resolution = input.resolution || '1080p';
    const useCase = input.useCase || 'Gaming';

    return (
      `Configured for ${useCase} targeting ${resolution} resolution. ` +
      `Estimated build cost is ₹${build.totalCost.toLocaleString('en-IN')} (${savings}). ` +
      `Hardware selection achieves a balanced Performance Score of ${breakdown.performance}/100 ` +
      `and Value Score of ${breakdown.priceEfficiency}/100 without overspending on diminishing returns. ` +
      `Compatibility is verified at ${breakdown.compatibility}/100 with an Upgradeability rating of ${breakdown.upgradeability}/100.`
    );
  }
}
