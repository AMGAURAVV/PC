import { Injectable } from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

import type { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async findById(id: string) {
    return this.db.permission.findUnique({
      where: { id },
    });
  }

  async findByAction(action: string) {
    return this.db.permission.findUnique({
      where: { action },
    });
  }

  async create(data: CreatePermissionDto) {
    return this.db.permission.create({
      data,
    });
  }

  async update(id: string, data: UpdatePermissionDto) {
    return this.db.permission.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.db.permission.delete({
      where: { id },
    });
  }
}
