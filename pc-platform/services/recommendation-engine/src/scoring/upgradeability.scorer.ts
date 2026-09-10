import { CandidateBuild } from '../domain/interfaces';
import { RecommendationInput } from '@pc-platform/types';

export class UpgradeabilityScorer {
  /**
   * Evaluates platform longevity, future component upgrade path, and expansion slots.
   * Returns a score between 0 and 100.
   */
  public static score(build: CandidateBuild, input: RecommendationInput): number {
    const cpuSpecs = build.cpu?.specifications || {};
    const mbSpecs = build.motherboard?.specifications || {};
    const ramSpecs = build.ram?.specifications || {};
    const psuSpecs = build.psu?.specifications || {};
    const gpuSpecs = build.gpu?.specifications || {};

    // 1. Platform Longevity (Socket Lifecycle)
    const socket = String(cpuSpecs.socket || mbSpecs.socket || '').toLowerCase();
    let socketScore = 75;
    if (socket.includes('am5')) {
      socketScore = 100; // Active platform with ongoing CPU generation roadmap
    } else if (socket.includes('1700') || socket.includes('lga1700')) {
      socketScore = 70; // 14th gen is final generation on LGA1700
    } else if (socket.includes('am4')) {
      socketScore = 60; // Mature budget platform
    }

    // 2. Memory Upgrade Path (DDR5 vs DDR4)
    const ramGen = String(ramSpecs.type || mbSpecs.memoryType || '').toUpperCase();
    const ramScore = ramGen.includes('DDR5') ? 95 : 65;

    // 3. Motherboard expansion headroom (RAM slots, M.2 slots)
    const ramSlots = Number(mbSpecs.ramSlots || mbSpecs.memorySlots || 4);
    const m2Slots = Number(mbSpecs.m2Slots || 2);
    let mbExpansionScore = 75;
    if (ramSlots >= 4 && m2Slots >= 3) mbExpansionScore = 100;
    else if (ramSlots >= 4 && m2Slots >= 2) mbExpansionScore = 90;
    else if (ramSlots <= 2 && m2Slots <= 1) mbExpansionScore = 60;

    // 4. Power supply headroom for future GPU upgrades
    const cpuTdp = Number(cpuSpecs.tdp || 65);
    const gpuTdp = Number(gpuSpecs.tdp || 150);
    const systemDraw = cpuTdp + gpuTdp + 75;
    const psuWatts = Number(psuSpecs.wattage || 650);
    const spareWatts = psuWatts - systemDraw;

    let psuHeadroomScore = 70;
    if (spareWatts >= 250) {
      psuHeadroomScore = 100; // Can easily take an upgrade to an 80/90 class GPU later
    } else if (spareWatts >= 150) {
      psuHeadroomScore = 88;
    } else if (spareWatts < 75) {
      psuHeadroomScore = 55;
    }

    // Adjust weighting if user preference specifies 'future_upgradeability'
    const upgradePref = input.upgradePreference || 'balanced';
    let weights = { socket: 0.35, ram: 0.25, mb: 0.20, psu: 0.20 };
    if (upgradePref === 'future_upgradeability') {
      weights = { socket: 0.40, ram: 0.30, mb: 0.15, psu: 0.15 };
    } else if (upgradePref === 'immediate_value') {
      weights = { socket: 0.25, ram: 0.25, mb: 0.25, psu: 0.25 };
    }

    const total = Math.round(
      socketScore * weights.socket +
        ramScore * weights.ram +
        mbExpansionScore * weights.mb +
        psuHeadroomScore * weights.psu,
    );

    return Math.min(100, Math.max(30, total));
  }
}
