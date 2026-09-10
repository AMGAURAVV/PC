import { CandidateBuild } from '../domain/interfaces';
import { RecommendationInput } from '@pc-platform/types';

export class PerformanceScorer {
  /**
   * Evaluates system performance for the given workload, games, resolution, and target FPS.
   * Returns a score between 0 and 100.
   */
  public static score(build: CandidateBuild, input: RecommendationInput): number {
    const cpuScore = this.evaluateCpu(build.cpu, input);
    const gpuScore = this.evaluateGpu(build.gpu, input);
    const ramScore = this.evaluateRam(build.ram, input);
    const storageScore = this.evaluateStorage(build.storage);

    const useCase = (input.useCase || 'gaming').toLowerCase();

    if (useCase === 'gaming') {
      return Math.round(gpuScore * 0.50 + cpuScore * 0.30 + ramScore * 0.15 + storageScore * 0.05);
    } else if (useCase === 'creator' || useCase === 'workstation') {
      return Math.round(cpuScore * 0.40 + gpuScore * 0.35 + ramScore * 0.20 + storageScore * 0.05);
    } else if (useCase === 'streaming') {
      return Math.round(gpuScore * 0.45 + cpuScore * 0.35 + ramScore * 0.15 + storageScore * 0.05);
    } else {
      // productivity or general
      return Math.round(cpuScore * 0.45 + ramScore * 0.30 + storageScore * 0.15 + (gpuScore || 50) * 0.10);
    }
  }

  private static evaluateCpu(cpu: any, input: RecommendationInput): number {
    if (!cpu) return 40;
    const name = (cpu.name || '').toLowerCase();
    const specs = cpu.specifications || {};
    const cores = Number(specs.cores || specs.coreCount || 6);

    let baseScore = 60;
    if (name.includes('i9') || name.includes('ryzen 9')) {
      baseScore = 98;
    } else if (name.includes('i7') || name.includes('ryzen 7')) {
      baseScore = 90;
    } else if (name.includes('i5') || name.includes('ryzen 5')) {
      baseScore = 78;
    } else if (name.includes('i3') || name.includes('ryzen 3')) {
      baseScore = 65;
    }

    // Core count boost for multi-threaded work
    const isMultiThreadWork = ['creator', 'workstation', 'streaming'].includes((input.useCase || '').toLowerCase());
    if (isMultiThreadWork) {
      if (cores >= 16) baseScore += 5;
      else if (cores >= 12) baseScore += 3;
      else if (cores < 8) baseScore -= 8;
    }

    return Math.min(100, Math.max(20, baseScore));
  }

  private static evaluateGpu(gpu: any, input: RecommendationInput): number {
    if (!gpu) return 30;
    const name = (gpu.name || '').toLowerCase();
    const specs = gpu.specifications || {};
    const vramStr = String(specs.vram || specs.memorySize || '8');
    const vram = parseInt(vramStr, 10) || 8;

    let tierScore = 60;
    if (name.includes('4090') || name.includes('7900 xtx')) tierScore = 100;
    else if (name.includes('4080') || name.includes('7900 xt')) tierScore = 94;
    else if (name.includes('4070 ti') || name.includes('7800 xt')) tierScore = 88;
    else if (name.includes('4070') || name.includes('7700 xt')) tierScore = 82;
    else if (name.includes('4060 ti') || name.includes('6700 xt')) tierScore = 75;
    else if (name.includes('4060') || name.includes('7600')) tierScore = 68;
    else if (name.includes('3060') || name.includes('6600')) tierScore = 60;
    else if (name.includes('3050') || name.includes('6500')) tierScore = 48;

    // Target resolution adjustment
    const res = input.resolution || '1080p';
    if (res === '4k') {
      if (vram >= 16 && tierScore >= 88) tierScore += 5;
      else if (vram < 12) tierScore -= 20; // VRAM bottleneck in 4K
    } else if (res === '1440p') {
      if (vram >= 12 && tierScore >= 75) tierScore += 3;
      else if (vram < 8) tierScore -= 10;
    }

    // Target FPS adjustment
    if (input.targetFps && input.targetFps > 144 && tierScore < 75) {
      tierScore -= 10;
    }

    return Math.min(100, Math.max(20, tierScore));
  }

  private static evaluateRam(ram: any, input: RecommendationInput): number {
    if (!ram) return 50;
    const specs = ram.specifications || {};
    const capStr = String(specs.capacity || specs.totalCapacity || '16');
    const capacityGb = parseInt(capStr, 10) || 16;
    const gen = String(specs.type || specs.ramType || 'DDR4').toUpperCase();

    let score = 70;
    if (capacityGb >= 64) score = 98;
    else if (capacityGb >= 32) score = 90;
    else if (capacityGb >= 16) score = 75;
    else score = 50;

    if (gen.includes('DDR5')) {
      score += 5;
    }

    const useCase = (input.useCase || '').toLowerCase();
    if (['creator', 'workstation'].includes(useCase) && capacityGb < 32) {
      score -= 15;
    }

    return Math.min(100, Math.max(30, score));
  }

  private static evaluateStorage(storage: any): number {
    if (!storage) return 60;
    const specs = storage.specifications || {};
    const type = String(specs.type || specs.interface || '').toUpperCase();
    const name = (storage.name || '').toLowerCase();

    if (type.includes('GEN5') || name.includes('gen5') || name.includes('gen 5')) return 98;
    if (type.includes('NVME') || type.includes('PCIE 4') || name.includes('gen4') || name.includes('gen 4')) return 90;
    if (type.includes('PCIE 3') || name.includes('gen3')) return 80;
    if (type.includes('SATA') || name.includes('sata')) return 65;
    return 75;
  }
}
