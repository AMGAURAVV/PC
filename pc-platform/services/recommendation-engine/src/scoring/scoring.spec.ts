import {
  PerformanceScorer,
  PriceEfficiencyScorer,
  CompatibilityScorer,
  AvailabilityScorer,
  PowerEfficiencyScorer,
  UpgradeabilityScorer,
  PreferenceScorer,
} from './index';
import { CandidateBuild } from '../domain/interfaces';
import { RecommendationInput } from '@pc-platform/types';

describe('Recommendation Scoring Algorithms (Unit Tests)', () => {
  const mockBaseBuild: CandidateBuild = {
    cpu: {
      id: 'cpu_1',
      name: 'AMD Ryzen 7 7800X3D',
      price: 36999,
      specifications: { socket: 'AM5', cores: 8, tdp: 120, socketType: 'AM5' },
    } as any,
    motherboard: {
      id: 'mb_1',
      name: 'MSI MAG B650 TOMAHAWK WIFI',
      price: 21999,
      specifications: { socket: 'AM5', memoryType: 'DDR5', formFactor: 'ATX', ramSlots: 4, m2Slots: 3, pcieGen5: true },
    } as any,
    ram: {
      id: 'ram_1',
      name: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
      price: 10499,
      specifications: { type: 'DDR5', capacity: 32, speed: 6000 },
    } as any,
    gpu: {
      id: 'gpu_1',
      name: 'NVIDIA GeForce RTX 4080 Super 16GB',
      price: 102999,
      specifications: { vram: 16, tdp: 320, length: 304 },
    } as any,
    storage: {
      id: 'ssd_1',
      name: 'Samsung 990 PRO 2TB NVMe SSD',
      price: 16999,
      specifications: { capacity: 2000, type: 'NVMe', gen: 4 },
    } as any,
    psu: {
      id: 'psu_1',
      name: 'Corsair RM850x 850W Gold',
      price: 12499,
      specifications: { wattage: 850, efficiencyRating: '80 Plus Gold' },
    } as any,
    case: {
      id: 'case_1',
      name: 'Lian Li LANCOOL 216',
      price: 8499,
      specifications: { maxGpuLength: 392, maxCoolerHeight: 180, formFactor: 'ATX' },
    } as any,
    cooling: {
      id: 'cooler_1',
      name: 'DeepCool AK620 Digital',
      price: 6499,
      specifications: { height: 162, socket: 'AM5' },
    } as any,
    totalCost: 216993,
  };

  const defaultInput: RecommendationInput = {
    useCase: 'gaming',
    budget: 230000,
    upgradePreference: 'future_upgradeability',
  };

  describe('PerformanceScorer', () => {
    it('calculates high performance score for high-end gaming configuration', () => {
      const score = PerformanceScorer.score(mockBaseBuild, defaultInput);
      expect(score).toBeGreaterThanOrEqual(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('adapts weighting for workstation/creator workload favoring CPU and RAM', () => {
      const creatorInput: RecommendationInput = {
        useCase: 'creator',
        budget: 230000,
      };
      const score = PerformanceScorer.score(mockBaseBuild, creatorInput);
      expect(score).toBeGreaterThan(70);
    });
  });

  describe('PriceEfficiencyScorer', () => {
    it('scores high when build utilization is in sweet-spot (85-99% of budget)', () => {
      const score = PriceEfficiencyScorer.score(mockBaseBuild, 90, defaultInput);
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('penalizes builds that exceed user budget', () => {
      const tightBudgetInput: RecommendationInput = {
        useCase: 'gaming',
        budget: 180000, // lower than 216993
      };
      const score = PriceEfficiencyScorer.score(mockBaseBuild, 90, tightBudgetInput);
      expect(score).toBeLessThan(50);
    });
  });

  describe('CompatibilityScorer', () => {
    it('returns 100 score and compatible status for matching parts', () => {
      const result = CompatibilityScorer.score(mockBaseBuild);
      expect(result.status).toBe('compatible');
      expect(result.score).toBe(100);
      expect(result.notes).toHaveLength(0);
    });

    it('flags socket mismatch and severely docks score', () => {
      const mismatchedBuild: CandidateBuild = {
        ...mockBaseBuild,
        motherboard: {
          ...mockBaseBuild.motherboard,
          specifications: { ...mockBaseBuild.motherboard?.specifications, socket: 'LGA1700' },
        } as any,
      };
      const result = CompatibilityScorer.score(mismatchedBuild);
      expect(result.status).toBe('incompatible');
      expect(result.score).toBeLessThanOrEqual(30);
      expect(result.notes.some((n) => n.includes('Socket mismatch'))).toBe(true);
    });

    it('flags power deficit when PSU wattage is below system peak draw', () => {
      const underpoweredBuild: CandidateBuild = {
        ...mockBaseBuild,
        psu: {
          ...mockBaseBuild.psu,
          specifications: { wattage: 450 }, // system draw = 120 + 320 + 80 = 520W
        } as any,
      };
      const result = CompatibilityScorer.score(underpoweredBuild);
      expect(result.status).toBe('incompatible');
      expect(result.notes.some((n) => n.includes('Power deficit'))).toBe(true);
    });
  });

  describe('AvailabilityScorer', () => {
    it('scores 100 when all parts are in stock', () => {
      const score = AvailabilityScorer.score(mockBaseBuild);
      expect(score).toBe(100);
    });
  });

  describe('PowerEfficiencyScorer', () => {
    it('evaluates PSU headroom and 80 Plus Gold rating favorably', () => {
      const score = PowerEfficiencyScorer.score(mockBaseBuild);
      expect(score).toBeGreaterThanOrEqual(75);
    });
  });

  describe('UpgradeabilityScorer', () => {
    it('scores AM5 and DDR5 platform high for future upgradeability', () => {
      const score = UpgradeabilityScorer.score(mockBaseBuild, defaultInput);
      expect(score).toBeGreaterThanOrEqual(80);
    });
  });

  describe('PreferenceScorer', () => {
    it('gives bonus when Wi-Fi requirement matches motherboard with Wi-Fi', () => {
      const wifiInput: RecommendationInput = {
        ...defaultInput,
        wifiRequirement: true,
      };
      const score = PreferenceScorer.score(mockBaseBuild, wifiInput);
      expect(score).toBe(100);
    });
  });
});
