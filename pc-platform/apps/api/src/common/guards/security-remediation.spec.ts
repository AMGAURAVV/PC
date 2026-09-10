import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { AdminUsersService } from '../../admin/services/admin-users.service';
import { BuildsService } from '../../builds/builds.service';
import { CartService } from '../../cart/cart.service';

describe('Security Remediation & Vulnerability Fixes Suite', () => {
  describe('IDOR Protection: BuildsService.duplicate', () => {
    it('should reject duplication of private build belonging to another user', async () => {
      const mockRepo: any = {
        findById: jest.fn().mockResolvedValue({
          id: 'build-secret-1',
          userId: 'victim-user-1',
          name: 'Confidential Rig',
          isPublic: false,
          items: [],
        }),
      };

      const buildsService = new BuildsService(mockRepo, {} as any);

      await expect(
        buildsService.duplicate('build-secret-1', 'attacker-user-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow duplication of public build by any user', async () => {
      const publicBuild = {
        id: 'build-public-1',
        userId: 'author-user-1',
        name: 'Public Battle Rig',
        isPublic: true,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const clonedBuild = {
        id: 'build-clone-1',
        name: 'Public Battle Rig (Copy)',
        userId: 'cloner-user-2',
        isPublic: false,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRepo: any = {
        findById: jest.fn().mockImplementation((id: string) => {
          if (id === 'build-public-1') return Promise.resolve(publicBuild);
          return Promise.resolve(clonedBuild);
        }),
        create: jest.fn().mockResolvedValue(clonedBuild),
        updateTotalPrice: jest.fn().mockResolvedValue({}),
        findVersions: jest.fn().mockResolvedValue([]),
        createVersion: jest.fn().mockResolvedValue({}),
      };
      const mockCompatClient: any = {
        check: jest.fn().mockResolvedValue({ isCompatible: true, issues: [] }),
      };

      const buildsService = new BuildsService(mockRepo, mockCompatClient);
      const result = await buildsService.duplicate('build-public-1', 'cloner-user-2');

      expect(result).toBeDefined();
      expect(mockRepo.create).toHaveBeenCalledWith(
        'cloner-user-2',
        expect.objectContaining({ name: 'Public Battle Rig (Copy)' }),
      );
    });
  });

  describe('IDOR Protection: CartService.addBuildBundle', () => {
    it('should reject adding components from another user\'s private build', async () => {
      const mockRepo: any = {
        findBuildWithItems: jest.fn().mockResolvedValue({
          id: 'build-private-99',
          userId: 'user-a',
          isPublic: false,
          items: [{ productId: 'gpu-1', quantity: 1 }],
        }),
      };

      const cartService = new CartService(mockRepo);

      await expect(
        cartService.addBuildBundle('user-b', 'build-private-99'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Privilege Escalation Protection: AdminUsersService', () => {
    let adminUsersService: AdminUsersService;
    let mockDb: any;
    let mockAudit: any;

    beforeEach(() => {
      mockDb = {
        user: {
          findUnique: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        order: {
          count: jest.fn().mockResolvedValue(0),
        },
        role: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'r-1', name: 'super_admin' },
            { id: 'r-2', name: 'admin' },
          ]),
        },
        userRole: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        $transaction: jest.fn().mockResolvedValue([]),
      };
      mockAudit = {
        record: jest.fn().mockResolvedValue({}),
      };

      adminUsersService = new AdminUsersService(mockDb, mockAudit);
    });

    it('should prevent administrators from modifying their own roles', async () => {
      const actor = { id: 'admin-self-1', sub: 'admin-self-1', roles: ['admin'] };
      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-self-1',
        email: 'self@pcplatform.com',
        userRoles: [{ role: { name: 'admin' } }],
      });

      await expect(
        adminUsersService.assignRoles(
          'admin-self-1',
          { roleNames: ['super_admin'] },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent non-super-admin from assigning super_admin role', async () => {
      const actor = { id: 'admin-actor-2', sub: 'admin-actor-2', roles: ['admin'] };
      mockDb.user.findUnique.mockResolvedValue({
        id: 'target-user-3',
        email: 'target@pcplatform.com',
        userRoles: [{ role: { name: 'customer' } }],
      });

      await expect(
        adminUsersService.assignRoles(
          'target-user-3',
          { roleNames: ['super_admin'] },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent non-super-admin from altering existing super_admin roles', async () => {
      const actor = { id: 'admin-actor-2', sub: 'admin-actor-2', roles: ['admin'] };
      mockDb.user.findUnique.mockResolvedValue({
        id: 'target-super-admin',
        email: 'boss@pcplatform.com',
        userRoles: [{ role: { name: 'super_admin' } }],
      });

      await expect(
        adminUsersService.assignRoles(
          'target-super-admin',
          { roleNames: ['customer'] },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent administrators from deleting their own account', async () => {
      const actor = { id: 'admin-self-1', sub: 'admin-self-1', roles: ['admin'] };
      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-self-1',
        email: 'self@pcplatform.com',
        userRoles: [{ role: { name: 'admin' } }],
      });

      await expect(
        adminUsersService.delete('admin-self-1', actor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent non-super-admin from deleting super_admin account', async () => {
      const actor = { id: 'admin-actor-2', sub: 'admin-actor-2', roles: ['admin'] };
      mockDb.user.findUnique.mockResolvedValue({
        id: 'super-admin-target',
        email: 'owner@pcplatform.com',
        userRoles: [{ role: { name: 'super_admin' } }],
      });

      await expect(
        adminUsersService.delete('super-admin-target', actor),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
