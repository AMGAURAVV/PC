import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';
import { AdminAuditService } from '../admin-audit.service';
import {
  AdminReviewFilterDto,
  ModerateReviewDto,
  BulkModerateReviewsDto,
  AdminReviewStatus,
} from '../dto/admin-review.dto';
import { BulkOperationResultDto } from '../dto/admin-common.dto';
import { PaginatedResponse } from '../../common/dto/response.dto';

@Injectable()
export class AdminReviewsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
  ) {}

  async findAll(query: AdminReviewFilterDto) {
    const where: any = {};
    if (query.status) {
      where.status = query.status as any;
    }
    if (query.productId) {
      where.productId = query.productId;
    }
    if (query.rating) {
      where.rating = query.rating;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.review.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          product: { select: { id: true, name: true, slug: true } },
          images: true,
        },
      }),
      this.db.review.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }

  async findOne(id: string) {
    const review = await this.db.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        product: { select: { id: true, name: true, slug: true } },
        images: true,
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found`);
    }

    return review;
  }

  async moderate(id: string, dto: ModerateReviewDto, actor?: any) {
    const current = await this.findOne(id);

    const updated = await this.db.review.update({
      where: { id },
      data: {
        status: dto.status as any,
        moderatorNote: dto.moderatorNote ?? null,
      },
    });

    const action = dto.status === AdminReviewStatus.APPROVED
      ? 'APPROVE'
      : dto.status === AdminReviewStatus.REJECTED
      ? 'REJECT'
      : 'UPDATE';

    await this.audit.record({
      actor,
      action,
      entityType: 'Review',
      entityId: id,
      entityLabel: `${current.product.name} review by ${current.user.email} -> ${dto.status}`,
      before: { status: current.status },
      after: { status: dto.status },
      metadata: { note: dto.moderatorNote },
    });

    return updated;
  }

  async bulkModerate(dto: BulkModerateReviewsDto, actor?: any): Promise<BulkOperationResultDto> {
    const errors: Array<{ id: string; error: string }> = [];
    let successCount = 0;

    for (const id of dto.reviewIds) {
      try {
        await this.moderate(id, { status: dto.status, moderatorNote: dto.moderatorNote }, actor);
        successCount++;
      } catch (err: any) {
        errors.push({ id, error: err.message || 'Moderation failed' });
      }
    }

    return BulkOperationResultDto.create(dto.reviewIds.length, successCount, errors);
  }

  async delete(id: string, actor?: any) {
    const current = await this.findOne(id);
    await this.db.review.delete({ where: { id } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'Review',
      entityId: id,
      entityLabel: `${current.product.name} review by ${current.user.email}`,
      before: current,
    });

    return { success: true, message: 'Review deleted' };
  }
}
