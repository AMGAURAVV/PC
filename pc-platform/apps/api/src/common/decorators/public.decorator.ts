/**
 * @Public() decorator — marks a route as publicly accessible.
 *
 * When applied, JwtAuthGuard will skip JWT validation for that route.
 *
 * Usage:
 *   @Public()
 *   @Post('register')
 *   register(@Body() dto: RegisterDto) {}
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(IS_PUBLIC_KEY, true);
