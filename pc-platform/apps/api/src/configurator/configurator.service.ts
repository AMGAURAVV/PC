import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, ComponentType } from '@pc-platform/database';
import type {
  UseCaseDefinition,
  ConfiguratorBaseBuild,
  ConfiguratorOptionsResponse,
  ConfiguratorSlot,
  ConfiguratorUpgradeOption,
} from '@pc-platform/types';

import type { GetBaseBuildsQueryDto } from './dto/configurator.dto';

const USE_CASES: UseCaseDefinition[] = [
  {
    id: 'gaming',
    name: 'Gaming',
    tagline: 'High Frame Rates & Ultra Visuals',
    description: 'Tuned for peak FPS, ray tracing, low input latency, and competitive esports responsiveness.',
    iconName: 'Gamepad2',
    popularApps: ['Cyberpunk 2077', 'Valorant', 'Counter-Strike 2', 'Call of Duty: Warzone', 'GTA V / VI'],
    recommendedBudgetMin: 55000,
    recommendedBudgetMax: 280000,
  },
  {
    id: 'creator',
    name: 'Content Creator',
    tagline: 'Video Editing, 3D & Color Grading',
    description: 'High multicore CPU throughput, massive VRAM for timeline scrubbing, and rapid NVMe storage.',
    iconName: 'Video',
    popularApps: ['Adobe Premiere Pro', 'DaVinci Resolve Studio', 'After Effects', 'Blender', 'Photoshop'],
    recommendedBudgetMin: 85000,
    recommendedBudgetMax: 320000,
  },
  {
    id: 'streaming',
    name: 'Streaming & VTubing',
    tagline: 'Simultaneous Gaming & Broadcast',
    description: 'Dedicated GPU hardware encoders (AV1/NVENC), 32GB+ RAM for broadcast software, and multi-cam support.',
    iconName: 'Radio',
    popularApps: ['OBS Studio', 'Streamlabs', 'VSeeFace', 'Twitch Studio', 'Discord Screen Share'],
    recommendedBudgetMin: 80000,
    recommendedBudgetMax: 220000,
  },
  {
    id: 'productivity',
    name: 'Office & Productivity',
    tagline: 'Silent, Snappy Multitasking',
    description: 'Whisper-quiet thermals, low power draw, and fast app launching for developers, analysts, and traders.',
    iconName: 'Briefcase',
    popularApps: ['Excel (Large Datasets)', 'VS Code', 'Docker Desktop', 'Slack / Teams', 'Multi-Monitor Trading'],
    recommendedBudgetMin: 45000,
    recommendedBudgetMax: 120000,
  },
  {
    id: 'workstation',
    name: 'Deep Learning & CAD',
    tagline: 'Enterprise Compute & Simulation',
    description: 'Maximum CUDA tensor cores, large memory pools, ECC support, and rock-solid 24/7 stability.',
    iconName: 'Cpu',
    popularApps: ['PyTorch / TensorFlow', 'AutoCAD / Revit', 'SolidWorks', 'ANSYS Simulation', 'Unreal Engine 5'],
    recommendedBudgetMin: 180000,
    recommendedBudgetMax: 450000,
  },
  {
    id: 'budget',
    name: 'Budget / Starter',
    tagline: 'Maximum Value per Rupee',
    description: 'Smartly balanced components giving you 1080p 60+ FPS gaming and everyday speed without overpaying.',
    iconName: 'PiggyBank',
    popularApps: ['1080p Esports', 'Web Browsing', 'Homework & Coding', 'Media Streaming'],
    recommendedBudgetMin: 38000,
    recommendedBudgetMax: 75000,
  },
];

const BASE_BUILDS: ConfiguratorBaseBuild[] = [
  // Gaming
  {
    id: 'gaming-1080p-esports',
    name: 'Apex Esports 1080p',
    tier: 'Entry Gaming',
    useCase: 'gaming',
    basePrice: 62990,
    targetResolution: '1080p Competitive (144+ FPS)',
    description: 'Ideal starter esports machine tuned for high-refresh FPS in Valorant, CS2, and Apex Legends.',
    imageUrl: 'https://storage.googleapis.com/pc-platform-assets/builds/apex-1080p.png',
    baselineSpecs: {
      cpu: 'Intel Core i5-12400F (6 Cores / 12 Threads)',
      gpu: 'AMD Radeon RX 7600 8GB GDDR6',
      ram: '16GB (2x8GB) DDR4 3200MHz',
      storage: '1TB NVMe PCIe 4.0 SSD',
      cooling: 'DeepCool AG400 ARGB Tower Air Cooler',
      case: 'Ant Esports ICE-112 Mesh Mid-Tower',
      psu: '550W 80+ Bronze Certified',
      os: 'Windows 11 Home 64-bit License',
      accessories: 'Thermal Paste + Braided Cable Ties',
      warranty: '1-Year Nexus Standard Hardware Warranty',
    },
    defaultItemIds: {},
  },
  {
    id: 'gaming-1440p-enthusiast',
    name: 'CyberForge 1440p Ultra',
    tier: 'Sweet Spot Enthusiast',
    useCase: 'gaming',
    basePrice: 139990,
    targetResolution: '1440p Ultra Ray-Tracing (100+ FPS)',
    description: 'The golden standard gaming setup with AMD 3D V-Cache and RTX 4070 Super for AAA titles.',
    imageUrl: 'https://storage.googleapis.com/pc-platform-assets/builds/cyberforge-1440p.png',
    baselineSpecs: {
      cpu: 'AMD Ryzen 7 7800X3D (8 Cores, 3D V-Cache)',
      gpu: 'NVIDIA GeForce RTX 4070 Super 12GB GDDR6X',
      ram: '32GB (2x16GB) DDR5 6000MHz CL30 EXPO',
      storage: '1TB Gen4 NVMe (5,000 MB/s)',
      cooling: 'DeepCool LS520 SE 240mm Liquid AIO Cooler',
      case: 'Lian Li Lancool 216 ARGB High Airflow',
      psu: '750W 80+ Gold Fully Modular ATX 3.0',
      os: 'Windows 11 Home 64-bit License',
      accessories: 'GPU Anti-Sag Support Bracket Included',
      warranty: '2-Year Nexus Priority On-Site Warranty',
    },
    defaultItemIds: {},
  },
  {
    id: 'gaming-4k-extreme',
    name: 'Titan 4K Apex Elite',
    tier: 'Ultimate Enthusiast',
    useCase: 'gaming',
    basePrice: 249990,
    targetResolution: '4K Native Max Settings + Path Tracing',
    description: 'Zero compromises. High frame-rate 4K HDR gaming with DLSS 3 Frame Generation.',
    imageUrl: 'https://storage.googleapis.com/pc-platform-assets/builds/titan-4k.png',
    baselineSpecs: {
      cpu: 'Intel Core i9-14900KF (24 Cores / 32 Threads)',
      gpu: 'NVIDIA GeForce RTX 4080 Super 16GB GDDR6X',
      ram: '32GB (2x16GB) DDR5 6400MHz RGB',
      storage: '2TB Gen4 NVMe (7,400 MB/s)',
      cooling: 'Corsair iCUE H150i 360mm Liquid AIO Cooler',
      case: 'NZXT H9 Flow Dual-Chamber Panoramic Case',
      psu: '1000W 80+ Platinum ATX 3.0 PCIe 5.0',
      os: 'Windows 11 Pro 64-bit License',
      accessories: 'Custom Braided Cable Extensions & Anti-Sag Kit',
      warranty: '3-Year Nexus VIP Concierge On-Site Warranty',
    },
    defaultItemIds: {},
  },

  // Creator
  {
    id: 'creator-video-pro',
    name: 'StudioForge 4K Creator',
    tier: 'Professional Studio',
    useCase: 'creator',
    basePrice: 148990,
    targetResolution: '4K ProRes / H.265 Real-Time Timeline',
    description: 'Engineered for smooth timeline scrubbing, fast exports, and zero background crash renders.',
    imageUrl: 'https://storage.googleapis.com/pc-platform-assets/builds/studio-4k.png',
    baselineSpecs: {
      cpu: 'AMD Ryzen 9 7900X (12 Cores / 24 Threads)',
      gpu: 'NVIDIA GeForce RTX 4070 12GB Studio Drivers',
      ram: '64GB (2x32GB) DDR5 5600MHz High-Capacity',
      storage: '2TB Ultra Fast NVMe + 2TB Secondary Scratch SSD',
      cooling: 'Noctua NH-D15 Chromax.Black Ultra-Quiet Tower',
      case: 'Fractal Design North Charcoal Glass',
      psu: '850W 80+ Gold Fully Modular',
      os: 'Windows 11 Pro 64-bit Workstation',
      accessories: 'High-speed UHS-II SD Card Reader Hub',
      warranty: '2-Year Nexus Priority Studio Warranty',
    },
    defaultItemIds: {},
  },
  {
    id: 'creator-3d-vfx',
    name: 'VFX & Render Monster',
    tier: 'Production Heavyweight',
    useCase: 'creator',
    basePrice: 269990,
    targetResolution: '8K Video, Blender Cycles, Unreal 5',
    description: 'Designed for 3D animators, simulation artists, and game development studios.',
    imageUrl: 'https://storage.googleapis.com/pc-platform-assets/builds/vfx-monster.png',
    baselineSpecs: {
      cpu: 'AMD Ryzen 9 7950X (16 Cores / 32 Threads)',
      gpu: 'NVIDIA GeForce RTX 4080 Super 16GB GDDR6X',
      ram: '64GB (2x32GB) DDR5 6000MHz Low-Latency',
      storage: '4TB NVMe PCIe 4.0 High-Endurance',
      cooling: 'Arctic Liquid Freezer III 360 A-RGB',
      case: 'Phanteks NV7 Panoramic Full Tower',
      psu: '1000W 80+ Gold PCIe 5.0 12VHPWR',
      os: 'Windows 11 Pro 64-bit Workstation',
      accessories: 'Dual 10GbE Network Expansion Support',
      warranty: '3-Year Nexus VIP Studio Support',
    },
    defaultItemIds: {},
  },

  // Streaming
  {
    id: 'streaming-broadcast-pro',
    name: 'StreamCraft Live Pro',
    tier: 'Broadcast Ready',
    useCase: 'streaming',
    basePrice: 124990,
    targetResolution: '1080p 60FPS Twitch/YouTube Broadcast + 1440p Gaming',
    description: 'Dual encoding power for simultaneous high-bitrate streaming, VTubing avatar tracking, and gaming.',
    imageUrl: 'https://storage.googleapis.com/pc-platform-assets/builds/streamcraft.png',
    baselineSpecs: {
      cpu: 'Intel Core i7-14700F (20 Cores / 28 Threads)',
      gpu: 'NVIDIA GeForce RTX 4070 12GB Dual NVENC',
      ram: '32GB (2x16GB) DDR5 5600MHz',
      storage: '1TB NVMe SSD + 2TB Media Storage',
      cooling: 'DeepCool LT520 240mm Liquid AIO',
      case: 'Montech Sky Two Dual-Glass ARGB',
      psu: '750W 80+ Gold Certified',
      os: 'Windows 11 Home 64-bit',
      accessories: 'Stream Deck Pre-Configuration Profile Included',
      warranty: '2-Year Nexus Priority Warranty',
    },
    defaultItemIds: {},
  },

  // Productivity
  {
    id: 'productivity-power-office',
    name: 'ProDesk Silent Executive',
    tier: 'High Productivity',
    useCase: 'productivity',
    basePrice: 58990,
    targetResolution: 'Triple 4K Monitors @ 60Hz',
    description: 'Whisper-quiet acoustics, instant boot times, and power-efficient operation for heavy daily business use.',
    imageUrl: 'https://storage.googleapis.com/pc-platform-assets/builds/prodesk.png',
    baselineSpecs: {
      cpu: 'Intel Core i5-13500 (14 Cores with UHD Graphics 770)',
      gpu: 'Integrated Intel UHD 770 (Triple Display Ready)',
      ram: '16GB (2x8GB) DDR5 5200MHz',
      storage: '1TB NVMe PCIe 4.0 SSD (3,500 MB/s)',
      cooling: 'Be Quiet! Pure Rock 2 Silent Cooler',
      case: 'Be Quiet! Pure Base 500 Acoustic Sound Dampening',
      psu: '500W 80+ Bronze Silent Power',
      os: 'Windows 11 Pro 64-bit (BitLocker Encrypted)',
      accessories: 'Whisper Sound-Dampening Matting Installed',
      warranty: '3-Year Nexus Enterprise Care',
    },
    defaultItemIds: {},
  },

  // Workstation
  {
    id: 'workstation-deep-learning',
    name: 'Nexus TensorStation AI',
    tier: 'Deep Learning / CAD',
    useCase: 'workstation',
    basePrice: 299990,
    targetResolution: 'Local LLM Inference, CAD SolidWorks & PyTorch',
    description: 'Massive GPU memory bandwidth, ECC RAM compatibility, and 24/7 sustained thermal dissipation.',
    imageUrl: 'https://storage.googleapis.com/pc-platform-assets/builds/workstation-ai.png',
    baselineSpecs: {
      cpu: 'AMD Ryzen 9 7950X (16 Cores, 5.7GHz Boost)',
      gpu: 'NVIDIA GeForce RTX 4090 24GB GDDR6X',
      ram: '64GB (2x32GB) DDR5 5600MHz High Stability',
      storage: '2TB Gen5 NVMe (10,000 MB/s) + 4TB Enterprise HDD',
      cooling: 'Custom Loop / Arctic 420mm Liquid AIO Cooler',
      case: 'Fractal Meshify 2 XL Heavy Workstation Chassis',
      psu: '1200W 80+ Platinum ATX 3.0 Titanium Ready',
      os: 'Dual Boot Windows 11 Pro + Ubuntu 24.04 LTS Ready',
      accessories: 'High-Current 12VHPWR Heavy Duty Cables',
      warranty: '3-Year 24/7 Priority Mission-Critical Support',
    },
    defaultItemIds: {},
  },

  // Budget
  {
    id: 'budget-starter-gamer',
    name: 'Vanguard Starter Gamer',
    tier: 'Budget Champion',
    useCase: 'budget',
    basePrice: 42990,
    targetResolution: '1080p Smooth (60 - 100 FPS)',
    description: 'Carefully engineered entry-level gaming PC that easily handles GTA V, Fortnite, and Valorant without burning a hole in your wallet.',
    imageUrl: 'https://storage.googleapis.com/pc-platform-assets/builds/vanguard-budget.png',
    baselineSpecs: {
      cpu: 'AMD Ryzen 5 5600 (6 Cores / 12 Threads)',
      gpu: 'AMD Radeon RX 6600 8GB GDDR6',
      ram: '16GB (2x8GB) DDR4 3200MHz',
      storage: '512GB NVMe M.2 SSD',
      cooling: 'AMD Wraith Stealth Stock Cooler',
      case: 'Ant Esports ICE-100 Mesh Front ARGB',
      psu: '500W 80+ Standard Certified',
      os: 'Windows 11 Home 64-bit License',
      accessories: 'Standard Cable Management Pack',
      warranty: '1-Year Nexus Standard Return-to-Base Warranty',
    },
    defaultItemIds: {},
  },
];

@Injectable()
export class ConfiguratorService {
  constructor(private readonly db: DatabaseService) {}

  getUseCases(): UseCaseDefinition[] {
    return USE_CASES;
  }

  getBaseBuilds(query: GetBaseBuildsQueryDto): ConfiguratorBaseBuild[] {
    let list = [...BASE_BUILDS];

    if (query.useCase) {
      const uc = query.useCase.toLowerCase();
      list = list.filter((b) => b.useCase === uc);
    }

    if (query.budgetMin !== undefined && query.budgetMin > 0) {
      list = list.filter((b) => b.basePrice >= (query.budgetMin ?? 0));
    }

    if (query.budgetMax !== undefined && query.budgetMax > 0) {
      list = list.filter((b) => b.basePrice <= (query.budgetMax ?? 9999999));
    }

    return list;
  }

  getBaseBuildById(id: string): ConfiguratorBaseBuild {
    const build = BASE_BUILDS.find((b) => b.id === id);
    if (!build) {
      throw new NotFoundException(`Base build '${id}' not found`);
    }
    return build;
  }

  async getBaseBuildOptions(baseBuildId: string): Promise<ConfiguratorOptionsResponse> {
    const baseBuild = this.getBaseBuildById(baseBuildId);

    // Query real products from database to enrich options
    const products = await this.db.product.findMany({
      where: { isActive: true },
      include: {
        brand: true,
        prices: { where: { isActive: true } },
      },
      take: 100,
    });

    const getPrice = (prod: any) => {
      const p = prod.prices?.[0]?.amount;
      return p ? Number(p) : 5000;
    };

    // Construct allowed options per slot using curated upgrade matrix tailored to the base build
    const optionsBySlot: Record<ConfiguratorSlot, ConfiguratorUpgradeOption[]> = {
      cpu: this.generateCpuOptions(baseBuild),
      gpu: this.generateGpuOptions(baseBuild),
      ram: this.generateRamOptions(baseBuild),
      storage: this.generateStorageOptions(baseBuild),
      cooling: this.generateCoolingOptions(baseBuild),
      case: this.generateCaseOptions(baseBuild),
      psu: this.generatePsuOptions(baseBuild),
      os: this.generateOsOptions(baseBuild),
      accessories: this.generateAccessoriesOptions(baseBuild),
      warranty: this.generateWarrantyOptions(baseBuild),
    };

    return {
      baseBuild,
      optionsBySlot,
    };
  }

  // ── Slot Upgrade Generators with Beginner-Friendly "Why It Matters" ──

  private generateCpuOptions(base: ConfiguratorBaseBuild): ConfiguratorUpgradeOption[] {
    if (base.id.includes('1080p') || base.useCase === 'budget') {
      return [
        {
          id: 'cpu-base',
          slot: 'cpu',
          name: base.baselineSpecs.cpu,
          brand: 'Intel / AMD',
          price: 11490,
          deltaPrice: 0,
          isDefault: true,
          specs: { Cores: 6, Threads: 12, Clock: '4.4 GHz' },
          whyItMatters: 'Rock-solid 6-core performance that keeps all esports titles running fluidly without bottlenecking entry GPUs.',
          compatibilityStatus: 'compatible',
        },
        {
          id: 'cpu-upgrade-1',
          slot: 'cpu',
          name: 'Intel Core i5-13400F (10 Cores / 16 Threads)',
          brand: 'Intel',
          price: 17490,
          deltaPrice: 6000,
          isDefault: false,
          specs: { Cores: 10, Threads: 16, Clock: '4.6 GHz' },
          whyItMatters: 'Adds 4 Efficient Cores. Prevents stutter when Discord, Spotify, and recording software are active in the background while gaming.',
          compatibilityStatus: 'compatible',
          performanceImpact: { fpsGainPercent: 8, multitaskingScore: 82 },
        },
        {
          id: 'cpu-upgrade-2',
          slot: 'cpu',
          name: 'Intel Core i5-14600KF (14 Cores / 20 Threads, 5.3GHz)',
          brand: 'Intel',
          price: 26990,
          deltaPrice: 15500,
          isDefault: false,
          specs: { Cores: 14, Threads: 20, Clock: '5.3 GHz Unlocked' },
          whyItMatters: 'Unlocked enthusiast processor for 240Hz competitive monitors and intense video rendering speed.',
          compatibilityStatus: 'compatible',
          performanceImpact: { fpsGainPercent: 18, renderSpeedGainPercent: 35 },
        },
      ];
    }

    // High End / Creator
    return [
      {
        id: 'cpu-base',
        slot: 'cpu',
        name: base.baselineSpecs.cpu,
        brand: 'AMD / Intel',
        price: 36990,
        deltaPrice: 0,
        isDefault: true,
        specs: { Cores: 8, Threads: 16, VCache: '96MB 3D V-Cache' },
        whyItMatters: 'The undisputed #1 gaming processor in the world. Its massive 3D V-Cache eliminates 1% low frame dips in simulation and battle royale games.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'cpu-upgrade-1',
        slot: 'cpu',
        name: 'AMD Ryzen 9 7900X3D (12 Cores / 24 Threads, 140MB Cache)',
        brand: 'AMD',
        price: 46990,
        deltaPrice: 10000,
        isDefault: false,
        specs: { Cores: 12, Threads: 24, Clock: '5.6 GHz' },
        whyItMatters: 'Combines gaming 3D V-Cache with 4 extra high-speed cores for creators who game by night and edit 4K video by day.',
        compatibilityStatus: 'compatible',
        performanceImpact: { fpsGainPercent: 5, renderSpeedGainPercent: 40 },
      },
      {
        id: 'cpu-upgrade-2',
        slot: 'cpu',
        name: 'AMD Ryzen 9 7950X3D (16 Cores / 32 Threads, 144MB Cache)',
        brand: 'AMD',
        price: 58990,
        deltaPrice: 22000,
        isDefault: false,
        specs: { Cores: 16, Threads: 32, Clock: '5.7 GHz' },
        whyItMatters: 'The absolute pinnacle of desktop computing. Handles Unreal Engine compiles, 8K video timelines, and 4K max ray-tracing concurrently.',
        compatibilityStatus: 'compatible',
        performanceImpact: { fpsGainPercent: 10, renderSpeedGainPercent: 75 },
      },
    ];
  }

  private generateGpuOptions(base: ConfiguratorBaseBuild): ConfiguratorUpgradeOption[] {
    if (base.id.includes('1080p') || base.useCase === 'budget') {
      return [
        {
          id: 'gpu-base',
          slot: 'gpu',
          name: base.baselineSpecs.gpu,
          brand: 'AMD Radeon',
          price: 24990,
          deltaPrice: 0,
          isDefault: true,
          specs: { VRAM: '8GB GDDR6', Bus: '128-bit', Architecture: 'RDNA 3' },
          whyItMatters: 'Delivers 90-140 FPS in modern 1080p titles at Ultra settings with outstanding power efficiency.',
          compatibilityStatus: 'compatible',
        },
        {
          id: 'gpu-upgrade-1',
          slot: 'gpu',
          name: 'NVIDIA GeForce RTX 4060 8GB GDDR6',
          brand: 'NVIDIA',
          price: 29990,
          deltaPrice: 5000,
          isDefault: false,
          specs: { VRAM: '8GB GDDR6', Tech: 'DLSS 3 Frame Gen', Architecture: 'Ada Lovelace' },
          whyItMatters: 'Unlocks NVIDIA DLSS 3 AI Frame Generation, dramatically boosting frame rates in demanding titles like Cyberpunk.',
          compatibilityStatus: 'compatible',
          performanceImpact: { fpsGainPercent: 15 },
        },
        {
          id: 'gpu-upgrade-2',
          slot: 'gpu',
          name: 'NVIDIA GeForce RTX 4060 Ti 16GB GDDR6',
          brand: 'NVIDIA',
          price: 43990,
          deltaPrice: 19000,
          isDefault: false,
          specs: { VRAM: '16GB GDDR6', Tech: 'DLSS 3 + Double VRAM' },
          whyItMatters: 'Doubles video memory from 8GB to 16GB. Future-proofs your PC for high-resolution texture packs and local AI image generation without running out of memory.',
          compatibilityStatus: 'compatible',
          performanceImpact: { fpsGainPercent: 32 },
        },
      ];
    }

    // High End Gaming / Creator
    return [
      {
        id: 'gpu-base',
        slot: 'gpu',
        name: base.baselineSpecs.gpu,
        brand: 'NVIDIA GeForce',
        price: 59990,
        deltaPrice: 0,
        isDefault: true,
        specs: { VRAM: '12GB GDDR6X', RayTracing: 'Gen 3 RT Cores', DLSS: 'DLSS 3.5' },
        whyItMatters: 'The undisputed sweet-spot 1440p card. Crushes ray tracing with ultra visuals above 100 FPS.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'gpu-upgrade-1',
        slot: 'gpu',
        name: 'NVIDIA GeForce RTX 4070 Ti Super 16GB GDDR6X',
        brand: 'NVIDIA',
        price: 81990,
        deltaPrice: 22000,
        isDefault: false,
        specs: { VRAM: '16GB GDDR6X', Bus: '256-bit Wide Bus' },
        whyItMatters: 'Upgrades memory bus to 256-bit with 16GB VRAM. Provides the high bandwidth needed for 4K gaming and complex 3D rendering.',
        compatibilityStatus: 'compatible',
        performanceImpact: { fpsGainPercent: 24 },
      },
      {
        id: 'gpu-upgrade-2',
        slot: 'gpu',
        name: 'NVIDIA GeForce RTX 4080 Super 16GB GDDR6X',
        brand: 'NVIDIA',
        price: 104990,
        deltaPrice: 45000,
        isDefault: false,
        specs: { VRAM: '16GB High-Speed GDDR6X', Cores: '10,240 CUDA Cores' },
        whyItMatters: 'True native 4K gaming dominance. Maximize full path-tracing at 120Hz on OLED gaming monitors.',
        compatibilityStatus: 'compatible',
        performanceImpact: { fpsGainPercent: 48 },
      },
    ];
  }

  private generateRamOptions(base: ConfiguratorBaseBuild): ConfiguratorUpgradeOption[] {
    return [
      {
        id: 'ram-base',
        slot: 'ram',
        name: base.baselineSpecs.ram,
        brand: 'Corsair / Kingston',
        price: 5490,
        deltaPrice: 0,
        isDefault: true,
        specs: { Capacity: '16GB / 32GB', Configuration: 'Dual Channel' },
        whyItMatters: 'Dual-channel bandwidth prevents system bottlenecks for everyday gaming and background web browsing.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'ram-upgrade-1',
        slot: 'ram',
        name: '32GB (2x16GB) High-Speed DDR5 6000MHz RGB CL30',
        brand: 'G.Skill / Corsair',
        price: 10490,
        deltaPrice: 5000,
        isDefault: false,
        specs: { Capacity: '32GB', Latency: 'CL30 Low-Latency', RGB: 'Yes' },
        whyItMatters: 'Eliminates micro-stutter in heavy open-world games and allows keeping 50 browser tabs open without losing game performance.',
        compatibilityStatus: 'compatible',
        performanceImpact: { multitaskingScore: 90 },
      },
      {
        id: 'ram-upgrade-2',
        slot: 'ram',
        name: '64GB (2x32GB) DDR5 6000MHz High-Capacity Kit',
        brand: 'Corsair Vengeance',
        price: 19990,
        deltaPrice: 14500,
        isDefault: false,
        specs: { Capacity: '64GB', HighDensity: 'True' },
        whyItMatters: 'Crucial for 4K video editing, heavy virtual machines, Docker development, and gigantic 3D assets in Blender.',
        compatibilityStatus: 'compatible',
        performanceImpact: { multitaskingScore: 99, renderSpeedGainPercent: 20 },
      },
    ];
  }

  private generateStorageOptions(base: ConfiguratorBaseBuild): ConfiguratorUpgradeOption[] {
    return [
      {
        id: 'storage-base',
        slot: 'storage',
        name: base.baselineSpecs.storage,
        brand: 'Kingston / Crucial',
        price: 5990,
        deltaPrice: 0,
        isDefault: true,
        specs: { Capacity: '1TB', ReadSpeed: '4,000 MB/s', Interface: 'PCIe 4.0 NVMe' },
        whyItMatters: 'Lightning-fast Windows boots in under 8 seconds and game load screens that finish almost instantly.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'storage-upgrade-1',
        slot: 'storage',
        name: '2TB Kingston KC3000 PCIe 4.0 NVMe (7,000 MB/s)',
        brand: 'Kingston',
        price: 12490,
        deltaPrice: 6500,
        isDefault: false,
        specs: { Capacity: '2TB (Double Space)', ReadSpeed: '7,000 MB/s' },
        whyItMatters: 'Doubles your game storage capacity to 2TB so you can store 20+ modern AAA games without constantly uninstalling favorites.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'storage-upgrade-2',
        slot: 'storage',
        name: '4TB Crucial T500 Ultra-Speed Pro NVMe (7,400 MB/s with Heatsink)',
        brand: 'Crucial',
        price: 24990,
        deltaPrice: 19000,
        isDefault: false,
        specs: { Capacity: '4TB Massive', Endurance: '2400 TBW' },
        whyItMatters: 'Massive high-speed archive. Perfect for storing uncompressed video footage, RAW photos, and entire steam libraries on a single blazing drive.',
        compatibilityStatus: 'compatible',
      },
    ];
  }

  private generateCoolingOptions(base: ConfiguratorBaseBuild): ConfiguratorUpgradeOption[] {
    return [
      {
        id: 'cooling-base',
        slot: 'cooling',
        name: base.baselineSpecs.cooling,
        brand: 'DeepCool / Arctic',
        price: 2990,
        deltaPrice: 0,
        isDefault: true,
        specs: { Type: 'Tower Air / 240mm AIO', Fans: 'PWM Low-Noise' },
        whyItMatters: 'Keeps CPU temperatures safe and cool under typical gaming loads without thermal throttling.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'cooling-upgrade-1',
        slot: 'cooling',
        name: '240mm ARGB Liquid AIO Cooler with Infinity Mirror',
        brand: 'DeepCool LS520 SE',
        price: 6490,
        deltaPrice: 3500,
        isDefault: false,
        specs: { Radiator: '240mm Aluminum', Pump: 'High-RPM Ceramic' },
        whyItMatters: 'Lowers CPU temps by an additional 8-10°C, ensuring whisper-quiet acoustics and adding stunning customizable ARGB infinity lighting.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'cooling-upgrade-2',
        slot: 'cooling',
        name: '360mm High-Performance Liquid AIO with LCD Temp Display',
        brand: 'NZXT Kraken / Corsair',
        price: 14990,
        deltaPrice: 12000,
        isDefault: false,
        specs: { Radiator: '360mm Triple Fan', Display: 'Real-time CPU/GPU Temp LCD' },
        whyItMatters: 'Maximum cooling overhead for aggressive overclocking. The customizable on-pump screen displays live temperatures or custom GIFs right inside your chassis.',
        compatibilityStatus: 'compatible',
      },
    ];
  }

  private generateCaseOptions(base: ConfiguratorBaseBuild): ConfiguratorUpgradeOption[] {
    return [
      {
        id: 'case-base',
        slot: 'case',
        name: base.baselineSpecs.case,
        brand: 'Ant Esports / Montech',
        price: 3490,
        deltaPrice: 0,
        isDefault: true,
        specs: { Type: 'Mid-Tower Mesh', FansIncluded: '3x ARGB' },
        whyItMatters: 'Mesh front panel delivers direct fresh air to keep internal graphics cards running cool.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'case-upgrade-1',
        slot: 'case',
        name: 'Lian Li Lancool 216 Premium ARGB High-Airflow',
        brand: 'Lian Li',
        price: 7990,
        deltaPrice: 4500,
        isDefault: false,
        specs: { FrontFans: 'Dual 160mm Giant Fans', CableManagement: 'Modular Straps' },
        whyItMatters: 'Features giant 160mm front fans that push 40% more airflow while spinning slower and quieter. Tool-less glass panels make cleaning dust a breeze.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'case-upgrade-2',
        slot: 'case',
        name: 'NZXT H9 Flow Panoramic Dual-Chamber Showcase',
        brand: 'NZXT',
        price: 15490,
        deltaPrice: 12000,
        isDefault: false,
        specs: { Glass: 'Seamless Pillar-less Curved Glass', Chambers: 'Dual Chamber PSU Compartment' },
        whyItMatters: 'Panoramic pillar-less glass showcase that conceals power cables in a second rear chamber for a showroom-tier aquarium aesthetic.',
        compatibilityStatus: 'compatible',
      },
    ];
  }

  private generatePsuOptions(base: ConfiguratorBaseBuild): ConfiguratorUpgradeOption[] {
    return [
      {
        id: 'psu-base',
        slot: 'psu',
        name: base.baselineSpecs.psu,
        brand: 'MSI / DeepCool',
        price: 4290,
        deltaPrice: 0,
        isDefault: true,
        specs: { Efficiency: '80+ Bronze/Gold', Protection: 'OVP / OCP / SCP' },
        whyItMatters: 'Certified reliable power that meets exact manufacturer electrical safety parameters with solid transient protection.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'psu-upgrade-1',
        slot: 'psu',
        name: '750W 80+ Gold Fully Modular ATX 3.0 / PCIe 5.0',
        brand: 'Corsair RM750e',
        price: 8490,
        deltaPrice: 4200,
        isDefault: false,
        specs: { Rating: '80+ Gold 90% Efficiency', Modular: 'Fully Modular', Native12VHPWR: 'Yes' },
        whyItMatters: 'Only plug in the cables your build needs, reducing internal clutter. ATX 3.0 standard safely absorbs 200% transient power spikes without crashing.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'psu-upgrade-2',
        slot: 'psu',
        name: '1000W 80+ Platinum Fully Modular Ultra-Quiet PSU',
        brand: 'Seasonic / Corsair RM1000x',
        price: 15990,
        deltaPrice: 11700,
        isDefault: false,
        specs: { Rating: '80+ Platinum Ultra-Clean', Capacity: '1000 Watts', ZeroRpmFan: 'Yes' },
        whyItMatters: 'Zero RPM silent fan mode under 40% load. Guarantees massive power headroom for next-gen graphics card upgrades over the next 7+ years.',
        compatibilityStatus: 'compatible',
      },
    ];
  }

  private generateOsOptions(base: ConfiguratorBaseBuild): ConfiguratorUpgradeOption[] {
    return [
      {
        id: 'os-base',
        slot: 'os',
        name: base.baselineSpecs.os,
        brand: 'Microsoft',
        price: 9990,
        deltaPrice: 0,
        isDefault: true,
        specs: { Edition: 'Windows 11 Home', Architecture: '64-bit Genuine' },
        whyItMatters: 'Genuine digital license with direct Microsoft security updates, Auto-HDR, and DirectStorage game acceleration.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'os-upgrade-1',
        slot: 'os',
        name: 'Microsoft Windows 11 Pro 64-bit (BitLocker + Remote Desktop)',
        brand: 'Microsoft',
        price: 13990,
        deltaPrice: 4000,
        isDefault: false,
        specs: { Edition: 'Windows 11 Pro', Security: 'BitLocker Full Disk Encryption' },
        whyItMatters: 'Adds BitLocker military-grade hardware drive encryption, Windows Sandbox for secure testing, and built-in Remote Desktop host capability.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'os-upgrade-2',
        slot: 'os',
        name: 'Dual Boot: Windows 11 Pro + Ubuntu Linux 24.04 LTS Pre-Configured',
        brand: 'Microsoft & Canonical',
        price: 15990,
        deltaPrice: 6000,
        isDefault: false,
        specs: { Setup: 'Dual Partition Boot', Support: 'Developer & AI Ready' },
        whyItMatters: 'Pre-configured dual boot partitions with NVIDIA Linux drivers and CUDA libraries installed for machine learning and programming workflows.',
        compatibilityStatus: 'compatible',
      },
    ];
  }

  private generateAccessoriesOptions(base: ConfiguratorBaseBuild): ConfiguratorUpgradeOption[] {
    return [
      {
        id: 'acc-base',
        slot: 'accessories',
        name: base.baselineSpecs.accessories,
        brand: 'Nexus Hardware',
        price: 990,
        deltaPrice: 0,
        isDefault: true,
        specs: { InBox: 'Premium Thermal Paste & Ties' },
        whyItMatters: 'Ensures neat cable routing and optimal thermal heat transfer right out of the box.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'acc-upgrade-1',
        slot: 'accessories',
        name: 'Nexus Battlestation Armor Pack (Anti-Sag Bracket + 3x Extra ARGB Fans)',
        brand: 'Nexus Gaming',
        price: 3490,
        deltaPrice: 2500,
        isDefault: false,
        specs: { Fans: '3x 120mm PWM ARGB', GPUHolder: 'Adjustable CNC Aluminum' },
        whyItMatters: 'Prevents heavy modern graphics cards from sagging and bending motherboard PCIe slots over time, while adding 3 fans for maximum case airflow.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'acc-upgrade-2',
        slot: 'accessories',
        name: 'Nexus Esports Pro Bundle (Mechanical RGB Keyboard + 26K DPI Mouse + XXL Mat)',
        brand: 'Nexus Esports Gear',
        price: 7990,
        deltaPrice: 7000,
        isDefault: false,
        specs: { Keyboard: 'Hot-swap Red Linear Switches', Mouse: '58g Optical 26K DPI', Mat: '900x400mm Cordura' },
        whyItMatters: 'Complete plug-and-play gaming peripheral setup matching your system aesthetics with competition-grade sensor accuracy.',
        compatibilityStatus: 'compatible',
      },
    ];
  }

  private generateWarrantyOptions(base: ConfiguratorBaseBuild): ConfiguratorUpgradeOption[] {
    return [
      {
        id: 'war-base',
        slot: 'warranty',
        name: base.baselineSpecs.warranty,
        brand: 'Nexus Care',
        price: 0,
        deltaPrice: 0,
        isDefault: true,
        specs: { Term: '1 Year', Coverage: 'Parts & Labor Included' },
        whyItMatters: 'Comprehensive 1-year warranty on all installed hardware with free diagnostics and repair.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'war-upgrade-1',
        slot: 'warranty',
        name: '2-Year Nexus Extended Shield + Doorstep Pickup & Return',
        brand: 'Nexus Care Plus',
        price: 2990,
        deltaPrice: 2990,
        isDefault: false,
        specs: { Term: '2 Years', Service: 'Pan-India Doorstep Logistics' },
        whyItMatters: 'Extends full component coverage to 2 years with free insured doorstep courier pickup and drop if any hardware ever develops an issue.',
        compatibilityStatus: 'compatible',
      },
      {
        id: 'war-upgrade-2',
        slot: 'warranty',
        name: '3-Year Nexus VIP Concierge (On-Site Technician + Same-Day Swap)',
        brand: 'Nexus Care Elite',
        price: 6490,
        deltaPrice: 6490,
        isDefault: false,
        specs: { Term: '3 Years Full Coverage', Priority: 'On-Site Technician & Loaner Unit' },
        whyItMatters: 'Total peace of mind. A certified technician visits your home or office to service your PC on-site, plus priority 24/7 WhatsApp technician support.',
        compatibilityStatus: 'compatible',
      },
    ];
  }
}
