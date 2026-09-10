import type { BuildComponents, ID } from '@pc-platform/types';

import { SpecNormalizer } from './spec-normalizer';
import type { NormalizedBuild } from './specs.interface';

export interface ComputedMetrics {
  readonly estimatedSystemTdpW: number; // Base overhead + CPU peak + GPU peak + storage + fans + cards
  readonly estimatedTypicalDrawW: number;
  readonly recommendedPsuWattageW: number; // Max of (TDP * 1.25) or GPU vendor recommended
  readonly totalRamCapacityGb: number;
  readonly totalRamSticks: number;
  readonly totalM2Drives: number;
  readonly totalSataDrives: number;
  readonly totalFanCount: number;
  readonly totalExpansionCardCount: number;
  readonly totalPciSlotsUsed: number;
  readonly gpuPcie16PinNeeded: number;
  readonly gpuPcie8PinNeeded: number;
  readonly gpuPcie6PinNeeded: number;
  readonly coolerFanHeadersNeeded: number;
}

export class RuleContext {
  public readonly raw: BuildComponents;
  public readonly normalized: NormalizedBuild;
  public readonly computed: ComputedMetrics;

  constructor(components: BuildComponents) {
    this.raw = components;
    this.normalized = SpecNormalizer.normalizeBuild(components);
    this.computed = this.calculateMetrics(this.normalized);
  }

  private calculateMetrics(n: NormalizedBuild): ComputedMetrics {
    // 1. Base platform overhead: Motherboard chipset, VRM idle, audio, networking
    let peakPowerW = 40;
    let typicalPowerW = 25;

    // CPU draw
    if (n.cpu) {
      const cpuPeak = n.cpu.maxTdpW || n.cpu.tdpW || 65;
      const cpuTypical = n.cpu.tdpW || 65;
      peakPowerW += cpuPeak;
      typicalPowerW += cpuTypical;
    }

    // GPU draw
    if (n.gpu) {
      const gpuPeak = n.gpu.tdpW ? Math.round(n.gpu.tdpW * 1.1) : 150; // 10% transient burst
      const gpuTypical = n.gpu.tdpW || 150;
      peakPowerW += gpuPeak;
      typicalPowerW += gpuTypical;
    }

    // RAM draw: ~5W per DIMM stick under load
    const totalRamSticks = n.ram.reduce((acc, r) => acc + r.stickCount, 0);
    const totalRamCapacityGb = n.ram.reduce((acc, r) => acc + r.totalCapacityGb, 0);
    peakPowerW += totalRamSticks * 5;
    typicalPowerW += totalRamSticks * 3;

    // Storage draw: ~6W per NVMe, ~4W per SATA SSD/HDD
    let totalM2Drives = 0;
    let totalSataDrives = 0;
    for (const s of n.storage) {
      if (s.isM2) totalM2Drives++;
      if (s.isSata || !s.isM2) totalSataDrives++;
      peakPowerW += s.isM2 ? 7 : 5;
      typicalPowerW += 3;
    }

    // Fans draw: ~3W per fan
    const fanCountFromCase = n.fans.reduce((acc, f) => acc + f.quantity, 0);
    const coolerFanHeadersNeeded = n.cpuCooler?.fanHeadersNeeded ?? (n.cpuCooler ? 1 : 0);
    const totalFanCount = fanCountFromCase + (n.cpuCooler?.fanCount ?? 0);
    peakPowerW += totalFanCount * 3;
    typicalPowerW += totalFanCount * 2;

    // Liquid cooler pump: ~15W
    if (n.cpuCooler?.coolerType === 'Liquid') {
      peakPowerW += 15;
      typicalPowerW += 10;
    }

    // Expansion cards: ~25W average or specified
    const totalExpansionCardCount = n.expansionCards.length;
    for (const card of n.expansionCards) {
      const cardW = card.powerRequiredW || 25;
      peakPowerW += cardW;
      typicalPowerW += Math.round(cardW * 0.7);
    }

    // Other components
    for (const other of n.otherComponents) {
      peakPowerW += other.powerW || 10;
      typicalPowerW += other.powerW || 10;
    }

    // Recommended PSU capacity (at least 25% safety headroom)
    const safetyMarginWattage = Math.ceil((peakPowerW * 1.25) / 50) * 50; // Round up to nearest 50W
    const gpuRecommended = n.gpu?.recommendedPsuW || 0;
    const recommendedPsuWattageW = Math.max(safetyMarginWattage, gpuRecommended);

    // PCI slots used: GPU slotWidth + expansion card slot widths
    const gpuSlots = n.gpu?.slotWidth ?? 0;
    const cardSlots = n.expansionCards.reduce((acc, c) => acc + c.slotWidth, 0);
    const totalPciSlotsUsed = gpuSlots + cardSlots;

    // GPU power connectors needed
    const gpuPcie16PinNeeded = n.gpu?.pciePowerConnectors?.pin16Count ?? 0;
    const gpuPcie8PinNeeded = n.gpu?.pciePowerConnectors?.pin8Count ?? 0;
    const gpuPcie6PinNeeded = n.gpu?.pciePowerConnectors?.pin6Count ?? 0;

    return {
      estimatedSystemTdpW: peakPowerW,
      estimatedTypicalDrawW: typicalPowerW,
      recommendedPsuWattageW,
      totalRamCapacityGb,
      totalRamSticks,
      totalM2Drives,
      totalSataDrives,
      totalFanCount,
      totalExpansionCardCount,
      totalPciSlotsUsed,
      gpuPcie16PinNeeded,
      gpuPcie8PinNeeded,
      gpuPcie6PinNeeded,
      coolerFanHeadersNeeded,
    };
  }

  /**
   * Helper to safely get component product ID or empty string
   */
  public getProductId(key: keyof NormalizedBuild): ID | undefined {
    const comp = this.normalized[key];
    if (comp && !Array.isArray(comp)) {
      return (comp as any).productId;
    }
    return undefined;
  }
}
