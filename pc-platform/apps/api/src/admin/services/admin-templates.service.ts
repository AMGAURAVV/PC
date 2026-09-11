import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';

import { PaginatedResponse } from '../../common/dto/response.dto';
import { AdminAuditService } from '../admin-audit.service';
import type {
  CreateBuildTemplateDto,
  UpdateBuildTemplateDto,
  BuildTemplateFilterDto,
} from '../dto/admin-template.dto';

function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

@Injectable()
export class AdminTemplatesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
  ) {}

  async findAll(query: BuildTemplateFilterDto) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    const [items, total] = await Promise.all([
      this.db.buildTemplate.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { sortOrder: 'asc' },
      }),
      this.db.buildTemplate.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }

  async findOne(id: string) {
    const template = await this.db.buildTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Build template with ID "${id}" not found`);
    }
    return template;
  }

  async create(dto: CreateBuildTemplateDto, actor?: any) {
    const slug = dto.slug || generateSlug(dto.name);
    const existing = await this.db.buildTemplate.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(`Build template with slug "${slug}" already exists`);
    }

    const template = await this.db.buildTemplate.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
        category: dto.category ?? null,
        budgetMin: dto.budgetMin ?? null,
        budgetMax: dto.budgetMax ?? null,
        items: dto.items as any,
        thumbnailUrl: dto.thumbnailUrl ?? null,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        createdBy: actor?.id || actor?.sub || null,
      },
    });

    await this.audit.record({
      actor,
      action: 'CREATE',
      entityType: 'BuildTemplate',
      entityId: template.id,
      entityLabel: template.name,
      after: template,
    });

    return template;
  }

  async update(id: string, dto: UpdateBuildTemplateDto, actor?: any) {
    const current = await this.findOne(id);
    if (dto.name && !dto.slug && dto.name !== current.name) {
      dto.slug = generateSlug(dto.name);
    }

    const updated = await this.db.buildTemplate.update({
      where: { id },
      data: dto as any,
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'BuildTemplate',
      entityId: id,
      entityLabel: updated.name,
      before: current,
      after: updated,
    });

    return updated;
  }

  async delete(id: string, actor?: any) {
    const current = await this.findOne(id);
    await this.db.buildTemplate.delete({ where: { id } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'BuildTemplate',
      entityId: id,
      entityLabel: current.name,
      before: current,
    });

    return { success: true, message: `Build template "${current.name}" deleted` };
  }

  async toggleFeatured(id: string, actor?: any) {
    const current = await this.findOne(id);
    const updated = await this.db.buildTemplate.update({
      where: { id },
      data: { isFeatured: !current.isFeatured },
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'BuildTemplate',
      entityId: id,
      entityLabel: `${current.name} (Featured: ${updated.isFeatured})`,
      metadata: { isFeatured: updated.isFeatured },
    });

    return updated;
  }

  async toggleActive(id: string, actor?: any) {
    const current = await this.findOne(id);
    const updated = await this.db.buildTemplate.update({
      where: { id },
      data: { isActive: !current.isActive },
    });

    await this.audit.record({
      actor,
      action: updated.isActive ? 'ACTIVATE' : 'SUSPEND',
      entityType: 'BuildTemplate',
      entityId: id,
      entityLabel: current.name,
      after: { isActive: updated.isActive },
    });

    return updated;
  }
}
