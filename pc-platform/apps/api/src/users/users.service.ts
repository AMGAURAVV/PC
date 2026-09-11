import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import type { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/response.dto';

import type { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async findAll(query: PaginationDto): Promise<PaginatedResponse<UserResponseDto>> {
    const [users, total] = await Promise.all([
      this.usersRepo.findAll(query.skip, query.limit),
      this.usersRepo.countAll(),
    ]);

    const data = users.map((u) => this.mapToDto(u));
    return PaginatedResponse.ok(data, query.page, query.limit, total);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapToDto(user);
  }

  async create(createDto: CreateUserDto): Promise<UserResponseDto> {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(createDto.password, salt);

    const user = await this.usersRepo.create(createDto, hash);
    return this.mapToDto(user);
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const dataToUpdate: any = {
      firstName: updateDto.firstName,
      lastName: updateDto.lastName,
    };
    if (updateDto.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(updateDto.password, 10);
    }

    const updatedUser = await this.usersRepo.update(id, dataToUpdate);
    return this.mapToDto(updatedUser);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepo.delete(id);
    return { message: 'User deleted successfully' };
  }

  private mapToDto(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      roles: user.userRoles?.map((ur: any) => ur.role.name) || [],
    };
  }
}
