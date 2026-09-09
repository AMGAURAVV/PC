import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response, Request as ExpressReq } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthGuard } from '@nestjs/passport';
import { VerifyEmailDto, ResendVerificationDto } from './dto/email-verification.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';

const REFRESH_COOKIE_NAME = 'refreshToken';
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Registration ──────────────────────────────────────────────
  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new customer account' })
  @SwaggerResponse({ status: 201, type: AuthResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto, ip, userAgent);
    return result;
  }

  // ── Login ─────────────────────────────────────────────────────
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Log in with email and password' })
  @SwaggerResponse({ status: 200, type: AuthResponseDto })
  async login(
    @Request() req: any,
    @Body() _loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(req.user, ip, userAgent);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  // ── Refresh Token ─────────────────────────────────────────────
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token with automatic token rotation' })
  async refresh(
    @Req() req: ExpressReq,
    @Body('refreshToken') bodyRefreshToken: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] || bodyRefreshToken;
    const result = await this.authService.refresh(token, ip, userAgent);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  // ── Logout ────────────────────────────────────────────────────
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out current session and invalidate refresh token' })
  async logout(
    @Req() req: ExpressReq,
    @Body('refreshToken') bodyRefreshToken: string,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] || bodyRefreshToken;
    const result = await this.authService.logout(token, ip);

    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    return result;
  }

  // ── Revoke All Sessions ───────────────────────────────────────
  @ApiBearerAuth('access-token')
  @Post('revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all active sessions and refresh tokens across all devices' })
  async revokeAll(
    @CurrentUser() user: JwtPayload,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const result = await this.authService.revokeAllSessions(user.sub, ip);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    return result;
  }

  // ── Email Verification ────────────────────────────────────────
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with verification token' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Ip() ip: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(dto, ip);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Resend email verification link' })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @Ip() ip: string,
  ): Promise<{ message: string }> {
    return this.authService.resendVerification(dto, ip);
  }

  // ── Password Reset ────────────────────────────────────────────
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request password reset link via email' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Ip() ip: string,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto, ip);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Ip() ip: string,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(dto, ip);
  }

  // ── Google OAuth ──────────────────────────────────────────────
  @Public()
  @Post('google/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with Google ID token from frontend client' })
  @SwaggerResponse({ status: 200, type: AuthResponseDto })
  async googleTokenLogin(
    @Body() dto: GoogleAuthDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.googleAuth(dto, ip, userAgent);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth redirect flow' })
  googleRedirect(@Res() res: Response) {
    // In production with Google Client ID configured, redirect to Google OAuth URL
    const clientId = process.env['GOOGLE_CLIENT_ID'] || 'demo-google-client-id';
    const redirectUri = process.env['GOOGLE_CALLBACK_URL'] || 'http://localhost:4000/api/v1/auth/google/callback';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`;
    return res.redirect(url);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  googleCallback(@Req() req: ExpressReq, @Res() res: Response) {
    // Architecture endpoint for processing Google OAuth code
    return res.json({
      message: 'Google OAuth callback received. Please use POST /api/v1/auth/google/token with ID token for SPA clients.',
    });
  }

  // ── Profile ───────────────────────────────────────────────────
  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return user;
  }
}
