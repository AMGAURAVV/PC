import { Injectable } from '@nestjs/common';
import { DatabaseService, ComponentType, Prisma } from '@pc-platform/database';

export const buildInclude = {
  items: {
    include: {
      product: {
        include: {
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' as const },
            take: 1,
          },
          prices: {
            where: { isActive: true },
          },
          powerRequirement: true,
          physicalDimension: true,
          cpuSpec: true,
          gpuSpec: true,
          motherboardSpec: true,
          ramSpec: true,
          storageSpec: true,
          psuSpec: true,
          caseSpec: true,
          coolerSpec: true,
          fanSpec: true,
          monitorSpec: true,
          peripheralSpec: true,
        },
      },
      variant: {
        include: {
          prices: {
            where: { isActive: true },
          },
        },
      },
    },
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
  versions: {
    select: {
      id: true,
      versionNumber: true,
      label: true,
      createdAt: true,
      createdBy: true,
    },
    orderBy: {
      versionNumber: 'desc' as const,
    },
  },
  sharedLinks: {
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
    take: 1,
  },
} satisfies Prisma.BuildInclude;

export const sharedLinkInclude = {
  build: {
    include: buildInclude,
  },
} satisfies Prisma.SharedBuildLinkInclude;

export type FullBuildPayload = Prisma.BuildGetPayload<{ include: typeof buildInclude }>;
export type SharedLinkPayload = Prisma.SharedBuildLinkGetPayload<{ include: typeof sharedLinkInclude }>;

@Injectable()
export class BuildsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllByUser(userId: string, skip: number, take: number): Promise<FullBuildPayload[]> {
    return this.db.build.findMany({
      skip,
      take,
      where: { userId, deletedAt: null },
      include: buildInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async countAllByUser(userId: string): Promise<number> {
    return this.db.build.count({
      where: { userId, deletedAt: null },
    });
  }

  async findById(id: string): Promise<FullBuildPayload | null> {
    return this.db.build.findFirst({
      where: { id, deletedAt: null },
      include: buildInclude,
    });
  }

  async findProductWithSpecs(productId: string) {
    return this.db.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        prices: {
          where: { isActive: true },
        },
        powerRequirement: true,
        physicalDimension: true,
        cpuSpec: true,
        gpuSpec: true,
        motherboardSpec: true,
        ramSpec: true,
        storageSpec: true,
        psuSpec: true,
        caseSpec: true,
        coolerSpec: true,
        fanSpec: true,
        monitorSpec: true,
        peripheralSpec: true,
      },
    });
  }

  async create(userId: string, data: { name: string; description?: string | undefined; isPublic?: boolean | undefined }): Promise<FullBuildPayload> {
    return this.db.build.create({
      data: {
        userId,
        name: data.name,
        description: data.description ?? null,
        isPublic: data.isPublic ?? false,
        totalPriceCache: 0,
      },
      include: buildInclude,
    });
  }

  async update(id: string, data: { name?: string | undefined; description?: string | undefined; isPublic?: boolean | undefined; status?: any }): Promise<FullBuildPayload> {
    const updateData: Prisma.BuildUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.status !== undefined) updateData.status = data.status;

    return this.db.build.update({
      where: { id },
      data: updateData,
      include: buildInclude,
    });
  }

  async updateTotalPrice(id: string, totalPrice: number) {
    return this.db.build.update({
      where: { id },
      data: { totalPriceCache: totalPrice },
    });
  }

  async delete(id: string) {
    return this.db.build.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Items Operations ──────────────────────────────────────────────────────────

  async findItemById(itemId: string) {
    return this.db.buildItem.findUnique({
      where: { id: itemId },
      include: {
        build: true,
      },
    });
  }

  async addItem(data: {
    buildId: string;
    productId: string;
    variantId?: string | undefined;
    componentType: ComponentType;
    quantity: number;
    sortOrder: number;
    priceSnapshot: number;
    notes?: string | undefined;
  }) {
    return this.db.buildItem.create({
      data: {
        buildId: data.buildId,
        productId: data.productId,
        variantId: data.variantId ?? null,
        componentType: data.componentType,
        quantity: data.quantity,
        sortOrder: data.sortOrder,
        priceSnapshot: data.priceSnapshot,
        notes: data.notes ?? null,
      },
    });
  }

  async updateItem(
    itemId: string,
    data: {
      productId?: string | undefined;
      variantId?: string | null | undefined;
      componentType?: ComponentType | undefined;
      quantity?: number | undefined;
      sortOrder?: number | undefined;
      priceSnapshot?: number | undefined;
      notes?: string | undefined;
    },
  ) {
    const itemUpdate: Prisma.BuildItemUncheckedUpdateInput = {};
    if (data.productId !== undefined) itemUpdate.productId = data.productId;
    if (data.variantId !== undefined) itemUpdate.variantId = data.variantId;
    if (data.componentType !== undefined) itemUpdate.componentType = data.componentType;
    if (data.quantity !== undefined) itemUpdate.quantity = data.quantity;
    if (data.sortOrder !== undefined) itemUpdate.sortOrder = data.sortOrder;
    if (data.priceSnapshot !== undefined) itemUpdate.priceSnapshot = data.priceSnapshot;
    if (data.notes !== undefined) itemUpdate.notes = data.notes;

    return this.db.buildItem.update({
      where: { id: itemId },
      data: itemUpdate,
    });
  }

  async removeItem(itemId: string) {
    return this.db.buildItem.delete({
      where: { id: itemId },
    });
  }

  async getMaxSortOrder(buildId: string): Promise<number> {
    const aggregate = await this.db.buildItem.aggregate({
      where: { buildId },
      _max: { sortOrder: true },
    });
    return aggregate._max.sortOrder ?? -1;
  }

  async reorderItems(buildId: string, items: { itemId: string; sortOrder: number }[]) {
    return this.db.$transaction(
      items.map((item) =>
        this.db.buildItem.updateMany({
          where: {
            id: item.itemId,
            buildId,
          },
          data: {
            sortOrder: item.sortOrder,
          },
        }),
      ),
    );
  }

  // ── Versioning ───────────────────────────────────────────────────────────────

  async getLatestVersionNumber(buildId: string): Promise<number> {
    const latest = await this.db.buildVersion.findFirst({
      where: { buildId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    return latest?.versionNumber ?? 0;
  }

  async createVersion(data: {
    buildId: string;
    versionNumber: number;
    label?: string | undefined;
    snapshot: any;
    createdBy?: string | undefined;
  }) {
    return this.db.buildVersion.create({
      data: {
        buildId: data.buildId,
        versionNumber: data.versionNumber,
        label: data.label ?? null,
        snapshot: data.snapshot,
        createdBy: data.createdBy ?? null,
      },
    });
  }

  async findVersions(buildId: string) {
    return this.db.buildVersion.findMany({
      where: { buildId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async findVersionByNumber(buildId: string, versionNumber: number) {
    return this.db.buildVersion.findUnique({
      where: {
        buildId_versionNumber: {
          buildId,
          versionNumber,
        },
      },
    });
  }

  // ── Sharing ──────────────────────────────────────────────────────────────────

  async createSharedLink(data: {
    buildId: string;
    token: string;
    label?: string | undefined;
    expiresAt?: Date | undefined;
    maxViews?: number | undefined;
  }) {
    return this.db.sharedBuildLink.create({
      data: {
        buildId: data.buildId,
        token: data.token,
        label: data.label ?? null,
        expiresAt: data.expiresAt ?? null,
        maxViews: data.maxViews ?? null,
        isActive: true,
      },
    });
  }

  async deactivateAllSharedLinks(buildId: string) {
    return this.db.sharedBuildLink.updateMany({
      where: { buildId, isActive: true },
      data: { isActive: false },
    });
  }

  async findSharedLinkByToken(token: string): Promise<SharedLinkPayload | null> {
    return this.db.sharedBuildLink.findUnique({
      where: { token },
      include: sharedLinkInclude,
    });
  }

  async incrementShareViewCount(linkId: string) {
    return this.db.sharedBuildLink.update({
      where: { id: linkId },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  async findProductsByIds(productIds: string[]) {
    return this.db.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      include: {
        brand: true,
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        prices: {
          where: { isActive: true },
        },
        powerRequirement: true,
        physicalDimension: true,
        cpuSpec: true,
        gpuSpec: true,
        motherboardSpec: true,
        ramSpec: true,
        storageSpec: true,
        psuSpec: true,
        caseSpec: true,
        coolerSpec: true,
        fanSpec: true,
        monitorSpec: true,
        peripheralSpec: true,
      },
    });
  }
}
