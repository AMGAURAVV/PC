import { Injectable } from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

import type { ProductFilterDto} from './dto/product-filter.dto';
import { ProductSortBy } from './dto/product-filter.dto';
import type { CreateProductImageDto } from './dto/product-image.dto';
import type { CreateProductVariantDto, UpdateProductVariantDto } from './dto/product-variant.dto';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsRepository {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Standard include query that fetches all relations and component specs.
   */
  private get standardProductIncludes() {
    return {
      brand: true,
      categories: {
        include: {
          category: true,
        },
        orderBy: {
          isPrimary: 'desc' as const,
        },
      },
      images: {
        orderBy: [
          { isPrimary: 'desc' as const },
          { sortOrder: 'asc' as const },
        ],
      },
      variants: {
        where: {
          isActive: true,
        },
        include: {
          prices: {
            where: { isActive: true },
            orderBy: { amount: 'asc' as const },
          },
          inventory: true,
        },
        orderBy: {
          sortOrder: 'asc' as const,
        },
      },
      prices: {
        where: {
          isActive: true,
        },
        orderBy: {
          amount: 'asc' as const,
        },
      },
      inventory: true,
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
    };
  }

  /**
   * Lightweight include query for catalog listings, searches, and multiple product lookups.
   * Excludes the 11 component spec tables which are only needed on product detail view.
   */
  private get catalogProductIncludes() {
    return {
      brand: true,
      categories: {
        include: {
          category: true,
        },
        orderBy: {
          isPrimary: 'desc' as const,
        },
      },
      images: {
        orderBy: [
          { isPrimary: 'desc' as const },
          { sortOrder: 'asc' as const },
        ],
      },
      variants: {
        where: {
          isActive: true,
        },
        include: {
          prices: {
            where: { isActive: true },
            orderBy: { amount: 'asc' as const },
          },
          inventory: true,
        },
        orderBy: {
          sortOrder: 'asc' as const,
        },
      },
      prices: {
        where: {
          isActive: true,
        },
        orderBy: {
          amount: 'asc' as const,
        },
      },
      inventory: true,
    };
  }

  /**
   * Builds the dynamic multi-table Prisma where clause from ProductFilterDto.
   */
  private buildWhereClause(filters: ProductFilterDto): any {
    const where: any = {
      deletedAt: null,
    };

    // Active & Draft state
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    // Component Type filter
    if (filters.componentType) {
      where.componentType = filters.componentType.toUpperCase();
    }

    // Brand filters
    if (filters.brandId) {
      where.brandId = filters.brandId;
    } else if (filters.brandSlug) {
      where.brand = {
        slug: { equals: filters.brandSlug, mode: 'insensitive' },
      };
    }

    // Category filters
    if (filters.categoryId) {
      where.categories = {
        some: {
          categoryId: filters.categoryId,
        },
      };
    } else if (filters.categorySlug) {
      where.categories = {
        some: {
          category: {
            slug: { equals: filters.categorySlug, mode: 'insensitive' },
          },
        },
      };
    }

    // In-stock filter: check if any inventory row has quantity > reservedQty
    if (filters.inStock) {
      where.inventory = {
        some: {
          quantity: { gt: 0 },
        },
      };
    }

    // Price range filters on active retail price
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceCondition: any = {
        isActive: true,
        priceType: 'RETAIL',
      };

      if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
        priceCondition.amount = {
          gte: filters.minPrice,
          lte: filters.maxPrice,
        };
      } else if (filters.minPrice !== undefined) {
        priceCondition.amount = { gte: filters.minPrice };
      } else if (filters.maxPrice !== undefined) {
        priceCondition.amount = { lte: filters.maxPrice };
      }

      where.prices = {
        some: priceCondition,
      };
    }

    // Text search across name, description, model, SKU, tags, or brand name
    if (filters.search && filters.search.trim().length > 0) {
      const term = filters.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { tags: { has: term.toLowerCase() } },
        { brand: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    // ── CPU Specific Filters ──────────────────────────────────────────────────
    const cpuSpecConditions: any = {};
    if (filters.cpuSocket) {
      cpuSpecConditions.socketType = { equals: filters.cpuSocket, mode: 'insensitive' };
    }
    if (filters.minCores !== undefined || filters.maxCores !== undefined) {
      cpuSpecConditions.cores = {};
      if (filters.minCores !== undefined) cpuSpecConditions.cores.gte = filters.minCores;
      if (filters.maxCores !== undefined) cpuSpecConditions.cores.lte = filters.maxCores;
    }
    if (filters.minThreads !== undefined || filters.maxThreads !== undefined) {
      cpuSpecConditions.threads = {};
      if (filters.minThreads !== undefined) cpuSpecConditions.threads.gte = filters.minThreads;
      if (filters.maxThreads !== undefined) cpuSpecConditions.threads.lte = filters.maxThreads;
    }
    if (filters.minBaseClockMhz !== undefined || filters.maxBaseClockMhz !== undefined) {
      cpuSpecConditions.baseClockMhz = {};
      if (filters.minBaseClockMhz !== undefined) cpuSpecConditions.baseClockMhz.gte = filters.minBaseClockMhz;
      if (filters.maxBaseClockMhz !== undefined) cpuSpecConditions.baseClockMhz.lte = filters.maxBaseClockMhz;
    }
    if (filters.minBoostClockMhz !== undefined || filters.maxBoostClockMhz !== undefined) {
      cpuSpecConditions.boostClockMhz = {};
      if (filters.minBoostClockMhz !== undefined) cpuSpecConditions.boostClockMhz.gte = filters.minBoostClockMhz;
      if (filters.maxBoostClockMhz !== undefined) cpuSpecConditions.boostClockMhz.lte = filters.maxBoostClockMhz;
    }
    if (Object.keys(cpuSpecConditions).length > 0) {
      where.cpuSpec = cpuSpecConditions;
    }

    // ── GPU Specific Filters ──────────────────────────────────────────────────
    const gpuSpecConditions: any = {};
    if (filters.gpuChipset) {
      gpuSpecConditions.chipset = { contains: filters.gpuChipset, mode: 'insensitive' };
    }
    if (filters.minVramGb !== undefined || filters.maxVramGb !== undefined) {
      gpuSpecConditions.vramGb = {};
      if (filters.minVramGb !== undefined) gpuSpecConditions.vramGb.gte = filters.minVramGb;
      if (filters.maxVramGb !== undefined) gpuSpecConditions.vramGb.lte = filters.maxVramGb;
    }
    if (filters.maxGpuLengthMm !== undefined) {
      gpuSpecConditions.lengthMm = { lte: filters.maxGpuLengthMm };
    }
    if (filters.maxTdpW !== undefined) {
      gpuSpecConditions.tdpW = { lte: filters.maxTdpW };
    }
    if (Object.keys(gpuSpecConditions).length > 0) {
      where.gpuSpec = gpuSpecConditions;
    }
    if (filters.gpuManufacturer) {
      where.brand = {
        name: { contains: filters.gpuManufacturer, mode: 'insensitive' },
      };
    }

    // ── Motherboard Specific Filters ──────────────────────────────────────────
    const mbSpecConditions: any = {};
    if (filters.mbSocket) {
      mbSpecConditions.socketType = { equals: filters.mbSocket, mode: 'insensitive' };
    }
    if (filters.mbChipset) {
      mbSpecConditions.chipset = { contains: filters.mbChipset, mode: 'insensitive' };
    }
    if (filters.mbRamType) {
      mbSpecConditions.supportedMemTypes = { has: filters.mbRamType.toUpperCase() };
    }
    if (filters.minRamSlots !== undefined) {
      mbSpecConditions.ramSlots = { gte: filters.minRamSlots };
    }
    if (filters.mbFormFactor) {
      mbSpecConditions.formFactor = { equals: filters.mbFormFactor, mode: 'insensitive' };
    }
    if (Object.keys(mbSpecConditions).length > 0) {
      where.motherboardSpec = mbSpecConditions;
    }

    // ── RAM Specific Filters ──────────────────────────────────────────────────
    const ramSpecConditions: any = {};
    if (filters.ramMemType) {
      ramSpecConditions.memType = { equals: filters.ramMemType, mode: 'insensitive' };
    }
    if (filters.ramCapacityGb !== undefined) {
      ramSpecConditions.totalCapacityGb = filters.ramCapacityGb;
    }
    if (filters.minRamSpeedMhz !== undefined) {
      ramSpecConditions.speedMhz = { gte: filters.minRamSpeedMhz };
    }
    if (filters.ramStickCount !== undefined) {
      ramSpecConditions.stickCount = filters.ramStickCount;
    }
    if (Object.keys(ramSpecConditions).length > 0) {
      where.ramSpec = ramSpecConditions;
    }

    // ── Storage Specific Filters ──────────────────────────────────────────────
    const storageSpecConditions: any = {};
    if (filters.storageInterface) {
      storageSpecConditions.interface = { contains: filters.storageInterface, mode: 'insensitive' };
    }
    if (filters.storageCapacityGb !== undefined) {
      storageSpecConditions.capacityGb = filters.storageCapacityGb;
    }
    if (filters.storageFormFactor) {
      storageSpecConditions.formFactor = { contains: filters.storageFormFactor, mode: 'insensitive' };
    }
    if (Object.keys(storageSpecConditions).length > 0) {
      where.storageSpec = storageSpecConditions;
    }

    // ── PSU Specific Filters ──────────────────────────────────────────────────
    const psuSpecConditions: any = {};
    if (filters.minWattage !== undefined || filters.maxWattage !== undefined) {
      psuSpecConditions.wattage = {};
      if (filters.minWattage !== undefined) psuSpecConditions.wattage.gte = filters.minWattage;
      if (filters.maxWattage !== undefined) psuSpecConditions.wattage.lte = filters.maxWattage;
    }
    if (filters.psuEfficiency) {
      psuSpecConditions.efficiencyRating = { contains: filters.psuEfficiency, mode: 'insensitive' };
    }
    if (filters.psuModularity) {
      psuSpecConditions.modular = { equals: filters.psuModularity, mode: 'insensitive' };
    }
    if (Object.keys(psuSpecConditions).length > 0) {
      where.psuSpec = psuSpecConditions;
    }

    // ── Case Specific Filters ─────────────────────────────────────────────────
    const caseSpecConditions: any = {};
    if (filters.caseMbFormFactor) {
      caseSpecConditions.supportedFormFactors = { has: filters.caseMbFormFactor.toUpperCase() };
    }
    if (filters.minSupportedGpuLengthMm !== undefined) {
      caseSpecConditions.maxGpuLengthMm = { gte: filters.minSupportedGpuLengthMm };
    }
    if (filters.minSupportedCoolerHeightMm !== undefined) {
      caseSpecConditions.maxCpuCoolerHeightMm = { gte: filters.minSupportedCoolerHeightMm };
    }
    if (Object.keys(caseSpecConditions).length > 0) {
      where.caseSpec = caseSpecConditions;
    }

    return where;
  }

  /**
   * Builds the orderBy clause.
   */
  private buildOrderBy(sortBy?: ProductSortBy): any {
    switch (sortBy) {
      case ProductSortBy.NAME_ASC:
        return [{ name: 'asc' }];
      case ProductSortBy.NAME_DESC:
        return [{ name: 'desc' }];
      case ProductSortBy.FEATURED:
        return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
      case ProductSortBy.NEWEST:
      default:
        return [{ createdAt: 'desc' }];
    }
  }

  async findWithFilters(filters: ProductFilterDto) {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(filters.sortBy as ProductSortBy | undefined);

    return this.db.product.findMany({
      where,
      skip: filters.skip,
      take: filters.limit,
      orderBy,
      include: this.catalogProductIncludes,
    });
  }

  async countWithFilters(filters: ProductFilterDto): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.db.product.count({ where });
  }

  async findById(id: string) {
    return this.db.product.findFirst({
      where: { id, deletedAt: null },
      include: this.standardProductIncludes,
    });
  }

  async findBySlug(slug: string) {
    return this.db.product.findFirst({
      where: { slug, deletedAt: null },
      include: this.standardProductIncludes,
    });
  }

  async findManyByIds(ids: string[]) {
    return this.db.product.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      include: this.catalogProductIncludes,
    });
  }

  private async getOrCreatePlatformSupplierId(): Promise<string> {
    const existing = await this.db.supplier.findFirst({
      where: { isPlatform: true },
    });
    if (existing) {
      return existing.id;
    }

    const created = await this.db.supplier.create({
      data: {
        name: 'PC Platform Direct',
        code: 'PLATFORM',
        isPlatform: true,
        isActive: true,
      },
    });
    return created.id;
  }

  async create(data: CreateProductDto, slug: string) {
    const sku = data.sku || `SKU-${Date.now()}`;
    const supplierId = await this.getOrCreatePlatformSupplierId();

    return this.db.product.create({
      data: {
        name: data.name,
        slug,
        sku,
        ...(data.barcode ? { barcode: data.barcode } : {}),
        ...(data.model ? { model: data.model } : {}),
        description: data.description,
        ...(data.shortDescription ? { shortDescription: data.shortDescription } : {}),
        componentType: data.componentType.toUpperCase() as any,
        brandId: data.brandId,
        ...(data.weight !== undefined ? { weight: data.weight } : {}),
        tags: data.tags || [],
        isFeatured: data.isFeatured ?? false,
        isDraft: data.isDraft ?? false,
        ...(data.metaTitle ? { metaTitle: data.metaTitle } : {}),
        ...(data.metaDescription ? { metaDescription: data.metaDescription } : {}),
        prices: {
          create: {
            amount: data.basePrice,
            ...(data.compareAtPrice !== undefined ? { compareAt: data.compareAtPrice } : {}),
            currency: data.currency || 'INR',
            priceType: 'RETAIL',
            isActive: true,
          },
        },
        inventory: {
          create: {
            supplierId,
            quantity: data.initialStock ?? 0,
            reservedQty: 0,
            lowStockThreshold: 5,
          },
        },
        ...(data.categoryIds && data.categoryIds.length > 0 && {
          categories: {
            create: data.categoryIds.map((catId: string) => ({
              categoryId: catId,
              isPrimary: catId === data.primaryCategoryId,
            })),
          },
        }),
      },
      include: this.standardProductIncludes,
    });
  }

  async update(id: string, data: UpdateProductDto, slug?: string) {
    // If updating categories, delete and re-create relationships
    if (data.categoryIds) {
      await this.db.productCategory.deleteMany({
        where: { productId: id },
      });

      if (data.categoryIds.length > 0) {
        await this.db.productCategory.createMany({
          data: data.categoryIds.map((catId: string) => ({
            productId: id,
            categoryId: catId,
            isPrimary: catId === data.primaryCategoryId,
          })),
        });
      }
    }

    // If updating base price, update the current active retail price or create a new one
    if (data.basePrice !== undefined) {
      const activePrice = await this.db.price.findFirst({
        where: { productId: id, variantId: null, isActive: true, priceType: 'RETAIL' },
      });

      if (activePrice) {
        await this.db.price.update({
          where: { id: activePrice.id },
          data: {
            amount: data.basePrice,
            ...(data.compareAtPrice !== undefined && { compareAt: data.compareAtPrice }),
          },
        });
      } else {
        await this.db.price.create({
          data: {
            productId: id,
            amount: data.basePrice,
            ...(data.compareAtPrice !== undefined ? { compareAt: data.compareAtPrice } : {}),
            priceType: 'RETAIL',
            isActive: true,
          },
        });
      }
    }

    return this.db.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(slug && { slug }),
        ...(data.description && { description: data.description }),
        ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
        ...(data.model !== undefined && { model: data.model }),
        ...(data.sku && { sku: data.sku }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDraft !== undefined && { isDraft: data.isDraft }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.tags && { tags: data.tags }),
        ...(data.weight !== undefined && { weight: data.weight }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
      },
      include: this.standardProductIncludes,
    });
  }

  async updateStatus(id: string, status: { isActive?: boolean; isDraft?: boolean }) {
    return this.db.product.update({
      where: { id },
      data: status,
      include: this.standardProductIncludes,
    });
  }

  async softDelete(id: string) {
    return this.db.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  // ── Variant Operations ──────────────────────────────────────────────────────

  async createVariant(productId: string, data: CreateProductVariantDto) {
    const supplierId = await this.getOrCreatePlatformSupplierId();

    return this.db.productVariant.create({
      data: {
        productId,
        name: data.name,
        sku: data.sku,
        ...(data.barcode ? { barcode: data.barcode } : {}),
        attributes: data.attributes || {},
        sortOrder: data.sortOrder || 0,
        isActive: true,
        ...(data.price !== undefined
          ? {
              prices: {
                create: {
                  productId,
                  amount: data.price,
                  ...(data.compareAt !== undefined ? { compareAt: data.compareAt } : {}),
                  priceType: 'RETAIL',
                  isActive: true,
                },
              },
            }
          : {}),
        ...(data.initialStock !== undefined
          ? {
              inventory: {
                create: {
                  productId,
                  supplierId,
                  quantity: data.initialStock,
                  reservedQty: 0,
                },
              },
            }
          : {}),
      },
      include: {
        prices: { where: { isActive: true } },
        inventory: true,
      },
    });
  }

  async updateVariant(variantId: string, data: UpdateProductVariantDto) {
    if (data.price !== undefined) {
      const activePrice = await this.db.price.findFirst({
        where: { variantId, isActive: true, priceType: 'RETAIL' },
      });
      if (activePrice) {
        await this.db.price.update({
          where: { id: activePrice.id },
          data: {
            amount: data.price,
            ...(data.compareAt !== undefined && { compareAt: data.compareAt }),
          },
        });
      }
    }

    return this.db.productVariant.update({
      where: { id: variantId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.sku && { sku: data.sku }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.attributes && { attributes: data.attributes }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: {
        prices: { where: { isActive: true } },
        inventory: true,
      },
    });
  }

  async deleteVariant(variantId: string) {
    return this.db.productVariant.update({
      where: { id: variantId },
      data: { isActive: false },
    });
  }

  // ── Image Operations ────────────────────────────────────────────────────────

  async addImage(productId: string, data: CreateProductImageDto) {
    if (data.isPrimary) {
      await this.db.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    return this.db.productImage.create({
      data: {
        productId,
        ...(data.variantId ? { variantId: data.variantId } : {}),
        url: data.url,
        ...(data.storageKey ? { storageKey: data.storageKey } : {}),
        ...(data.altText ? { altText: data.altText } : {}),
        isPrimary: data.isPrimary ?? false,
        sortOrder: data.sortOrder ?? 0,
        ...(data.width !== undefined ? { width: data.width } : {}),
        ...(data.height !== undefined ? { height: data.height } : {}),
        ...(data.mimeType ? { mimeType: data.mimeType } : {}),
      },
    });
  }

  async deleteImage(productId: string, imageId: string) {
    return this.db.productImage.delete({
      where: { id: imageId, productId },
    });
  }

  async setPrimaryImage(productId: string, imageId: string) {
    await this.db.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });

    return this.db.productImage.update({
      where: { id: imageId, productId },
      data: { isPrimary: true },
    });
  }

  // ── Component Spec Upserts ──────────────────────────────────────────────────

  async upsertComponentSpec(productId: string, componentType: string, specData: any) {
    const type = componentType.toUpperCase();
    switch (type) {
      case 'CPU':
        return this.db.cpuSpec.upsert({
          where: { productId },
          create: { productId, ...specData },
          update: specData,
        });
      case 'GPU':
        return this.db.gpuSpec.upsert({
          where: { productId },
          create: { productId, ...specData },
          update: specData,
        });
      case 'MOTHERBOARD':
        return this.db.motherboardSpec.upsert({
          where: { productId },
          create: { productId, ...specData },
          update: specData,
        });
      case 'RAM':
        return this.db.ramSpec.upsert({
          where: { productId },
          create: { productId, ...specData },
          update: specData,
        });
      case 'STORAGE':
        return this.db.storageSpec.upsert({
          where: { productId },
          create: { productId, ...specData },
          update: specData,
        });
      case 'PSU':
        return this.db.psuSpec.upsert({
          where: { productId },
          create: { productId, ...specData },
          update: specData,
        });
      case 'CASE':
        return this.db.caseSpec.upsert({
          where: { productId },
          create: { productId, ...specData },
          update: specData,
        });
      case 'COOLER':
        return this.db.coolerSpec.upsert({
          where: { productId },
          create: { productId, ...specData },
          update: specData,
        });
      case 'FAN':
        return this.db.fanSpec.upsert({
          where: { productId },
          create: { productId, ...specData },
          update: specData,
        });
      case 'MONITOR':
        return this.db.monitorSpec.upsert({
          where: { productId },
          create: { productId, ...specData },
          update: specData,
        });
      default:
        throw new Error(`Unsupported component type for structured specification: ${componentType}`);
    }
  }
}
