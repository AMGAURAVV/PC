import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';

import { CacheService } from '../../common/cache/cache.service';
import { PaginatedResponse } from '../../common/dto/response.dto';
import { AdminAuditService } from '../admin-audit.service';
import type {
  AdminBrandFilterDto,
  AdminCreateBrandDto,
  AdminUpdateBrandDto,
} from '../dto/admin-brand.dto';

function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

@Injectable()
export class AdminBrandsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
    private readonly cache: CacheService,
  ) {}

  async findAll(query: AdminBrandFilterDto) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.countryCode) {
      where.countryCode = query.countryCode;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [items, total] = await Promise.all([
      this.db.brand.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      }),
      this.db.brand.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }

  async findOne(id: string) {
    const brand = await this.db.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID "${id}" not found`);
    }

    return brand;
  }

  async create(dto: AdminCreateBrandDto, actor?: any) {
    const slug = dto.slug || generateSlug(dto.name);
    const existing = await this.db.brand.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(`Brand with slug "${slug}" already exists`);
    }

    const brand = await this.db.brand.create({
      data: {
        name: dto.name,
        slug,
        countryCode: dto.countryCode ?? null,
        websiteUrl: dto.websiteUrl ?? null,
        logoUrl: dto.logoUrl ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.record({
      actor,
      action: 'CREATE',
      entityType: 'Brand',
      entityId: brand.id,
      entityLabel: brand.name,
      after: brand,
    });

    this.cache.invalidateByTag('catalog:brands');
    return brand;
  }

  async update(id: string, dto: AdminUpdateBrandDto, actor?: any) {
    const current = await this.findOne(id);
    if (dto.name && !dto.slug && dto.name !== current.name) {
      dto.slug = generateSlug(dto.name);
    }

    const updated = await this.db.brand.update({
      where: { id },
      data: dto,
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Brand',
      entityId: id,
      entityLabel: updated.name,
      before: current,
      after: updated,
    });

    this.cache.invalidateByTag('catalog:brands');
    return updated;
  }

  async delete(id: string, actor?: any, force: boolean = false) {
    const brand = await this.findOne(id);

    // Safe destructive check: Check for assigned products
    const productCount = await this.db.product.count({
      where: { brandId: id },
    });

    if (productCount > 0 && !force) {
      throw new BadRequestException(
        `Cannot delete brand "${brand.name}": ${productCount} products are currently associated with it. Reassign products or use force=true.`,
      );
    }

    await this.db.brand.delete({ where: { id } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'Brand',
      entityId: id,
      entityLabel: brand.name,
      before: brand,
    });

    this.cache.invalidateByTag('catalog:brands');
    return { success: true, message: `Brand "${brand.name}" removed` };
  }
}
