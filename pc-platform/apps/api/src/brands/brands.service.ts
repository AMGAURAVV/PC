import { Injectable, NotFoundException } from '@nestjs/common';

import type { CacheService } from '../common/cache/cache.service';
import type { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/response.dto';

import type { BrandsRepository } from './brands.repository';
import type { CreateBrandDto, UpdateBrandDto, BrandResponseDto } from './dto/brand.dto';

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
export class BrandsService {
  constructor(
    private readonly brandsRepo: BrandsRepository,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(query: PaginationDto, isActive?: boolean, search?: string): Promise<PaginatedResponse<BrandResponseDto>> {
    const cacheKey = `catalog:brands:list:${query.page}:${query.limit}:${isActive}:${search || ''}`;

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const [brands, total] = await Promise.all([
          this.brandsRepo.findAll(query.skip, query.limit, isActive, search),
          this.brandsRepo.countAll(isActive, search),
        ]);

        const data = brands.map((b: any) => this.mapToDto(b));
        return PaginatedResponse.ok(data, query.page, query.limit, total);
      },
      180,
      ['catalog:brands'],
    );
  }

  async findOne(id: string): Promise<BrandResponseDto> {
    const brand = await this.brandsRepo.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand with ID "${id}" not found`);
    }
    return this.mapToDto(brand);
  }

  async findBySlug(slug: string): Promise<BrandResponseDto> {
    const brand = await this.brandsRepo.findBySlug(slug);
    if (!brand) {
      throw new NotFoundException(`Brand with slug "${slug}" not found`);
    }
    return this.mapToDto(brand);
  }

  async create(createDto: CreateBrandDto): Promise<BrandResponseDto> {
    const baseSlug = generateSlug(createDto.name);
    const existing = await this.brandsRepo.findBySlug(baseSlug);
    const slug = existing ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const brand = await this.brandsRepo.create(createDto, slug);
    this.cacheService.invalidateByTag('catalog:brands');
    return this.mapToDto(brand);
  }

  async update(id: string, updateDto: UpdateBrandDto): Promise<BrandResponseDto> {
    const brand = await this.brandsRepo.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand with ID "${id}" not found`);
    }

    let slug: string | undefined;
    if (updateDto.name && updateDto.name !== brand.name) {
      slug = generateSlug(updateDto.name);
    }

    const updatedBrand = await this.brandsRepo.update(id, updateDto, slug);
    this.cacheService.invalidateByTag('catalog:brands');
    return this.mapToDto(updatedBrand);
  }

  async remove(id: string): Promise<{ message: string }> {
    const brand = await this.brandsRepo.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand with ID "${id}" not found`);
    }

    await this.brandsRepo.delete(id);
    this.cacheService.invalidateByTag('catalog:brands');
    return { message: 'Brand deleted successfully' };
  }

  private mapToDto(brand: any): BrandResponseDto {
    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logoUrl,
      websiteUrl: brand.websiteUrl,
      productCount: brand._count?.products ?? 0,
      isActive: brand.isActive,
    };
  }
}
