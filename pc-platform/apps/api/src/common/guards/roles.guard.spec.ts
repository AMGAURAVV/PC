import type { ExecutionContext} from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as any;
  };

  it('should allow access if no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is not on request', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext({ roles: ['customer'] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if user has one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin', 'moderator']);
    const context = createMockContext({ roles: ['customer', 'admin'] });

    expect(guard.canActivate(context)).toBe(true);
  });
});
