import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BuildsRepository } from './builds.repository';
import { CreateBuildDto, UpdateBuildDto, BuildResponseDto } from './dto/build.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/response.dto';

@Injectable()
export class BuildsService {
  constructor(private readonly buildsRepo: BuildsRepository) {}

  async findAllByUser(userId: string, query: PaginationDto): Promise<PaginatedResponse<BuildResponseDto>> {
    const [builds, total] = await Promise.all([
      this.buildsRepo.findAllByUser(userId, query.skip, query.limit),
      this.buildsRepo.countAllByUser(userId),
    ]);

    const data = builds.map((b: any) => this.mapToDto(b));
    return PaginatedResponse.ok(data, query.page, query.limit, total);
  }

  async findOne(id: string, userId: string): Promise<BuildResponseDto> {
    const build = await this.buildsRepo.findById(id);
    if (!build) {
      throw new NotFoundException('Build not found');
    }
    if (build.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.mapToDto(build);
  }

  async create(userId: string, createDto: CreateBuildDto): Promise<BuildResponseDto> {
    // Basic implementation: calculate total price by summing up the product prices
    // In reality, this requires fetching current prices from products
    const build = await this.buildsRepo.create(userId, createDto);
    return this.mapToDto(build);
  }

  async update(id: string, userId: string, updateDto: UpdateBuildDto): Promise<BuildResponseDto> {
    const build = await this.buildsRepo.findById(id);
    if (!build) {
      throw new NotFoundException('Build not found');
    }
    if (build.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.buildsRepo.update(id, updateDto);
    return this.mapToDto(updated);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const build = await this.buildsRepo.findById(id);
    if (!build) {
      throw new NotFoundException('Build not found');
    }
    if (build.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.buildsRepo.delete(id);
    return { message: 'Build deleted successfully' };
  }

  private mapToDto(build: any): BuildResponseDto {
    return {
      id: build.id,
      userId: build.userId,
      name: build.name,
      description: build.description,
      items: build.buildItems?.map((item: any) => ({
        productId: item.productId,
        productVariantId: item.productVariantId,
      })) || [],
      totalEstimatedPrice: Number(build.totalEstimatedPrice),
      createdAt: build.createdAt.toISOString(),
      updatedAt: build.updatedAt.toISOString(),
    };
  }
}
