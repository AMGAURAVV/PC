"use strict";
/**
 * Seed: 03-brands.ts
 * Seeds major PC hardware brands.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedBrands = seedBrands;
const BRANDS = [
    // Processors
    { name: 'AMD', slug: 'amd', countryCode: 'US', websiteUrl: 'https://amd.com' },
    { name: 'Intel', slug: 'intel', countryCode: 'US', websiteUrl: 'https://intel.com' },
    // GPUs
    { name: 'NVIDIA', slug: 'nvidia', countryCode: 'US', websiteUrl: 'https://nvidia.com' },
    // GPU AIBs
    { name: 'ASUS', slug: 'asus', countryCode: 'TW', websiteUrl: 'https://asus.com' },
    { name: 'MSI', slug: 'msi', countryCode: 'TW', websiteUrl: 'https://msi.com' },
    { name: 'Gigabyte', slug: 'gigabyte', countryCode: 'TW', websiteUrl: 'https://gigabyte.com' },
    { name: 'EVGA', slug: 'evga', countryCode: 'US', websiteUrl: 'https://evga.com' },
    { name: 'Sapphire', slug: 'sapphire', countryCode: 'HK', websiteUrl: 'https://sapphiretech.com' },
    { name: 'PowerColor', slug: 'powercolor', countryCode: 'TW', websiteUrl: 'https://powercolor.com' },
    { name: 'XFX', slug: 'xfx', countryCode: 'US', websiteUrl: 'https://xfxforce.com' },
    { name: 'Zotac', slug: 'zotac', countryCode: 'HK', websiteUrl: 'https://zotac.com' },
    // RAM
    { name: 'Corsair', slug: 'corsair', countryCode: 'US', websiteUrl: 'https://corsair.com' },
    { name: 'G.Skill', slug: 'gskill', countryCode: 'TW', websiteUrl: 'https://gskill.com' },
    { name: 'Kingston', slug: 'kingston', countryCode: 'US', websiteUrl: 'https://kingston.com' },
    { name: 'Crucial', slug: 'crucial', countryCode: 'US', websiteUrl: 'https://crucial.com' },
    { name: 'TeamGroup', slug: 'teamgroup', countryCode: 'TW', websiteUrl: 'https://teamgroupinc.com' },
    // Storage
    { name: 'Samsung', slug: 'samsung', countryCode: 'KR', websiteUrl: 'https://samsung.com' },
    { name: 'WD', slug: 'wd', countryCode: 'US', websiteUrl: 'https://westerndigital.com' },
    { name: 'Seagate', slug: 'seagate', countryCode: 'US', websiteUrl: 'https://seagate.com' },
    { name: 'SK Hynix', slug: 'sk-hynix', countryCode: 'KR', websiteUrl: 'https://skhynix.com' },
    // PSU
    { name: 'Seasonic', slug: 'seasonic', countryCode: 'TW', websiteUrl: 'https://seasonic.com' },
    { name: 'EVGA', slug: 'evga-psu', countryCode: 'US', websiteUrl: 'https://evga.com' },
    { name: 'be quiet!', slug: 'be-quiet', countryCode: 'DE', websiteUrl: 'https://bequiet.com' },
    { name: 'Cooler Master', slug: 'cooler-master', countryCode: 'TW', websiteUrl: 'https://coolermaster.com' },
    { name: 'Thermaltake', slug: 'thermaltake', countryCode: 'TW', websiteUrl: 'https://thermaltake.com' },
    // Cooling
    { name: 'Noctua', slug: 'noctua', countryCode: 'AT', websiteUrl: 'https://noctua.at' },
    { name: 'Arctic', slug: 'arctic', countryCode: 'CH', websiteUrl: 'https://arctic.de' },
    { name: 'DeepCool', slug: 'deepcool', countryCode: 'CN', websiteUrl: 'https://deepcool.com' },
    { name: 'Lian Li', slug: 'lian-li', countryCode: 'TW', websiteUrl: 'https://lian-li.com' },
    // Monitors
    { name: 'LG', slug: 'lg', countryCode: 'KR', websiteUrl: 'https://lg.com' },
    { name: 'Dell', slug: 'dell', countryCode: 'US', websiteUrl: 'https://dell.com' },
    { name: 'BenQ', slug: 'benq', countryCode: 'TW', websiteUrl: 'https://benq.com' },
    { name: 'Acer', slug: 'acer', countryCode: 'TW', websiteUrl: 'https://acer.com' },
    // Peripherals
    { name: 'Logitech', slug: 'logitech', countryCode: 'CH', websiteUrl: 'https://logitech.com' },
    { name: 'Razer', slug: 'razer', countryCode: 'US', websiteUrl: 'https://razer.com' },
    { name: 'SteelSeries', slug: 'steelseries', countryCode: 'DK', websiteUrl: 'https://steelseries.com' },
];
async function seedBrands(prisma) {
    let count = 0;
    for (const brand of BRANDS) {
        await prisma.brand.upsert({
            where: { slug: brand.slug },
            update: {},
            create: brand,
        });
        count++;
    }
    console.log(`  ✔  Brands: ${count} seeded`);
}
//# sourceMappingURL=03-brands.js.map