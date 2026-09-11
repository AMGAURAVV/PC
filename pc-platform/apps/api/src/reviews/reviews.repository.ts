import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';

import type { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllByProduct(productId: string, skip: number, take: number) {
    return this.db.review.findMany({
      skip,
      take,
      where: { productId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });
  }

  async countAllByProduct(productId: string) {
    return this.db.review.count({
      where: { productId, deletedAt: null },
    });
  }

  async findById(id: string) {
    return this.db.review.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async findByUserAndProduct(userId: string, productId: string) {
    return this.db.review.findFirst({
      where: { userId, productId, deletedAt: null },
    });
  }

  async create(userId: string, data: CreateReviewDto) {
    return this.db.review.create({
      data: {
        userId,
        productId: data.productId,
        rating: data.rating,
        body: data.body ?? null,
      },
    });
  }

  async update(id: string, data: UpdateReviewDto) {
    return this.db.review.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.db.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
