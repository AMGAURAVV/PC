import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@pc-platform/database';
import { AuditAction, ModerationStatus } from '@pc-platform/database';

import { CommunityRepository } from '../../community/community.repository';
import { AdminAuditService } from '../admin-audit.service';
import type {
  AdminCommunityFilterDto,
  ModerateCommunityBuildDto,
  ResolveCommunityReportDto,
} from '../dto/admin-community.dto';

@Injectable()
export class AdminCommunityService {
  constructor(
    private readonly communityRepo: CommunityRepository,
    private readonly auditService: AdminAuditService,
  ) {}

  async findAll(query: AdminCommunityFilterDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.CommunityBuildWhereInput = {};

    if (query.status) {
      where.moderationStatus = query.status;
    }

    if (query.useCase) {
      where.useCase = { equals: query.useCase, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { cpuName: { contains: query.search, mode: 'insensitive' } },
        { gpuName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.communityRepo.findManyAdmin({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.communityRepo.count(where),
    ]);

    const mapped = items.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      description: b.description,
      useCase: b.useCase,
      totalPrice: Number(b.totalPrice),
      currency: b.currency,
      cpuName: b.cpuName,
      gpuName: b.gpuName,
      images: b.images,
      author: {
        id: b.author.id,
        name: `${b.author.firstName} ${b.author.lastName}`.trim(),
        email: b.author.email,
      },
      isFeatured: b.isFeatured,
      moderationStatus: b.moderationStatus,
      viewCount: b.viewCount,
      likeCount: b.likeCount,
      commentCount: b.commentCount,
      reportCount: b.reports.length,
      reports: b.reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        details: r.details,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      moderatorNotes: b.moderatorNotes,
      moderatedAt: b.moderatedAt ? b.moderatedAt.toISOString() : null,
      moderatedBy: b.moderatedBy,
      publishedAt: b.publishedAt.toISOString(),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async moderate(id: string, dto: ModerateCommunityBuildDto, actor: any) {
    const build = await this.communityRepo.findById(id);
    if (!build) {
      throw new NotFoundException(`Community build ${id} not found`);
    }

    let newStatus: ModerationStatus = build.moderationStatus;
    let isFeatured = build.isFeatured;

    switch (dto.action) {
      case 'approve':
        newStatus = ModerationStatus.APPROVED;
        break;
      case 'hide':
        newStatus = ModerationStatus.HIDDEN;
        break;
      case 'remove':
        newStatus = ModerationStatus.REMOVED;
        break;
      case 'feature':
        isFeatured = true;
        break;
      case 'unfeature':
        isFeatured = false;
        break;
    }

    const updated = await this.communityRepo.update(id, {
      moderationStatus: newStatus,
      isFeatured,
      moderatorNotes: dto.notes ?? build.moderatorNotes,
      moderatedAt: new Date(),
      moderatedBy: actor?.email || actor?.sub || 'admin',
    });

    await this.auditService.record({
      actor: { id: actor?.sub, email: actor?.email, sub: actor?.sub },
      action: dto.action === 'approve' ? AuditAction.APPROVE : AuditAction.UPDATE,
      entityType: 'CommunityBuild',
      entityId: id,
      entityLabel: build.name,
      before: { moderationStatus: build.moderationStatus, isFeatured: build.isFeatured },
      after: { moderationStatus: newStatus, isFeatured },
      metadata: { action: dto.action, notes: dto.notes },
    });

    return {
      id: updated.id,
      name: updated.name,
      moderationStatus: updated.moderationStatus,
      isFeatured: updated.isFeatured,
      message: `Build has been updated with action "${dto.action}".`,
    };
  }

  async findReports() {
    const reports = await this.communityRepo.findReports();
    return reports.map((r) => ({
      id: r.id,
      buildId: r.buildId,
      build: r.build,
      reporter: r.user ? `${r.user.firstName} ${r.user.lastName}` : (r.reporterEmail || 'Anonymous Guest'),
      reporterEmail: r.user?.email || r.reporterEmail,
      reason: r.reason,
      details: r.details,
      status: r.status,
      resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
      resolvedBy: r.resolvedBy,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async resolveReport(id: string, dto: ResolveCommunityReportDto, actor: any) {
    const updated = await this.communityRepo.updateReport(id, {
      status: dto.status,
      resolvedAt: new Date(),
      resolvedBy: actor?.email || actor?.sub || 'admin',
    });

    return {
      id: updated.id,
      status: updated.status,
      message: `Report ${id} marked as ${dto.status}.`,
    };
  }
}
