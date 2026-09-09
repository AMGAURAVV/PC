import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  ProductPriceDto,
  ProductInventoryDto,
} from './dto/product.dto';
import { ProductFilterDto, ProductSortBy } from './dto/product-filter.dto';
import { PaginatedResponse } from '../common/dto/response.dto';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/product-variant.dto';
import { CreateProductImageDto } from './dto/product-image.dto';
import {
  ComparisonProductItemDto,
  ProductComparisonResponseDto,
} from './dto/product-compare.dto';
import { CacheService } from '../common/cache/cache.service';

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
export class ProductsService {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly cacheService: CacheService,
  ) {}

  // ── Public Catalog & Filtering ──────────────────────────────────────────────

  async findAll(query: ProductFilterDto): Promise<PaginatedResponse<ProductResponseDto>> {
    const cacheKey = `catalog:products:list:${JSON.stringify(query)}`;

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const [products, total] = await Promise.all([
          this.productsRepo.findWithFilters(query),
          this.productsRepo.countWithFilters(query),
        ]);

        let mapped = products.map((p) => this.mapToDto(p));

        // In-memory sorting for price criteria
        if (query.sortBy === ProductSortBy.PRICE_ASC) {
          mapped = mapped.sort((a, b) => (a.price?.amount ?? 0) - (b.price?.amount ?? 0));
        } else if (query.sortBy === ProductSortBy.PRICE_DESC) {
          mapped = mapped.sort((a, b) => (b.price?.amount ?? 0) - (a.price?.amount ?? 0));
        }

        return PaginatedResponse.ok(mapped, query.page, query.limit, total);
      },
      60,
      ['catalog:products'],
    );
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const cacheKey = `catalog:products:id:${id}`;

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const product = await this.productsRepo.findById(id);
        if (!product) {
          throw new NotFoundException(`Product with ID "${id}" not found`);
        }
        return this.mapToDto(product);
      },
      120,
      ['catalog:products'],
    );
  }

  async findBySlug(slug: string): Promise<ProductResponseDto> {
    const cacheKey = `catalog:products:slug:${slug}`;

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const product = await this.productsRepo.findBySlug(slug);
        if (!product) {
          throw new NotFoundException(`Product with slug "${slug}" not found`);
        }
        return this.mapToDto(product);
      },
      120,
      ['catalog:products'],
    );
  }

  // ── Product Lifecycle Management ────────────────────────────────────────────

  async create(createDto: CreateProductDto): Promise<ProductResponseDto> {
    const baseSlug = generateSlug(createDto.name);
    const existing = await this.productsRepo.findBySlug(baseSlug);
    const slug = existing ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const product = await this.productsRepo.create(createDto, slug);
    this.cacheService.invalidateByTag('catalog:products');

    return this.mapToDto(product);
  }

  async update(id: string, updateDto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.productsRepo.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    let slug: string | undefined;
    if (updateDto.name && updateDto.name !== product.name) {
      const baseSlug = generateSlug(updateDto.name);
      const existing = await this.productsRepo.findBySlug(baseSlug);
      slug = existing && existing.id !== id ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;
    }

    const updated = await this.productsRepo.update(id, updateDto, slug);
    this.cacheService.invalidateByTag('catalog:products');

    return this.mapToDto(updated);
  }

  async publish(id: string): Promise<ProductResponseDto> {
    const product = await this.productsRepo.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    if (!product.prices || product.prices.length === 0) {
      throw new BadRequestException('Product cannot be published without at least one active price');
    }

    const updated = await this.productsRepo.updateStatus(id, {
      isActive: true,
      isDraft: false,
    });
    this.cacheService.invalidateByTag('catalog:products');

    return this.mapToDto(updated);
  }

  async archive(id: string): Promise<ProductResponseDto> {
    const product = await this.productsRepo.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    const updated = await this.productsRepo.updateStatus(id, {
      isActive: false,
    });
    this.cacheService.invalidateByTag('catalog:products');

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.productsRepo.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    await this.productsRepo.softDelete(id);
    this.cacheService.invalidateByTag('catalog:products');

    return { message: 'Product archived successfully' };
  }

  // ── Product Comparison Engine ───────────────────────────────────────────────

  async compareProducts(ids: string[]): Promise<ProductComparisonResponseDto> {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length < 2) {
      throw new BadRequestException('At least 2 unique products are required for comparison');
    }
    if (uniqueIds.length > 5) {
      throw new BadRequestException('Maximum 5 products can be compared simultaneously');
    }

    const products = await this.productsRepo.findManyByIds(uniqueIds);

    if (products.length !== uniqueIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = uniqueIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(`Products not found for comparison: ${missing.join(', ')}`);
    }

    const comparisonItems: ComparisonProductItemDto[] = products.map((p) => {
      const dto = this.mapToDto(p);
      return {
        id: dto.id,
        name: dto.name,
        slug: dto.slug,
        sku: dto.sku,
        componentType: dto.componentType,
        brand: dto.brand,
        primaryImageUrl: dto.primaryImage?.url || null,
        price: dto.price?.amount || null,
        compareAt: dto.price?.compareAt || null,
        discountPercent: dto.price?.discountPercent || null,
        inStock: dto.inventory.inStock,
        stockStatus: dto.inventory.stockStatus,
        specifications: dto.specifications || {},
      };
    });

    // Determine all unique spec keys present across all products
    const allSpecKeysSet = new Set<string>();
    for (const item of comparisonItems) {
      for (const key of Object.keys(item.specifications)) {
        allSpecKeysSet.add(key);
      }
    }
    const allSpecKeys = Array.from(allSpecKeysSet).sort();

    // Identify keys where values differ across products
    const differenceKeys: string[] = [];
    for (const key of allSpecKeys) {
      const values = comparisonItems.map((item) => JSON.stringify(item.specifications[key] ?? null));
      const hasDifference = values.some((val) => val !== values[0]);
      if (hasDifference) {
        differenceKeys.push(key);
      }
    }

    const firstType = comparisonItems[0]?.componentType ?? '';
    const isSameComponentType = comparisonItems.every((item) => item.componentType === firstType);

    return {
      products: comparisonItems,
      allSpecKeys,
      differenceKeys,
      isSameComponentType,
    };
  }

  // ── Variant Sub-operations ──────────────────────────────────────────────────

  async addVariant(productId: string, dto: CreateProductVariantDto) {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const variant = await this.productsRepo.createVariant(productId, dto);
    this.cacheService.invalidateByTag('catalog:products');
    return variant;
  }

  async updateVariant(productId: string, variantId: string, dto: UpdateProductVariantDto) {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const updated = await this.productsRepo.updateVariant(variantId, dto);
    this.cacheService.invalidateByTag('catalog:products');
    return updated;
  }

  async removeVariant(productId: string, variantId: string) {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    await this.productsRepo.deleteVariant(variantId);
    this.cacheService.invalidateByTag('catalog:products');
    return { message: 'Variant removed successfully' };
  }

  // ── Image Sub-operations ────────────────────────────────────────────────────

  async addImage(productId: string, dto: CreateProductImageDto) {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const image = await this.productsRepo.addImage(productId, dto);
    this.cacheService.invalidateByTag('catalog:products');
    return image;
  }

  async removeImage(productId: string, imageId: string) {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    await this.productsRepo.deleteImage(productId, imageId);
    this.cacheService.invalidateByTag('catalog:products');
    return { message: 'Image deleted successfully' };
  }

  async setPrimaryImage(productId: string, imageId: string) {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const updated = await this.productsRepo.setPrimaryImage(productId, imageId);
    this.cacheService.invalidateByTag('catalog:products');
    return updated;
  }

  // ── Component Specification Upsert ──────────────────────────────────────────

  async upsertSpecification(productId: string, componentType: string, specData: any) {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const spec = await this.productsRepo.upsertComponentSpec(productId, componentType, specData);
    this.cacheService.invalidateByTag('catalog:products');
    return spec;
  }

  // ── Mapping & Enrichment ────────────────────────────────────────────────────

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
      // Omit DB internal keys id and productId
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
