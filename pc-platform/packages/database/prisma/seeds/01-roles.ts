/**
 * Seed: 01-roles.ts
 * Seeds system roles: super_admin, admin, customer, supplier
 * These are the baseline RBAC roles — do not delete.
 */

import type { PrismaClient } from '../src/generated';

export async function seedRoles(prisma: PrismaClient) {
  const roles = [
    {
      name: 'super_admin',
      description: 'Full system access — can manage everything including other admins',
      isSystem: true,
    },
    {
      name: 'admin',
      description: 'Platform administrator — manages products, orders, users',
      isSystem: true,
    },
    {
      name: 'customer',
      description: 'Registered customer — default role for all sign-ups',
      isSystem: true,
    },
    {
      name: 'supplier',
      description: 'Supplier/merchant — manages their own inventory and pricing',
      isSystem: false,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  console.log(`  ✔  Roles: ${roles.map((r) => r.name).join(', ')}`);
}
