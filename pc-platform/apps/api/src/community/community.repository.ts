import { Injectable } from '@nestjs/common';
import { DatabaseService, Prisma , ModerationStatus } from '@pc-platform/database';

@Injectable()
export class CommunityRepository {
  constructor(private readonly db: DatabaseService) {}

  async findMany(params: {
    where: Prisma.CommunityBuildWhereInput;
    orderBy: Prisma.CommunityBuildOrderByWithRelationInput;
    skip: number;
    take: number;
  }) {
    return this.db.communityBuild.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async count(where: Prisma.CommunityBuildWhereInput) {
    return this.db.communityBuild.count({ where });
  }

  async findBySlug(slug: string) {
    return this.db.communityBuild.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        comments: {
          where: { isModerated: false },
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.db.communityBuild.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async incrementViewCount(id: string) {
    return this.db.communityBuild.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  async create(data: Prisma.CommunityBuildCreateInput) {
    return this.db.communityBuild.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.CommunityBuildUpdateInput) {
    return this.db.communityBuild.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.db.communityBuild.delete({
      where: { id },
    });
  }

  async findLike(buildId: string, userId: string) {
    return this.db.communityBuildLike.findUnique({
      where: {
        buildId_userId: {
          buildId,
          userId,
        },
      },
    });
  }

  async addLike(buildId: string, userId: string) {
    return this.db.$transaction(async (tx) => {
      const like = await tx.communityBuildLike.create({
        data: {
          buildId,
          userId,
        },
      });
      await tx.communityBuild.update({
        where: { id: buildId },
        data: { likeCount: { increment: 1 } },
      });
      return like;
    });
  }

  async removeLike(buildId: string, userId: string) {
    return this.db.$transaction(async (tx) => {
      await tx.communityBuildLike.delete({
        where: {
          buildId_userId: {
            buildId,
            userId,
          },
        },
      });
      await tx.communityBuild.update({
        where: { id: buildId },
        data: { likeCount: { decrement: 1 } },
      });
    });
  }

  async findComments(buildId: string) {
    return this.db.communityBuildComment.findMany({
      where: { buildId, isModerated: false },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async addComment(buildId: string, userId: string, content: string) {
    return this.db.$transaction(async (tx) => {
      const comment = await tx.communityBuildComment.create({
        data: {
          buildId,
          userId,
          content,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });
      await tx.communityBuild.update({
        where: { id: buildId },
        data: { commentCount: { increment: 1 } },
      });
      return comment;
    });
  }

  async createReport(data: Prisma.CommunityBuildReportCreateInput) {
    return this.db.communityBuildReport.create({
      data,
    });
  }

  async getFilterMetadata() {
    const builds = await this.db.communityBuild.findMany({
      where: { moderationStatus: ModerationStatus.APPROVED },
      select: {
        cpuName: true,
        gpuName: true,
        useCase: true,
        totalPrice: true,
      },
    });

    const cpus = Array.from(new Set(builds.map((b) => b.cpuName).filter(Boolean))) as string[];
    const gpus = Array.from(new Set(builds.map((b) => b.gpuName).filter(Boolean))) as string[];
    const useCases = Array.from(new Set(builds.map((b) => b.useCase).filter(Boolean))) as string[];

    return {
      cpus: cpus.sort(),
      gpus: gpus.sort(),
      useCases: useCases.sort(),
      totalBuilds: builds.length,
    };
  }

  // Admin methods
  async findManyAdmin(params: {
    where: Prisma.CommunityBuildWhereInput;
    orderBy: Prisma.CommunityBuildOrderByWithRelationInput;
    skip: number;
    take: number;
  }) {
    return this.db.communityBuild.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reports: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findReports(where: Prisma.CommunityBuildReportWhereInput = {}, skip = 0, take = 50) {
    return this.db.communityBuildReport.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        build: {
          select: {
            id: true,
            name: true,
            slug: true,
            moderationStatus: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateReport(id: string, data: Prisma.CommunityBuildReportUpdateInput) {
    return this.db.communityBuildReport.update({
      where: { id },
      data,
    });
  }
}
