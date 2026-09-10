import { Injectable } from '@nestjs/common';
import type { DatabaseService} from '@pc-platform/database';
import { UserStatus } from '@pc-platform/database';

import { Role } from '../common/enums/role.enum';

import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) {}

  async findUserByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return this.db.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findUserById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async createUser(
    data: RegisterDto,
    passwordHash: string,
    status: UserStatus = UserStatus.PENDING_VERIFICATION,
    roleName: string = Role.CUSTOMER,
  ) {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Look for role (try uppercase then lowercase)
    let role = await this.db.role.findFirst({
      where: {
        name: {
          in: [roleName.toUpperCase(), roleName.toLowerCase(), 'customer', 'CUSTOMER'],
          mode: 'insensitive',
        },
      },
    });

    if (!role) {
      // Fallback create system role if missing
      role = await this.db.role.create({
        data: {
          name: Role.CUSTOMER,
          description: 'Standard customer account',
          isSystem: true,
        },
      });
    }

    return this.db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        status,
        isVerified: status === UserStatus.ACTIVE,
        verifiedAt: status === UserStatus.ACTIVE ? new Date() : null,
        userRoles: {
          create: {
            roleId: role.id,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async saveRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.db.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return this.db.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async revokeRefreshToken(tokenHash: string) {
    return this.db.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return this.db.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async updateUserStatus(
    userId: string,
    status: UserStatus,
    isVerified: boolean,
    verifiedAt: Date | null = null,
  ) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        status,
        isVerified,
        verifiedAt,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async updateLastLogin(userId: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
