import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import type { CreatePermissionDto, UpdatePermissionDto, PermissionResponseDto } from './dto/permission.dto';
import type { PermissionsRepository } from './permissions.repository';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepo: PermissionsRepository) {}

  async findAll(): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionsRepo.findAll();
    return permissions.map(this.mapToDto);
  }

  async findOne(id: string): Promise<PermissionResponseDto> {
    const permission = await this.permissionsRepo.findById(id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return this.mapToDto(permission);
  }

  async create(createDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    const existing = await this.permissionsRepo.findByAction(createDto.action);
    if (existing) {
      throw new ConflictException('Permission already exists');
    }

    const permission = await this.permissionsRepo.create(createDto);
    return this.mapToDto(permission);
  }

  async update(id: string, updateDto: UpdatePermissionDto): Promise<PermissionResponseDto> {
    const permission = await this.permissionsRepo.findById(id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    
    if (updateDto.action && updateDto.action !== permission.action) {
      const existing = await this.permissionsRepo.findByAction(updateDto.action);
      if (existing) {
        throw new ConflictException('Permission action already exists');
      }
    }

    const updated = await this.permissionsRepo.update(id, updateDto);
    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    const permission = await this.permissionsRepo.findById(id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    await this.permissionsRepo.delete(id);
    return { message: 'Permission deleted successfully' };
  }

  private mapToDto(permission: any): PermissionResponseDto {
    return {
      id: permission.id,
      action: permission.action,
      module: permission.module,
      description: permission.description,
      createdAt: permission.createdAt.toISOString(),
    };
  }
}
