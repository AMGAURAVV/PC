import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { UserStatus } from '@pc-platform/database';
import * as bcrypt from 'bcryptjs';

import { AuditLogsService } from '../audit-logs/audit-logs.service';

import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import type { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let auditLogsService: jest.Mocked<AuditLogsService>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    passwordHash: '',
    firstName: 'John',
    lastName: 'Doe',
    phone: null,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
    isVerified: true,
    emailVerifiedAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userRoles: [
      {
        userId: 'user-uuid-1',
        roleId: 'role-uuid-1',
        assignedAt: new Date(),
        role: {
          id: 'role-uuid-1',
          name: 'CUSTOMER',
          description: 'Customer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ],
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('Password123!', 10);
  });

  beforeEach(async () => {
    const mockRepo = {
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      createUser: jest.fn(),
      saveRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllUserRefreshTokens: jest.fn(),
      updateUserPassword: jest.fn(),
      updateUserStatus: jest.fn(),
      updateLastLogin: jest.fn(),
    };

    const mockJwt = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
      decode: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_REFRESH_EXPIRES_IN_DAYS') return 7;
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'REQUIRE_EMAIL_VERIFICATION') return 'true';
        return null;
      }),
    };

    const mockAudit = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-id' } as any),
      getAuditLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AuditLogsService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get(AuthRepository);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    auditLogsService = module.get(AuditLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password hash if password matches and account is active', async () => {
      repository.findUserByEmail.mockResolvedValue(mockUser as any);

      const result = await service.validateUser('test@example.com', 'Password123!');

      expect(result).toBeDefined();
      expect(result.id).toBe('user-uuid-1');
      expect(result.email).toBe('test@example.com');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should return null and log audit if user is not found', async () => {
      repository.findUserByEmail.mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'Password123!');

      expect(result).toBeNull();
      expect(auditLogsService.logAction).toHaveBeenCalled();
    });

    it('should return null and log audit if password is incorrect', async () => {
      repository.findUserByEmail.mockResolvedValue(mockUser as any);

      const result = await service.validateUser('test@example.com', 'WrongPassword');

      expect(result).toBeNull();
      expect(auditLogsService.logAction).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if account is SUSPENDED', async () => {
      repository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      } as any);

      await expect(
        service.validateUser('test@example.com', 'Password123!'),
      ).rejects.toThrow('Your account has been suspended');
    });

    it('should throw UnauthorizedException if account is PENDING_VERIFICATION', async () => {
      repository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        status: UserStatus.PENDING_VERIFICATION,
      } as any);

      await expect(
        service.validateUser('test@example.com', 'Password123!'),
      ).rejects.toThrow('Please verify your email address before logging in');
    });

    it('should throw UnauthorizedException if account is INACTIVE', async () => {
      repository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        status: UserStatus.INACTIVE,
      } as any);

      await expect(
        service.validateUser('test@example.com', 'Password123!'),
      ).rejects.toThrow('Your account is inactive');
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'new@example.com',
      password: 'StrongPassword123!',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should register a new user with PENDING_VERIFICATION status and return verification token', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      repository.createUser.mockResolvedValue({
        ...mockUser,
        id: 'new-user-uuid',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        status: UserStatus.PENDING_VERIFICATION,
        isVerified: false,
      } as any);

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('new@example.com');
      expect(result.verificationToken).toBe('mock-jwt-token');
      expect(repository.createUser).toHaveBeenCalled();
      expect(auditLogsService.logAction).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      repository.findUserByEmail.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(repository.createUser).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should generate accessToken and hashed refreshToken, update lastLoginAt and log audit', async () => {
      repository.saveRefreshToken.mockResolvedValue({} as any);
      repository.updateLastLogin.mockResolvedValue({} as any);

      const result = await service.login(mockUser);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(repository.saveRefreshToken).toHaveBeenCalled();
      expect(repository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(auditLogsService.logAction).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should rotate token: revoke old token and issue new token pair', async () => {
      repository.findRefreshToken.mockResolvedValue({
        id: 'token-id-1',
        userId: mockUser.id,
        tokenHash: 'somehash',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        user: mockUser,
      } as any);

      repository.revokeRefreshToken.mockResolvedValue({} as any);
      repository.saveRefreshToken.mockResolvedValue({} as any);

      const result = await service.refresh('raw-refresh-token');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(repository.revokeRefreshToken).toHaveBeenCalled();
      expect(repository.saveRefreshToken).toHaveBeenCalled();
    });

    it('should detect TOKEN REUSE and revoke all sessions when a revoked token is used', async () => {
      repository.findRefreshToken.mockResolvedValue({
        id: 'compromised-token-id',
        userId: mockUser.id,
        tokenHash: 'somehash',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(), // Already revoked!
        user: mockUser,
      } as any);

      repository.revokeAllUserRefreshTokens.mockResolvedValue({} as any);

      await expect(service.refresh('already-revoked-token')).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify all sessions were invalidated for security
      expect(repository.revokeAllUserRefreshTokens).toHaveBeenCalledWith(mockUser.id);
      expect(auditLogsService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          entityLabel: 'RefreshTokenReuseDetected',
        }),
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      repository.findRefreshToken.mockResolvedValue({
        id: 'token-id-1',
        userId: mockUser.id,
        tokenHash: 'somehash',
        expiresAt: new Date(Date.now() - 1000), // Expired
        revokedAt: null,
        user: mockUser,
      } as any);

      repository.revokeRefreshToken.mockResolvedValue({} as any);

      await expect(service.refresh('expired-token')).rejects.toThrow('Refresh token has expired');
    });
  });

  describe('logout & session revocation', () => {
    it('should revoke single refresh token on logout', async () => {
      repository.findRefreshToken.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        user: mockUser,
      } as any);
      repository.revokeRefreshToken.mockResolvedValue({} as any);

      const result = await service.logout('refresh-token');

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(repository.revokeRefreshToken).toHaveBeenCalled();
      expect(auditLogsService.logAction).toHaveBeenCalled();
    });

    it('should revoke all user refresh tokens when revokeAllSessions is called', async () => {
      repository.revokeAllUserRefreshTokens.mockResolvedValue({ count: 3 } as any);
      repository.findUserById.mockResolvedValue(mockUser as any);

      const result = await service.revokeAllSessions(mockUser.id);

      expect(result).toEqual({ message: 'All active sessions have been revoked' });
      expect(repository.revokeAllUserRefreshTokens).toHaveBeenCalledWith(mockUser.id);
      expect(auditLogsService.logAction).toHaveBeenCalled();
    });
  });

  describe('email verification architecture', () => {
    it('should verify email and activate user account on valid token', async () => {
      jwtService.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        type: 'email_verification',
      });
      repository.findUserById.mockResolvedValue({
        ...mockUser,
        isVerified: false,
        status: UserStatus.PENDING_VERIFICATION,
      } as any);
      repository.updateUserStatus.mockResolvedValue({} as any);

      const result = await service.verifyEmail({ token: 'valid-token' });

      expect(result.message).toContain('verified successfully');
      expect(repository.updateUserStatus).toHaveBeenCalledWith(
        mockUser.id,
        UserStatus.ACTIVE,
        true,
        expect.any(Date),
      );
      expect(auditLogsService.logAction).toHaveBeenCalled();
    });

    it('should return constant message on resendVerification without disclosing user existence', async () => {
      repository.findUserByEmail.mockResolvedValue(null);

      const result = await service.resendVerification({ email: 'unknown@example.com' });

      expect(result.message).toContain('If an unverified account exists');
    });
  });

  describe('password reset architecture', () => {
    it('should return constant message on forgotPassword and not disclose user existence', async () => {
      repository.findUserByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'unknown@example.com' });

      expect(result.message).toContain('If an account exists');
    });

    it('should reset password, update hash and revoke all existing sessions', async () => {
      jwtService.decode.mockReturnValue({
        sub: mockUser.id,
        type: 'password_reset',
      });
      repository.findUserById.mockResolvedValue(mockUser as any);
      jwtService.verify.mockReturnValue({});
      repository.updateUserPassword.mockResolvedValue({} as any);
      repository.revokeAllUserRefreshTokens.mockResolvedValue({ count: 2 } as any);

      const result = await service.resetPassword({
        token: 'valid-reset-token',
        newPassword: 'BrandNewPass123!',
      });

      expect(result.message).toContain('Password has been reset successfully');
      expect(repository.updateUserPassword).toHaveBeenCalled();
      expect(repository.revokeAllUserRefreshTokens).toHaveBeenCalledWith(mockUser.id);
      expect(auditLogsService.logAction).toHaveBeenCalled();
    });
  });

  describe('google OAuth architecture', () => {
    it('should login or provision user from Google token and return session tokens', async () => {
      repository.findUserByEmail.mockResolvedValue(mockUser as any);
      repository.saveRefreshToken.mockResolvedValue({} as any);
      repository.updateLastLogin.mockResolvedValue({} as any);

      const result = await service.googleAuth({ idToken: 'mock-google-id-token' });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe(mockUser.email);
    });
  });
});
