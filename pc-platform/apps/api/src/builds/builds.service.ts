import { randomBytes } from 'crypto';

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ComponentType } from '@pc-platform/database';
import type {
  BuildComponents,
  CompatibilityComponentSpec,
  CompatibilityResult,
  ComponentCategory,
} from '@pc-platform/types';

import type { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/response.dto';

import { BuildsRepository } from './builds.repository';
import { CompatibilityClientService } from './compatibility-client.service';
import type {
  CreateBuildDto,
  UpdateBuildDto,
  AddBuildItemDto,
  ReplaceBuildItemDto,
  ReorderBuildItemsDto,
  SaveBuildVersionDto,
  ShareBuildDto,
  BuildResponseDto,
  BuildItemResponseDto,
  BuildCalculationsDto,
  BuildVersionResponseDto,
  SharedBuildResponseDto,
  EvaluateBuildDto,
} from './dto/build.dto';



@Injectable()
export class BuildsService {
  constructor(
    private readonly buildsRepo: BuildsRepository,
    private readonly compatClient: CompatibilityClientService,
  ) {}

  async findAllByUser(userId: string, query: PaginationDto): Promise<PaginatedResponse<BuildResponseDto>> {
    const [builds, total] = await Promise.all([
      this.buildsRepo.findAllByUser(userId, query.skip, query.limit),
      this.buildsRepo.countAllByUser(userId),
    ]);

    const data = await Promise.all(builds.map((b) => this.mapToDto(b, userId, undefined, true)));
    return PaginatedResponse.ok(data, query.page, query.limit, total);
  }

  async findOne(id: string, userId: string): Promise<BuildResponseDto> {
    const build = await this.buildsRepo.findById(id);
    if (!build) {
      throw new NotFoundException(`Build with ID ${id} not found`);
    }
    if (build.userId !== userId) {
      throw new ForbiddenException('Access denied to this build');
    }
    return this.mapToDto(build, userId);
  }

  async create(userId: string, createDto: CreateBuildDto): Promise<BuildResponseDto> {
    const build = await this.buildsRepo.create(userId, {
      name: createDto.name,
      description: createDto.description ?? undefined,
      isPublic: createDto.isPublic ?? false,
    });

    if (createDto.items && createDto.items.length > 0) {
      for (let i = 0; i < createDto.items.length; i++) {
        const itemDto = createDto.items[i]!;
        await this.addItemInternal(build.id, itemDto, i);
      }
    }

    const reloaded = await this.buildsRepo.findById(build.id);
    const dto = await this.mapToDto(reloaded!, userId);

    // Automatically snapshot initial Version 1
    await this.buildsRepo.createVersion({
      buildId: build.id,
      versionNumber: 1,
      label: 'Initial build creation',
      snapshot: dto,
      createdBy: userId,
    });

    return dto;
  }

  async update(id: string, userId: string, updateDto: UpdateBuildDto): Promise<BuildResponseDto> {
    await this.assertBuildOwnership(id, userId);

    const updated = await this.buildsRepo.update(id, {
      name: updateDto.name ?? undefined,
      description: updateDto.description ?? undefined,
      isPublic: updateDto.isPublic ?? undefined,
      status: updateDto.status as any,
    });

    return this.mapToDto(updated, userId);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    await this.assertBuildOwnership(id, userId);
    await this.buildsRepo.delete(id);
    return { message: 'Build deleted successfully' };
  }

  // ── Items Management ──────────────────────────────────────────────────────────

  async addItem(buildId: string, userId: string, dto: AddBuildItemDto): Promise<BuildResponseDto> {
    await this.assertBuildOwnership(buildId, userId);

    const currentMaxSort = await this.buildsRepo.getMaxSortOrder(buildId);
    const sortOrder = dto.sortOrder !== undefined ? dto.sortOrder : currentMaxSort + 1;

    await this.addItemInternal(buildId, dto, sortOrder);

    const updated = await this.buildsRepo.findById(buildId);
    return this.mapToDto(updated!, userId);
  }

  private async addItemInternal(buildId: string, dto: AddBuildItemDto, sortOrder: number) {
    const product = await this.buildsRepo.findProductWithSpecs(dto.productId);
    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    const priceSnapshot = this.resolveActivePrice(product, dto.productVariantId);

    await this.buildsRepo.addItem({
      buildId,
      productId: dto.productId,
      variantId: dto.productVariantId ?? undefined,
      componentType: product.componentType,
      quantity: dto.quantity ?? 1,
      sortOrder,
      priceSnapshot,
      notes: dto.notes ?? undefined,
    });

    await this.recalculateTotalPriceCache(buildId);
  }

  async removeItem(buildId: string, userId: string, itemId: string): Promise<BuildResponseDto> {
    await this.assertBuildOwnership(buildId, userId);

    const item = await this.buildsRepo.findItemById(itemId);
    if (!item || item.buildId !== buildId) {
      throw new NotFoundException(`Item ${itemId} not found in this build`);
    }

    await this.buildsRepo.removeItem(itemId);
    await this.recalculateTotalPriceCache(buildId);

    const updated = await this.buildsRepo.findById(buildId);
    return this.mapToDto(updated!, userId);
  }

  async replaceItem(
    buildId: string,
    userId: string,
    itemId: string,
    dto: ReplaceBuildItemDto,
  ): Promise<BuildResponseDto> {
    await this.assertBuildOwnership(buildId, userId);

    const existingItem = await this.buildsRepo.findItemById(itemId);
    if (!existingItem || existingItem.buildId !== buildId) {
      throw new NotFoundException(`Item ${itemId} not found in this build`);
    }

    const newProduct = await this.buildsRepo.findProductWithSpecs(dto.newProductId);
    if (!newProduct) {
      throw new NotFoundException(`Product ${dto.newProductId} not found`);
    }

    const priceSnapshot = this.resolveActivePrice(newProduct, dto.newProductVariantId);

    await this.buildsRepo.updateItem(itemId, {
      productId: dto.newProductId,
      variantId: dto.newProductVariantId ?? null,
      componentType: newProduct.componentType,
      quantity: dto.quantity ?? existingItem.quantity,
      priceSnapshot,
      notes: dto.notes !== undefined ? dto.notes : existingItem.notes ?? undefined,
    });

    await this.recalculateTotalPriceCache(buildId);

    const updated = await this.buildsRepo.findById(buildId);
    return this.mapToDto(updated!, userId);
  }

  async reorderItems(
    buildId: string,
    userId: string,
    dto: ReorderBuildItemsDto,
  ): Promise<BuildResponseDto> {
    await this.assertBuildOwnership(buildId, userId);

    await this.buildsRepo.reorderItems(buildId, dto.items);

    const updated = await this.buildsRepo.findById(buildId);
    return this.mapToDto(updated!, userId);
  }

  // ── Versioning & Snapshots ───────────────────────────────────────────────────

  async saveVersion(
    buildId: string,
    userId: string,
    dto: SaveBuildVersionDto,
  ): Promise<BuildVersionResponseDto> {
    await this.assertBuildOwnership(buildId, userId);

    const build = await this.buildsRepo.findById(buildId);
    if (!build) {
      throw new NotFoundException(`Build ${buildId} not found`);
    }

    const latestVersion = await this.buildsRepo.getLatestVersionNumber(buildId);
    const nextVersionNumber = latestVersion + 1;

    const fullSnapshot = await this.mapToDto(build, userId);

    const version = await this.buildsRepo.createVersion({
      buildId,
      versionNumber: nextVersionNumber,
      label: dto.label || `Version ${nextVersionNumber}`,
      snapshot: fullSnapshot,
      createdBy: userId,
    });

    return {
      id: version.id,
      buildId: version.buildId,
      versionNumber: version.versionNumber,
      label: version.label,
      snapshot: version.snapshot,
      createdBy: version.createdBy,
      createdAt: version.createdAt.toISOString(),
    };
  }

  async getVersions(buildId: string, userId: string): Promise<BuildVersionResponseDto[]> {
    await this.assertBuildOwnership(buildId, userId);

    const versions = await this.buildsRepo.findVersions(buildId);
    return versions.map((v) => ({
      id: v.id,
      buildId: v.buildId,
      versionNumber: v.versionNumber,
      label: v.label,
      snapshot: v.snapshot,
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    }));
  }

  async getVersion(
    buildId: string,
    userId: string,
    versionNumber: number,
  ): Promise<BuildVersionResponseDto> {
    await this.assertBuildOwnership(buildId, userId);

    const version = await this.buildsRepo.findVersionByNumber(buildId, versionNumber);
    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} for build ${buildId} not found`);
    }

    return {
      id: version.id,
      buildId: version.buildId,
      versionNumber: version.versionNumber,
      label: version.label,
      snapshot: version.snapshot,
      createdBy: version.createdBy,
      createdAt: version.createdAt.toISOString(),
    };
  }

  // ── Duplicate ────────────────────────────────────────────────────────────────

  async duplicate(buildId: string, userId: string): Promise<BuildResponseDto> {
    const original = await this.buildsRepo.findById(buildId);
    if (!original) {
      throw new NotFoundException(`Build ${buildId} not found`);
    }

    if (original.userId !== userId && !original.isPublic) {
      throw new ForbiddenException('Access denied to duplicate this private build');
    }

    // Clone build metadata
    const cloned = await this.buildsRepo.create(userId, {
      name: `${original.name} (Copy)`,
      description: original.description ?? undefined,
      isPublic: false,
    });

    // Clone all items
    for (const item of original.items) {
      await this.buildsRepo.addItem({
        buildId: cloned.id,
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        componentType: item.componentType,
        quantity: item.quantity,
        sortOrder: item.sortOrder,
        priceSnapshot: Number(item.priceSnapshot || 0),
        notes: item.notes ?? undefined,
      });
    }

    await this.recalculateTotalPriceCache(cloned.id);

    const reloaded = await this.buildsRepo.findById(cloned.id);
    const dto = await this.mapToDto(reloaded!, userId);

    // Initial snapshot for duplicate
    await this.buildsRepo.createVersion({
      buildId: cloned.id,
      versionNumber: 1,
      label: `Cloned from ${original.name}`,
      snapshot: dto,
      createdBy: userId,
    });

    return dto;
  }

  // ── Sharing & Publishing ─────────────────────────────────────────────────────

  async share(buildId: string, userId: string, dto: ShareBuildDto): Promise<SharedBuildResponseDto> {
    await this.assertBuildOwnership(buildId, userId);

    // Generate unique URL-safe token
    const token = randomBytes(8).toString('hex');
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

    // Deactivate previous active links for fresh link
    await this.buildsRepo.deactivateAllSharedLinks(buildId);

    const link = await this.buildsRepo.createSharedLink({
      buildId,
      token,
      label: dto.label ?? undefined,
      expiresAt,
      maxViews: dto.maxViews ?? undefined,
    });

    await this.buildsRepo.update(buildId, { isPublic: true });

    const build = await this.buildsRepo.findById(buildId);
    const buildDto = await this.mapToDto(build!, userId);

    return {
      token: link.token,
      build: buildDto,
      label: link.label,
      viewCount: link.viewCount,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      createdAt: link.createdAt.toISOString(),
    };
  }

  async unpublish(buildId: string, userId: string): Promise<{ message: string }> {
    await this.assertBuildOwnership(buildId, userId);

    await this.buildsRepo.deactivateAllSharedLinks(buildId);
    await this.buildsRepo.update(buildId, { isPublic: false });

    return { message: 'Build has been unpublished. All shared links are now deactivated.' };
  }

  async getSharedBuild(token: string): Promise<SharedBuildResponseDto> {
    const link = await this.buildsRepo.findSharedLinkByToken(token);
    if (!link || !link.isActive || !link.build) {
      throw new NotFoundException('Shared build link is invalid or has expired');
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      await this.buildsRepo.deactivateAllSharedLinks(link.buildId);
      throw new NotFoundException('This shared build link has expired');
    }

    if (link.maxViews && link.viewCount >= link.maxViews) {
      throw new NotFoundException('This shared build link has reached its maximum view limit');
    }

    // Increment view count asynchronously
    await this.buildsRepo.incrementShareViewCount(link.id);

    const buildDto = await this.mapToDto(link.build, link.build.userId, token);

    return {
      token: link.token,
      build: buildDto,
      label: link.label,
      viewCount: link.viewCount + 1,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      createdAt: link.createdAt.toISOString(),
    };
  }

  // ── On-demand Compatibility Check ───────────────────────────────────────────

  async checkCompatibility(buildId: string, userId: string): Promise<CompatibilityResult> {
    await this.assertBuildOwnership(buildId, userId);

    const build = await this.buildsRepo.findById(buildId);
    if (!build) {
      throw new NotFoundException(`Build ${buildId} not found`);
    }

    const components = this.mapBuildToComponents(build.items);
    return this.compatClient.check(components);
  }

  async evaluateItems(dto: EvaluateBuildDto): Promise<BuildCalculationsDto> {
    if (!dto.items || dto.items.length === 0) {
      return {
        totalPrice: 0,
        estimatedPowerW: 0,
        recommendedPsuW: 450,
        compatibilityStatus: 'compatible',
        warnings: [],
        performanceScore: 0,
        valueScore: 0,
        compatibilityResult: {
          status: 'compatible',
          compatible: true,
          issues: [],
          warnings: [],
          summary: 'No components configured.',
        },
      };
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.buildsRepo.findProductsByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalPrice = 0;
    const pseudoItems: any[] = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) continue;
      const qty = item.quantity || 1;
      const unitPrice = this.resolveActivePrice(product);
      totalPrice += unitPrice * qty;
      pseudoItems.push({
        product,
        quantity: qty,
      });
    }

    const estimatedPowerW = this.calculateEstimatedPower(pseudoItems);
    const recommendedPsuW = this.calculateRecommendedPsu(estimatedPowerW, pseudoItems);
    const performanceScore = this.calculatePerformanceScore(pseudoItems);
    const valueScore = this.calculateValueScore(performanceScore, totalPrice);

    const buildComponents = this.mapBuildToComponents(pseudoItems);
    const compatResult = await this.compatClient.check(buildComponents);

    return {
      totalPrice,
      estimatedPowerW,
      recommendedPsuW,
      compatibilityStatus: compatResult.status,
      warnings: [...compatResult.issues, ...compatResult.warnings],
      performanceScore,
      valueScore,
      compatibilityResult: compatResult,
    };
  }

  // ── Helper Calculations & Transformations ───────────────────────────────────

  private async assertBuildOwnership(buildId: string, userId: string) {
    const build = await this.buildsRepo.findById(buildId);
    if (!build) {
      throw new NotFoundException(`Build ${buildId} not found`);
    }
    if (build.userId !== userId) {
      throw new ForbiddenException('Access denied to this build');
    }
    return build;
  }

  private resolveActivePrice(product: any, variantId?: string): number {
    if (variantId && product.variants) {
      const variant = product.variants.find((v: any) => v.id === variantId);
      if (variant && variant.prices && variant.prices.length > 0) {
        const vPrice = variant.prices.find((p: any) => p.isActive && p.priceType === 'RETAIL');
        if (vPrice) return Number(vPrice.amount);
      }
    }

    if (product.prices && product.prices.length > 0) {
      const pPrice = product.prices.find((p: any) => p.isActive && p.priceType === 'RETAIL');
      if (pPrice) return Number(pPrice.amount);
      const anyActive = product.prices.find((p: any) => p.isActive);
      if (anyActive) return Number(anyActive.amount);
    }

    return 0;
  }

  private async recalculateTotalPriceCache(buildId: string): Promise<number> {
    const build = await this.buildsRepo.findById(buildId);
    if (!build) return 0;

    let total = 0;
    for (const item of build.items) {
      const unitPrice = this.resolveActivePrice(item.product, item.variantId ?? undefined) || Number(item.priceSnapshot || 0);
      total += unitPrice * item.quantity;
    }

    await this.buildsRepo.updateTotalPrice(buildId, total);
    return total;
  }

  private calculateEstimatedPower(items: any[]): number {
    let power = 50; // Base motherboard, chipset, and system baseline

    for (const item of items) {
      const p = item.product;
      const qty = item.quantity || 1;

      if (p.cpuSpec?.tdpW) {
        power += (p.cpuSpec.maxTdpW || p.cpuSpec.tdpW) * qty;
      } else if (p.componentType === ComponentType.CPU) {
        power += (p.powerRequirement?.watts || 65) * qty;
      }

      if (p.gpuSpec?.tdpW) {
        power += p.gpuSpec.tdpW * qty;
      } else if (p.componentType === ComponentType.GPU) {
        power += (p.powerRequirement?.watts || 200) * qty;
      }

      if (p.ramSpec) {
        const sticks = p.ramSpec.stickCount || 2;
        power += sticks * 4 * qty;
      } else if (p.componentType === ComponentType.RAM) {
        power += 8 * qty;
      }

      if (p.componentType === ComponentType.STORAGE) {
        power += 7 * qty;
      }

      if (p.componentType === ComponentType.FAN) {
        power += 3 * qty;
      }

      if (p.componentType === ComponentType.COOLER) {
        power += 15 * qty;
      }
    }

    return Math.round(power);
  }

  private calculateRecommendedPsu(estimatedPowerW: number, items: any[]): number {
    // Standard rule: 30% headroom for transients and optimal 50-80% PSU load curve
    let recommended = Math.ceil((estimatedPowerW * 1.3) / 50) * 50;

    // Check GPU recommended PSU spec
    for (const item of items) {
      if (item.product?.gpuSpec?.recommendedPsuW) {
        recommended = Math.max(recommended, item.product.gpuSpec.recommendedPsuW);
      }
    }

    return Math.max(recommended, 450); // Minimum 450W PSU baseline
  }

  private calculatePerformanceScore(items: any[]): number {
    if (!items || items.length === 0) return 0;

    let cpuScore = 0;
    let gpuScore = 0;
    let ramScore = 5;

    for (const item of items) {
      const p = item.product;

      if (p.cpuSpec) {
        const cores = p.cpuSpec.cores || 6;
        const clock = p.cpuSpec.boostClockMhz || p.cpuSpec.baseClockMhz || 4000;
        cpuScore = Math.min(40, (cores / 16) * 20 + (clock / 5500) * 20);
      } else if (p.componentType === ComponentType.CPU) {
        cpuScore = 25;
      }

      if (p.gpuSpec) {
        const vram = p.gpuSpec.vramGb || 8;
        const tdp = p.gpuSpec.tdpW || 200;
        gpuScore = Math.min(50, (vram / 24) * 25 + (tdp / 450) * 25);
      } else if (p.componentType === ComponentType.GPU) {
        gpuScore = 30;
      }

      if (p.ramSpec) {
        const capacity = p.ramSpec.totalCapacityGb || 16;
        ramScore = Math.min(10, (capacity / 64) * 10);
      }
    }

    const totalScore = Math.round(cpuScore + gpuScore + ramScore);
    return Math.max(10, Math.min(99, totalScore));
  }

  private calculateValueScore(perfScore: number, totalPrice: number): number {
    if (perfScore === 0 || totalPrice === 0) return 0;
    // Ratio of performance index to total price scaled to 0-100 index
    const ratio = (perfScore / (totalPrice / 1500)) * 10;
    return Math.round(Math.max(20, Math.min(98, ratio)));
  }

  private mapBuildToComponents(items: any[]): BuildComponents {
    const components: BuildComponents = {};

    for (const item of items) {
      const p = item.product;
      const type = p.componentType;

      const specItem: CompatibilityComponentSpec = {
        productId: p.id,
        name: p.name,
        category: type as unknown as ComponentCategory,
        specs: {
          ...p.cpuSpec,
          ...p.gpuSpec,
          ...p.motherboardSpec,
          ...p.ramSpec,
          ...p.storageSpec,
          ...p.psuSpec,
          ...p.caseSpec,
          ...p.coolerSpec,
          ...p.fanSpec,
          ...p.monitorSpec,
          ...p.peripheralSpec,
          powerRequirement: p.powerRequirement,
          physicalDimension: p.physicalDimension,
          brand: p.brand?.name,
          model: p.model,
          name: p.name,
        },
      };

      switch (type) {
        case ComponentType.CPU:
          components.cpu = specItem;
          break;
        case ComponentType.MOTHERBOARD:
          components.motherboard = specItem;
          break;
        case ComponentType.COOLER:
          components.cpuCooler = specItem;
          components.cooling = specItem;
          break;
        case ComponentType.RAM:
          components.ram = components.ram || [];
          components.ram.push(specItem);
          break;
        case ComponentType.GPU:
          components.gpu = specItem;
          break;
        case ComponentType.STORAGE:
          components.storage = components.storage || [];
          components.storage.push(specItem);
          break;
        case ComponentType.PSU:
          components.psu = specItem;
          break;
        case ComponentType.CASE:
          components.case = specItem;
          break;
        case ComponentType.FAN:
          components.fans = components.fans || [];
          components.fans.push(specItem);
          break;
        case ComponentType.MONITOR:
          components.monitor = specItem;
          break;
        default:
          components.otherComponents = components.otherComponents || [];
          components.otherComponents.push(specItem);
          break;
      }
    }

    return components;
  }

  private async mapToDto(
    build: any,
    userId: string,
    explicitShareToken?: string,
    skipCompatCheck = false,
  ): Promise<BuildResponseDto> {
    let totalPrice = 0;

    const itemsDto: BuildItemResponseDto[] = (build.items || []).map((item: any) => {
      const p = item.product;
      const unitPrice = this.resolveActivePrice(p, item.variantId) || Number(item.priceSnapshot || 0);
      const itemTotal = unitPrice * item.quantity;
      totalPrice += itemTotal;

      const rawSpec =
        p.cpuSpec ||
        p.gpuSpec ||
        p.motherboardSpec ||
        p.ramSpec ||
        p.storageSpec ||
        p.psuSpec ||
        p.caseSpec ||
        p.coolerSpec ||
        p.fanSpec ||
        p.monitorSpec ||
        p.peripheralSpec;

      let specs: Record<string, any> | undefined;
      if (rawSpec) {
        const { id, productId, ...rest } = rawSpec;
        specs = rest;
      }

      return {
        id: item.id,
        productId: item.productId,
        productVariantId: item.variantId || null,
        productName: p.name,
        productSlug: p.slug,
        componentType: item.componentType,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        sortOrder: item.sortOrder,
        notes: item.notes || null,
        specs,
        imageUrl: p.images && p.images.length > 0 ? p.images[0].url : null,
      };
    });

    const estimatedPowerW = this.calculateEstimatedPower(build.items || []);
    const recommendedPsuW = this.calculateRecommendedPsu(estimatedPowerW, build.items || []);
    const performanceScore = this.calculatePerformanceScore(build.items || []);
    const valueScore = this.calculateValueScore(performanceScore, totalPrice);

    // Call compatibility engine (skipped on bulk build listings for performance)
    let compatResult: any = {
      status: 'COMPATIBLE',
      isCompatible: true,
      issues: [],
      warnings: [],
      rulesEvaluated: 0,
    };

    if (!skipCompatCheck) {
      const buildComponents = this.mapBuildToComponents(build.items || []);
      compatResult = await this.compatClient.check(buildComponents);
    }

    const calculations: BuildCalculationsDto = {
      totalPrice,
      estimatedPowerW,
      recommendedPsuW,
      compatibilityStatus: compatResult.status,
      warnings: [...(compatResult.issues || []), ...(compatResult.warnings || [])],
      performanceScore,
      valueScore,
      compatibilityResult: compatResult,
    };

    const activeShareToken = explicitShareToken || (build.sharedLinks && build.sharedLinks.length > 0 ? build.sharedLinks[0].token : null);
    const shareUrl = activeShareToken ? `https://pcplatform.com/b/${activeShareToken}` : null;

    return {
      id: build.id,
      userId: build.userId,
      name: build.name,
      description: build.description || null,
      status: build.status,
      isPublic: build.isPublic,
      items: itemsDto,
      calculations,
      shareUrl,
      activeShareToken,
      versionsCount: build.versions?.length ?? 0,
      createdAt: build.createdAt.toISOString(),
      updatedAt: build.updatedAt.toISOString(),
    };
  }
}
