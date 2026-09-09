/**
 * Seed: 07-products.ts
 *
 * ⚠️  DEMO DATA — All prices are clearly marked as DEMO.
 *     Do NOT use these prices in production.
 *     Replace with real pricing from your sourcing team.
 *
 * Seeds a representative set of PC components:
 *   - 3 CPUs (AMD AM5 + Intel LGA1700)
 *   - 2 Motherboards
 *   - 2 GPUs
 *   - 2 RAM kits
 *   - 2 Storage devices
 *   - 1 PSU
 *   - 1 Case
 *   - 1 CPU Cooler
 *   - 1 Monitor
 *
 * Each product gets:
 *   - A normalized spec table row (CpuSpec, GpuSpec, etc.)
 *   - PowerRequirement row
 *   - PhysicalDimension row
 *   - ProductSpecification EAV rows (for search/filter)
 *   - Inventory row (Platform supplier)
 *   - Price row (DEMO)
 *   - PriceHistory entry
 */
import type { PrismaClient } from '../src/generated';
export declare function seedProducts(prisma: PrismaClient): Promise<void>;
//# sourceMappingURL=07-products.d.ts.map