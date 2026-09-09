import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';
import { AdminAuditService } from '../admin-audit.service';
import {
  AdminCategoryFilterDto,
  AdminCreateCategoryDto,
  AdminUpdateCategoryDto,
  AdminReorderCategoriesDto,
} from '../dto/admin-category.dto';
import { PaginatedResponse } from '../../common/dto/response.dto';
import { CacheService } from '../../common/cache/cache.service';

function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

@Injectable()
export class AdminCategoriesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
    private readonly cache: CacheService,
  ) {}

  async findAll(query: AdminCategoryFilterDto) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.parentId !== undefined) {
      where.parentId = query.parentId === 'null' ? null : query.parentId;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [items, total] = await Promise.all([
      this.db.category.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          parent: true,
          children: true,
          _count: { select: { productCategories: true } },
        },
      }),
      this.db.category.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }

  async findOne(id: string) {
    const category = await this.db.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: { select: { productCategories: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  async create(dto: AdminCreateCategoryDto, actor?: any) {
    const slug = dto.slug || generateSlug(dto.name);
    const existing = await this.db.category.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(`Category with slug "${slug}" already exists`);
    }

    const category = await this.db.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
        parentId: dto.parentId || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.record({
      actor,
      action: 'CREATE',
      entityType: 'Category',
      entityId: category.id,
      entityLabel: category.name,
      after: category,
    });

    this.cache.invalidateByTag('catalog:categories');
    return category;
  }

  async update(id: string, dto: AdminUpdateCategoryDto, actor?: any) {
    const current = await this.findOne(id);
    if (dto.name && !dto.slug && dto.name !== current.name) {
      dto.slug = generateSlug(dto.name);
    }

    const updated = await this.db.category.update({
      where: { id },
      data: dto,
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Category',
      entityId: id,
      entityLabel: updated.name,
      before: current,
      after: updated,
    });

    this.cache.invalidateByTag('catalog:categories');
    return updated;
  }

  async delete(id: string, actor?: any, force: boolean = false) {
    const category = await this.findOne(id);

    // Safe destructive check: Check for assigned products
    const productCount = await this.db.productCategory.count({
      where: { categoryId: id },
    });

    if (productCount > 0 && !force) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}": ${productCount} products are currently assigned to it. Reassign products or use force=true.`,
      );
    }

    // Also check for subcategories
    const childCount = await this.db.category.count({
      where: { parentId: id },
    });

    if (childCount > 0 && !force) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}": ${childCount} subcategories exist. Reassign subcategories or use force=true.`,
      );
    }

    await this.db.category.delete({ where: { id } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'Category',
      entityId: id,
      entityLabel: category.name,
      before: category,
    });

    this.cache.invalidateByTag('catalog:categories');
    return { success: true, message: `Category "${category.name}" removed` };
  }

  async reorder(dto: AdminReorderCategoriesDto, actor?: any) {
    await this.db.$transaction(
      dto.items.map((item) =>
        this.db.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Category',
      metadata: { action: 'REORDER', count: dto.items.length },
    });

    this.cache.invalidateByTag('catalog:categories');
    return { success: true, updatedCount: dto.items.length };
  }
}
