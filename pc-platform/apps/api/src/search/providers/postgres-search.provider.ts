import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';

import type {
  ProductResponseDto,
  ProductPriceDto,
  ProductInventoryDto,
} from '../../products/dto/product.dto';
import type {
  SearchProvider,
  SearchOptions,
  SearchResult,
  SearchSuggestion,
  SearchFacets,
  FacetBucket,
} from '../interfaces/search-provider.interface';

@Injectable()
export class PostgresSearchProvider implements SearchProvider {
  private readonly logger = new Logger(PostgresSearchProvider.name);

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
   * Builds the comprehensive multi-field where clause for PostgreSQL.
   */
  private buildWhereClause(options: SearchOptions): any {
    const where: any = {
      deletedAt: null,
      isActive: true,
      isDraft: false,
    };

    // 1. Category filter
    if (options.categorySlugs && options.categorySlugs.length > 0) {
      where.categories = {
        some: {
          category: {
            slug: { in: options.categorySlugs, mode: 'insensitive' },
          },
        },
      };
    }

    // 2. Brand filter
    if (options.brandSlugs && options.brandSlugs.length > 0) {
      where.brand = {
        slug: { in: options.brandSlugs, mode: 'insensitive' },
      };
    }

    // 3. Component Type filter
    if (options.componentTypes && options.componentTypes.length > 0) {
      where.componentType = {
        in: options.componentTypes.map((ct) => ct.toUpperCase()),
      };
    }

    // 4. In-stock filter
    if (options.inStock) {
      where.inventory = {
        some: {
          quantity: { gt: 0 },
        },
      };
    }

    // 5. Price range filter
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      const priceCondition: any = {
        isActive: true,
        priceType: 'RETAIL',
      };

      if (options.minPrice !== undefined && options.maxPrice !== undefined) {
        priceCondition.amount = {
          gte: options.minPrice,
          lte: options.maxPrice,
        };
      } else if (options.minPrice !== undefined) {
        priceCondition.amount = { gte: options.minPrice };
      } else if (options.maxPrice !== undefined) {
        priceCondition.amount = { lte: options.maxPrice };
      }

      where.prices = {
        some: priceCondition,
      };
    }

    // 6. Multi-field text search: name, brand, model, category, specifications
    if (options.query && options.query.trim().length > 0) {
      const term = options.query.trim();
      const lowerTerm = term.toLowerCase();

      where.OR = [
        // Name, model, SKU, description, tags
        { name: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { tags: { has: lowerTerm } },

        // Brand
        { brand: { name: { contains: term, mode: 'insensitive' } } },
        { brand: { slug: { contains: term, mode: 'insensitive' } } },

        // Category
        {
          categories: {
            some: {
              category: {
                name: { contains: term, mode: 'insensitive' },
              },
            },
          },
        },
        {
          categories: {
            some: {
              category: {
                slug: { contains: term, mode: 'insensitive' },
              },
            },
          },
        },

        // CPU Specifications
        { cpuSpec: { socketType: { contains: term, mode: 'insensitive' } } },
        { cpuSpec: { architecture: { contains: term, mode: 'insensitive' } } },

        // GPU Specifications
        { gpuSpec: { chipset: { contains: term, mode: 'insensitive' } } },
        { gpuSpec: { memoryType: { contains: term, mode: 'insensitive' } } },

        // Motherboard Specifications
        { motherboardSpec: { socketType: { contains: term, mode: 'insensitive' } } },
        { motherboardSpec: { chipset: { contains: term, mode: 'insensitive' } } },
        { motherboardSpec: { formFactor: { contains: term, mode: 'insensitive' } } },

        // RAM Specifications
        { ramSpec: { memType: { contains: term, mode: 'insensitive' } } },

        // Storage Specifications
        { storageSpec: { interface: { contains: term, mode: 'insensitive' } } },
        { storageSpec: { formFactor: { contains: term, mode: 'insensitive' } } },

        // PSU Specifications
        { psuSpec: { efficiencyRating: { contains: term, mode: 'insensitive' } } },
        { psuSpec: { modular: { contains: term, mode: 'insensitive' } } },

        // Case Specifications
        { caseSpec: { formFactor: { contains: term, mode: 'insensitive' } } },

        // Cooler Specifications
        { coolerSpec: { coolerType: { contains: term, mode: 'insensitive' } } },
        { coolerSpec: { supportedSockets: { has: term.toUpperCase() } } },
      ];
    }

    // 7. Explicit Specification filters
    if (options.specs && Object.keys(options.specs).length > 0) {
      const s = options.specs;

      if (s.socket) {
        where.OR = where.OR || [];
        where.OR.push(
          { cpuSpec: { socketType: { equals: s.socket, mode: 'insensitive' } } },
          { motherboardSpec: { socketType: { equals: s.socket, mode: 'insensitive' } } },
          { coolerSpec: { supportedSockets: { has: String(s.socket).toUpperCase() } } },
        );
      }

      if (s.chipset) {
        where.OR = where.OR || [];
        where.OR.push(
          { gpuSpec: { chipset: { contains: s.chipset, mode: 'insensitive' } } },
          { motherboardSpec: { chipset: { contains: s.chipset, mode: 'insensitive' } } },
        );
      }

      if (s.formFactor) {
        where.OR = where.OR || [];
        where.OR.push(
          { motherboardSpec: { formFactor: { equals: s.formFactor, mode: 'insensitive' } } },
          { caseSpec: { formFactor: { equals: s.formFactor, mode: 'insensitive' } } },
        );
      }

      if (s.memoryType || s.memType) {
        const mem = s.memoryType || s.memType;
        where.ramSpec = { memType: { equals: mem, mode: 'insensitive' } };
      }

      if (s.wattage) {
        where.psuSpec = { wattage: { gte: Number(s.wattage) } };
      }
    }

    return where;
  }

  /**
   * Builds the orderBy clause.
   */
  private buildOrderBy(sortBy?: string): any {
    switch (sortBy) {
      case 'name_asc':
        return [{ name: 'asc' }];
      case 'name_desc':
        return [{ name: 'desc' }];
      case 'newest':
        return [{ createdAt: 'desc' }];
      case 'relevance':
      default:
        return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    }
  }

  /**
   * Executes faceted search.
   */
  async search(options: SearchOptions): Promise<SearchResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 12));
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(options);
    const orderBy = this.buildOrderBy(options.sortBy);

    // Run matching products query, total count, and facet dataset concurrently
    const [products, total, facetRecords] = await Promise.all([
      this.db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.standardProductIncludes,
      }),
      this.db.product.count({ where }),
      // Lightweight query over matching results to build dynamic facets
      this.db.product.findMany({
        where,
        select: {
          id: true,
          componentType: true,
          brand: {
            select: { id: true, name: true, slug: true },
          },
          categories: {
            select: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
          prices: {
            where: { isActive: true },
            select: { amount: true, priceType: true },
          },
          inventory: {
            select: { quantity: true, reservedQty: true },
          },
          cpuSpec: { select: { socketType: true } },
          gpuSpec: { select: { chipset: true } },
          motherboardSpec: { select: { socketType: true, chipset: true } },
          ramSpec: { select: { memType: true } },
        },
      }),
    ]);

    let mappedItems = products.map((p) => this.mapToDto(p));

    // Handle price sorting in-memory to account for active retail price calculation
    if (options.sortBy === 'price_asc') {
      mappedItems = mappedItems.sort((a, b) => (a.price?.amount ?? 0) - (b.price?.amount ?? 0));
    } else if (options.sortBy === 'price_desc') {
      mappedItems = mappedItems.sort((a, b) => (b.price?.amount ?? 0) - (a.price?.amount ?? 0));
    }

    // Compute dynamic facets
    const facets = this.computeFacets(facetRecords);

    return {
      items: mappedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      facets,
    };
  }

  /**
   * Computes faceted aggregation data from matching records.
   */
  private computeFacets(records: any[]): SearchFacets {
    const categoryCountMap = new Map<string, { name: string; count: number }>();
    const brandCountMap = new Map<string, { name: string; count: number }>();
    const componentTypeCountMap = new Map<string, number>();

    const socketCountMap = new Map<string, number>();
    const chipsetCountMap = new Map<string, number>();
    const memoryTypeCountMap = new Map<string, number>();

    let minPrice = Infinity;
    let maxPrice = 0;
    let inStockCount = 0;

    for (const record of records) {
      // 1. Categories
      for (const pc of record.categories || []) {
        if (pc.category) {
          const { slug, name } = pc.category;
          const current = categoryCountMap.get(slug) || { name, count: 0 };
          current.count += 1;
          categoryCountMap.set(slug, current);
        }
      }

      // 2. Brands
      if (record.brand) {
        const { slug, name } = record.brand;
        const current = brandCountMap.get(slug) || { name, count: 0 };
        current.count += 1;
        brandCountMap.set(slug, current);
      }

      // 3. Component Types
      if (record.componentType) {
        const type = record.componentType;
        componentTypeCountMap.set(type, (componentTypeCountMap.get(type) || 0) + 1);
      }

      // 4. In Stock
      const totalQty = (record.inventory || []).reduce(
        (sum: number, inv: any) => sum + (inv.quantity || 0) - (inv.reservedQty || 0),
        0,
      );
      if (totalQty > 0) {
        inStockCount += 1;
      }

      // 5. Price Range
      const activePrices = (record.prices || []).map((p: any) => Number(p.amount));
      if (activePrices.length > 0) {
        const pMin = Math.min(...activePrices);
        const pMax = Math.max(...activePrices);
        if (pMin < minPrice) minPrice = pMin;
        if (pMax > maxPrice) maxPrice = pMax;
      }

      // 6. Key Specifications facets
      const socket = record.cpuSpec?.socketType || record.motherboardSpec?.socketType;
      if (socket) {
        const sUpper = socket.toUpperCase();
        socketCountMap.set(sUpper, (socketCountMap.get(sUpper) || 0) + 1);
      }

      const chipset = record.gpuSpec?.chipset || record.motherboardSpec?.chipset;
      if (chipset) {
        chipsetCountMap.set(chipset, (chipsetCountMap.get(chipset) || 0) + 1);
      }

      const mem = record.ramSpec?.memType;
      if (mem) {
        const mUpper = mem.toUpperCase();
        memoryTypeCountMap.set(mUpper, (memoryTypeCountMap.get(mUpper) || 0) + 1);
      }
    }

    const categories: FacetBucket[] = Array.from(categoryCountMap.entries())
      .map(([value, info]) => ({ value, label: info.name, count: info.count }))
      .sort((a, b) => b.count - a.count);

    const brands: FacetBucket[] = Array.from(brandCountMap.entries())
      .map(([value, info]) => ({ value, label: info.name, count: info.count }))
      .sort((a, b) => b.count - a.count);

    const componentTypes: FacetBucket[] = Array.from(componentTypeCountMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count);

    const specifications: Record<string, FacetBucket[]> = {
      socket: Array.from(socketCountMap.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => b.count - a.count),
      chipset: Array.from(chipsetCountMap.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      memoryType: Array.from(memoryTypeCountMap.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => b.count - a.count),
    };

    return {
      categories,
      brands,
      componentTypes,
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice,
      },
      inStockCount,
      specifications,
    };
  }

  /**
   * Generates autocomplete & suggestions for fast search dropdowns.
   */
  async suggest(query: string, limit: number = 8): Promise<SearchSuggestion[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const suggestions: SearchSuggestion[] = [];

    // 1. Match Brands
    const matchingBrands = await this.db.brand.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { slug: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      take: 3,
      select: { id: true, name: true, slug: true },
    });

    for (const b of matchingBrands) {
      suggestions.push({
        id: b.id,
        title: b.name,
        type: 'brand',
        slug: b.slug,
      });
    }

    // 2. Match Categories
    const matchingCategories = await this.db.category.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { slug: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      take: 3,
      select: { id: true, name: true, slug: true },
    });

    for (const c of matchingCategories) {
      suggestions.push({
        id: c.id,
        title: c.name,
        type: 'category',
        slug: c.slug,
      });
    }

    // 3. Match Products
    const remainingSlots = Math.max(1, limit - suggestions.length);
    const matchingProducts = await this.db.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isDraft: false,
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { model: { contains: trimmed, mode: 'insensitive' } },
          { sku: { contains: trimmed, mode: 'insensitive' } },
          { cpuSpec: { socketType: { contains: trimmed, mode: 'insensitive' } } },
          { gpuSpec: { chipset: { contains: trimmed, mode: 'insensitive' } } },
          { motherboardSpec: { socketType: { contains: trimmed, mode: 'insensitive' } } },
          { ramSpec: { memType: { contains: trimmed, mode: 'insensitive' } } },
        ],
      },
      take: remainingSlots,
      select: {
        id: true,
        name: true,
        slug: true,
        componentType: true,
        prices: {
          where: { isActive: true },
          select: { amount: true, priceType: true },
        },
        categories: {
          take: 1,
          select: { category: { select: { name: true } } },
        },
      },
    });

    for (const p of matchingProducts) {
      const activePrice = p.prices.find((pr: any) => pr.priceType === 'RETAIL') || p.prices[0];
      const categoryName = p.categories[0]?.category?.name || p.componentType;

      suggestions.push({
        id: p.id,
        title: p.name,
        type: 'product',
        slug: p.slug,
        category: categoryName,
        price: activePrice ? Number(activePrice.amount) : undefined,
      });
    }

    return suggestions.slice(0, limit);
  }

  /**
   * Helper: Maps raw Prisma product entity to standardized ProductResponseDto.
   */
  private mapToDto(product: any): ProductResponseDto {
    // 1. Calculate Active Retail Price
    let priceDto: ProductPriceDto | null = null;
    const activePrices = (product.prices || []).filter((p: any) => p.isActive);
    const retailPrice = activePrices.find((p: any) => p.priceType === 'RETAIL') || activePrices[0];

    if (retailPrice) {
      const amount = Number(retailPrice.amount);
      const compareAt = retailPrice.compareAt ? Number(retailPrice.compareAt) : null;
      let discountPercent: number | null = null;
      if (compareAt && compareAt > amount) {
        discountPercent = Math.round(((compareAt - amount) / compareAt) * 100);
      }

      priceDto = {
        amount,
        compareAt,
        currency: retailPrice.currency || 'INR',
        discountPercent,
        priceType: retailPrice.priceType,
      };
    }

    // 2. Variant Price Range
    let variantPriceRange: { minPrice: number; maxPrice: number } | null = null;
    const variantPrices: number[] = [];
    for (const v of product.variants || []) {
      for (const vp of v.prices || []) {
        if (vp.isActive && vp.amount) {
          variantPrices.push(Number(vp.amount));
        }
      }
    }
    if (variantPrices.length > 0) {
      variantPriceRange = {
        minPrice: Math.min(...variantPrices),
        maxPrice: Math.max(...variantPrices),
      };
    }

    // 3. Calculate Inventory Availability
    let totalQuantity = 0;
    let reservedQuantity = 0;
    for (const inv of product.inventory || []) {
      totalQuantity += inv.quantity || 0;
      reservedQuantity += inv.reservedQty || 0;
    }
    const availableQuantity = Math.max(0, totalQuantity - reservedQuantity);
    const inStock = availableQuantity > 0;
    let stockStatus = 'OUT_OF_STOCK';
    if (availableQuantity > 5) {
      stockStatus = 'IN_STOCK';
    } else if (availableQuantity > 0) {
      stockStatus = 'LOW_STOCK';
    }

    const inventoryDto: ProductInventoryDto = {
      inStock,
      totalQuantity,
      reservedQuantity,
      availableQuantity,
      stockStatus,
    };

    // 4. Categories & Primary Category
    const categories = (product.categories || []).map((pc: any) => ({
      id: pc.category?.id || pc.categoryId,
      name: pc.category?.name || '',
      slug: pc.category?.slug || '',
      isPrimary: pc.isPrimary ?? false,
    }));
    const primaryCategory = categories.find((c: any) => c.isPrimary) || categories[0] || null;

    // 5. Images & Primary Image
    const images = (product.images || []).map((img: any) => ({
      id: img.id,
      productId: img.productId,
      variantId: img.variantId,
      url: img.url,
      storageKey: img.storageKey || null,
      altText: img.altText,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
      width: img.width,
      height: img.height,
    }));
    const primaryImage = images.find((img: any) => img.isPrimary) || images[0] || null;

    // 6. Variants
    const variants = (product.variants || []).map((v: any) => {
      const vActivePrices = (v.prices || []).filter((p: any) => p.isActive);
      const vPrice = vActivePrices[0];
      let vStock = 0;
      for (const inv of v.inventory || []) {
        vStock += (inv.quantity || 0) - (inv.reservedQty || 0);
      }

      return {
        id: v.id,
        productId: v.productId,
        name: v.name,
        sku: v.sku,
        barcode: v.barcode,
        attributes: v.attributes || {},
        isActive: v.isActive,
        sortOrder: v.sortOrder,
        price: vPrice ? Number(vPrice.amount) : null,
        compareAt: vPrice?.compareAt ? Number(vPrice.compareAt) : null,
        availableStock: Math.max(0, vStock),
        stockStatus: vStock > 5 ? 'IN_STOCK' : vStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
      };
    });

    // 7. Structured Specifications extraction
    const rawSpec =
      product.cpuSpec ||
      product.gpuSpec ||
      product.motherboardSpec ||
      product.ramSpec ||
      product.storageSpec ||
      product.psuSpec ||
      product.caseSpec ||
      product.coolerSpec ||
      product.fanSpec ||
      product.monitorSpec ||
      product.peripheralSpec;

    let specifications: Record<string, any> | undefined;
    if (rawSpec) {
      const { id, productId, ...specFields } = rawSpec;
      specifications = specFields;
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      barcode: product.barcode || null,
      description: product.description,
      shortDescription: product.shortDescription || null,
      model: product.model || null,
      componentType: product.componentType,
      brand: {
        id: product.brand?.id || product.brandId,
        name: product.brand?.name || '',
        slug: product.brand?.slug || '',
        logoUrl: product.brand?.logoUrl || null,
      },
      primaryCategory,
      categories,
      price: priceDto,
      variantPriceRange,
      inventory: inventoryDto,
      primaryImage,
      images,
      variants,
      specifications,
      tags: product.tags || [],
      isActive: product.isActive,
      isDraft: product.isDraft,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt?.toISOString ? product.createdAt.toISOString() : product.createdAt,
      updatedAt: product.updatedAt?.toISOString ? product.updatedAt.toISOString() : product.updatedAt,
    };
  }
}
