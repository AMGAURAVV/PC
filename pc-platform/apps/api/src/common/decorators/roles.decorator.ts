/**
 * @Roles() decorator — marks a route with required role(s).
 *
 * Usage:
 *   @Roles('admin')
 *   @Roles('admin', 'super_admin')
 *
 * Used by RolesGuard to evaluate access.
 */

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
