import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';
import { SharedBuildsController } from './shared-builds.controller';

describe('BuildsController & SharedBuildsController', () => {
  let buildsController: BuildsController;
  let sharedController: SharedBuildsController;
  let service: jest.Mocked<BuildsService>;

  const mockUser: JwtPayload = {
    sub: 'user-uuid-1',
    email: 'gamer@example.com',
    roles: ['USER'],
    type: 'access',
  };

  const mockBuildResponse: any = {
    id: 'build-uuid-1',
    userId: 'user-uuid-1',
    name: 'Dream Rig',
    items: [],
    calculations: {
      totalPrice: 150000,
      estimatedPowerW: 550,
      recommendedPsuW: 750,
      compatibilityStatus: 'compatible',
      warnings: [],
      performanceScore: 85,
      valueScore: 80,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuildsController, SharedBuildsController],
      providers: [
        {
          provide: BuildsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockBuildResponse),
            findAllByUser: jest.fn().mockResolvedValue({ data: [mockBuildResponse], meta: {} }),
            findOne: jest.fn().mockResolvedValue(mockBuildResponse),
            update: jest.fn().mockResolvedValue(mockBuildResponse),
            remove: jest.fn().mockResolvedValue({ message: 'Deleted' }),
            addItem: jest.fn().mockResolvedValue(mockBuildResponse),
            removeItem: jest.fn().mockResolvedValue(mockBuildResponse),
            replaceItem: jest.fn().mockResolvedValue(mockBuildResponse),
            reorderItems: jest.fn().mockResolvedValue(mockBuildResponse),
            saveVersion: jest.fn().mockResolvedValue({ versionNumber: 2 }),
            getVersions: jest.fn().mockResolvedValue([{ versionNumber: 1 }]),
            getVersion: jest.fn().mockResolvedValue({ versionNumber: 1 }),
            duplicate: jest.fn().mockResolvedValue(mockBuildResponse),
            checkCompatibility: jest.fn().mockResolvedValue({ status: 'compatible' }),
            share: jest.fn().mockResolvedValue({ token: 'tok123' }),
            unpublish: jest.fn().mockResolvedValue({ message: 'Unpublished' }),
            getSharedBuild: jest.fn().mockResolvedValue({ token: 'tok123', build: mockBuildResponse }),
          },
        },
      ],
    }).compile();

    buildsController = module.get<BuildsController>(BuildsController);
    sharedController = module.get<SharedBuildsController>(SharedBuildsController);
    service = module.get(BuildsService);
  });

  describe('BuildsController', () => {
    it('POST /builds -> create', async () => {
      const res = await buildsController.create(mockUser, { name: 'Dream Rig' });
      expect(service.create).toHaveBeenCalledWith(mockUser.sub, { name: 'Dream Rig' });
      expect(res).toBeDefined();
    });

    it('GET /builds -> findAll', async () => {
      await buildsController.findAll(mockUser, { page: 1, limit: 10, skip: 0, sortOrder: 'desc' });
      expect(service.findAllByUser).toHaveBeenCalledWith(mockUser.sub, { page: 1, limit: 10, skip: 0, sortOrder: 'desc' });
    });

    it('GET /builds/:id -> findOne', async () => {
      await buildsController.findOne(mockUser, 'b-1');
      expect(service.findOne).toHaveBeenCalledWith('b-1', mockUser.sub);
    });

    it('PATCH /builds/:id -> update', async () => {
      await buildsController.update(mockUser, 'b-1', { name: 'Renamed' });
      expect(service.update).toHaveBeenCalledWith('b-1', mockUser.sub, { name: 'Renamed' });
    });

    it('DELETE /builds/:id -> remove', async () => {
      await buildsController.remove(mockUser, 'b-1');
      expect(service.remove).toHaveBeenCalledWith('b-1', mockUser.sub);
    });

    it('POST /builds/:id/items -> addItem', async () => {
      await buildsController.addItem(mockUser, 'b-1', { productId: 'p-1' });
      expect(service.addItem).toHaveBeenCalledWith('b-1', mockUser.sub, { productId: 'p-1' });
    });

    it('DELETE /builds/:id/items/:itemId -> removeItem', async () => {
      await buildsController.removeItem(mockUser, 'b-1', 'item-1');
      expect(service.removeItem).toHaveBeenCalledWith('b-1', mockUser.sub, 'item-1');
    });

    it('PUT /builds/:id/items/:itemId -> replaceItem', async () => {
      await buildsController.replaceItem(mockUser, 'b-1', 'item-1', { newProductId: 'p-2' });
      expect(service.replaceItem).toHaveBeenCalledWith('b-1', mockUser.sub, 'item-1', { newProductId: 'p-2' });
    });

    it('PATCH /builds/:id/items/order -> reorderItems', async () => {
      await buildsController.reorderItems(mockUser, 'b-1', { items: [{ itemId: 'item-1', sortOrder: 0 }] });
      expect(service.reorderItems).toHaveBeenCalledWith('b-1', mockUser.sub, { items: [{ itemId: 'item-1', sortOrder: 0 }] });
    });

    it('POST /builds/:id/save -> saveVersion', async () => {
      await buildsController.saveVersion(mockUser, 'b-1', { label: 'Milestone' });
      expect(service.saveVersion).toHaveBeenCalledWith('b-1', mockUser.sub, { label: 'Milestone' });
    });

    it('GET /builds/:id/versions -> getVersions', async () => {
      await buildsController.getVersions(mockUser, 'b-1');
      expect(service.getVersions).toHaveBeenCalledWith('b-1', mockUser.sub);
    });

    it('GET /builds/:id/versions/:versionNumber -> getVersion', async () => {
      await buildsController.getVersion(mockUser, 'b-1', 1);
      expect(service.getVersion).toHaveBeenCalledWith('b-1', mockUser.sub, 1);
    });

    it('POST /builds/:id/duplicate -> duplicate', async () => {
      await buildsController.duplicate(mockUser, 'b-1');
      expect(service.duplicate).toHaveBeenCalledWith('b-1', mockUser.sub);
    });

    it('POST /builds/:id/check -> checkCompatibility', async () => {
      await buildsController.checkCompatibility(mockUser, 'b-1');
      expect(service.checkCompatibility).toHaveBeenCalledWith('b-1', mockUser.sub);
    });

    it('POST /builds/:id/share -> share', async () => {
      await buildsController.share(mockUser, 'b-1', { label: 'Public share' });
      expect(service.share).toHaveBeenCalledWith('b-1', mockUser.sub, { label: 'Public share' });
    });

    it('POST /builds/:id/unpublish -> unpublish', async () => {
      await buildsController.unpublish(mockUser, 'b-1');
      expect(service.unpublish).toHaveBeenCalledWith('b-1', mockUser.sub);
    });
  });

  describe('SharedBuildsController', () => {
    it('GET /shared-builds/:slug -> getSharedBuild', async () => {
      const res = await sharedController.getSharedBuild('slug123');
      expect(service.getSharedBuild).toHaveBeenCalledWith('slug123');
      expect(res).toBeDefined();
    });
  });
});
