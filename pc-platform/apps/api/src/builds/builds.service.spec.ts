import { NotFoundException, ForbiddenException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ComponentType } from '@pc-platform/database';
import type { CompatibilityResult } from '@pc-platform/types';

import { BuildsRepository } from './builds.repository';
import { BuildsService } from './builds.service';
import { CompatibilityClientService } from './compatibility-client.service';


describe('BuildsService', () => {
  let service: BuildsService;
  let repo: jest.Mocked<BuildsRepository>;
  let compatClient: jest.Mocked<CompatibilityClientService>;

  const userId = 'user-uuid-1';
  const otherUserId = 'user-uuid-2';
  const buildId = 'build-uuid-1';
  const cpuProductId = 'prod-cpu-1';
  const mbProductId = 'prod-mb-1';
  const gpuProductId = 'prod-gpu-1';

  const mockCpuProduct = {
    id: cpuProductId,
    name: 'AMD Ryzen 7 7800X3D',
    slug: 'amd-ryzen-7-7800x3d',
    componentType: ComponentType.CPU,
    prices: [{ isActive: true, priceType: 'RETAIL', amount: 38999 }],
    cpuSpec: {
      socketType: 'AM5',
      cores: 8,
      threads: 16,
      baseClockMhz: 4200,
      boostClockMhz: 5000,
      tdpW: 120,
    },
    images: [{ url: 'https://cdn.example.com/cpu.jpg', sortOrder: 0 }],
  };

  const mockMbProduct = {
    id: mbProductId,
    name: 'MSI MAG B650 TOMAHAWK WIFI',
    slug: 'msi-mag-b650-tomahawk-wifi',
    componentType: ComponentType.MOTHERBOARD,
    prices: [{ isActive: true, priceType: 'RETAIL', amount: 21999 }],
    motherboardSpec: {
      socketType: 'AM5',
      chipset: 'B650',
      formFactor: 'ATX',
      supportedMemTypes: ['DDR5'],
      ramSlots: 4,
      maxRamGb: 192,
    },
    images: [{ url: 'https://cdn.example.com/mb.jpg', sortOrder: 0 }],
  };

  const mockGpuProduct = {
    id: gpuProductId,
    name: 'NVIDIA GeForce RTX 4080 Super',
    slug: 'nvidia-geforce-rtx-4080-super',
    componentType: ComponentType.GPU,
    prices: [{ isActive: true, priceType: 'RETAIL', amount: 99999 }],
    gpuSpec: {
      vramGb: 16,
      tdpW: 320,
      recommendedPsuW: 750,
      lengthMm: 310,
    },
    images: [{ url: 'https://cdn.example.com/gpu.jpg', sortOrder: 0 }],
  };

  const mockBuild: any = {
    id: buildId,
    userId,
    name: 'My Elite Gaming Rig',
    description: 'High-end 1440p PC',
    status: 'DRAFT',
    isPublic: false,
    thumbnailUrl: null,
    totalPriceCache: 160997,
    deletedAt: null,
    createdAt: new Date('2026-09-09T00:00:00Z'),
    updatedAt: new Date('2026-09-09T01:00:00Z'),
    items: [
      {
        id: 'item-1',
        buildId,
        productId: cpuProductId,
        variantId: null,
        componentType: ComponentType.CPU,
        quantity: 1,
        sortOrder: 0,
        priceSnapshot: 38999,
        notes: null,
        product: mockCpuProduct,
        variant: null,
      },
      {
        id: 'item-2',
        buildId,
        productId: mbProductId,
        variantId: null,
        componentType: ComponentType.MOTHERBOARD,
        quantity: 1,
        sortOrder: 1,
        priceSnapshot: 21999,
        notes: null,
        product: mockMbProduct,
        variant: null,
      },
      {
        id: 'item-3',
        buildId,
        productId: gpuProductId,
        variantId: null,
        componentType: ComponentType.GPU,
        quantity: 1,
        sortOrder: 2,
        priceSnapshot: 99999,
        notes: null,
        product: mockGpuProduct,
        variant: null,
      },
    ],
    versions: [
      {
        id: 'v-1',
        versionNumber: 1,
        label: 'Initial',
        createdAt: new Date(),
        createdBy: userId,
      },
    ],
    sharedLinks: [],
  };

  const mockCompatResult: CompatibilityResult = {
    status: 'compatible',
    compatible: true,
    issues: [],
    warnings: [],
    summary: 'Build is fully compatible.',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildsService,
        {
          provide: BuildsRepository,
          useValue: {
            findAllByUser: jest.fn().mockResolvedValue([mockBuild]),
            countAllByUser: jest.fn().mockResolvedValue(1),
            findById: jest.fn().mockResolvedValue(mockBuild),
            findProductWithSpecs: jest.fn().mockImplementation((id: string) => {
              if (id === cpuProductId) return Promise.resolve(mockCpuProduct);
              if (id === mbProductId) return Promise.resolve(mockMbProduct);
              if (id === gpuProductId) return Promise.resolve(mockGpuProduct);
              return Promise.resolve(null);
            }),
            create: jest.fn().mockResolvedValue(mockBuild),
            update: jest.fn().mockResolvedValue({ ...mockBuild, name: 'Renamed Rig' }),
            updateTotalPrice: jest.fn().mockResolvedValue(mockBuild),
            delete: jest.fn().mockResolvedValue({ ...mockBuild, deletedAt: new Date() }),
            findItemById: jest.fn().mockResolvedValue({
              id: 'item-1',
              buildId,
              productId: cpuProductId,
              quantity: 1,
            }),
            addItem: jest.fn().mockResolvedValue({ id: 'item-new' }),
            updateItem: jest.fn().mockResolvedValue({ id: 'item-1' }),
            removeItem: jest.fn().mockResolvedValue({ id: 'item-1' }),
            getMaxSortOrder: jest.fn().mockResolvedValue(2),
            reorderItems: jest.fn().mockResolvedValue([]),
            getLatestVersionNumber: jest.fn().mockResolvedValue(1),
            createVersion: jest.fn().mockResolvedValue({
              id: 'v-2',
              buildId,
              versionNumber: 2,
              label: 'Milestone 2',
              snapshot: {},
              createdBy: userId,
              createdAt: new Date(),
            }),
            findVersions: jest.fn().mockResolvedValue(mockBuild.versions),
            findVersionByNumber: jest.fn().mockResolvedValue(mockBuild.versions[0]),
            createSharedLink: jest.fn().mockResolvedValue({
              id: 'link-1',
              buildId,
              token: 'abcd1234efgh5678',
              label: 'Shared',
              viewCount: 0,
              expiresAt: null,
              createdAt: new Date(),
            }),
            deactivateAllSharedLinks: jest.fn().mockResolvedValue({ count: 1 }),
            findSharedLinkByToken: jest.fn().mockResolvedValue({
              id: 'link-1',
              buildId,
              token: 'abcd1234efgh5678',
              label: 'Shared',
              viewCount: 5,
              expiresAt: null,
              isActive: true,
              build: mockBuild,
              createdAt: new Date(),
            }),
            incrementShareViewCount: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: CompatibilityClientService,
          useValue: {
            check: jest.fn().mockResolvedValue(mockCompatResult),
          },
        },
      ],
    }).compile();

    service = module.get<BuildsService>(BuildsService);
    repo = module.get(BuildsRepository);
    compatClient = module.get(CompatibilityClientService);
  });

  describe('CRUD & Ownership', () => {
    it('should create a build and automatically generate Version 1', async () => {
      const result = await service.create(userId, {
        name: 'New Build',
        items: [{ productId: cpuProductId }],
      });

      expect(repo.create).toHaveBeenCalled();
      expect(repo.createVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          buildId,
          versionNumber: 1,
          label: 'Initial build creation',
        }),
      );
      expect(result.id).toBe(buildId);
    });

    it('should find a build by id and calculate price, power, psu, and scores', async () => {
      const result = await service.findOne(buildId, userId);

      expect(result.id).toBe(buildId);
      expect(result.calculations.totalPrice).toBe(38999 + 21999 + 99999);
      expect(result.calculations.estimatedPowerW).toBeGreaterThan(450); // 50 (base) + 120 (cpu) + 320 (gpu) = 490W
      expect(result.calculations.recommendedPsuW).toBeGreaterThanOrEqual(750); // GPU recommends 750W
      expect(result.calculations.compatibilityStatus).toBe('compatible');
      expect(result.calculations.performanceScore).toBeGreaterThan(0);
      expect(result.calculations.valueScore).toBeGreaterThan(0);
      expect(compatClient.check).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own the build', async () => {
      await expect(service.findOne(buildId, otherUserId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if build does not exist', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.findOne('non-existent', userId)).rejects.toThrow(NotFoundException);
    });

    it('should update build metadata', async () => {
      const result = await service.update(buildId, userId, { name: 'Renamed Rig' });
      expect(repo.update).toHaveBeenCalledWith(buildId, expect.objectContaining({ name: 'Renamed Rig' }));
      expect(result).toBeDefined();
    });

    it('should soft delete a build', async () => {
      const result = await service.remove(buildId, userId);
      expect(repo.delete).toHaveBeenCalledWith(buildId);
      expect(result.message).toContain('deleted');
    });
  });

  describe('Component Items Workflow', () => {
    it('should add a component and recalculate total price cache', async () => {
      const result = await service.addItem(buildId, userId, {
        productId: gpuProductId,
        quantity: 1,
      });

      expect(repo.addItem).toHaveBeenCalled();
      expect(repo.updateTotalPrice).toHaveBeenCalled();
      expect(result.id).toBe(buildId);
    });

    it('should remove a component item', async () => {
      const result = await service.removeItem(buildId, userId, 'item-1');
      expect(repo.removeItem).toHaveBeenCalledWith('item-1');
      expect(result.id).toBe(buildId);
    });

    it('should replace a component item with another product', async () => {
      const result = await service.replaceItem(buildId, userId, 'item-1', {
        newProductId: gpuProductId,
      });
      expect(repo.updateItem).toHaveBeenCalledWith(
        'item-1',
        expect.objectContaining({
          productId: gpuProductId,
        }),
      );
      expect(result.id).toBe(buildId);
    });

    it('should reorder component items', async () => {
      const result = await service.reorderItems(buildId, userId, {
        items: [
          { itemId: 'item-2', sortOrder: 0 },
          { itemId: 'item-1', sortOrder: 1 },
        ],
      });
      expect(repo.reorderItems).toHaveBeenCalled();
      expect(result.id).toBe(buildId);
    });
  });

  describe('Versioning & Snapshots', () => {
    it('should create an immutable historical version snapshot on save', async () => {
      const result = await service.saveVersion(buildId, userId, {
        label: 'Milestone 2',
      });

      expect(repo.getLatestVersionNumber).toHaveBeenCalledWith(buildId);
      expect(repo.createVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          buildId,
          versionNumber: 2,
          label: 'Milestone 2',
        }),
      );
      expect(result.versionNumber).toBe(2);
    });

    it('should retrieve historical versions list', async () => {
      const versions = await service.getVersions(buildId, userId);
      expect(versions).toHaveLength(1);
      expect(versions[0]?.versionNumber).toBe(1);
    });

    it('should retrieve a specific historical version snapshot', async () => {
      const version = await service.getVersion(buildId, userId, 1);
      expect(version.versionNumber).toBe(1);
    });
  });

  describe('Duplicate, Sharing & Compatibility Check', () => {
    it('should duplicate a build with all its components and create initial copy snapshot', async () => {
      const result = await service.duplicate(buildId, userId);
      expect(repo.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          name: 'My Elite Gaming Rig (Copy)',
        }),
      );
      expect(repo.addItem).toHaveBeenCalledTimes(mockBuild.items.length);
      expect(result).toBeDefined();
    });

    it('should share a build by generating unique token and activating share link', async () => {
      const result = await service.share(buildId, userId, {
        label: 'Reddit review',
      });
      expect(repo.deactivateAllSharedLinks).toHaveBeenCalledWith(buildId);
      expect(repo.createSharedLink).toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith(buildId, { isPublic: true });
      expect(result.token).toBeDefined();
      expect(result.build).toBeDefined();
    });

    it('should unpublish a build and deactivate all share links', async () => {
      const result = await service.unpublish(buildId, userId);
      expect(repo.deactivateAllSharedLinks).toHaveBeenCalledWith(buildId);
      expect(repo.update).toHaveBeenCalledWith(buildId, { isPublic: false });
      expect(result.message).toContain('unpublished');
    });

    it('should retrieve a shared build by token and increment view count', async () => {
      const result = await service.getSharedBuild('abcd1234efgh5678');
      expect(repo.incrementShareViewCount).toHaveBeenCalled();
      expect(result.token).toBe('abcd1234efgh5678');
      expect(result.build.id).toBe(buildId);
    });

    it('should execute on-demand compatibility check via compatibility engine', async () => {
      const result = await service.checkCompatibility(buildId, userId);
      expect(compatClient.check).toHaveBeenCalled();
      expect(result.status).toBe('compatible');
    });
  });
});
