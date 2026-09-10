import { RecommendationService } from './recommendation.service';
import { HardwarePool, IRecommendationEngine } from './domain/interfaces';
import { RecommendationInput, RecommendationResult, Product, ComponentCategory } from '@pc-platform/types';

describe('RecommendationEngine & Service', () => {
  let service: RecommendationService;

  const createProduct = (partial: Partial<Product>): Product => ({
    id: 'mock-id',
    name: 'Mock Product',
    brand: 'MockBrand',
    model: 'MockModel',
    price: 10000,
    stock: 10,
    isActive: true,
    isFeatured: false,
    componentCategory: ComponentCategory.CPU,
    category: {} as any,
    slug: 'mock-product',
    description: 'Mock product description',
    sku: 'SKU-MOCK',
    specifications: {},
    images: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  });

  const mockCpus: Product[] = [
    createProduct({
      id: 'cpu-1',
      name: 'AMD Ryzen 5 7600',
      brand: 'AMD',
      price: 18000,
      stock: 15,
      componentCategory: ComponentCategory.CPU,
      slug: 'ryzen-5-7600',
      specifications: { socket: 'AM5', cores: 6, tdp: 65 },
    }),
    createProduct({
      id: 'cpu-expensive',
      name: 'Intel Core i9 14900KS',
      brand: 'Intel',
      price: 65000,
      stock: 5,
      componentCategory: ComponentCategory.CPU,
      slug: 'i9-14900ks',
      specifications: { socket: 'LGA1700', cores: 24, tdp: 250 },
    }),
  ];

  const mockMotherboards: Product[] = [
    createProduct({
      id: 'mb-am5',
      name: 'MSI B650 Gaming Plus WIFI',
      brand: 'MSI',
      price: 16000,
      stock: 12,
      componentCategory: ComponentCategory.MOTHERBOARD,
      slug: 'msi-b650-wifi',
      specifications: { socket: 'AM5', memoryType: 'DDR5', ramSlots: 4, m2Slots: 2, wifi: true },
    }),
    createProduct({
      id: 'mb-intel',
      name: 'Gigabyte Z790 AORUS ELITE',
      brand: 'Gigabyte',
      price: 24000,
      stock: 8,
      componentCategory: ComponentCategory.MOTHERBOARD,
      slug: 'z790-elite',
      specifications: { socket: 'LGA1700', memoryType: 'DDR5', ramSlots: 4, m2Slots: 3, wifi: true },
    }),
  ];

  const mockGpus: Product[] = [
    createProduct({
      id: 'gpu-mid',
      name: 'NVIDIA GeForce RTX 4070',
      brand: 'NVIDIA',
      price: 54000,
      stock: 10,
      componentCategory: ComponentCategory.GPU,
      slug: 'rtx-4070',
      specifications: { vram: 12, tdp: 200, length: 260 },
    }),
    createProduct({
      id: 'gpu-flagship',
      name: 'NVIDIA GeForce RTX 4090',
      brand: 'NVIDIA',
      price: 180000,
      stock: 2,
      componentCategory: ComponentCategory.GPU,
      slug: 'rtx-4090',
      specifications: { vram: 24, tdp: 450, length: 330 },
    }),
  ];

  const mockRam: Product[] = [
    createProduct({
      id: 'ram-ddr5',
      name: 'Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz',
      brand: 'Corsair',
      price: 9500,
      stock: 20,
      componentCategory: ComponentCategory.RAM,
      slug: 'corsair-ddr5-32gb',
      specifications: { type: 'DDR5', capacity: 32, speed: 6000 },
    }),
  ];

  const mockStorage: Product[] = [
    createProduct({
      id: 'ssd-1tb',
      name: 'Kingston KC3000 1TB NVMe PCIe 4.0',
      brand: 'Kingston',
      price: 7500,
      stock: 25,
      componentCategory: ComponentCategory.STORAGE,
      slug: 'kingston-kc3000-1tb',
      specifications: { type: 'NVMe PCIe 4.0', capacity: 1000 },
    }),
  ];

  const mockPsus: Product[] = [
    createProduct({
      id: 'psu-750w',
      name: 'Corsair RM750e 750W 80+ Gold',
      brand: 'Corsair',
      price: 8500,
      stock: 14,
      componentCategory: ComponentCategory.PSU,
      slug: 'corsair-rm750e',
      specifications: { wattage: 750, efficiencyRating: '80+ Gold' },
    }),
  ];

  const mockCases: Product[] = [
    createProduct({
      id: 'case-atx',
      name: 'Lian Li LANCOOL 216 RGB',
      brand: 'Lian Li',
      price: 7800,
      stock: 15,
      componentCategory: ComponentCategory.CASE,
      slug: 'lancool-216',
      specifications: { maxGpuLength: 390, maxCpuCoolerHeight: 180, rgb: true },
    }),
  ];

  const mockCooling: Product[] = [
    createProduct({
      id: 'cooler-air',
      name: 'Deepcool AK620 Dual Tower CPU Cooler',
      brand: 'Deepcool',
      price: 5200,
      stock: 18,
      componentCategory: ComponentCategory.COOLING,
      slug: 'deepcool-ak620',
      specifications: { height: 160, tdpRating: 260 },
    }),
  ];

  const candidatePool: HardwarePool = {
    cpus: mockCpus,
    motherboards: mockMotherboards,
    gpus: mockGpus,
    ram: mockRam,
    storage: mockStorage,
    psus: mockPsus,
    cases: mockCases,
    cooling: mockCooling,
  };

  beforeEach(() => {
    service = new RecommendationService();
  });

  it('should generate a balanced gaming build adhering to budget and not selecting solely by price', async () => {
    const input: RecommendationInput = {
      budget: 130000,
      useCase: 'gaming',
      resolution: '1440p',
      targetFps: 120,
      wifiRequirement: true,
      rgbPreference: 'subtle',
      upgradePreference: 'balanced',
    };

    const result = await service.getRecommendation(input, candidatePool);

    expect(result).toBeDefined();
    expect(result.recommendedComponents).toBeDefined();
    expect(result.recommendedComponents.cpu).toBeDefined();
    expect(result.recommendedComponents.gpu).toBeDefined();
    expect(result.recommendedComponents.motherboard).toBeDefined();

    // Must NOT simply select the most expensive RTX 4090 (₹1,80,000) when budget is ₹1,30,000
    expect(result.recommendedComponents.gpu.productId).toBe('gpu-mid');
    expect(result.estimatedCost).toBeLessThanOrEqual(input.budget);

    // Scoring breakdown must contain all 7 dimensions
    const sb = result.scoringBreakdown;
    expect(sb.performance).toBeGreaterThan(0);
    expect(sb.priceEfficiency).toBeGreaterThan(0);
    expect(sb.compatibility).toBe(100);
    expect(sb.availability).toBeGreaterThan(0);
    expect(sb.powerEfficiency).toBeGreaterThan(0);
    expect(sb.upgradeability).toBeGreaterThan(0);
    expect(sb.userPreferences).toBeGreaterThan(0);
    expect(sb.overallScore).toBeGreaterThan(50);

    // Human readable rationale must be generated
    expect(result.rationale).toContain('Configured for gaming');
    expect(result.rationale).toContain('1440p');

    // Alternatives must be present
    expect(result.alternativeComponents).toBeDefined();
    expect(Array.isArray(result.alternativeComponents.cpu)).toBe(true);
  });

  it('should prioritize upgradeability when upgradePreference is future_upgradeability', async () => {
    const input: RecommendationInput = {
      budget: 130000,
      useCase: 'gaming',
      upgradePreference: 'future_upgradeability',
    };

    const result = await service.getRecommendation(input, candidatePool);
    expect(result.upgradeScore).toBeGreaterThanOrEqual(70);
  });

  it('should support swapping to an alternative recommendation engine strategy via setEngine', async () => {
    const mockCustomEngine: IRecommendationEngine = {
      generateRecommendation: jest.fn().mockResolvedValue({
        recommendedComponents: {},
        alternativeComponents: {},
        estimatedCost: 99999,
        compatibilityScore: 100,
        performanceScore: 95,
        valueScore: 90,
        upgradeScore: 85,
        scoringBreakdown: {
          performance: 95,
          priceEfficiency: 90,
          compatibility: 100,
          availability: 100,
          powerEfficiency: 90,
          upgradeability: 85,
          userPreferences: 90,
          overallScore: 93,
        },
        rationale: 'Custom AI Engine Rationale',
      }),
    };

    service.setEngine(mockCustomEngine);

    const result = await service.getRecommendation(
      { budget: 100000, useCase: 'creator' },
      candidatePool,
    );

    expect(mockCustomEngine.generateRecommendation).toHaveBeenCalled();
    expect(result.estimatedCost).toBe(99999);
    expect(result.rationale).toBe('Custom AI Engine Rationale');
  });
});
