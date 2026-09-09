"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const generated_1 = require("./src/generated");
const _01_roles_1 = require("./seeds/01-roles");
const _02_permissions_1 = require("./seeds/02-permissions");
const _03_brands_1 = require("./seeds/03-brands");
const _04_categories_1 = require("./seeds/04-categories");
const _05_component_types_1 = require("./seeds/05-component-types");
const _06_suppliers_1 = require("./seeds/06-suppliers");
const _07_products_1 = require("./seeds/07-products");
const _08_compatibility_rules_1 = require("./seeds/08-compatibility-rules");
const _09_users_1 = require("./seeds/09-users");
const prisma = new generated_1.PrismaClient({
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
    await (0, _01_roles_1.seedRoles)(prisma);
    console.log('🔐 [02/09] Seeding permissions...');
    await (0, _02_permissions_1.seedPermissions)(prisma);
    console.log('🏷️  [03/09] Seeding brands...');
    await (0, _03_brands_1.seedBrands)(prisma);
    console.log('📂 [04/09] Seeding categories...');
    await (0, _04_categories_1.seedCategories)(prisma);
    console.log('⚙️  [05/09] Seeding component type definitions...');
    await (0, _05_component_types_1.seedComponentTypes)(prisma);
    console.log('🏭 [06/09] Seeding suppliers...');
    await (0, _06_suppliers_1.seedSuppliers)(prisma);
    console.log('🛒 [07/09] Seeding products (with specs, inventory, DEMO prices)...');
    await (0, _07_products_1.seedProducts)(prisma);
    console.log('🔧 [08/09] Seeding compatibility rules...');
    await (0, _08_compatibility_rules_1.seedCompatibilityRules)(prisma);
    console.log('👤 [09/09] Seeding demo users...');
    await (0, _09_users_1.seedUsers)(prisma);
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
//# sourceMappingURL=seed.js.map