import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepo: RolesRepository) {}

  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.rolesRepo.findAll();
    return roles.map(this.mapToDto);
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.rolesRepo.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.mapToDto(role);
  }

  async create(createDto: CreateRoleDto): Promise<RoleResponseDto> {
    const existing = await this.rolesRepo.findByName(createDto.name);
    if (existing) {
      throw new ConflictException('Role already exists');
    }

    const role = await this.rolesRepo.create(createDto);
    return this.mapToDto(role);
  }

  async update(id: string, updateDto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.rolesRepo.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    
    // Prevent modifying system roles if needed, for now just simple update
    if (['admin', 'super_admin', 'customer'].includes(role.name) && updateDto.name && updateDto.name !== role.name) {
       throw new BadRequestException('Cannot rename system roles');
    }

    if (updateDto.name && updateDto.name !== role.name) {
      const existing = await this.rolesRepo.findByName(updateDto.name);
      if (existing) {
        throw new ConflictException('Role name already exists');
      }
    }

    const updated = await this.rolesRepo.update(id, updateDto);
    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    const role = await this.rolesRepo.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (['admin', 'super_admin', 'customer'].includes(role.name)) {
       throw new BadRequestException('Cannot delete system roles');
    }

    await this.rolesRepo.delete(id);
    return { message: 'Role deleted successfully' };
  }

  private mapToDto(role: any): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }
}
