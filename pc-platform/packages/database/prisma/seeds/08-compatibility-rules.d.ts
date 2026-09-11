/**
 * Seed: 08-compatibility-rules.ts
 *
 * Seeds the core compatibility rules that the compatibility-engine service
 * reads at runtime to evaluate PC builds.
 *
 * IMPORTANT: These are DATA records only.
 * The compatibility-engine service evaluates them — no DB triggers.
 *
 * Rules seeded:
 *   1. CPU ↔ Motherboard socket match (ERROR)
 *   2. RAM type ↔ Motherboard supported types (ERROR)
 *   3. GPU length ≤ Case max GPU length (ERROR)
 *   4. CPU cooler height ≤ Case max cooler height (ERROR)
 *   5. PSU wattage ≥ build total TDP × 1.2 safety margin (WARNING)
 *   6. Motherboard form factor fits case (ERROR)
 *   7. GPU slot width ≤ case available PCI slots (ERROR)
 *   8. RAM capacity ≤ Motherboard max RAM (WARNING)
 */
import type { PrismaClient } from '../../src/generated';
export declare function seedCompatibilityRules(prisma: PrismaClient): Promise<void>;
//# sourceMappingURL=08-compatibility-rules.d.ts.map
