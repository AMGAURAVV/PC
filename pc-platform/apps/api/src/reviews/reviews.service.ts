import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

import type { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/response.dto';

import type { CreateReviewDto, UpdateReviewDto, ReviewResponseDto } from './dto/review.dto';
import type { ReviewsRepository } from './reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(private readonly reviewsRepo: ReviewsRepository) {}

  async findAllByProduct(productId: string, query: PaginationDto): Promise<PaginatedResponse<ReviewResponseDto>> {
    const [reviews, total] = await Promise.all([
      this.reviewsRepo.findAllByProduct(productId, query.skip, query.limit),
      this.reviewsRepo.countAllByProduct(productId),
    ]);

    const data = reviews.map((r) => this.mapToDto(r));
    return PaginatedResponse.ok(data, query.page, query.limit, total);
  }

  async findOne(id: string): Promise<ReviewResponseDto> {
    const review = await this.reviewsRepo.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return this.mapToDto(review);
  }

  async create(userId: string, createDto: CreateReviewDto): Promise<ReviewResponseDto> {
    const existing = await this.reviewsRepo.findByUserAndProduct(userId, createDto.productId);
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    const review = await this.reviewsRepo.create(userId, createDto);
    return this.mapToDto(review);
  }

  async update(id: string, userId: string, updateDto: UpdateReviewDto): Promise<ReviewResponseDto> {
    const review = await this.reviewsRepo.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.reviewsRepo.update(id, updateDto);
    return this.mapToDto(updated);
  }

  async remove(id: string, userId: string, isAdmin: boolean): Promise<{ message: string }> {
    const review = await this.reviewsRepo.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    await this.reviewsRepo.delete(id);
    return { message: 'Review deleted successfully' };
  }

  private mapToDto(review: any): ReviewResponseDto {
    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }
}
