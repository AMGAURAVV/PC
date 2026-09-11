import { Injectable, NotFoundException } from '@nestjs/common';

import { CacheService } from '../common/cache/cache.service';

import { CategoriesRepository } from './categories.repository';
import type { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto/category.dto';

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
export class CategoriesService {
  constructor(
    private readonly categoriesRepo: CategoriesRepository,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(): Promise<CategoryResponseDto[]> {
    return this.cacheService.wrap(
      'catalog:categories:all',
      async () => {
        const categories = await this.categoriesRepo.findAll();
        return categories.map((c: any) => this.mapToDto(c));
      },
      300,
      ['catalog:categories'],
    );
  }

  async findTree(): Promise<CategoryResponseDto[]> {
    return this.cacheService.wrap(
      'catalog:categories:tree',
      async () => {
        const tree = await this.categoriesRepo.findTree();
        return tree.map((c: any) => this.mapToDtoWithChildren(c));
      },
      300,
      ['catalog:categories'],
    );
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepo.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return this.mapToDto(category);
  }

  async findBySlug(slug: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepo.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }
    return this.mapToDto(category);
  }

  async create(createDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const baseSlug = generateSlug(createDto.name);
    const existing = await this.categoriesRepo.findBySlug(baseSlug);
    const slug = existing ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const category = await this.categoriesRepo.create(createDto, slug);
    this.cacheService.invalidateByTag('catalog:categories');
    return this.mapToDto(category);
  }

  async update(id: string, updateDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepo.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    let slug: string | undefined;
    if (updateDto.name && updateDto.name !== category.name) {
      slug = generateSlug(updateDto.name);
    }

    const updatedCategory = await this.categoriesRepo.update(id, updateDto, slug);
    this.cacheService.invalidateByTag('catalog:categories');
    return this.mapToDto(updatedCategory);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.categoriesRepo.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    await this.categoriesRepo.delete(id);
    this.cacheService.invalidateByTag('catalog:categories');
    return { message: 'Category deleted successfully' };
  }

  private mapToDto(category: any): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      productCount: category._count?.productCategories ?? 0,
    };
  }

  private mapToDtoWithChildren(category: any): CategoryResponseDto {
    return {
      ...this.mapToDto(category),
      children: (category.children || []).map((child: any) => this.mapToDtoWithChildren(child)),
    };
  }
}
