import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService, ComponentType } from '@pc-platform/database';
import {
  RecommendationService as CoreRecommendationEngineService,
  type HardwarePool,
} from '@pc-platform/recommendation-engine';
import type {
  Product,
  RecommendationInput,
  RecommendationResult} from '@pc-platform/types';
import {
  ComponentCategory,
} from '@pc-platform/types';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly engineService: CoreRecommendationEngineService,
  ) {}

  public async generateRecommendation(
    input: RecommendationInput,
  ): Promise<RecommendationResult> {
    this.logger.log(
      `Received recommendation request for ${input.useCase} with budget ₹${input.budget}`,
    );

    // 1. Fetch active products with specs from database
    const dbProducts = await this.db.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        brand: true,
        prices: {
          where: { isActive: true },
          orderBy: { amount: 'asc' },
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
      },
    });

    // 2. Map and partition products into HardwarePool
    const pool = this.buildHardwarePool(dbProducts);

    // 3. Delegate to isolated recommendation engine
    return this.engineService.getRecommendation(input, pool);
  }

  private buildHardwarePool(rawProducts: any[]): HardwarePool {
    const pool: HardwarePool = {
      cpus: [],
      motherboards: [],
      gpus: [],
      ram: [],
      storage: [],
      psus: [],
      cases: [],
      cooling: [],
    };

    for (const raw of rawProducts) {
      const p = this.mapProduct(raw);
      if (!p) continue;

      switch (raw.componentType) {
        case ComponentType.CPU:
          pool.cpus.push(p);
          break;
        case ComponentType.MOTHERBOARD:
          pool.motherboards.push(p);
          break;
        case ComponentType.GPU:
          pool.gpus.push(p);
          break;
        case ComponentType.RAM:
          pool.ram.push(p);
          break;
        case ComponentType.STORAGE:
          pool.storage.push(p);
          break;
        case ComponentType.PSU:
          pool.psus.push(p);
          break;
        case ComponentType.CASE:
          pool.cases.push(p);
          break;
        case ComponentType.COOLER:
          pool.cooling.push(p);
          break;
        default:
          break;
      }
    }

    return pool;
  }

  private mapProduct(raw: any): Product | null {
    if (!raw) return null;

    // Lowest active price in rupees (raw amount is in paise)
    const pricePaise = raw.prices?.[0]?.amount || 1000000;
    const priceRupees = Math.round(Number(pricePaise) / 100);

    const availableStock = raw.inventory?.quantity || 10;

    const rawSpec =
      raw.cpuSpec ||
      raw.gpuSpec ||
      raw.motherboardSpec ||
      raw.ramSpec ||
      raw.storageSpec ||
      raw.psuSpec ||
      raw.caseSpec ||
      raw.coolerSpec ||
      {};

    const { id: _, productId: __, ...cleanSpecs } = rawSpec;

    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      description: raw.description || '',
      price: priceRupees,
      sku: raw.sku,
      stock: availableStock,
      isActive: raw.isActive ?? true,
      isFeatured: raw.isFeatured ?? false,
      brand: raw.brand?.name || 'Standard',
      model: raw.model || 'Standard',
      category: {} as any,
      componentCategory: this.mapComponentCategory(raw.componentType),
      specifications: cleanSpecs,
      images: [],
      createdAt: raw.createdAt ? raw.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: raw.updatedAt ? raw.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  private mapComponentCategory(type: ComponentType): ComponentCategory {
    switch (type) {
      case ComponentType.CPU:
        return ComponentCategory.CPU;
      case ComponentType.MOTHERBOARD:
        return ComponentCategory.MOTHERBOARD;
      case ComponentType.RAM:
        return ComponentCategory.RAM;
      case ComponentType.GPU:
        return ComponentCategory.GPU;
      case ComponentType.STORAGE:
        return ComponentCategory.STORAGE;
      case ComponentType.PSU:
        return ComponentCategory.PSU;
      case ComponentType.CASE:
        return ComponentCategory.CASE;
      case ComponentType.COOLER:
        return ComponentCategory.COOLING;
      default:
        return ComponentCategory.OTHER;
    }
  }
}
