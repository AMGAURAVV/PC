import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@pc-platform/database';
import { ModerationStatus } from '@pc-platform/database';

import { CacheService } from '../common/cache/cache.service';

import { CommunityRepository } from './community.repository';
import type {
  QueryCommunityBuildsDto,
  PublishCommunityBuildDto,
  ReportCommunityBuildDto,
} from './dto/community.dto';

@Injectable()
export class CommunityService {
  constructor(
    private readonly communityRepo: CommunityRepository,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(query: QueryCommunityBuildsDto, currentUserId?: string): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 12, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.CommunityBuildWhereInput = {
      moderationStatus: ModerationStatus.APPROVED,
    };

    if (query.useCase) {
      where.useCase = { equals: query.useCase, mode: 'insensitive' };
    }

    if (query.budgetMin !== undefined || query.budgetMax !== undefined) {
      where.totalPrice = {};
      if (query.budgetMin !== undefined) where.totalPrice.gte = query.budgetMin;
      if (query.budgetMax !== undefined) where.totalPrice.lte = query.budgetMax;
    }

    if (query.gpu) {
      where.gpuName = { contains: query.gpu, mode: 'insensitive' };
    }

    if (query.cpu) {
      where.cpuName = { contains: query.cpu, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { cpuName: { contains: query.search, mode: 'insensitive' } },
        { gpuName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Sort order
    let orderBy: Prisma.CommunityBuildOrderByWithRelationInput = { publishedAt: 'desc' };
    if (query.sort === 'featured') {
      orderBy = { isFeatured: 'desc' };
    } else if (query.sort === 'popular') {
      orderBy = { likeCount: 'desc' };
    } else if (query.sort === 'price_asc') {
      orderBy = { totalPrice: 'asc' };
    } else if (query.sort === 'price_desc') {
      orderBy = { totalPrice: 'desc' };
    } else if (query.sort === 'latest') {
      orderBy = { publishedAt: 'desc' };
    }

    const [items, total] = await Promise.all([
      this.communityRepo.findMany({ where, orderBy, skip, take: limit }),
      this.communityRepo.count(where),
    ]);

    // If zero builds in database, auto-seed with rich starter showcase builds!
    if (total === 0 && !query.search && !query.useCase && !query.budgetMin && !query.budgetMax && !query.gpu && !query.cpu) {
      await this.ensureInitialSeedData();
      return this.findAll(query, currentUserId);
    }

    const mappedItems = items.map((build) => this.mapBuildToResponse(build, currentUserId));

    return {
      items: mappedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getFilterMetadata() {
    return this.cacheService.wrap(
      'community:filters:metadata',
      async () => this.communityRepo.getFilterMetadata(),
      600, // 10 minutes cache
      ['community:builds'],
    );
  }

  async findBySlug(slug: string, currentUserId?: string) {
    const build = await this.communityRepo.findBySlug(slug);
    if (!build || build.moderationStatus === ModerationStatus.REMOVED) {
      throw new NotFoundException(`Community build "${slug}" not found`);
    }

    // Increment view count asynchronously
    this.communityRepo.incrementViewCount(build.id).catch(() => {});

    return this.mapBuildDetailToResponse(build, currentUserId);
  }

  async publish(userId: string, dto: PublishCommunityBuildDto) {
    const baseSlug = this.generateSlug(dto.name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.communityRepo.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const images = dto.images && dto.images.length > 0
      ? dto.images
      : ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80'];

    const newBuild = await this.communityRepo.create({
      slug,
      name: dto.name,
      description: dto.description ?? null,
      useCase: dto.useCase ?? 'Gaming',
      totalPrice: dto.totalPrice ?? 0,
      cpuName: dto.cpuName ?? null,
      gpuName: dto.gpuName ?? null,
      motherboardName: dto.motherboardName ?? null,
      ramInfo: dto.ramInfo ?? null,
      storageInfo: dto.storageInfo ?? null,
      caseName: dto.caseName ?? null,
      psuInfo: dto.psuInfo ?? null,
      coolerName: dto.coolerName ?? null,
      images,
      components: dto.components || [],
      compatibilitySummary: dto.compatibilitySummary || { status: 'COMPATIBLE' },
      author: {
        connect: { id: userId },
      },
      ...(dto.buildId ? { build: { connect: { id: dto.buildId } } } : {}),
      moderationStatus: ModerationStatus.APPROVED,
    });

    this.cacheService.invalidateByTag('community:builds');
    return this.mapBuildToResponse(newBuild, userId);
  }

  async toggleLike(buildId: string, userId: string) {
    const build = await this.communityRepo.findById(buildId);
    if (!build) {
      throw new NotFoundException(`Build ${buildId} not found`);
    }

    const existing = await this.communityRepo.findLike(buildId, userId);
    if (existing) {
      await this.communityRepo.removeLike(buildId, userId);
      return { liked: false, likeCount: Math.max(0, build.likeCount - 1) };
    } else {
      await this.communityRepo.addLike(buildId, userId);
      return { liked: true, likeCount: build.likeCount + 1 };
    }
  }

  async getComments(buildId: string) {
    const comments = await this.communityRepo.findComments(buildId);
    return comments.map((c) => ({
      id: c.id,
      buildId: c.buildId,
      userId: c.userId,
      user: {
        id: c.user.id,
        name: `${c.user.firstName} ${c.user.lastName}`.trim(),
        avatarUrl: c.user.avatarUrl,
      },
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async addComment(buildId: string, userId: string, content: string) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const comment = await this.communityRepo.addComment(buildId, userId, content.trim());
    return {
      id: comment.id,
      buildId: comment.buildId,
      userId: comment.userId,
      user: {
        id: comment.user.id,
        name: `${comment.user.firstName} ${comment.user.lastName}`.trim(),
        avatarUrl: comment.user.avatarUrl,
      },
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  async reportBuild(buildId: string, userId: string | null, dto: ReportCommunityBuildDto) {
    const build = await this.communityRepo.findById(buildId);
    if (!build) {
      throw new NotFoundException(`Build ${buildId} not found`);
    }

    const report = await this.communityRepo.createReport({
      build: { connect: { id: buildId } },
      ...(userId ? { user: { connect: { id: userId } } } : {}),
      reporterEmail: dto.reporterEmail ?? null,
      reason: dto.reason,
      details: dto.details ?? null,
    });

    return {
      id: report.id,
      message: 'Report submitted successfully for moderator review.',
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private mapBuildToResponse(build: any, currentUserId?: string) {
    const isLiked = currentUserId && build.likes
      ? build.likes.some((l: any) => l.userId === currentUserId)
      : false;

    return {
      id: build.id,
      slug: build.slug,
      name: build.name,
      description: build.description,
      useCase: build.useCase,
      totalPrice: Number(build.totalPrice),
      currency: build.currency,
      cpuName: build.cpuName,
      gpuName: build.gpuName,
      motherboardName: build.motherboardName,
      ramInfo: build.ramInfo,
      storageInfo: build.storageInfo,
      caseName: build.caseName,
      psuInfo: build.psuInfo,
      coolerName: build.coolerName,
      images: build.images || [],
      components: build.components || [],
      compatibilitySummary: build.compatibilitySummary || null,
      authorId: build.authorId,
      author: {
        id: build.author.id,
        name: `${build.author.firstName} ${build.author.lastName}`.trim(),
        email: build.author.email,
        avatarUrl: build.author.avatarUrl,
      },
      buildId: build.buildId,
      isFeatured: build.isFeatured,
      moderationStatus: build.moderationStatus,
      viewCount: build.viewCount,
      likeCount: build.likeCount,
      commentCount: build.commentCount,
      isLiked,
      moderatorNotes: build.moderatorNotes,
      publishedAt: build.publishedAt ? build.publishedAt.toISOString() : build.createdAt.toISOString(),
      createdAt: build.createdAt.toISOString(),
      updatedAt: build.updatedAt.toISOString(),
    };
  }

  private mapBuildDetailToResponse(build: any, currentUserId?: string) {
    const base = this.mapBuildToResponse(build, currentUserId);
    const comments = (build.comments || []).map((c: any) => ({
      id: c.id,
      buildId: c.buildId,
      userId: c.userId,
      user: {
        id: c.user.id,
        name: `${c.user.firstName} ${c.user.lastName}`.trim(),
        avatarUrl: c.user.avatarUrl,
      },
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return {
      ...base,
      comments,
    };
  }

  private async ensureInitialSeedData() {
    try {
      // Find or create a demo author user
      let user = await (this.communityRepo as any).db.user.findFirst();
      if (!user) {
        user = await (this.communityRepo as any).db.user.create({
          data: {
            email: 'community_curator@nexusrigs.com',
            passwordHash: 'dummy_hash_for_demo',
            firstName: 'Gaurav',
            lastName: 'Nexus',
            isVerified: true,
          },
        });
      }

      const seedBuilds = [
        {
          name: 'Cyberpunk Aurora Ultra RTX 4090',
          slug: 'cyberpunk-aurora-ultra-rtx-4090',
          description: 'White & ARGB high-end battlestation tuned for 4K raytracing, path tracing at 120+ FPS, and local LLM deep learning workloads.',
          useCase: 'Gaming',
          totalPrice: 385000,
          cpuName: 'AMD Ryzen 9 7950X3D',
          gpuName: 'NVIDIA GeForce RTX 4090 24GB',
          motherboardName: 'ASUS ROG STRIX X670E-A Gaming WIFI',
          ramInfo: '64GB (2x32GB) G.Skill Trident Z5 RGB DDR5-6000',
          storageInfo: 'Samsung 990 PRO 4TB PCIe 4.0 NVMe SSD',
          caseName: 'Lian Li O11 Dynamic EVO RGB White',
          psuInfo: 'Corsair RM1000x Shift 1000W 80+ Gold',
          coolerName: 'NZXT Kraken Elite 360 RGB White LCD',
          images: [
            'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
          ],
          components: [
            { productId: 'cpu-1', name: 'AMD Ryzen 9 7950X3D (16-Core, 32-Thread)', componentType: 'CPU', price: 61999, quantity: 1, specs: { socket: 'AM5', cores: 16, tdp: '120W' } },
            { productId: 'gpu-1', name: 'ASUS ROG Strix GeForce RTX 4090 24GB White OC', componentType: 'GPU', price: 215000, quantity: 1, specs: { vram: '24GB GDDR6X', length: '357mm' } },
            { productId: 'mb-1', name: 'ASUS ROG STRIX X670E-A GAMING WIFI', componentType: 'MOTHERBOARD', price: 38999, quantity: 1, specs: { formFactor: 'ATX', socket: 'AM5', pcie: 'PCIe 5.0' } },
            { productId: 'ram-1', name: 'G.Skill Trident Z5 RGB 64GB (2x32GB) DDR5-6000', componentType: 'RAM', price: 21499, quantity: 1, specs: { speed: '6000MHz', cas: 'CL30' } },
            { productId: 'ssd-1', name: 'Samsung 990 PRO 4TB M.2 PCIe 4.0 NVMe SSD', componentType: 'STORAGE', price: 29999, quantity: 1, specs: { read: '7450 MB/s', write: '6900 MB/s' } },
            { productId: 'case-1', name: 'Lian Li O11 Dynamic EVO RGB White', componentType: 'CASE', price: 16499, quantity: 1, specs: { maxGpu: '455mm', maxCooler: '167mm' } },
            { productId: 'psu-1', name: 'Corsair RM1000x Shift 1000W 80+ Gold Modular', componentType: 'PSU', price: 17999, quantity: 1, specs: { wattage: '1000W', efficiency: '80+ Gold' } },
            { productId: 'cooler-1', name: 'NZXT Kraken Elite 360 RGB LCD White', componentType: 'COOLER', price: 25999, quantity: 1, specs: { radiator: '360mm', fanCount: 3 } },
          ],
          compatibilitySummary: {
            status: 'COMPATIBLE',
            estimatedWattage: 720,
            recommendedPsuW: 1000,
            warnings: [],
            notes: ['GPU length 357mm verified against Lian Li 455mm max clearance', 'AM5 socket match confirmed'],
          },
          isFeatured: true,
          viewCount: 1420,
          likeCount: 184,
          commentCount: 12,
        },
        {
          name: 'Stealth Black 1440p Esports King',
          slug: 'stealth-black-1440p-esports-king',
          description: 'Optimized specifically for 240Hz competitive shooters (Valorant, CS2, Apex Legends). Zero RGB, high static pressure fans, Whisper-quiet operation.',
          useCase: 'Gaming',
          totalPrice: 148000,
          cpuName: 'AMD Ryzen 7 7800X3D',
          gpuName: 'NVIDIA GeForce RTX 4070 Super 12GB',
          motherboardName: 'MSI B650 Gaming Plus WIFI',
          ramInfo: '32GB (2x16GB) Corsair Vengeance DDR5-6000 CL30',
          storageInfo: 'WD Black SN850X 2TB NVMe SSD',
          caseName: 'Fractal Design North Charcoal Black Mesh',
          psuInfo: 'MSI MAG A750GL 750W 80+ Gold ATX 3.0',
          coolerName: 'Thermalright Peerless Assassin 120 SE Black',
          images: [
            'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80',
          ],
          components: [
            { productId: 'cpu-2', name: 'AMD Ryzen 7 7800X3D 8-Core Processor', componentType: 'CPU', price: 38999, quantity: 1, specs: { socket: 'AM5', cores: 8, tdp: '120W' } },
            { productId: 'gpu-2', name: 'ZOTAC Gaming GeForce RTX 4070 Super Twin Edge 12GB', componentType: 'GPU', price: 58999, quantity: 1, specs: { vram: '12GB GDDR6X', length: '234mm' } },
            { productId: 'mb-2', name: 'MSI B650 Gaming Plus WIFI', componentType: 'MOTHERBOARD', price: 16999, quantity: 1, specs: { formFactor: 'ATX', socket: 'AM5' } },
            { productId: 'ram-2', name: 'Corsair Vengeance 32GB (2x16GB) DDR5-6000 CL30', componentType: 'RAM', price: 10499, quantity: 1, specs: { speed: '6000MHz', cas: 'CL30' } },
            { productId: 'ssd-2', name: 'WD_BLACK 2TB SN850X NVMe Internal Gaming SSD', componentType: 'STORAGE', price: 14499, quantity: 1, specs: { read: '7300 MB/s' } },
            { productId: 'case-2', name: 'Fractal Design North Charcoal Black Mesh', componentType: 'CASE', price: 14999, quantity: 1, specs: { maxGpu: '355mm' } },
            { productId: 'psu-2', name: 'MSI MAG A750GL PCIE5 750W 80+ Gold', componentType: 'PSU', price: 8499, quantity: 1, specs: { wattage: '750W' } },
            { productId: 'cooler-2', name: 'Thermalright Peerless Assassin 120 SE Black', componentType: 'COOLER', price: 3899, quantity: 1, specs: { type: 'Dual Tower Air' } },
          ],
          compatibilitySummary: {
            status: 'COMPATIBLE',
            estimatedWattage: 480,
            recommendedPsuW: 750,
            warnings: [],
            notes: ['RAM clearance under front air cooler fan verified'],
          },
          isFeatured: true,
          viewCount: 980,
          likeCount: 142,
          commentCount: 8,
        },
        {
          name: 'Pro Audio & DaVinci Resolve Workstation',
          slug: 'pro-audio-davinci-resolve-workstation',
          description: 'Production monster engineered for 8K RED RAW grading, 128-track Ableton Live projects, and 3D Blender architectural rendering.',
          useCase: 'Workstation',
          totalPrice: 289000,
          cpuName: 'Intel Core i9-14900K',
          gpuName: 'NVIDIA GeForce RTX 4080 Super 16GB',
          motherboardName: 'GIGABYTE Z790 AORUS ELITE AX',
          ramInfo: '96GB (2x48GB) Corsair Vengeance DDR5-5600',
          storageInfo: 'Crucial T700 2TB Gen5 NVMe + 4TB Gen4 Scratch Drive',
          caseName: 'be quiet! Dark Base Pro 901',
          psuInfo: 'Seasonic Vertex GX-1000 1000W ATX 3.0',
          coolerName: 'ARCTIC Liquid Freezer III 420mm',
          images: [
            'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=1200&q=80',
          ],
          components: [
            { productId: 'cpu-3', name: 'Intel Core i9-14900K (24-Core, 32-Thread)', componentType: 'CPU', price: 53999, quantity: 1, specs: { socket: 'LGA1700', cores: 24, tdp: '253W' } },
            { productId: 'gpu-3', name: 'Gigabyte GeForce RTX 4080 Super Gaming OC 16GB', componentType: 'GPU', price: 104999, quantity: 1, specs: { vram: '16GB GDDR6X' } },
            { productId: 'mb-3', name: 'GIGABYTE Z790 AORUS ELITE AX', componentType: 'MOTHERBOARD', price: 27999, quantity: 1, specs: { formFactor: 'ATX', socket: 'LGA1700' } },
            { productId: 'ram-3', name: 'Corsair Vengeance 96GB (2x48GB) DDR5-5600', componentType: 'RAM', price: 29999, quantity: 1, specs: { capacity: '96GB', speed: '5600MHz' } },
            { productId: 'ssd-3', name: 'Crucial T700 2TB PCIe Gen5 NVMe SSD', componentType: 'STORAGE', price: 27499, quantity: 1, specs: { read: '12400 MB/s' } },
            { productId: 'case-3', name: 'be quiet! Dark Base Pro 901 Full Tower', componentType: 'CASE', price: 28999, quantity: 1, specs: { soundDampening: true } },
            { productId: 'psu-3', name: 'Seasonic Vertex GX-1000 1000W 80+ Gold', componentType: 'PSU', price: 19999, quantity: 1, specs: { wattage: '1000W' } },
            { productId: 'cooler-3', name: 'ARCTIC Liquid Freezer III 420 A-RGB', componentType: 'COOLER', price: 14999, quantity: 1, specs: { radiator: '420mm' } },
          ],
          compatibilitySummary: {
            status: 'COMPATIBLE',
            estimatedWattage: 680,
            recommendedPsuW: 1000,
            warnings: [],
            notes: ['Full tower case supports front 420mm radiator with clearance to spare'],
          },
          isFeatured: false,
          viewCount: 650,
          likeCount: 96,
          commentCount: 4,
        },
        {
          name: 'Compact SFF Lan Party Prodigy',
          slug: 'compact-sff-lan-party-prodigy',
          description: '11-liter Small Form Factor powerhouse that fits inside an airline backpack. Full desktop performance without compromises.',
          useCase: 'Budget Gaming',
          totalPrice: 86000,
          cpuName: 'AMD Ryzen 5 7600',
          gpuName: 'AMD Radeon RX 7600 XT 16GB',
          motherboardName: 'ASRock B650I Lightning WiFi Mini-ITX',
          ramInfo: '32GB (2x16GB) TeamGroup T-Create DDR5-6000',
          storageInfo: 'Crucial P3 Plus 2TB PCIe 4.0 M.2 SSD',
          caseName: 'Fractal Design Ridge White Mini-ITX',
          psuInfo: 'Corsair SF750 750W Platinum SFX',
          coolerName: 'Noctua NH-L12S Low Profile Cooler',
          images: [
            'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
          ],
          components: [
            { productId: 'cpu-4', name: 'AMD Ryzen 5 7600 6-Core Processor', componentType: 'CPU', price: 18999, quantity: 1, specs: { socket: 'AM5', cores: 6, tdp: '65W' } },
            { productId: 'gpu-4', name: 'Sapphire Pulse AMD Radeon RX 7600 XT 16GB', componentType: 'GPU', price: 32999, quantity: 1, specs: { vram: '16GB GDDR6' } },
            { productId: 'mb-4', name: 'ASRock B650I Lightning WiFi Mini-ITX', componentType: 'MOTHERBOARD', price: 17999, quantity: 1, specs: { formFactor: 'Mini-ITX' } },
            { productId: 'ram-4', name: 'TeamGroup T-Create Expert 32GB DDR5-6000', componentType: 'RAM', price: 9499, quantity: 1, specs: { height: '32mm low profile' } },
            { productId: 'ssd-4', name: 'Crucial P3 Plus 2TB PCIe 4.0 M.2 SSD', componentType: 'STORAGE', price: 11499, quantity: 1, specs: { read: '5000 MB/s' } },
            { productId: 'case-4', name: 'Fractal Design Ridge White Console Style SFF', componentType: 'CASE', price: 12999, quantity: 1, specs: { volume: '12.6L' } },
            { productId: 'psu-4', name: 'Corsair SF750 750W 80+ Platinum SFX', componentType: 'PSU', price: 14999, quantity: 1, specs: { formFactor: 'SFX' } },
            { productId: 'cooler-4', name: 'Noctua NH-L12S Low Profile 70mm Cooler', componentType: 'COOLER', price: 6299, quantity: 1, specs: { height: '70mm' } },
          ],
          compatibilitySummary: {
            status: 'COMPATIBLE',
            estimatedWattage: 320,
            recommendedPsuW: 550,
            warnings: [],
            notes: ['Low profile RAM fits underneath NH-L12S cooler bend'],
          },
          isFeatured: false,
          viewCount: 820,
          likeCount: 115,
          commentCount: 6,
        },
      ];

      for (const item of seedBuilds) {
        await (this.communityRepo as any).db.communityBuild.create({
          data: {
            ...item,
            authorId: user.id,
            moderationStatus: ModerationStatus.APPROVED,
          },
        });
      }
    } catch {
      // ignore if duplicate or error during auto-seed
    }
  }
}
