import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';

import { PaginatedResponse } from '../../common/dto/response.dto';
import { AdminAuditService } from '../admin-audit.service';
import type {
  CreateCompatibilityRuleDto,
  UpdateCompatibilityRuleDto,
  CompatibilityRuleFilterDto,
} from '../dto/admin-compatibility.dto';

@Injectable()
export class AdminCompatibilityService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
  ) {}

  async findAll(query: CompatibilityRuleFilterDto) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.ruleType) {
      where.ruleType = query.ruleType as any;
    }
    if (query.severity) {
      where.severity = query.severity as any;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [items, total] = await Promise.all([
      this.db.compatibilityRule.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { priority: 'asc' },
        include: {
          conditions: true,
          warnings: true,
        },
      }),
      this.db.compatibilityRule.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }

  async findOne(id: string) {
    const rule = await this.db.compatibilityRule.findUnique({
      where: { id },
      include: {
        conditions: true,
        warnings: true,
      },
    });

    if (!rule) {
      throw new NotFoundException(`Compatibility rule with ID "${id}" not found`);
    }

    return rule;
  }

  async create(dto: CreateCompatibilityRuleDto, actor?: any) {
    const existing = await this.db.compatibilityRule.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`Compatibility rule with name "${dto.name}" already exists`);
    }

    const rule = await this.db.compatibilityRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        ruleType: dto.ruleType as any,
        severity: (dto.severity || 'ERROR') as any,
        priority: dto.priority ?? 100,
        tags: dto.tags || [],
        notes: dto.notes ?? null,
        isActive: dto.isActive ?? true,
        ...(dto.conditions?.length && {
          conditions: {
            create: dto.conditions.map((c) => ({
              conditionIndex: c.conditionIndex,
              componentType: c.componentType as any,
              attributePath: c.attributePath,
              operator: c.operator as any,
              value: c.value,
              targetComponentType: c.targetComponentType as any,
              targetAttributePath: c.targetAttributePath ?? null,
            })),
          },
        }),
      },
      include: {
        conditions: true,
      },
    });

    await this.audit.record({
      actor,
      action: 'CREATE',
      entityType: 'CompatibilityRule',
      entityId: rule.id,
      entityLabel: rule.name,
      after: rule,
    });

    return rule;
  }

  async update(id: string, dto: UpdateCompatibilityRuleDto, actor?: any) {
    const current = await this.findOne(id);

    const updated = await this.db.compatibilityRule.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.severity && { severity: dto.severity as any }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.notes !== undefined && { notes: dto.notes ?? null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { conditions: true, warnings: true },
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'CompatibilityRule',
      entityId: id,
      entityLabel: updated.name,
      before: current,
      after: updated,
    });

    return updated;
  }

  async delete(id: string, actor?: any) {
    const current = await this.findOne(id);
    await this.db.compatibilityRule.delete({ where: { id } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'CompatibilityRule',
      entityId: id,
      entityLabel: current.name,
      before: current,
    });

    return { success: true, message: `Compatibility rule "${current.name}" deleted` };
  }

  async toggleActive(id: string, actor?: any) {
    const current = await this.findOne(id);
    const updated = await this.db.compatibilityRule.update({
      where: { id },
      data: { isActive: !current.isActive },
    });

    await this.audit.record({
      actor,
      action: updated.isActive ? 'ACTIVATE' : 'SUSPEND',
      entityType: 'CompatibilityRule',
      entityId: id,
      entityLabel: current.name,
      before: { isActive: current.isActive },
      after: { isActive: updated.isActive },
    });

    return updated;
  }
}
