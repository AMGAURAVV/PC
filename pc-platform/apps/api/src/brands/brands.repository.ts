import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(skip: number, take: number, isActive?: boolean, search?: string) {
    return this.db.brand.findMany({
      skip,
      take,
      where: {
        deletedAt: null,
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          name: { contains: search, mode: 'insensitive' },
        }),
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async countAll(isActive?: boolean, search?: string) {
    return this.db.brand.count({
      where: {
        deletedAt: null,
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          name: { contains: search, mode: 'insensitive' },
        }),
      },
    });
  }

  async findById(id: string) {
    return this.db.brand.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.db.brand.findFirst({
      where: { slug, deletedAt: null },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async create(data: CreateBrandDto, slug: string) {
    return this.db.brand.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        logoUrl: data.logoUrl ?? null,
        websiteUrl: data.websiteUrl ?? null,
      },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async update(id: string, data: UpdateBrandDto, slug?: string) {
    return this.db.brand.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(slug && { slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.websiteUrl !== undefined && { websiteUrl: data.websiteUrl }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async delete(id: string) {
    return this.db.brand.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
