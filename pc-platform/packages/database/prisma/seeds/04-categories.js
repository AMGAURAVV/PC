"use strict";
/**
 * Seed: 04-categories.ts
 * Seeds hierarchical product categories.
 *
 * Root categories map to ComponentType enums.
 * Sub-categories provide finer navigation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCategories = seedCategories;
async function seedCategories(prisma) {
    // ── Root categories ───────────────────────────────────────────
    const roots = [
        { name: 'Processors (CPUs)', slug: 'processors', description: 'Desktop and workstation CPUs from AMD and Intel', sortOrder: 1 },
        { name: 'Motherboards', slug: 'motherboards', description: 'ATX, mATX, and Mini-ITX motherboards', sortOrder: 2 },
        { name: 'Graphics Cards (GPUs)', slug: 'graphics-cards', description: 'Discrete graphics cards for gaming and content creation', sortOrder: 3 },
        { name: 'Memory (RAM)', slug: 'memory', description: 'DDR4 and DDR5 desktop memory modules', sortOrder: 4 },
        { name: 'Storage', slug: 'storage', description: 'NVMe SSDs, SATA SSDs, and hard drives', sortOrder: 5 },
        { name: 'Power Supplies (PSUs)', slug: 'power-supplies', description: 'ATX modular and non-modular power supply units', sortOrder: 6 },
        { name: 'PC Cases', slug: 'pc-cases', description: 'Full, mid, and mini tower PC cases', sortOrder: 7 },
        { name: 'Cooling', slug: 'cooling', description: 'Air coolers, AIO liquid coolers, and case fans', sortOrder: 8 },
        { name: 'Monitors', slug: 'monitors', description: 'Gaming and productivity monitors', sortOrder: 9 },
        { name: 'Peripherals', slug: 'peripherals', description: 'Keyboards, mice, headsets, and more', sortOrder: 10 },
    ];
    const rootMap = {};
    for (const cat of roots) {
        const record = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
        rootMap[cat.slug] = record.id;
    }
    // ── Sub-categories ────────────────────────────────────────────
    const subs = [
        // Processors
        { name: 'AMD Ryzen Processors', slug: 'amd-ryzen', parentSlug: 'processors', sortOrder: 1 },
        { name: 'Intel Core Processors', slug: 'intel-core', parentSlug: 'processors', sortOrder: 2 },
        // GPUs
        { name: 'NVIDIA GeForce', slug: 'nvidia-geforce', parentSlug: 'graphics-cards', sortOrder: 1 },
        { name: 'AMD Radeon', slug: 'amd-radeon', parentSlug: 'graphics-cards', sortOrder: 2 },
        // Storage
        { name: 'NVMe SSDs', slug: 'nvme-ssd', parentSlug: 'storage', sortOrder: 1 },
        { name: 'SATA SSDs', slug: 'sata-ssd', parentSlug: 'storage', sortOrder: 2 },
        { name: 'Hard Drives (HDD)', slug: 'hdd', parentSlug: 'storage', sortOrder: 3 },
        // Cooling
        { name: 'Air CPU Coolers', slug: 'air-coolers', parentSlug: 'cooling', sortOrder: 1 },
        { name: 'AIO Liquid Coolers', slug: 'aio-coolers', parentSlug: 'cooling', sortOrder: 2 },
        { name: 'Case Fans', slug: 'case-fans', parentSlug: 'cooling', sortOrder: 3 },
        // Peripherals
        { name: 'Keyboards', slug: 'keyboards', parentSlug: 'peripherals', sortOrder: 1 },
        { name: 'Mice', slug: 'mice', parentSlug: 'peripherals', sortOrder: 2 },
        { name: 'Headsets', slug: 'headsets', parentSlug: 'peripherals', sortOrder: 3 },
        { name: 'Webcams', slug: 'webcams', parentSlug: 'peripherals', sortOrder: 4 },
        { name: 'Speakers', slug: 'speakers', parentSlug: 'peripherals', sortOrder: 5 },
        { name: 'UPS', slug: 'ups', parentSlug: 'peripherals', sortOrder: 6 },
    ];
    for (const sub of subs) {
        const parentId = rootMap[sub.parentSlug];
        if (!parentId)
            continue;
        await prisma.category.upsert({
            where: { slug: sub.slug },
            update: {},
            create: {
                name: sub.name,
                slug: sub.slug,
                parentId,
                sortOrder: sub.sortOrder,
            },
        });
    }
    console.log(`  ✔  Categories: ${roots.length} root + ${subs.length} sub-categories`);
}
//# sourceMappingURL=04-categories.js.map