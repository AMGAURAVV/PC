import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';
import { AdminAuditService } from '../admin-audit.service';
import {
  AdminProductFilterDto,
  AdminCreateProductDto,
  AdminUpdateProductDto,
  BulkProductStatusDto,
  BulkProductDeleteDto,
  BulkProductStatusAction,
} from '../dto/admin-product.dto';
import { BulkOperationResultDto } from '../dto/admin-common.dto';
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
export class AdminProductsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
    private readonly cache: CacheService,
  ) {}

  async findAll(query: AdminProductFilterDto) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.categories = {
        some: {
          category: {
            OR: [{ id: query.category }, { slug: query.category }],
          },
        },
      };
    }

    if (query.brand) {
      where.brand = {
        OR: [{ id: query.brand }, { slug: query.brand }],
      };
    }

    if (query.componentType) {
      where.componentType = query.componentType;
    }

    if (query.isDraft !== undefined) {
      where.isDraft = query.isDraft;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.db.product.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include: {
          brand: true,
          categories: { include: { category: true } },
          prices: { where: { isActive: true } },
          inventory: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: true,
        },
      }),
      this.db.product.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }

  async findOne(id: string) {
    const product = await this.db.product.findUnique({
      where: { id },
      include: {
        brand: true,
        categories: { include: { category: true } },
        prices: true,
        inventory: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { prices: true, inventory: true } },
        cpuSpec: true,
        gpuSpec: true,
        motherboardSpec: true,
        ramSpec: true,
        storageSpec: true,
        psuSpec: true,
        caseSpec: true,
        coolerSpec: true,
        fanSpec: true,
        monitorSpec: true,
        peripheralSpec: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  async create(dto: AdminCreateProductDto, actor?: any) {
    const slug = generateSlug(dto.name);
    const existing = await this.db.product.findFirst({
      where: { OR: [{ slug }, ...(dto.sku ? [{ sku: dto.sku }] : [])] },
    });

    if (existing) {
      throw new BadRequestException(
        `Product with slug "${slug}" or SKU "${dto.sku}" already exists`,
      );
    }

    const defaultSupplier = await this.db.supplier.findFirst({ where: { isPlatform: true } })
      || await this.db.supplier.create({
        data: {
          name: 'Platform Warehouse',
          code: 'PLATFORM-WH',
          isPlatform: true,
          isActive: true,
        },
      });

    const isDraft = dto.isDraft ?? false;
    const isActive = dto.isActive ?? true;

    const product = await this.db.product.create({
      data: {
        name: dto.name,
        slug,
        sku: dto.sku || `SKU-${Date.now()}`,
        barcode: dto.barcode ?? null,
        description: dto.description,
        shortDescription: dto.shortDescription ?? null,
        model: dto.model ?? null,
        componentType: dto.componentType as any,
        brandId: dto.brandId,
        weight: dto.weight ?? null,
        tags: dto.tags || [],
        isDraft,
        isActive,
        isFeatured: dto.isFeatured ?? false,
        ...(dto.categoryIds?.length && {
          categories: {
            create: dto.categoryIds.map((catId, idx) => ({
              categoryId: catId,
              isPrimary: catId === dto.primaryCategoryId || idx === 0,
            })),
          },
        }),
        prices: {
          create: {
            amount: dto.basePrice,
            compareAt: dto.compareAtPrice ?? null,
            currency: dto.currency || 'INR',
            priceType: 'RETAIL',
            isActive: true,
          },
        },
        inventory: {
          create: {
            supplierId: defaultSupplier.id,
            quantity: dto.initialStock ?? 0,
            reservedQty: 0,
            lowStockThreshold: 5,
          },
        },
      },
      include: {
        brand: true,
        prices: true,
        inventory: true,
      },
    });

    // Audit mutation
    await this.audit.record({
      actor,
      action: 'CREATE',
      entityType: 'Product',
      entityId: product.id,
      entityLabel: product.name,
      after: product,
    });

    this.cache.invalidateByTag('catalog:products');
    return product;
  }

  async update(id: string, dto: AdminUpdateProductDto, actor?: any) {
    const current = await this.findOne(id);

    // Optimistic concurrency check
    if (dto.expectedUpdatedAt) {
      const currentIso = new Date(current.updatedAt).toISOString();
      const expectedIso = new Date(dto.expectedUpdatedAt).toISOString();
      if (currentIso !== expectedIso) {
        throw new ConflictException(
          'Product was modified by another administrator. Please refresh before saving.',
        );
      }
    }

    if (dto.name && dto.name !== current.name && !dto.slug) {
      dto.slug = generateSlug(dto.name);
    }

    const { expectedUpdatedAt, basePrice, compareAtPrice, categoryIds, primaryCategoryId, ...rest } = dto;

    const updated = await this.db.product.update({
      where: { id },
      data: {
        ...rest,
        ...(basePrice !== undefined && {
          prices: {
            updateMany: {
              where: { productId: id, priceType: 'RETAIL' },
              data: {
                amount: basePrice,
                ...(compareAtPrice !== undefined ? { compareAt: compareAtPrice } : {}),
              },
            },
          },
        }),
      },
      include: {
        brand: true,
        prices: true,
        inventory: true,
      },
    });

    // Audit mutation
    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Product',
      entityId: id,
      entityLabel: updated.name,
      before: current,
      after: updated,
    });

    this.cache.invalidateByTag('catalog:products');
    return updated;
  }

  async publish(id: string, actor?: any) {
    const product = await this.findOne(id);
    const hasActivePrice = product.prices?.some((p: any) => p.isActive);
    if (!hasActivePrice) {
      throw new BadRequestException('Cannot publish product without at least one active price');
    }

    const updated = await this.db.product.update({
      where: { id },
      data: { isActive: true, isDraft: false },
    });

    await this.audit.record({
      actor,
      action: 'ACTIVATE',
      entityType: 'Product',
      entityId: id,
      entityLabel: product.name,
      before: { isActive: product.isActive, isDraft: product.isDraft },
      after: { isActive: true, isDraft: false },
    });

    this.cache.invalidateByTag('catalog:products');
    return updated;
  }

  async archive(id: string, actor?: any) {
    const product = await this.findOne(id);

    const updated = await this.db.product.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.record({
      actor,
      action: 'SUSPEND',
      entityType: 'Product',
      entityId: id,
      entityLabel: product.name,
      before: { isActive: product.isActive },
      after: { isActive: false },
    });

    this.cache.invalidateByTag('catalog:products');
    return updated;
  }

  async draft(id: string, actor?: any) {
    const product = await this.findOne(id);

    const updated = await this.db.product.update({
      where: { id },
      data: { isDraft: true, isActive: false },
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Product',
      entityId: id,
      entityLabel: product.name,
      before: { isDraft: product.isDraft, isActive: product.isActive },
      after: { isDraft: true, isActive: false },
    });

    this.cache.invalidateByTag('catalog:products');
    return updated;
  }

  async delete(id: string, actor?: any, force: boolean = false) {
    const product = await this.findOne(id);

    // Safe destructive check: check if product is in active orders
    const activeOrderItems = await this.db.orderItem.count({
      where: { productId: id },
    });

    if (activeOrderItems > 0 && !force) {
      // Soft-delete instead of hard delete to protect historical order integrity
      const softDeleted = await this.db.product.update({
        where: { id },
        data: { isActive: false, isDraft: true },
      });

      await this.audit.record({
        actor,
        action: 'DELETE',
        entityType: 'Product',
        entityId: id,
        entityLabel: product.name,
        metadata: { softDelete: true, reason: 'Historical order items exist' },
      });

      this.cache.invalidateByTag('catalog:products');
      return { success: true, softDeleted: true, message: 'Product archived and deactivated due to existing order history' };
    }

    // Hard delete when safe or explicitly forced
    await this.db.product.delete({ where: { id } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'Product',
      entityId: id,
      entityLabel: product.name,
      before: product,
    });

    this.cache.invalidateByTag('catalog:products');
    return { success: true, softDeleted: false, message: 'Product permanently removed' };
  }

  async bulkStatus(dto: BulkProductStatusDto, actor?: any): Promise<BulkOperationResultDto> {
    const errors: Array<{ id: string; error: string }> = [];
    let successCount = 0;

    for (const id of dto.productIds) {
      try {
        switch (dto.action) {
          case BulkProductStatusAction.PUBLISH:
            await this.publish(id, actor);
            break;
          case BulkProductStatusAction.ARCHIVE:
            await this.archive(id, actor);
            break;
          case BulkProductStatusAction.DRAFT:
            await this.draft(id, actor);
            break;
          case BulkProductStatusAction.FEATURE:
            await this.db.product.update({ where: { id }, data: { isFeatured: true } });
            break;
          case BulkProductStatusAction.UNFEATURE:
            await this.db.product.update({ where: { id }, data: { isFeatured: false } });
            break;
        }
        successCount++;
      } catch (err: any) {
        errors.push({ id, error: err.message || 'Operation failed' });
      }
    }

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Product',
      metadata: { bulk: true, action: dto.action, count: successCount, total: dto.productIds.length },
    });

    this.cache.invalidateByTag('catalog:products');
    return BulkOperationResultDto.create(dto.productIds.length, successCount, errors);
  }

  async bulkDelete(dto: BulkProductDeleteDto, actor?: any): Promise<BulkOperationResultDto> {
    const errors: Array<{ id: string; error: string }> = [];
    let successCount = 0;

    for (const id of dto.productIds) {
      try {
        await this.delete(id, actor, dto.force);
        successCount++;
      } catch (err: any) {
        errors.push({ id, error: err.message || 'Deletion failed' });
      }
    }

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'Product',
      metadata: { bulk: true, count: successCount, total: dto.productIds.length },
    });

    this.cache.invalidateByTag('catalog:products');
    return BulkOperationResultDto.create(dto.productIds.length, successCount, errors);
  }

  // ── Variants ──
  async addVariant(productId: string, data: any, actor?: any) {
    const product = await this.findOne(productId);
    const variant = await this.db.productVariant.create({
      data: {
        productId,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        attributes: data.attributes || {},
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    await this.audit.record({
      actor,
      action: 'CREATE',
      entityType: 'ProductVariant',
      entityId: variant.id,
      entityLabel: `${product.name} - ${variant.name}`,
      after: variant,
    });

    this.cache.invalidateByTag('catalog:products');
    return variant;
  }

  async updateVariant(productId: string, variantId: string, data: any, actor?: any) {
    const variant = await this.db.productVariant.update({
      where: { id: variantId },
      data,
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'ProductVariant',
      entityId: variantId,
      after: variant,
    });

    this.cache.invalidateByTag('catalog:products');
    return variant;
  }

  async deleteVariant(productId: string, variantId: string, actor?: any) {
    await this.db.productVariant.delete({ where: { id: variantId } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'ProductVariant',
      entityId: variantId,
    });

    this.cache.invalidateByTag('catalog:products');
    return { success: true };
  }

  // ── Images ──
  async addImage(productId: string, data: any, actor?: any) {
    if (data.isPrimary) {
      await this.db.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    const image = await this.db.productImage.create({
      data: {
        productId,
        url: data.url,
        altText: data.altText,
        isPrimary: data.isPrimary ?? false,
        sortOrder: data.sortOrder ?? 0,
        width: data.width,
        height: data.height,
      },
    });

    await this.audit.record({
      actor,
      action: 'CREATE',
      entityType: 'ProductImage',
      entityId: image.id,
      after: image,
    });

    this.cache.invalidateByTag('catalog:products');
    return image;
  }

  async setPrimaryImage(productId: string, imageId: string, actor?: any) {
    await this.db.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });

    const updated = await this.db.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'ProductImage',
      entityId: imageId,
      metadata: { action: 'SET_PRIMARY' },
    });

    this.cache.invalidateByTag('catalog:products');
    return updated;
  }

  async deleteImage(productId: string, imageId: string, actor?: any) {
    await this.db.productImage.delete({ where: { id: imageId } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'ProductImage',
      entityId: imageId,
    });

    this.cache.invalidateByTag('catalog:products');
    return { success: true };
  }

  // ── Specifications ──
  async upsertSpecification(productId: string, componentType: string, specData: any, actor?: any) {
    await this.findOne(productId);

    const modelMap: Record<string, any> = {
      CPU: this.db.cpuSpec,
      GPU: this.db.gpuSpec,
      MOTHERBOARD: this.db.motherboardSpec,
      RAM: this.db.ramSpec,
      STORAGE: this.db.storageSpec,
      PSU: this.db.psuSpec,
      CASE: this.db.caseSpec,
      COOLER: this.db.coolerSpec,
      FAN: this.db.fanSpec,
      MONITOR: this.db.monitorSpec,
      PERIPHERAL: this.db.peripheralSpec,
    };

    const model = modelMap[componentType.toUpperCase()];
    if (!model) {
      throw new BadRequestException(`Unsupported component type for specs: "${componentType}"`);
    }

    const spec = await model.upsert({
      where: { productId },
      create: { productId, ...specData },
      update: { ...specData },
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: `${componentType.toUpperCase()}_Spec`,
      entityId: productId,
      after: spec,
    });

    this.cache.invalidateByTag('catalog:products');
    return spec;
  }
}
