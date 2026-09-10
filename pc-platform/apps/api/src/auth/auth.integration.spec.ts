import type { INestApplication} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService, JwtModule } from '@nestjs/jwt';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { UserStatus } from '@pc-platform/database';
import * as bcrypt from 'bcryptjs';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';



describe('Auth Integration & Security Suite', () => {
  let app: INestApplication;
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let auditLogsService: jest.Mocked<AuditLogsService>;
  let jwtService: JwtService;

  // In-memory data store for integration tests
  let users: any[] = [];
  let refreshTokens: any[] = [];
  let auditLogs: any[] = [];

  beforeAll(async () => {
    const mockRepo = {
      findUserByEmail: jest.fn((email: string) => {
        return Promise.resolve(users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null);
      }),
      findUserById: jest.fn((id: string) => {
        return Promise.resolve(users.find((u) => u.id === id) || null);
      }),
      createUser: jest.fn((data: any, passwordHash: string, status: UserStatus = UserStatus.PENDING_VERIFICATION) => {
        const newUser = {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          status,
          isVerified: status === UserStatus.ACTIVE,
          verifiedAt: status === UserStatus.ACTIVE ? new Date() : null,
          deletedAt: null,
          userRoles: [
            {
              role: {
                name: Role.CUSTOMER,
              },
            },
          ],
        };
        users.push(newUser);
        return Promise.resolve(newUser);
      }),
      saveRefreshToken: jest.fn((userId: string, tokenHash: string, expiresAt: Date, ip?: string, userAgent?: string) => {
        const token = {
          id: `token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          userId,
          tokenHash,
          expiresAt,
          revokedAt: null,
          ipAddress: ip || null,
          userAgent: userAgent || null,
          user: users.find((u) => u.id === userId),
        };
        refreshTokens.push(token);
        return Promise.resolve(token);
      }),
      findRefreshToken: jest.fn((tokenHash: string) => {
        const token = refreshTokens.find((t) => t.tokenHash === tokenHash);
        if (token) {
          token.user = users.find((u) => u.id === token.userId);
        }
        return Promise.resolve(token || null);
      }),
      revokeRefreshToken: jest.fn((tokenHash: string) => {
        const token = refreshTokens.find((t) => t.tokenHash === tokenHash);
        if (token) {
          token.revokedAt = new Date();
        }
        return Promise.resolve(token);
      }),
      revokeAllUserRefreshTokens: jest.fn((userId: string) => {
        let count = 0;
        for (const t of refreshTokens) {
          if (t.userId === userId && !t.revokedAt) {
            t.revokedAt = new Date();
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
      updateUserPassword: jest.fn((userId: string, passwordHash: string) => {
        const user = users.find((u) => u.id === userId);
        if (user) {
          user.passwordHash = passwordHash;
        }
        return Promise.resolve(user);
      }),
      updateUserStatus: jest.fn((userId: string, status: UserStatus, isVerified: boolean, verifiedAt?: Date) => {
        const user = users.find((u) => u.id === userId);
        if (user) {
          user.status = status;
          user.isVerified = isVerified;
          user.verifiedAt = verifiedAt || null;
        }
        return Promise.resolve(user);
      }),
      updateLastLogin: jest.fn((userId: string) => {
        const user = users.find((u) => u.id === userId);
        if (user) {
          user.lastLoginAt = new Date();
        }
        return Promise.resolve(user);
      }),
    };

    const mockAudit = {
      logAction: jest.fn((log: any) => {
        auditLogs.push({ id: `audit-${Date.now()}`, ...log, createdAt: new Date() });
        return Promise.resolve({ id: `audit-${Date.now()}`, ...log });
      }),
      getAuditLogs: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: 'integration-test-jwt-secret-key-12345' }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        RolesGuard,
        Reflector,
        { provide: AuthRepository, useValue: mockRepo },
        { provide: AuditLogsService, useValue: mockAudit },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'integration-test-jwt-secret-key-12345';
              if (key === 'JWT_EXPIRES_IN') return '15m';
              if (key === 'JWT_REFRESH_EXPIRES_IN_DAYS') return 7;
              if (key === 'REQUIRE_EMAIL_VERIFICATION') return 'true';
              return null;
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    authService = moduleFixture.get<AuthService>(AuthService);
    authRepository = moduleFixture.get(AuthRepository);
    auditLogsService = moduleFixture.get(AuditLogsService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  beforeEach(() => {
    users = [];
    refreshTokens = [];
    auditLogs = [];
    jest.clearAllMocks();
  });

  describe('Registration & Password Security', () => {
    it('should register a user with hashed password, status PENDING_VERIFICATION, and emit audit log', async () => {
      const regDto = {
        email: 'customer@example.com',
        password: 'SecurePass123!',
        firstName: 'Alice',
        lastName: 'Wonderland',
      };

      const result = await authService.register(regDto, '192.168.1.1', 'Mozilla/5.0');

      expect(result).toBeDefined();
      expect(result.user.email).toBe('customer@example.com');
      expect(result.user.status).toBe(UserStatus.PENDING_VERIFICATION);
      expect(result.user.isVerified).toBe(false);
      expect((result.user as any).passwordHash).toBeUndefined(); // Never returns password hash!
      expect(result.verificationToken).toBeDefined();

      const savedUser = users.find((u) => u.email === 'customer@example.com');
      expect(savedUser).toBeDefined();
      expect(savedUser.passwordHash).not.toBe('SecurePass123!');
      expect(await bcrypt.compare('SecurePass123!', savedUser.passwordHash)).toBe(true);

      // Verify audit log
      expect(auditLogs.some((l) => l.action === 'CREATE' && l.actorId === savedUser.id)).toBe(true);
    });

    it('should reject duplicate email registration with ConflictException', async () => {
      const regDto = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        firstName: 'Bob',
        lastName: 'Marley',
      };

      await authService.register(regDto);
      await expect(authService.register(regDto)).rejects.toThrow('Email is already registered');
    });
  });

  describe('Email Verification Lifecycle', () => {
    it('should verify email with valid token and transition status to ACTIVE', async () => {
      const regResult = await authService.register({
        email: 'verify@example.com',
        password: 'Password123!',
        firstName: 'Charlie',
        lastName: 'Brown',
      });

      const verifyResult = await authService.verifyEmail(
        { token: regResult.verificationToken! },
        '192.168.1.2',
      );

      expect(verifyResult.message).toContain('verified successfully');

      const user = users.find((u) => u.email === 'verify@example.com');
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.isVerified).toBe(true);
      expect(user.verifiedAt).toBeInstanceOf(Date);
    });

    it('should safely reject verification with invalid token', async () => {
      await expect(
        authService.verifyEmail({ token: 'garbage-token-here' }),
      ).rejects.toThrow('Verification token is invalid or has expired');
    });

    it('should return constant response on resendVerification without revealing user existence', async () => {
      const res1 = await authService.resendVerification({ email: 'nonexistent@example.com' });
      expect(res1.message).toContain('If an unverified account exists');
    });
  });

  describe('Account Status Enforcement on Login', () => {
    it('should reject login for PENDING_VERIFICATION accounts', async () => {
      await authService.register({
        email: 'pending@example.com',
        password: 'Password123!',
        firstName: 'Dan',
        lastName: 'Smith',
      });

      await expect(
        authService.validateUser('pending@example.com', 'Password123!'),
      ).rejects.toThrow('Please verify your email address before logging in');
    });

    it('should reject login for SUSPENDED accounts', async () => {
      const regResult = await authService.register({
        email: 'suspended@example.com',
        password: 'Password123!',
        firstName: 'Eve',
        lastName: 'Hacker',
      });

      // Verify and then suspend account
      await authService.verifyEmail({ token: regResult.verificationToken! });
      const user = users.find((u) => u.email === 'suspended@example.com');
      user.status = UserStatus.SUSPENDED;

      await expect(
        authService.validateUser('suspended@example.com', 'Password123!'),
      ).rejects.toThrow('Your account has been suspended');
    });

    it('should succeed login for ACTIVE accounts and record lastLoginAt', async () => {
      const regResult = await authService.register({
        email: 'active@example.com',
        password: 'Password123!',
        firstName: 'Frank',
        lastName: 'Castle',
      });

      await authService.verifyEmail({ token: regResult.verificationToken! });
      const validatedUser = await authService.validateUser('active@example.com', 'Password123!');
      expect(validatedUser).toBeDefined();

      const loginResult = await authService.login(validatedUser, '10.0.0.1', 'PC-Browser/1.0');
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();
      expect(loginResult.user.email).toBe('active@example.com');

      const user = users.find((u) => u.email === 'active@example.com');
      expect(user.lastLoginAt).toBeInstanceOf(Date);
      expect(refreshTokens.length).toBe(1);
    });
  });

  describe('Refresh Token Rotation & Compromise Detection', () => {
    it('should rotate refresh token on use and invalidate old token', async () => {
      const reg = await authService.register({
        email: 'rotate@example.com',
        password: 'Password123!',
        firstName: 'Grace',
        lastName: 'Hopper',
      });
      await authService.verifyEmail({ token: reg.verificationToken! });
      const user = await authService.validateUser('rotate@example.com', 'Password123!');
      const login = await authService.login(user);

      const initialRefreshToken = login.refreshToken;
      expect(refreshTokens[0].revokedAt).toBeNull();

      // Refresh token
      const refreshed = await authService.refresh(initialRefreshToken);
      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.refreshToken).not.toBe(initialRefreshToken);

      // Old token must now be revoked
      expect(refreshTokens[0].revokedAt).toBeInstanceOf(Date);
      // New token is active
      expect(refreshTokens[1].revokedAt).toBeNull();
    });

    it('should detect token theft (reuse of revoked token) and revoke ALL sessions for that user', async () => {
      const reg = await authService.register({
        email: 'theft@example.com',
        password: 'Password123!',
        firstName: 'Helen',
        lastName: 'Troy',
      });
      await authService.verifyEmail({ token: reg.verificationToken! });
      const user = await authService.validateUser('theft@example.com', 'Password123!');

      // User has 2 active sessions (e.g. laptop and phone)
      const session1 = await authService.login(user);
      const session2 = await authService.login(user);

      expect(refreshTokens.filter((t) => t.revokedAt === null).length).toBe(2);

      // Legitimate client rotates session1
      const rotated = await authService.refresh(session1.refreshToken);
      expect(rotated.refreshToken).toBeDefined();

      // Attacker attempts to use the old session1 token (replay/theft attempt)
      await expect(authService.refresh(session1.refreshToken)).rejects.toThrow(
        'Security violation detected: token was already revoked',
      );

      // ALL active sessions for Helen must be revoked!
      const activeSessions = refreshTokens.filter((t) => t.userId === user.id && t.revokedAt === null);
      expect(activeSessions.length).toBe(0);

      // Audit log must record security incident
      expect(auditLogs.some((l) => l.entityLabel === 'RefreshTokenReuseDetected')).toBe(true);
    });
  });

  describe('Session Revocation & Password Reset', () => {
    it('should revoke all active user sessions on revokeAllSessions', async () => {
      const reg = await authService.register({
        email: 'revoke@example.com',
        password: 'Password123!',
        firstName: 'Ian',
        lastName: 'Malcolm',
      });
      await authService.verifyEmail({ token: reg.verificationToken! });
      const user = await authService.validateUser('revoke@example.com', 'Password123!');

      await authService.login(user);
      await authService.login(user);
      expect(refreshTokens.filter((t) => t.userId === user.id && t.revokedAt === null).length).toBe(2);

      await authService.revokeAllSessions(user.id);
      expect(refreshTokens.filter((t) => t.userId === user.id && t.revokedAt === null).length).toBe(0);
    });

    it('should execute password reset and revoke all active sessions across all devices', async () => {
      const reg = await authService.register({
        email: 'reset@example.com',
        password: 'OldPassword123!',
        firstName: 'Jack',
        lastName: 'Ryan',
      });
      await authService.verifyEmail({ token: reg.verificationToken! });
      const user = await authService.validateUser('reset@example.com', 'OldPassword123!');
      await authService.login(user);
      expect(refreshTokens.filter((t) => t.userId === user.id && t.revokedAt === null).length).toBe(1);

      // Request password reset
      const forgot = await authService.forgotPassword({ email: 'reset@example.com' });
      expect(forgot.resetToken).toBeDefined();

      // Reset password
      const resetResult = await authService.resetPassword({
        token: forgot.resetToken!,
        newPassword: 'BrandNewPassword123!',
      });
      expect(resetResult.message).toContain('Password has been reset successfully');

      // Sessions revoked
      expect(refreshTokens.filter((t) => t.userId === user.id && t.revokedAt === null).length).toBe(0);

      // Old password fails
      const failed = await authService.validateUser('reset@example.com', 'OldPassword123!');
      expect(failed).toBeNull();

      // New password works
      const success = await authService.validateUser('reset@example.com', 'BrandNewPassword123!');
      expect(success).toBeDefined();
    });
  });

  describe('RBAC Role Enforcement', () => {
    it('should allow access when user possesses one of the required roles', () => {
      const reflector = new Reflector();
      const rolesGuard = new RolesGuard(reflector);

      const makeContext = (userRoles: string[], requiredRoles: string[]) => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);
        return {
          getHandler: jest.fn(),
          getClass: jest.fn(),
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
              user: { roles: userRoles },
            }),
          }),
        } as any;
      };

      // Test all required roles: CUSTOMER, ADMIN, STAFF, EDITOR, INVENTORY_MANAGER
      expect(rolesGuard.canActivate(makeContext([Role.ADMIN], [Role.ADMIN]))).toBe(true);
      expect(rolesGuard.canActivate(makeContext(['admin'], [Role.ADMIN]))).toBe(true); // Case-insensitive
      expect(rolesGuard.canActivate(makeContext([Role.CUSTOMER], [Role.CUSTOMER]))).toBe(true);
      expect(rolesGuard.canActivate(makeContext([Role.STAFF], [Role.STAFF]))).toBe(true);
      expect(rolesGuard.canActivate(makeContext([Role.EDITOR], [Role.EDITOR]))).toBe(true);
      expect(rolesGuard.canActivate(makeContext([Role.INVENTORY_MANAGER], [Role.INVENTORY_MANAGER]))).toBe(true);

      // Multi-role match
      expect(rolesGuard.canActivate(makeContext([Role.CUSTOMER, Role.STAFF], [Role.ADMIN, Role.STAFF]))).toBe(true);

      // Denial
      expect(() => rolesGuard.canActivate(makeContext([Role.CUSTOMER], [Role.ADMIN]))).toThrow('Access denied');
    });
  });
});
