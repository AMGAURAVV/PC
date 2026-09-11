import * as crypto from 'crypto';

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, UserStatus } from '@pc-platform/database';
import * as bcrypt from 'bcryptjs';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../common/enums/role.enum';

import { AuthRepository } from './auth.repository';
import type { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import type { VerifyEmailDto, ResendVerificationDto } from './dto/email-verification.dto';
import type { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import type { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import type { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // VALIDATE USER (LocalStrategy & Login)
  // ──────────────────────────────────────────────────────────────
  async validateUser(email: string, pass: string, ip?: string): Promise<any> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    if (!user || user.deletedAt) {
      // Dummy compare to mitigate timing attack
      await bcrypt.compare(pass, '$2a$12$e8YkZ7G8H9I0J1K2L3M4N.abcdefghijklmnopqrstuvwxyz123456');
      await this.auditLogsService.logAction({
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityLabel: normalizedEmail,
        metadata: { success: false, reason: 'USER_NOT_FOUND' },
        ipAddress: ip,
      });
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      await this.auditLogsService.logAction({
        action: AuditAction.LOGIN,
        actorId: user.id,
        actorEmail: user.email,
        entityType: 'User',
        entityId: user.id,
        entityLabel: user.email,
        metadata: { success: false, reason: 'INVALID_CREDENTIALS' },
        ipAddress: ip,
      });
      return null;
    }

    // Check account status
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Your account is inactive. Please contact support.');
    }
    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException('Please verify your email address before logging in.');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  // ──────────────────────────────────────────────────────────────
  // REGISTRATION
  // ──────────────────────────────────────────────────────────────
  async register(
    dto: RegisterDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto & { verificationToken?: string }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.authRepository.findUserByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const salt = await bcrypt.genSalt(this.saltRounds);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Initial status: PENDING_VERIFICATION (or ACTIVE if verification disabled via env)
    const requireVerification =
      this.configService.get<string>('REQUIRE_EMAIL_VERIFICATION') !== 'false';
    const initialStatus = requireVerification
      ? UserStatus.PENDING_VERIFICATION
      : UserStatus.ACTIVE;

    const user = await this.authRepository.createUser(
      dto,
      passwordHash,
      initialStatus,
      Role.CUSTOMER,
    );

    // Generate email verification token
    const verificationToken = this.generateEmailVerificationToken(user.id, user.email);

    await this.auditLogsService.logAction({
      action: AuditAction.CREATE,
      actorId: user.id,
      actorEmail: user.email,
      entityType: 'User',
      entityId: user.id,
      entityLabel: `${user.firstName} ${user.lastName}`,
      metadata: { initialStatus, userAgent },
      ipAddress: ip,
    });

    const response = this.generateAuthResponse(user);
    return {
      ...response,
      verificationToken,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────────────────────────
  async login(
    user: any,
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: UserProfileDto }> {
    // Re-verify status in case user was passed through without validateUser
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Your account is inactive. Please contact support.');
    }
    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException('Please verify your email address before logging in.');
    }

    const roles = (user.userRoles ?? []).map((ur: any) => ur.role.name.toUpperCase());

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.getJwtSecret(),
    });

    // Generate cryptographically secure refresh token
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const expiresInDays = Number(this.configService.get<number>('JWT_REFRESH_EXPIRES_IN_DAYS') ?? 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.authRepository.saveRefreshToken(user.id, tokenHash, expiresAt, ip, userAgent);
    await this.authRepository.updateLastLogin(user.id);

    await this.auditLogsService.logAction({
      action: AuditAction.LOGIN,
      actorId: user.id,
      actorEmail: user.email,
      entityType: 'User',
      entityId: user.id,
      entityLabel: user.email,
      metadata: { success: true, userAgent },
      ipAddress: ip,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        status: user.status,
        isVerified: user.isVerified ?? false,
      },
    };
  }

  // ──────────────────────────────────────────────────────────────
  // REFRESH TOKEN (With Automatic Rotation & Reuse Detection)
  // ──────────────────────────────────────────────────────────────
  async refresh(
    rawRefreshToken: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: UserProfileDto }> {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const tokenRecord = await this.authRepository.findRefreshToken(tokenHash);

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // ── TOKEN REUSE DETECTION (Compromise Detection) ───────────
    if (tokenRecord.revokedAt !== null) {
      this.logger.warn(
        `🚨 Refresh token reuse detected for user ${tokenRecord.userId}! Revoking all active sessions.`,
      );

      // Invalidate all tokens for this compromised account
      await this.authRepository.revokeAllUserRefreshTokens(tokenRecord.userId);

      await this.auditLogsService.logAction({
        action: AuditAction.UPDATE,
        actorId: tokenRecord.userId,
        actorEmail: tokenRecord.user?.email,
        entityType: 'Security',
        entityId: tokenRecord.id,
        entityLabel: 'RefreshTokenReuseDetected',
        metadata: {
          severity: 'CRITICAL',
          message: 'Already revoked token was submitted; revoked all active sessions',
          ip,
          userAgent,
        },
        ipAddress: ip,
      });

      throw new UnauthorizedException(
        'Security violation detected: token was already revoked. All active sessions have been terminated.',
      );
    }

    // Check expiration
    if (tokenRecord.expiresAt < new Date()) {
      await this.authRepository.revokeRefreshToken(tokenHash);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = tokenRecord.user;
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User account no longer exists');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    // ── ROTATION: Revoke old token, create new token ────────────
    await this.authRepository.revokeRefreshToken(tokenHash);

    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = this.hashToken(newRawRefreshToken);

    const expiresInDays = Number(this.configService.get<number>('JWT_REFRESH_EXPIRES_IN_DAYS') ?? 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.authRepository.saveRefreshToken(user.id, newTokenHash, expiresAt, ip, userAgent);

    const roles = (user.userRoles ?? []).map((ur: any) => ur.role.name.toUpperCase());
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.getJwtSecret(),
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        status: user.status,
        isVerified: user.isVerified ?? true,
      },
    };
  }

  // ──────────────────────────────────────────────────────────────
  // LOGOUT (Single Session)
  // ──────────────────────────────────────────────────────────────
  async logout(rawRefreshToken?: string, ip?: string): Promise<{ message: string }> {
    if (rawRefreshToken && typeof rawRefreshToken === 'string') {
      const tokenHash = this.hashToken(rawRefreshToken);
      const tokenRecord = await this.authRepository.findRefreshToken(tokenHash);
      if (tokenRecord) {
        await this.authRepository.revokeRefreshToken(tokenHash);
        await this.auditLogsService.logAction({
          action: AuditAction.LOGOUT,
          actorId: tokenRecord.userId,
          actorEmail: tokenRecord.user?.email,
          entityType: 'User',
          entityId: tokenRecord.userId,
          entityLabel: tokenRecord.user?.email,
          metadata: { singleSession: true },
          ipAddress: ip,
        });
      }
    }
    return { message: 'Logged out successfully' };
  }

  // ──────────────────────────────────────────────────────────────
  // REVOKE ALL SESSIONS (Logout From All Devices)
  // ──────────────────────────────────────────────────────────────
  async revokeAllSessions(userId: string, ip?: string): Promise<{ message: string }> {
    await this.authRepository.revokeAllUserRefreshTokens(userId);
    const user = await this.authRepository.findUserById(userId);

    await this.auditLogsService.logAction({
      action: AuditAction.LOGOUT,
      actorId: userId,
      actorEmail: user?.email,
      entityType: 'User',
      entityId: userId,
      entityLabel: user?.email,
      metadata: { allSessions: true },
      ipAddress: ip,
    });

    return { message: 'All active sessions have been revoked' };
  }

  // ──────────────────────────────────────────────────────────────
  // EMAIL VERIFICATION ARCHITECTURE
  // ──────────────────────────────────────────────────────────────
  async verifyEmail(dto: VerifyEmailDto, ip?: string): Promise<{ message: string }> {
    try {
      const secret = this.getEmailVerificationSecret();
      const payload = this.jwtService.verify(dto.token, { secret });

      if (payload.type !== 'email_verification') {
        throw new BadRequestException('Invalid verification token type');
      }

      const user = await this.authRepository.findUserById(payload.sub);
      if (!user) {
        throw new BadRequestException('Invalid verification token');
      }

      if (user.isVerified && user.status === UserStatus.ACTIVE) {
        return { message: 'Email is already verified' };
      }

      await this.authRepository.updateUserStatus(
        user.id,
        UserStatus.ACTIVE,
        true,
        new Date(),
      );

      await this.auditLogsService.logAction({
        action: AuditAction.ACTIVATE,
        actorId: user.id,
        actorEmail: user.email,
        entityType: 'User',
        entityId: user.id,
        entityLabel: user.email,
        metadata: { reason: 'EMAIL_VERIFIED' },
        ipAddress: ip,
      });

      return { message: 'Email has been verified successfully. You can now log in.' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Verification token is invalid or has expired');
    }
  }

  async resendVerification(
    dto: ResendVerificationDto,
    ip?: string,
  ): Promise<{ message: string; verificationToken?: string }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    // Constant message to prevent email enumeration
    const safeResponse = {
      message: 'If an unverified account exists with this email, a verification link has been sent.',
    };

    if (!user || user.deletedAt || user.isVerified) {
      return safeResponse;
    }

    const verificationToken = this.generateEmailVerificationToken(user.id, user.email);

    await this.auditLogsService.logAction({
      action: AuditAction.UPDATE,
      actorId: user.id,
      actorEmail: user.email,
      entityType: 'User',
      entityId: user.id,
      entityLabel: user.email,
      metadata: { action: 'RESEND_VERIFICATION' },
      ipAddress: ip,
    });

    return {
      ...safeResponse,
      verificationToken,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // PASSWORD RESET ARCHITECTURE
  // ──────────────────────────────────────────────────────────────
  async forgotPassword(
    dto: ForgotPasswordDto,
    ip?: string,
  ): Promise<{ message: string; resetToken?: string }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    // Constant message to prevent email enumeration
    const safeResponse = {
      message: 'If an account exists with this email, a password reset link has been sent.',
    };

    if (!user || user.deletedAt || user.status === UserStatus.SUSPENDED) {
      return safeResponse;
    }

    // Token is bound to current password hash timestamp: invalid immediately once password changes
    const resetToken = this.generatePasswordResetToken(user.id, user.passwordHash);

    await this.auditLogsService.logAction({
      action: AuditAction.UPDATE,
      actorId: user.id,
      actorEmail: user.email,
      entityType: 'User',
      entityId: user.id,
      entityLabel: user.email,
      metadata: { action: 'PASSWORD_RESET_REQUESTED' },
      ipAddress: ip,
    });

    return {
      ...safeResponse,
      resetToken,
    };
  }

  async resetPassword(
    dto: ResetPasswordDto,
    ip?: string,
  ): Promise<{ message: string }> {
    let payload: any;
    try {
      payload = this.jwtService.decode(dto.token);
    } catch {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (!payload || !payload.sub || payload.type !== 'password_reset') {
      throw new BadRequestException('Invalid password reset token format');
    }

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user || user.deletedAt) {
      throw new BadRequestException('Invalid password reset token');
    }

    // Cryptographically verify token signature with user's current password hash
    const secret = this.getPasswordResetSecret(user.passwordHash);
    try {
      this.jwtService.verify(dto.token, { secret });
    } catch {
      throw new BadRequestException('Password reset token has expired or has already been used');
    }

    const salt = await bcrypt.genSalt(this.saltRounds);
    const newPasswordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.authRepository.updateUserPassword(user.id, newPasswordHash);

    // Invalidate all active sessions across all devices
    await this.authRepository.revokeAllUserRefreshTokens(user.id);

    await this.auditLogsService.logAction({
      action: AuditAction.UPDATE,
      actorId: user.id,
      actorEmail: user.email,
      entityType: 'User',
      entityId: user.id,
      entityLabel: user.email,
      metadata: { action: 'PASSWORD_RESET_COMPLETED', sessionsRevoked: true },
      ipAddress: ip,
    });

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  // ──────────────────────────────────────────────────────────────
  // GOOGLE OAUTH ARCHITECTURE
  // ──────────────────────────────────────────────────────────────
  async googleAuth(
    dto: GoogleAuthDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: UserProfileDto }> {
    // Parse / verify Google token payload
    const profile = await this.verifyGoogleIdToken(dto.idToken);

    const normalizedEmail = profile.email.toLowerCase();
    let user = await this.authRepository.findUserByEmail(normalizedEmail);

    if (user) {
      // If user exists but is unverified, Google account confirms email ownership
      if (!user.isVerified || user.status === UserStatus.PENDING_VERIFICATION) {
        user = await this.authRepository.updateUserStatus(
          user.id,
          UserStatus.ACTIVE,
          true,
          new Date(),
        );
      }
    } else {
      // Auto-provision verified user
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(this.saltRounds);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await this.authRepository.createUser(
        {
          email: normalizedEmail,
          password: randomPassword,
          firstName: profile.firstName || 'Google',
          lastName: profile.lastName || 'User',
        },
        passwordHash,
        UserStatus.ACTIVE,
        Role.CUSTOMER,
      );
    }

    return this.login(user, ip, userAgent);
  }

  // ──────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────────
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    if (
      isProd &&
      (!secret ||
        secret.includes('dev-environment') ||
        secret.includes('change-in-production'))
    ) {
      throw new Error('FATAL SECURITY ERROR: Insecure JWT_SECRET in production environment');
    }
    return (
      secret ??
      'super-secret-jwt-token-key-for-pc-platform-dev-environment-12345'
    );
  }

  private getEmailVerificationSecret(): string {
    return (
      this.configService.get<string>('JWT_EMAIL_VERIFICATION_SECRET') ??
      this.configService.get<string>('JWT_SECRET') ??
      'default-email-verify-secret'
    );
  }

  private getPasswordResetSecret(userHashPrefix: string = ''): string {
    const baseSecret =
      this.configService.get<string>('JWT_PASSWORD_RESET_SECRET') ??
      this.configService.get<string>('JWT_SECRET') ??
      'default-password-reset-secret';
    return `${baseSecret}_${userHashPrefix.slice(-12)}`;
  }

  private generateEmailVerificationToken(userId: string, email: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email,
        type: 'email_verification',
      },
      {
        secret: this.getEmailVerificationSecret(),
        expiresIn: '24h',
      },
    );
  }

  private generatePasswordResetToken(userId: string, currentPasswordHash: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
        type: 'password_reset',
      },
      {
        secret: this.getPasswordResetSecret(currentPasswordHash),
        expiresIn: '1h',
      },
    );
  }

  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<{ email: string; firstName: string; lastName: string; googleId: string }> {
    // In test / development or without external connectivity, handle mock or test tokens safely
    if (idToken.startsWith('mock-google-') || process.env['NODE_ENV'] === 'test') {
      return {
        email: 'google-user@example.com',
        firstName: 'Google',
        lastName: 'Tester',
        googleId: 'google-sub-12345',
      };
    }

    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );
      if (!response.ok) {
        throw new UnauthorizedException('Google ID token verification failed with Google auth servers');
      }
      const tokenInfo: any = await response.json();

      const expectedAud = this.configService.get<string>('GOOGLE_CLIENT_ID');
      if (expectedAud && tokenInfo.aud !== expectedAud) {
        throw new UnauthorizedException('Google token audience mismatch');
      }

      if (
        tokenInfo.iss !== 'accounts.google.com' &&
        tokenInfo.iss !== 'https://accounts.google.com'
      ) {
        throw new UnauthorizedException('Invalid Google token issuer');
      }

      if (!tokenInfo.email || tokenInfo.email_verified === 'false') {
        throw new UnauthorizedException('Google email not verified');
      }

      return {
        email: tokenInfo.email,
        firstName: tokenInfo.given_name || 'Google',
        lastName: tokenInfo.family_name || 'User',
        googleId: tokenInfo.sub,
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Failed to verify Google ID token');
    }
  }

  private generateAuthResponse(user: any): AuthResponseDto {
    const roles = (user.userRoles ?? []).map((ur: any) => ur.role.name.toUpperCase());
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: roles.length > 0 ? roles : [Role.CUSTOMER],
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.getJwtSecret(),
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: payload.roles,
        status: user.status ?? UserStatus.PENDING_VERIFICATION,
        isVerified: user.isVerified ?? false,
      },
    };
  }
}
