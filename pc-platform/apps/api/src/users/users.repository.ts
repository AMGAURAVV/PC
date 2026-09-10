import { Injectable } from '@nestjs/common';
import type { DatabaseService , Prisma } from '@pc-platform/database';

import type { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(skip: number, take: number) {
    return this.db.user.findMany({
      skip,
      take,
      where: { deletedAt: null },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async countAll() {
    return this.db.user.count({
      where: { deletedAt: null },
    });
  }

  async findById(id: string) {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async create(data: CreateUserDto, passwordHash: string) {
    // We assume the 'customer' role exists
    const customerRole = await this.db.role.findUnique({
      where: { name: 'customer' },
    });

    if (!customerRole) {
      throw new Error('Default customer role not found in database');
    }

    return this.db.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        userRoles: {
          create: {
            roleId: customerRole.id,
          },
        },
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async update(id: string, data: Partial<UpdateUserDto & { passwordHash?: string }>) {
    return this.db.user.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.passwordHash && { passwordHash: data.passwordHash }),
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async delete(id: string) {
    return this.db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
