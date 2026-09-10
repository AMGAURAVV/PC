import { Injectable } from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            productCategories: true,
          },
        },
      },
    });
  }

  async findTree() {
    return this.db.category.findMany({
      where: {
        parentId: null,
        deletedAt: null,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { deletedAt: null, isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              where: { deletedAt: null, isActive: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                _count: { select: { productCategories: true } },
              },
            },
            _count: { select: { productCategories: true } },
          },
        },
        _count: {
          select: {
            productCategories: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.db.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        children: { where: { deletedAt: null } },
        parent: true,
        _count: {
          select: { productCategories: true },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.db.category.findFirst({
      where: { slug, deletedAt: null },
      include: {
        children: { where: { deletedAt: null } },
        parent: true,
        _count: {
          select: { productCategories: true },
        },
      },
    });
  }

  async create(data: CreateCategoryDto, slug: string) {
    return this.db.category.create({
      data: {
        name: data.name,
        slug,
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
      include: {
        children: true,
        _count: { select: { productCategories: true } },
      },
    });
  }

  async update(id: string, data: UpdateCategoryDto, slug?: string) {
    return this.db.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(slug && { slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        children: true,
        _count: { select: { productCategories: true } },
      },
    });
  }

  async delete(id: string) {
    return this.db.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
