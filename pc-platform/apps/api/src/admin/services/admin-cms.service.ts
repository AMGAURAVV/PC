import { Injectable, NotFoundException } from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

import type { CacheService } from '../../common/cache/cache.service';
import { PaginatedResponse } from '../../common/dto/response.dto';
import type { AdminAuditService } from '../admin-audit.service';
import type {
  CreateBannerDto,
  UpdateBannerDto,
  BannerFilterDto,
  CreateHomepageSectionDto,
  UpdateHomepageSectionDto,
  SetFeaturedProductsDto,
} from '../dto/admin-cms.dto';

@Injectable()
export class AdminCmsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
    private readonly cache: CacheService,
  ) {}

  // ── Banners ──

  async findAllBanners(query: BannerFilterDto) {
    const where: any = {};
    if (query.position) {
      where.position = query.position;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { subtitle: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.banner.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { sortOrder: 'asc' },
      }),
      this.db.banner.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }

  async findOneBanner(id: string) {
    const banner = await this.db.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID "${id}" not found`);
    }
    return banner;
  }

  async createBanner(dto: CreateBannerDto, actor?: any) {
    const banner = await this.db.banner.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        imageUrl: dto.imageUrl,
        mobileImageUrl: dto.mobileImageUrl ?? null,
        linkUrl: dto.linkUrl ?? null,
        position: dto.position || 'hero',
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });

    await this.audit.record({
      actor,
      action: 'CREATE',
      entityType: 'Banner',
      entityId: banner.id,
      entityLabel: banner.title,
      after: banner,
    });

    this.cache.invalidateByTag('catalog:homepage');
    return banner;
  }

  async updateBanner(id: string, dto: UpdateBannerDto, actor?: any) {
    const current = await this.findOneBanner(id);

    const updated = await this.db.banner.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.imageUrl && { imageUrl: dto.imageUrl }),
        ...(dto.mobileImageUrl !== undefined && { mobileImageUrl: dto.mobileImageUrl }),
        ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl }),
        ...(dto.position && { position: dto.position }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.startsAt !== undefined && { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }),
        ...(dto.endsAt !== undefined && { endsAt: dto.endsAt ? new Date(dto.endsAt) : null }),
      },
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Banner',
      entityId: id,
      entityLabel: updated.title,
      before: current,
      after: updated,
    });

    this.cache.invalidateByTag('catalog:homepage');
    return updated;
  }

  async deleteBanner(id: string, actor?: any) {
    const current = await this.findOneBanner(id);
    await this.db.banner.delete({ where: { id } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'Banner',
      entityId: id,
      entityLabel: current.title,
      before: current,
    });

    this.cache.invalidateByTag('catalog:homepage');
    return { success: true, message: `Banner "${current.title}" deleted` };
  }

  // ── Homepage Sections ──

  async findAllSections() {
    return this.db.homepageSection.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createSection(dto: CreateHomepageSectionDto, actor?: any) {
    const section = await this.db.homepageSection.create({
      data: {
        title: dto.title,
        sectionKey: dto.sectionKey,
        type: dto.type,
        config: dto.config,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.record({
      actor,
      action: 'CREATE',
      entityType: 'HomepageSection',
      entityId: section.id,
      entityLabel: section.title,
      after: section,
    });

    this.cache.invalidateByTag('catalog:homepage');
    return section;
  }

  async updateSection(id: string, dto: UpdateHomepageSectionDto, actor?: any) {
    const current = await this.db.homepageSection.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Homepage section with ID "${id}" not found`);
    }

    const updated = await this.db.homepageSection.update({
      where: { id },
      data: dto as any,
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'HomepageSection',
      entityId: id,
      entityLabel: updated.title,
      before: current,
      after: updated,
    });

    this.cache.invalidateByTag('catalog:homepage');
    return updated;
  }

  async deleteSection(id: string, actor?: any) {
    const current = await this.db.homepageSection.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Homepage section with ID "${id}" not found`);
    }

    await this.db.homepageSection.delete({ where: { id } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'HomepageSection',
      entityId: id,
      entityLabel: current.title,
      before: current,
    });

    this.cache.invalidateByTag('catalog:homepage');
    return { success: true, message: `Homepage section "${current.title}" deleted` };
  }

  // ── Featured Products ──

  async getFeaturedProducts() {
    return this.db.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: {
        brand: true,
        prices: { where: { isActive: true } },
        images: { where: { isPrimary: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async setFeaturedProducts(dto: SetFeaturedProductsDto, actor?: any) {
    // Unfeature all products
    await this.db.product.updateMany({
      data: { isFeatured: false },
    });

    // Feature specified products
    if (dto.productIds.length > 0) {
      await this.db.product.updateMany({
        where: { id: { in: dto.productIds } },
        data: { isFeatured: true },
      });
    }

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Product',
      metadata: { action: 'SET_FEATURED_PRODUCTS', count: dto.productIds.length, productIds: dto.productIds },
    });

    this.cache.invalidateByTag('catalog:products');
    this.cache.invalidateByTag('catalog:homepage');
    return { success: true, featuredCount: dto.productIds.length };
  }
}
