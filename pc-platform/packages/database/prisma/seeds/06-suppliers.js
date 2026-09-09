"use strict";
/**
 * Seed: 06-suppliers.ts
 * Seeds supplier records. "Platform" is the default supplier — the store itself.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSuppliers = seedSuppliers;
async function seedSuppliers(prisma) {
    const suppliers = [
        {
            name: 'PC Platform (Direct)',
            code: 'PCP',
            isPlatform: true,
            email: 'inventory@pcplatform.in',
            website: 'https://pcplatform.in',
        },
        {
            name: 'MDComputers',
            code: 'MDC',
            isPlatform: false,
            website: 'https://mdcomputers.in',
        },
        {
            name: 'Vedant Computers',
            code: 'VDT',
            isPlatform: false,
            website: 'https://vedantcomputers.com',
        },
        {
            name: 'Prime ABGB',
            code: 'ABGB',
            isPlatform: false,
            website: 'https://primeabgb.com',
        },
    ];
    for (const supplier of suppliers) {
        await prisma.supplier.upsert({
            where: { code: supplier.code },
            update: {},
            create: supplier,
        });
    }
    console.log(`  ✔  Suppliers: ${suppliers.length} seeded`);
}
//# sourceMappingURL=06-suppliers.js.map