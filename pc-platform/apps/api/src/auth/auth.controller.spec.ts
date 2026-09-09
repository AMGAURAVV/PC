import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResponse = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    user: {
      id: 'user-uuid-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['CUSTOMER'],
      status: 'ACTIVE',
      isVerified: true,
    },
  };

  beforeEach(async () => {
    const mockService = {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refresh: jest.fn(),
      revokeAllSessions: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerification: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      googleAuth: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return response', async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockRes: any = {};
      const result = await controller.register(dto, '127.0.0.1', 'jest-agent', mockRes);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(dto, '127.0.0.1', 'jest-agent');
    });
  });

  describe('login', () => {
    it('should log in user, set refresh cookie and return access token', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const mockRes: any = {
        cookie: jest.fn(),
      };

      const mockReq = {
        user: { id: 'user-uuid-1', email: 'test@example.com', userRoles: [] },
      };

      const result = await controller.login(mockReq, {} as LoginDto, '127.0.0.1', 'jest-agent', mockRes);

      expect(result.accessToken).toBe('test-access-token');
      expect(result.user).toEqual(mockAuthResponse.user);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'test-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe('logout', () => {
    it('should call logout and clear cookie', async () => {
      authService.logout.mockResolvedValue({ message: 'Logged out successfully' });

      const mockReq: any = {
        cookies: { refreshToken: 'valid-refresh-token' },
      };
      const mockRes: any = {
        clearCookie: jest.fn(),
      };

      const result = await controller.logout(mockReq, '', '127.0.0.1', mockRes);

      expect(authService.logout).toHaveBeenCalledWith('valid-refresh-token', '127.0.0.1');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('revokeAll', () => {
    it('should revoke all user sessions and clear cookie', async () => {
      authService.revokeAllSessions.mockResolvedValue({ message: 'All active sessions have been revoked' });

      const mockRes: any = {
        clearCookie: jest.fn(),
      };
      const mockUser = { sub: 'user-uuid-1', email: 'test@example.com', roles: ['CUSTOMER'], type: 'access' as const };

      const result = await controller.revokeAll(mockUser, '127.0.0.1', mockRes);

      expect(authService.revokeAllSessions).toHaveBeenCalledWith('user-uuid-1', '127.0.0.1');
      expect(mockRes.clearCookie).toHaveBeenCalled();
      expect(result.message).toContain('All active sessions');
    });
  });

  describe('refresh', () => {
    it('should refresh tokens and set new cookie', async () => {
      authService.refresh.mockResolvedValue(mockAuthResponse);

      const mockReq: any = {
        cookies: { refreshToken: 'old-refresh-token' },
      };
      const mockRes: any = {
        cookie: jest.fn(),
      };

      const result = await controller.refresh(mockReq, '', '127.0.0.1', 'jest-agent', mockRes);

      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        user: mockAuthResponse.user,
      });
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'test-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe('verifyEmail & resendVerification', () => {
    it('should verify email successfully', async () => {
      authService.verifyEmail.mockResolvedValue({ message: 'Email has been verified successfully.' });

      const result = await controller.verifyEmail({ token: 'test-token' }, '127.0.0.1');

      expect(result.message).toContain('verified successfully');
      expect(authService.verifyEmail).toHaveBeenCalledWith({ token: 'test-token' }, '127.0.0.1');
    });

    it('should resend verification link', async () => {
      authService.resendVerification.mockResolvedValue({ message: 'If an unverified account exists' });

      const result = await controller.resendVerification({ email: 'test@example.com' }, '127.0.0.1');

      expect(result.message).toContain('If an unverified account exists');
    });
  });

  describe('forgotPassword & resetPassword', () => {
    it('should handle forgot-password request', async () => {
      authService.forgotPassword.mockResolvedValue({ message: 'If an account exists' });

      const result = await controller.forgotPassword({ email: 'test@example.com' }, '127.0.0.1');

      expect(result.message).toContain('If an account exists');
    });

    it('should handle reset-password request', async () => {
      authService.resetPassword.mockResolvedValue({ message: 'Password has been reset successfully.' });

      const result = await controller.resetPassword(
        { token: 'reset-token', newPassword: 'BrandNewPassword123!' },
        '127.0.0.1',
      );

      expect(result.message).toContain('Password has been reset');
    });
  });

  describe('googleTokenLogin', () => {
    it('should authenticate via Google ID token', async () => {
      authService.googleAuth.mockResolvedValue(mockAuthResponse);

      const mockRes: any = {
        cookie: jest.fn(),
      };

      const result = await controller.googleTokenLogin(
        { idToken: 'google-id-token' },
        '127.0.0.1',
        'jest-agent',
        mockRes,
      );

      expect(result.accessToken).toBe('test-access-token');
      expect(mockRes.cookie).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return the current user payload', () => {
      const userPayload = {
        sub: 'user-uuid-1',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
        type: 'access' as const,
      };

      const result = controller.getProfile(userPayload);

      expect(result).toEqual(userPayload);
    });
  });
});
