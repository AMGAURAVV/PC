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
export {};
//# sourceMappingURL=seed.d.ts.map