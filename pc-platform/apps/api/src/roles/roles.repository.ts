import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';

import type { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.db.role.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return this.db.role.findUnique({
      where: { name },
    });
  }

  async create(data: CreateRoleDto) {
    return this.db.role.create({
      data,
    });
  }

  async update(id: string, data: UpdateRoleDto) {
    return this.db.role.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.db.role.delete({
      where: { id },
    });
  }
}
