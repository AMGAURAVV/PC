/**
 * Prisma Seed Orchestrator
 *
 * Runs all seed modules in dependency order.
 *
 * Run with:
 *   pnpm --filter @pc-platform/database seed
 *   # or
 *   pnpm db:seed
 *
 * ⚠️  All monetary values seeded are DEMO DATA — not real prices.
 *     All user passwords seeded are DEMO — not for production use.
 *
 * Seed execution order (dependencies respected):
 *   01 → Roles
 *   02 → Permissions (depends on roles)
 *   03 → Brands
 *   04 → Categories
 *   05 → Component type definitions
 *   06 → Suppliers
 *   07 → Products (depends on brands, categories, suppliers)
 *   08 → Compatibility rules
 *   09 → Demo users (depends on roles)
 */

import { PrismaClient } from '../src/generated';

import { seedRoles }                from './seeds/01-roles';
import { seedPermissions }          from './seeds/02-permissions';
import { seedBrands }               from './seeds/03-brands';
import { seedCategories }           from './seeds/04-categories';
import { seedComponentTypes }       from './seeds/05-component-types';
import { seedSuppliers }            from './seeds/06-suppliers';
import { seedProducts }             from './seeds/07-products';
import { seedCompatibilityRules }   from './seeds/08-compatibility-rules';
import { seedUsers }                from './seeds/09-users';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║       PC Platform — Database Seed v2.0.0        ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  DEMO DATA: Prices and passwords are NOT for production.');
  console.log('');

  console.log('📦 [01/09] Seeding roles...');
  await seedRoles(prisma);

  console.log('🔐 [02/09] Seeding permissions...');
  await seedPermissions(prisma);

  console.log('🏷️  [03/09] Seeding brands...');
  await seedBrands(prisma);

  console.log('📂 [04/09] Seeding categories...');
  await seedCategories(prisma);

  console.log('⚙️  [05/09] Seeding component type definitions...');
  await seedComponentTypes(prisma);

  console.log('🏭 [06/09] Seeding suppliers...');
  await seedSuppliers(prisma);

  console.log('🛒 [07/09] Seeding products (with specs, inventory, DEMO prices)...');
  await seedProducts(prisma);

  console.log('🔧 [08/09] Seeding compatibility rules...');
  await seedCompatibilityRules(prisma);

  console.log('👤 [09/09] Seeding demo users...');
  await seedUsers(prisma);

  console.log('');
  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo accounts (CHANGE BEFORE PRODUCTION):');
  console.log('  admin@pcplatform.in  →  Admin@Demo2024!   (super_admin)');
  console.log('  ops@pcplatform.in    →  Ops@Demo2024!     (admin)');
  console.log('  demo@example.com     →  Demo@Demo2024!    (customer)');
  console.log('');
  console.log('View data: pnpm --filter @pc-platform/database studio');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
