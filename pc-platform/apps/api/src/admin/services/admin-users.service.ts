import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

import { PaginatedResponse } from '../../common/dto/response.dto';
import type { AdminAuditService } from '../admin-audit.service';
import { BulkOperationResultDto } from '../dto/admin-common.dto';
import type {
  AdminUserFilterDto,
  AdminUpdateUserStatusDto,
  AdminAssignRolesDto,
  BulkUserStatusDto,
} from '../dto/admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
  ) {}

  async findAll(query: AdminUserFilterDto) {
    const where: any = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.role) {
      where.userRoles = {
        some: { role: { name: query.role } },
      };
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          status: true,
          isVerified: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: { include: { role: true } },
          _count: { select: { orders: true, builds: true, reviews: true } },
        },
      }),
      this.db.user.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }

  async findOne(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: true } },
        addresses: true,
        orders: { take: 10, orderBy: { createdAt: 'desc' } },
        reviews: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: { select: { orders: true, builds: true, reviews: true, wishlists: true } },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async updateStatus(id: string, dto: AdminUpdateUserStatusDto, actor?: any) {
    const current = await this.findOne(id);

    const updated = await this.db.user.update({
      where: { id },
      data: { status: dto.status as any },
    });

    await this.audit.record({
      actor,
      action: dto.status === 'ACTIVE' ? 'ACTIVATE' : 'SUSPEND',
      entityType: 'User',
      entityId: id,
      entityLabel: `${current.firstName} ${current.lastName} (${current.email})`,
      before: { status: current.status },
      after: { status: dto.status },
      metadata: { reason: dto.reason },
    });

    return updated;
  }

  async assignRoles(id: string, dto: AdminAssignRolesDto, actor?: any) {
    const current = await this.findOne(id);

    const actorId = actor?.sub || actor?.id;
    if (actorId && actorId === id) {
      throw new ForbiddenException('Administrators cannot modify their own roles');
    }

    const actorRoles: string[] = (actor?.roles || []).map((r: string) => r.toUpperCase());
    const isSuperAdmin = actorRoles.includes('SUPER_ADMIN');

    const targetHasSuperAdmin = current.userRoles.some(
      (ur: any) => ur.role.name.toUpperCase() === 'SUPER_ADMIN',
    );
    const assigningSuperAdmin = dto.roleNames.some(
      (n: string) => n.toUpperCase() === 'SUPER_ADMIN',
    );

    if ((targetHasSuperAdmin || assigningSuperAdmin) && !isSuperAdmin) {
      throw new ForbiddenException(
        'Only super administrators can manage the super_admin role',
      );
    }

    // Look up roles by name
    const roles = await this.db.role.findMany({
      where: { name: { in: dto.roleNames } },
    });

    if (roles.length !== dto.roleNames.length) {
      const foundNames = roles.map((r) => r.name);
      const missing = dto.roleNames.filter((n) => !foundNames.includes(n));
      throw new BadRequestException(`Unknown roles specified: ${missing.join(', ')}`);
    }

    // Replace user roles in transaction
    await this.db.$transaction([
      this.db.userRole.deleteMany({ where: { userId: id } }),
      this.db.userRole.createMany({
        data: roles.map((role) => ({
          userId: id,
          roleId: role.id,
        })),
      }),
    ]);

    const updated = await this.findOne(id);

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      entityLabel: `${current.email} roles updated to [${dto.roleNames.join(', ')}]`,
      before: { roles: current.userRoles.map((ur: any) => ur.role.name) },
      after: { roles: dto.roleNames },
    });

    return updated;
  }

  async delete(id: string, actor?: any, force: boolean = false) {
    const current = await this.findOne(id);

    const actorId = actor?.sub || actor?.id;
    if (actorId && actorId === id) {
      throw new BadRequestException('Administrators cannot delete their own account');
    }

    const actorRoles: string[] = (actor?.roles || []).map((r: string) => r.toUpperCase());
    const isSuperAdmin = actorRoles.includes('SUPER_ADMIN');

    const targetHasSuperAdmin = current.userRoles.some(
      (ur: any) => ur.role.name.toUpperCase() === 'SUPER_ADMIN',
    );

    if (targetHasSuperAdmin && !isSuperAdmin) {
      throw new ForbiddenException(
        'Only super administrators can delete a super administrator account',
      );
    }

    // Safe destructive check: Check for existing orders
    const orderCount = await this.db.order.count({ where: { userId: id } });
    if (orderCount > 0 && !force) {
      // Soft-delete to preserve order history
      const softDeleted = await this.db.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'INACTIVE',
        },
      });

      await this.audit.record({
        actor,
        action: 'DELETE',
        entityType: 'User',
        entityId: id,
        entityLabel: current.email,
        metadata: { softDelete: true, reason: `User has ${orderCount} existing orders` },
      });

      return {
        success: true,
        softDeleted: true,
        message: `User has ${orderCount} historical orders; account deactivated and soft-deleted`,
      };
    }

    // Hard delete if clean or forced
    await this.db.user.delete({ where: { id } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      entityLabel: current.email,
      before: current,
    });

    return { success: true, softDeleted: false, message: 'User permanently deleted' };
  }

  async bulkStatus(dto: BulkUserStatusDto, actor?: any): Promise<BulkOperationResultDto> {
    const errors: Array<{ id: string; error: string }> = [];
    let successCount = 0;

    for (const id of dto.userIds) {
      try {
        await this.updateStatus(id, { status: dto.status, reason: dto.reason }, actor);
        successCount++;
      } catch (err: any) {
        errors.push({ id, error: err.message || 'Status update failed' });
      }
    }

    return BulkOperationResultDto.create(dto.userIds.length, successCount, errors);
  }
}
