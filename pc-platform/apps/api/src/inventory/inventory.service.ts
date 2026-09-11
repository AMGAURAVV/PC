import { Injectable, NotFoundException } from '@nestjs/common';

import type { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/response.dto';

import type { CreateInventoryDto, UpdateInventoryDto, InventoryResponseDto } from './dto/inventory.dto';
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  async findAll(query: PaginationDto): Promise<PaginatedResponse<InventoryResponseDto>> {
    const [items, total] = await Promise.all([
      this.inventoryRepo.findAll(query.skip, query.limit),
      this.inventoryRepo.countAll(),
    ]);

    const data = items.map((i) => this.mapToDto(i));
    return PaginatedResponse.ok(data, query.page, query.limit, total);
  }

  async findOne(id: string): Promise<InventoryResponseDto> {
    const item = await this.inventoryRepo.findById(id);
    if (!item) {
      throw new NotFoundException('Inventory record not found');
    }
    return this.mapToDto(item);
  }

  async findByProduct(productId: string): Promise<InventoryResponseDto> {
    const item = await this.inventoryRepo.findByProductId(productId);
    if (!item) {
      throw new NotFoundException('Inventory record not found for product');
    }
    return this.mapToDto(item);
  }

  async create(createDto: CreateInventoryDto): Promise<InventoryResponseDto> {
    const item = await this.inventoryRepo.create(createDto);
    return this.mapToDto(item);
  }

  async update(id: string, updateDto: UpdateInventoryDto): Promise<InventoryResponseDto> {
    const item = await this.inventoryRepo.findById(id);
    if (!item) {
      throw new NotFoundException('Inventory record not found');
    }
    const updated = await this.inventoryRepo.update(id, updateDto);
    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    const item = await this.inventoryRepo.findById(id);
    if (!item) {
      throw new NotFoundException('Inventory record not found');
    }

    await this.inventoryRepo.delete(id);
    return { message: 'Inventory record deleted successfully' };
  }

  private mapToDto(item: any): InventoryResponseDto {
    return {
      id: item.id,
      productId: item.productId,
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      location: item.location,
      lastUpdated: item.lastUpdated.toISOString(),
    };
  }
}
