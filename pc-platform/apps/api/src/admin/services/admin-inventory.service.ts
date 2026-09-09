import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';
import { AdminAuditService } from '../admin-audit.service';
import {
  AdminInventoryFilterDto,
  StockAdjustmentDto,
  BulkStockAdjustmentDto,
  UpdateStockThresholdDto,
} from '../dto/admin-inventory.dto';
import { BulkOperationResultDto } from '../dto/admin-common.dto';
import { PaginatedResponse } from '../../common/dto/response.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class AdminInventoryService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
    private readonly cache: CacheService,
  ) {}

  async findAll(query: AdminInventoryFilterDto) {
    const where: any = {};

    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    if (query.search || query.componentType) {
      where.product = {
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { sku: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(query.componentType ? { componentType: query.componentType as any } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.db.inventory.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true, componentType: true, brand: true } },
          variant: { select: { id: true, name: true, sku: true } },
          supplier: { select: { id: true, name: true, code: true } },
        },
      }),
      this.db.inventory.count({ where }),
    ]);

    // Apply low stock / out of stock filtering in-memory if requested
    let filteredItems = items;
    if (query.lowStockOnly) {
      filteredItems = filteredItems.filter((i) => (i.quantity - i.reservedQty) <= i.lowStockThreshold && (i.quantity - i.reservedQty) > 0);
    } else if (query.outOfStockOnly) {
      filteredItems = filteredItems.filter((i) => (i.quantity - i.reservedQty) <= 0);
    }

    return PaginatedResponse.ok(filteredItems, query.page, query.limit, total);
  }

  async findByProduct(productId: string) {
    return this.db.inventory.findMany({
      where: { productId },
      include: {
        supplier: true,
        variant: true,
      },
    });
  }

  async adjustStock(dto: StockAdjustmentDto, actor?: any) {
    let inventory = await this.db.inventory.findFirst({
      where: {
        productId: dto.productId,
        variantId: dto.variantId || null,
        ...(dto.supplierId ? { supplierId: dto.supplierId } : {}),
      },
      include: { product: true },
    });

    if (!inventory) {
      // Find or create default platform supplier
      const defaultSupplier = await this.db.supplier.findFirst({ where: { isPlatform: true } })
        || await this.db.supplier.create({
          data: { name: 'Platform Warehouse', code: 'PLATFORM-WH', isPlatform: true, isActive: true },
        });

      inventory = await this.db.inventory.create({
        data: {
          productId: dto.productId,
          variantId: dto.variantId || null,
          supplierId: dto.supplierId || defaultSupplier.id,
          quantity: 0,
          reservedQty: 0,
          lowStockThreshold: 5,
        },
        include: { product: true },
      });
    }

    const previousQty = inventory.quantity;
    const newQty = previousQty + dto.quantityDelta;

    if (newQty < 0) {
      throw new BadRequestException(
        `Cannot reduce stock below 0. Current stock: ${previousQty}, requested delta: ${dto.quantityDelta}`,
      );
    }

    const updated = await this.db.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newQty },
      include: { product: true, variant: true },
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Inventory',
      entityId: inventory.id,
      entityLabel: `${inventory.product.name} (Stock ${dto.quantityDelta > 0 ? '+' : ''}${dto.quantityDelta})`,
      before: { quantity: previousQty },
      after: { quantity: newQty },
      metadata: {
        adjustmentType: dto.type,
        reason: dto.reason,
        delta: dto.quantityDelta,
        productId: dto.productId,
        variantId: dto.variantId,
      },
    });

    this.cache.invalidateByTag('catalog:products');
    return updated;
  }

  async bulkAdjust(dto: BulkStockAdjustmentDto, actor?: any): Promise<BulkOperationResultDto> {
    const errors: Array<{ id: string; error: string }> = [];
    let successCount = 0;

    for (const adj of dto.adjustments) {
      try {
        await this.adjustStock(adj, actor);
        successCount++;
      } catch (err: any) {
        errors.push({ id: adj.productId, error: err.message || 'Adjustment failed' });
      }
    }

    return BulkOperationResultDto.create(dto.adjustments.length, successCount, errors);
  }

  async updateThreshold(inventoryId: string, dto: UpdateStockThresholdDto, actor?: any) {
    const current = await this.db.inventory.findUnique({
      where: { id: inventoryId },
      include: { product: true },
    });

    if (!current) {
      throw new NotFoundException(`Inventory with ID "${inventoryId}" not found`);
    }

    const updated = await this.db.inventory.update({
      where: { id: inventoryId },
      data: { lowStockThreshold: dto.lowStockThreshold },
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Inventory',
      entityId: inventoryId,
      entityLabel: `${current.product.name} Low Stock Threshold`,
      before: { lowStockThreshold: current.lowStockThreshold },
      after: { lowStockThreshold: dto.lowStockThreshold },
    });

    return updated;
  }
}
