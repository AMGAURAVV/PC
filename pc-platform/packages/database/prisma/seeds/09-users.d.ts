/**
 * Seed: 09-users.ts
 *
 * Seeds demo user accounts.
 *
 * ⚠️  IMPORTANT: These passwords are demo-only seed values.
 *     Production authentication uses bcrypt in the API service.
 *     The seed uses SHA-256 as a stand-in ONLY because bcrypt
 *     is not a dependency of the database package.
 *     CHANGE ALL PASSWORDS before any real deployment.
 *
 * Accounts seeded:
 *   admin@pcplatform.in   / [DEMO] Admin@Demo2024!   → super_admin role
 *   ops@pcplatform.in     / [DEMO] Ops@Demo2024!     → admin role
 *   demo@example.com      / [DEMO] Demo@Demo2024!    → customer role
 */
import type { PrismaClient } from '../src/generated';
export declare function seedUsers(prisma: PrismaClient): Promise<void>;
//# sourceMappingURL=09-users.d.ts.map