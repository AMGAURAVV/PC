/**
 * @CurrentUser() param decorator — extracts the authenticated user from the request.
 *
 * Usage:
 *   @Get('me')
 *   getMe(@CurrentUser() user: JwtPayload) {
 *     return user;
 *   }
 *
 * Returns the full JWT payload set by JwtStrategy.validate().
 * Use with @UseGuards(JwtAuthGuard) to ensure user is present.
 */

import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
