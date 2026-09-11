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

import * as crypto from 'crypto';
import type { PrismaClient } from '../../src/generated';
import { UserStatus } from '../../src/generated';

// ⚠️  For seed only. Production uses bcrypt in the API.
function demoHash(password: string): string {
  return 'sha256:' + crypto.createHash('sha256').update(password).digest('hex');
}

const DEMO_USERS = [
  {
    email: 'admin@pcplatform.in',
    password: 'Admin@Demo2024!',
    firstName: 'Platform',
    lastName: 'Admin',
    status: UserStatus.ACTIVE,
    isVerified: true,
    roleName: 'super_admin',
  },
  {
    email: 'ops@pcplatform.in',
    password: 'Ops@Demo2024!',
    firstName: 'Operations',
    lastName: 'Manager',
    status: UserStatus.ACTIVE,
    isVerified: true,
    roleName: 'admin',
  },
  {
    email: 'demo@example.com',
    password: 'Demo@Demo2024!',
    firstName: 'Demo',
    lastName: 'Customer',
    status: UserStatus.ACTIVE,
    isVerified: true,
    roleName: 'customer',
  },
];

export async function seedUsers(prisma: PrismaClient) {
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: demoHash(u.password),
        firstName: u.firstName,
        lastName: u.lastName,
        status: u.status,
        isVerified: u.isVerified,
        verifiedAt: new Date(),
      },
    });

    // Assign role
    const role = await prisma.role.findUnique({ where: { name: u.roleName } });
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }
  }

  console.log(`  ✔  Users: ${DEMO_USERS.length} demo accounts seeded`);
  console.log(`     admin@pcplatform.in   → super_admin  [DEMO password — change before production!]`);
  console.log(`     ops@pcplatform.in     → admin        [DEMO password — change before production!]`);
  console.log(`     demo@example.com      → customer     [DEMO password — change before production!]`);
}
