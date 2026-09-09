"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedProducts = seedProducts;
const generated_1 = require("../src/generated");
// [DEMO] Prices are illustrative only — not real market prices
const DEMO_PRICES = {
    'AMD-7950X': 99999, // [DEMO] ₹99,999
    'AMD-7600X': 34999, // [DEMO] ₹34,999
    'INTEL-13900K': 79999, // [DEMO] ₹79,999
    'ASUS-X670E-HERO': 59999, // [DEMO] ₹59,999
    'MSI-Z790-TOMAHAWK': 24999, // [DEMO] ₹24,999
    'NVIDIA-4090-FE': 199999, // [DEMO] ₹1,99,999
    'AMD-7900-XTX': 94999, // [DEMO] ₹94,999
    'GSKILL-32GB-DDR5': 14999, // [DEMO] ₹14,999
    'CORSAIR-64GB-DDR5': 24999, // [DEMO] ₹24,999
    'SAMSUNG-990PRO-2TB': 14999, // [DEMO] ₹14,999
    'WD-SN850X-1TB': 8999, // [DEMO] ₹8,999
    'SEASONIC-1000W-PX': 18999, // [DEMO] ₹18,999
    'LIANLI-O11D-EVO': 14999, // [DEMO] ₹14,999
    'NOCTUA-NH-D15': 8499, // [DEMO] ₹8,499
    'LG-27GP850B': 39999, // [DEMO] ₹39,999
};
async function seedProducts(prisma) {
    // Resolve required FKs
    const amd = await prisma.brand.findUniqueOrThrow({ where: { slug: 'amd' } });
    const intel = await prisma.brand.findUniqueOrThrow({ where: { slug: 'intel' } });
    const nvidia = await prisma.brand.findUniqueOrThrow({ where: { slug: 'nvidia' } });
    const asus = await prisma.brand.findUniqueOrThrow({ where: { slug: 'asus' } });
    const msi = await prisma.brand.findUniqueOrThrow({ where: { slug: 'msi' } });
    const gskill = await prisma.brand.findUniqueOrThrow({ where: { slug: 'gskill' } });
    const corsair = await prisma.brand.findUniqueOrThrow({ where: { slug: 'corsair' } });
    const samsung = await prisma.brand.findUniqueOrThrow({ where: { slug: 'samsung' } });
    const wd = await prisma.brand.findUniqueOrThrow({ where: { slug: 'wd' } });
    const seasonic = await prisma.brand.findUniqueOrThrow({ where: { slug: 'seasonic' } });
    const lianli = await prisma.brand.findUniqueOrThrow({ where: { slug: 'lian-li' } });
    const noctua = await prisma.brand.findUniqueOrThrow({ where: { slug: 'noctua' } });
    const lg = await prisma.brand.findUniqueOrThrow({ where: { slug: 'lg' } });
    const sapphire = await prisma.brand.findUniqueOrThrow({ where: { slug: 'sapphire' } });
    const cpuCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'processors' } });
    const mbCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'motherboards' } });
    const gpuCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'graphics-cards' } });
    const ramCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'memory' } });
    const storageCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'storage' } });
    const psuCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'power-supplies' } });
    const caseCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'pc-cases' } });
    const coolerCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'cooling' } });
    const monitorCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'monitors' } });
    const supplier = await prisma.supplier.findUniqueOrThrow({ where: { code: 'PCP' } });
    const products = [
        // ── CPUs ─────────────────────────────────────────────────────
        {
            sku: 'AMD-7950X',
            slug: 'amd-ryzen-9-7950x',
            name: 'AMD Ryzen 9 7950X',
            model: 'Ryzen 9 7950X',
            shortDescription: '16C/32T · 4.5–5.7 GHz · AM5 · 170W TDP',
            description: 'Flagship AMD Zen 4 desktop processor. 16 cores, 32 threads on the AM5 platform with DDR5 and PCIe 5.0 support.',
            brandId: amd.id,
            componentType: generated_1.ComponentType.CPU,
            categoryId: cpuCat.id,
            stock: 15,
            spec: {
                socketType: 'AM5', architecture: 'Zen 4', processTech: '5nm',
                cores: 16, threads: 32, baseClockMhz: 4500, boostClockMhz: 5700,
                l3CacheMb: 64, tdpW: 170, maxTdpW: 230,
                memoryType: 'DDR5', maxMemoryGb: 128, maxMemorySpeedMhz: 5200,
                memoryChannels: 2, pcieGen: 5, pcieLanes: 24,
                hasIgpu: false, coolerIncluded: false,
            },
            powerW: { idle: 35, typical: 140, peak: 230 },
            dims: { length: 40, width: 40, heightG: undefined, weightG: 45 },
            eav: [
                { key: 'socket_type', value: 'AM5', groupKey: 'compatibility' },
                { key: 'cores', value: '16', groupKey: 'performance' },
                { key: 'threads', value: '32', groupKey: 'performance' },
                { key: 'boost_clock_mhz', value: '5700', unit: 'MHz', groupKey: 'performance' },
                { key: 'tdp_w', value: '170', unit: 'W', groupKey: 'power' },
                { key: 'mem_type', value: 'DDR5', groupKey: 'compatibility' },
            ],
        },
        {
            sku: 'AMD-7600X',
            slug: 'amd-ryzen-5-7600x',
            name: 'AMD Ryzen 5 7600X',
            model: 'Ryzen 5 7600X',
            shortDescription: '6C/12T · 4.7–5.3 GHz · AM5 · 105W TDP',
            description: 'AMD Ryzen 5 7600X — mid-range Zen 4 powerhouse with outstanding single-thread performance for gaming.',
            brandId: amd.id,
            componentType: generated_1.ComponentType.CPU,
            categoryId: cpuCat.id,
            stock: 32,
            spec: {
                socketType: 'AM5', architecture: 'Zen 4', processTech: '5nm',
                cores: 6, threads: 12, baseClockMhz: 4700, boostClockMhz: 5300,
                l3CacheMb: 32, tdpW: 105, maxTdpW: 142,
                memoryType: 'DDR5', maxMemoryGb: 128, maxMemorySpeedMhz: 5200,
                memoryChannels: 2, pcieGen: 5, pcieLanes: 24,
                hasIgpu: false, coolerIncluded: false,
            },
            powerW: { idle: 20, typical: 80, peak: 142 },
            dims: { weightG: 40 },
            eav: [
                { key: 'socket_type', value: 'AM5', groupKey: 'compatibility' },
                { key: 'cores', value: '6', groupKey: 'performance' },
                { key: 'threads', value: '12', groupKey: 'performance' },
                { key: 'boost_clock_mhz', value: '5300', unit: 'MHz', groupKey: 'performance' },
                { key: 'tdp_w', value: '105', unit: 'W', groupKey: 'power' },
                { key: 'mem_type', value: 'DDR5', groupKey: 'compatibility' },
            ],
        },
        {
            sku: 'INTEL-13900K',
            slug: 'intel-core-i9-13900k',
            name: 'Intel Core i9-13900K',
            model: 'Core i9-13900K',
            shortDescription: '24C(8P+16E)/32T · 3.0–5.8 GHz · LGA1700 · 125W PBP',
            description: 'Intel 13th Gen Raptor Lake flagship. 24 cores (8P + 16E) with class-leading gaming performance.',
            brandId: intel.id,
            componentType: generated_1.ComponentType.CPU,
            categoryId: cpuCat.id,
            stock: 8,
            spec: {
                socketType: 'LGA1700', architecture: 'Raptor Lake', processTech: 'Intel 7',
                cores: 24, threads: 32, baseClockMhz: 3000, boostClockMhz: 5800,
                l2CacheMb: 32, l3CacheMb: 36, tdpW: 125, maxTdpW: 253,
                memoryType: 'DDR5', maxMemoryGb: 192, maxMemorySpeedMhz: 5600,
                memoryChannels: 2, pcieGen: 5, pcieLanes: 20,
                hasIgpu: true, igpuModel: 'Intel UHD 770', coolerIncluded: false,
            },
            powerW: { idle: 30, typical: 180, peak: 253 },
            dims: { weightG: 50 },
            eav: [
                { key: 'socket_type', value: 'LGA1700', groupKey: 'compatibility' },
                { key: 'cores', value: '24', groupKey: 'performance' },
                { key: 'threads', value: '32', groupKey: 'performance' },
                { key: 'boost_clock_mhz', value: '5800', unit: 'MHz', groupKey: 'performance' },
                { key: 'tdp_w', value: '125', unit: 'W', groupKey: 'power' },
                { key: 'mem_type', value: 'DDR5', groupKey: 'compatibility' },
                { key: 'has_igpu', value: 'true', groupKey: 'features' },
            ],
        },
        // ── Motherboards ──────────────────────────────────────────────
        {
            sku: 'ASUS-X670E-HERO',
            slug: 'asus-rog-crosshair-x670e-hero',
            name: 'ASUS ROG Crosshair X670E Hero',
            model: 'ROG Crosshair X670E Hero',
            shortDescription: 'AM5 · X670E · ATX · DDR5 · Wi-Fi 6E',
            description: 'High-end AM5 motherboard for Ryzen 7000 series. X670E chipset, full DDR5 + PCIe 5.0 support.',
            brandId: asus.id,
            componentType: generated_1.ComponentType.MOTHERBOARD,
            categoryId: mbCat.id,
            stock: 10,
            spec: {
                socketType: 'AM5', chipset: 'X670E', formFactor: 'ATX',
                supportedMemTypes: ['DDR5'], ramSlots: 4, maxRamGb: 192, maxRamSpeedMhz: 6400,
                pcieX16Slots: 2, pcieX1Slots: 1, m2Slots: 4,
                m2Details: [
                    { slot: 1, key: 'M', pcie: 5, sata: false },
                    { slot: 2, key: 'M', pcie: 4, sata: false },
                    { slot: 3, key: 'M', pcie: 4, sata: true },
                    { slot: 4, key: 'M', pcie: 4, sata: true },
                ],
                sataSlots: 6,
                usbRearPorts: [
                    { type: 'USB 3.2 Gen2x2 Type-C', count: 1 },
                    { type: 'USB 3.2 Gen2 Type-A', count: 4 },
                    { type: 'USB 3.2 Gen1 Type-A', count: 2 },
                ],
                hasWifi: true, wifiStandard: 'Wi-Fi 6E',
                hasBluetooth: true, bluetoothVersion: '5.3',
                hasRgbHeaders: true, hasArgbHeaders: true,
                lanSpeedGbps: 2.5, audioChipset: 'ROG SupremeFX',
                biosFlashback: true, thunderboltSupport: false,
            },
            powerW: { idle: 15, typical: 30, peak: 60 },
            dims: { length: 305, width: 244, heightG: 1200 },
            eav: [
                { key: 'socket_type', value: 'AM5', groupKey: 'compatibility' },
                { key: 'form_factor', value: 'ATX', groupKey: 'physical' },
                { key: 'chipset', value: 'X670E', groupKey: 'features' },
                { key: 'ram_slots', value: '4', groupKey: 'memory' },
                { key: 'max_ram_gb', value: '192', unit: 'GB', groupKey: 'memory' },
                { key: 'has_wifi', value: 'true', groupKey: 'features' },
                { key: 'm2_slots', value: '4', groupKey: 'storage' },
            ],
        },
        {
            sku: 'MSI-Z790-TOMAHAWK',
            slug: 'msi-mag-z790-tomahawk-wifi',
            name: 'MSI MAG Z790 Tomahawk WiFi',
            model: 'MAG Z790 Tomahawk WiFi',
            shortDescription: 'LGA1700 · Z790 · ATX · DDR5 · Wi-Fi 6E',
            description: 'Mid-range Z790 motherboard for Intel 12th/13th Gen. Excellent VRM for overclocking on a budget.',
            brandId: msi.id,
            componentType: generated_1.ComponentType.MOTHERBOARD,
            categoryId: mbCat.id,
            stock: 18,
            spec: {
                socketType: 'LGA1700', chipset: 'Z790', formFactor: 'ATX',
                supportedMemTypes: ['DDR5'], ramSlots: 4, maxRamGb: 192, maxRamSpeedMhz: 7200,
                pcieX16Slots: 2, pcieX1Slots: 0, m2Slots: 5,
                m2Details: [
                    { slot: 1, key: 'M', pcie: 5, sata: false },
                    { slot: 2, key: 'M', pcie: 4, sata: false },
                    { slot: 3, key: 'M', pcie: 4, sata: true },
                ],
                sataSlots: 6,
                hasWifi: true, wifiStandard: 'Wi-Fi 6E',
                hasBluetooth: true, bluetoothVersion: '5.3',
                hasArgbHeaders: true, hasRgbHeaders: true,
                lanSpeedGbps: 2.5, biosFlashback: true,
            },
            powerW: { idle: 12, typical: 25, peak: 50 },
            dims: { length: 305, width: 244, weightG: 1100 },
            eav: [
                { key: 'socket_type', value: 'LGA1700', groupKey: 'compatibility' },
                { key: 'form_factor', value: 'ATX', groupKey: 'physical' },
                { key: 'chipset', value: 'Z790', groupKey: 'features' },
                { key: 'ram_slots', value: '4', groupKey: 'memory' },
                { key: 'has_wifi', value: 'true', groupKey: 'features' },
                { key: 'm2_slots', value: '5', groupKey: 'storage' },
            ],
        },
        // ── GPUs ──────────────────────────────────────────────────────
        {
            sku: 'NVIDIA-4090-FE',
            slug: 'nvidia-geforce-rtx-4090-founders-edition',
            name: 'NVIDIA GeForce RTX 4090 Founders Edition',
            model: 'RTX 4090 Founders Edition',
            shortDescription: '24GB GDDR6X · 450W TDP · PCIe 4.0 x16 · 336mm',
            description: 'NVIDIA Ada Lovelace flagship GPU. Unrivaled performance for 4K gaming and AI inference workloads.',
            brandId: nvidia.id,
            componentType: generated_1.ComponentType.GPU,
            categoryId: gpuCat.id,
            stock: 5,
            spec: {
                chipset: 'AD102', gpuArchitecture: 'Ada Lovelace', processTech: '4nm',
                vramGb: 24, vramType: 'GDDR6X', vramBusBit: 384,
                boostClockMhz: 2520, tdpW: 450, recommendedPsuW: 850,
                powerConnectors: '1x 16-pin (600W)',
                pcieSlot: 'x16', pcieGen: 4, slotWidth: 3,
                lengthMm: 336, widthMm: 140, heightMm: 61,
                displayports: 3, hdmiPorts: 1, hdmiVersion: '2.1', dpVersion: '1.4a',
                hasRaytracing: true, hasDlss: true, hasFsr: false,
            },
            powerW: { idle: 25, typical: 350, peak: 480 },
            dims: { length: 336, width: 140, height: 61, weightG: 2100 },
            eav: [
                { key: 'vram_gb', value: '24', unit: 'GB', groupKey: 'memory' },
                { key: 'vram_type', value: 'GDDR6X', groupKey: 'memory' },
                { key: 'tdp_w', value: '450', unit: 'W', groupKey: 'power' },
                { key: 'length_mm', value: '336', unit: 'mm', groupKey: 'physical' },
                { key: 'pcie_gen', value: '4', groupKey: 'compatibility' },
                { key: 'has_raytracing', value: 'true', groupKey: 'features' },
            ],
        },
        {
            sku: 'AMD-7900-XTX',
            slug: 'sapphire-pulse-radeon-rx-7900-xtx',
            name: 'Sapphire PULSE Radeon RX 7900 XTX',
            model: 'RX 7900 XTX PULSE',
            shortDescription: '24GB GDDR6 · 355W TDP · PCIe 4.0 x16 · 320mm',
            description: 'AMD RDNA 3 flagship GPU. 24GB GDDR6, triple fan, excellent 4K rasterization performance.',
            brandId: sapphire.id,
            componentType: generated_1.ComponentType.GPU,
            categoryId: gpuCat.id,
            stock: 7,
            spec: {
                chipset: 'Navi 31 XTX', gpuArchitecture: 'RDNA 3', processTech: '5nm + 6nm',
                vramGb: 24, vramType: 'GDDR6', vramBusBit: 384,
                boostClockMhz: 2500, tdpW: 355, recommendedPsuW: 800,
                powerConnectors: '2x 8-pin',
                pcieSlot: 'x16', pcieGen: 4, slotWidth: 3,
                lengthMm: 320, widthMm: 135, heightMm: 59,
                displayports: 2, hdmiPorts: 1, hdmiVersion: '2.1', dpVersion: '2.1',
                hasRaytracing: true, hasDlss: false, hasFsr: true,
            },
            powerW: { idle: 20, typical: 290, peak: 380 },
            dims: { length: 320, width: 135, height: 59, weightG: 1980 },
            eav: [
                { key: 'vram_gb', value: '24', unit: 'GB', groupKey: 'memory' },
                { key: 'vram_type', value: 'GDDR6', groupKey: 'memory' },
                { key: 'tdp_w', value: '355', unit: 'W', groupKey: 'power' },
                { key: 'length_mm', value: '320', unit: 'mm', groupKey: 'physical' },
                { key: 'pcie_gen', value: '4', groupKey: 'compatibility' },
                { key: 'has_raytracing', value: 'true', groupKey: 'features' },
            ],
        },
        // ── RAM ───────────────────────────────────────────────────────
        {
            sku: 'GSKILL-32GB-DDR5',
            slug: 'gskill-trident-z5-rgb-32gb-ddr5-6000',
            name: 'G.Skill Trident Z5 RGB 32GB DDR5-6000',
            model: 'Trident Z5 RGB 32GB (2x16GB) DDR5-6000 CL30',
            shortDescription: '32GB (2x16GB) · DDR5-6000 · CL30 · RGB',
            description: 'Premium DDR5 memory kit. 6000MHz at CL30 is the sweet spot for AMD Expo and Intel XMP.',
            brandId: gskill.id,
            componentType: generated_1.ComponentType.RAM,
            categoryId: ramCat.id,
            stock: 45,
            spec: {
                memType: 'DDR5', totalCapacityGb: 32, stickCount: 2, capacityPerStickGb: 16,
                speedMhz: 6000, casLatency: 30, timing: '30-38-38-96', voltageV: 1.35,
                formFactor: 'DIMM', isEcc: false, isRegistered: false,
                hasHeatspreader: true, hasRgb: true,
            },
            powerW: { idle: 2, typical: 3, peak: 5 },
            dims: { length: 135, width: 8, height: 44, weightG: 100 },
            eav: [
                { key: 'mem_type', value: 'DDR5', groupKey: 'compatibility' },
                { key: 'total_capacity_gb', value: '32', unit: 'GB', groupKey: 'capacity' },
                { key: 'speed_mhz', value: '6000', unit: 'MHz', groupKey: 'performance' },
                { key: 'has_rgb', value: 'true', groupKey: 'features' },
            ],
        },
        {
            sku: 'CORSAIR-64GB-DDR5',
            slug: 'corsair-dominator-platinum-rgb-64gb-ddr5-6000',
            name: 'Corsair Dominator Platinum RGB 64GB DDR5-6000',
            model: 'Dominator Platinum RGB 64GB (2x32GB) DDR5-6000 CL30',
            shortDescription: '64GB (2x32GB) · DDR5-6000 · CL30 · RGB',
            description: 'High-capacity Corsair DDR5 kit for content creation and workstation builds.',
            brandId: corsair.id,
            componentType: generated_1.ComponentType.RAM,
            categoryId: ramCat.id,
            stock: 22,
            spec: {
                memType: 'DDR5', totalCapacityGb: 64, stickCount: 2, capacityPerStickGb: 32,
                speedMhz: 6000, casLatency: 30, timing: '30-36-36-76', voltageV: 1.35,
                formFactor: 'DIMM', isEcc: false, isRegistered: false,
                hasHeatspreader: true, hasRgb: true,
            },
            powerW: { idle: 4, typical: 6, peak: 10 },
            dims: { length: 135, width: 8, height: 56, weightG: 120 },
            eav: [
                { key: 'mem_type', value: 'DDR5', groupKey: 'compatibility' },
                { key: 'total_capacity_gb', value: '64', unit: 'GB', groupKey: 'capacity' },
                { key: 'speed_mhz', value: '6000', unit: 'MHz', groupKey: 'performance' },
                { key: 'has_rgb', value: 'true', groupKey: 'features' },
            ],
        },
        // ── Storage ───────────────────────────────────────────────────
        {
            sku: 'SAMSUNG-990PRO-2TB',
            slug: 'samsung-990-pro-2tb-nvme-ssd',
            name: 'Samsung 990 Pro 2TB NVMe SSD',
            model: '990 Pro 2TB',
            shortDescription: '2TB · PCIe 4.0 x4 · M.2 2280 · 7450/6900 MB/s',
            description: 'Samsung top-tier consumer NVMe. Best-in-class random read for gaming and professional workloads.',
            brandId: samsung.id,
            componentType: generated_1.ComponentType.STORAGE,
            categoryId: storageCat.id,
            stock: 60,
            spec: {
                storageType: 'NVMe SSD', capacityGb: 2000, interface: 'PCIe 4.0 x4',
                formFactor: 'M.2 2280', nandType: 'TLC', controller: 'Samsung Elpis',
                seqReadMbps: 7450, seqWriteMbps: 6900,
                randRead4kIops: 1400000, randWrite4kIops: 1400000,
                tbw: 1200, mtbfHours: 1500000, dramCache: true, encryptionSupport: true,
            },
            powerW: { idle: 1, typical: 4, peak: 7 },
            dims: { length: 80, width: 22, height: 2, weightG: 9 },
            eav: [
                { key: 'storage_type', value: 'NVMe SSD', groupKey: 'type' },
                { key: 'capacity_gb', value: '2000', unit: 'GB', groupKey: 'capacity' },
                { key: 'interface', value: 'PCIe 4.0 x4', groupKey: 'compatibility' },
                { key: 'seq_read_mbps', value: '7450', unit: 'MB/s', groupKey: 'performance' },
            ],
        },
        {
            sku: 'WD-SN850X-1TB',
            slug: 'wd-black-sn850x-1tb-nvme-ssd',
            name: 'WD Black SN850X 1TB NVMe SSD',
            model: 'SN850X 1TB',
            shortDescription: '1TB · PCIe 4.0 x4 · M.2 2280 · 7300/6300 MB/s',
            description: 'WD flagship gaming SSD. Excellent sustained performance with 1TB sweet-spot capacity.',
            brandId: wd.id,
            componentType: generated_1.ComponentType.STORAGE,
            categoryId: storageCat.id,
            stock: 80,
            spec: {
                storageType: 'NVMe SSD', capacityGb: 1000, interface: 'PCIe 4.0 x4',
                formFactor: 'M.2 2280', nandType: 'TLC',
                seqReadMbps: 7300, seqWriteMbps: 6300,
                randRead4kIops: 1200000, randWrite4kIops: 1100000,
                tbw: 600, mtbfHours: 1750000, dramCache: true, encryptionSupport: false,
            },
            powerW: { idle: 1, typical: 3, peak: 6 },
            dims: { length: 80, width: 22, height: 2, weightG: 8 },
            eav: [
                { key: 'storage_type', value: 'NVMe SSD', groupKey: 'type' },
                { key: 'capacity_gb', value: '1000', unit: 'GB', groupKey: 'capacity' },
                { key: 'interface', value: 'PCIe 4.0 x4', groupKey: 'compatibility' },
                { key: 'seq_read_mbps', value: '7300', unit: 'MB/s', groupKey: 'performance' },
            ],
        },
        // ── PSU ───────────────────────────────────────────────────────
        {
            sku: 'SEASONIC-1000W-PX',
            slug: 'seasonic-prime-tx-1000',
            name: 'Seasonic PRIME TX-1000',
            model: 'PRIME TX-1000',
            shortDescription: '1000W · 80+ Titanium · Fully Modular · ATX',
            description: 'Seasonic flagship Titanium PSU. Zero-RPM mode, 10-year warranty, impeccable voltage regulation.',
            brandId: seasonic.id,
            componentType: generated_1.ComponentType.PSU,
            categoryId: psuCat.id,
            stock: 12,
            spec: {
                wattage: 1000, efficiencyRating: '80+ Titanium', modular: 'Full', formFactor: 'ATX',
                atx12vVersion: 'ATX 2.52', hasAtx3Connector: false,
                eps12vConnectors: 2,
                pcieConnectors: [{ type: '8-pin', count: 6 }],
                sataConnectors: 10, molexConnectors: 4,
                fanSizeMm: 135, isZeroFan: true, warrantyYears: 12,
                protections: ['OVP', 'OCP', 'SCP', 'OPP', 'OTP', 'NLO'],
            },
            powerW: { idle: 10, typical: 600, peak: 1050 },
            dims: { length: 170, width: 150, height: 86, weightG: 2100 },
            eav: [
                { key: 'wattage', value: '1000', unit: 'W', groupKey: 'power' },
                { key: 'efficiency_rating', value: '80+ Titanium', groupKey: 'efficiency' },
                { key: 'modular', value: 'Full', groupKey: 'features' },
            ],
        },
        // ── Case ──────────────────────────────────────────────────────
        {
            sku: 'LIANLI-O11D-EVO',
            slug: 'lian-li-o11-dynamic-evo',
            name: 'Lian Li O11 Dynamic Evo',
            model: 'O11 Dynamic Evo',
            shortDescription: 'Mid-Tower · ATX/E-ATX/mATX · Dual-Chamber · PCIe 4.0 Riser',
            description: 'Iconic dual-chamber case. Excellent airflow and watercooling support. Ships with PCIe 4.0 riser.',
            brandId: lianli.id,
            componentType: generated_1.ComponentType.CASE,
            categoryId: caseCat.id,
            stock: 20,
            spec: {
                caseType: 'Mid-Tower',
                supportedFormFactors: ['E-ATX', 'ATX', 'mATX'],
                maxMbFormFactor: 'E-ATX',
                maxGpuLengthMm: 446,
                maxGpuWidthMm: 160,
                maxCpuCoolerHeightMm: 167,
                maxPsuLengthMm: 220,
                drive35Bays: 0, drive25Bays: 6,
                pciSlots: 8,
                frontPanelUsb: [{ type: 'USB 3.2 Gen2 Type-C', count: 1 }, { type: 'USB 3.0', count: 2 }],
                hasFrontUsbc: true,
                radiatorSupport: [
                    { location: 'side', maxMm: 360 },
                    { location: 'bottom', maxMm: 360 },
                    { location: 'top', maxMm: 360 },
                ],
                includedFans: 0, maxFans: 10,
                hasGlassPanel: true, hasRgb: false, dustFilters: true,
                widthMm: 280, heightMm: 459, depthMm: 462,
            },
            powerW: { typical: 0, peak: 0 },
            dims: { length: 462, width: 280, height: 459, weightG: 9900 },
            eav: [
                { key: 'max_gpu_length_mm', value: '446', unit: 'mm', groupKey: 'compatibility' },
                { key: 'max_cpu_cooler_height_mm', value: '167', unit: 'mm', groupKey: 'compatibility' },
                { key: 'form_factor', value: 'ATX', groupKey: 'compatibility' },
            ],
        },
        // ── Cooler ─────────────────────────────────────────────────────
        {
            sku: 'NOCTUA-NH-D15',
            slug: 'noctua-nh-d15-chromax-black',
            name: 'Noctua NH-D15 Chromax.Black',
            model: 'NH-D15 Chromax.Black',
            shortDescription: 'Dual-tower air cooler · 165mm · 250W+ TDP rating · Dual NF-A15',
            description: 'Reference dual-tower air cooler. Exceptional performance, near-silent operation. Black edition.',
            brandId: noctua.id,
            componentType: generated_1.ComponentType.COOLER,
            categoryId: coolerCat.id,
            stock: 28,
            spec: {
                coolerType: 'Air',
                supportedSockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200', 'LGA115x'],
                tdpRatingW: 250, heightMm: 165,
                fanCount: 2, fanSizeMm: 140, maxFanRpm: 1500, noiseDbA: 24.6,
                hasArgb: false, ramClearanceMm: 32, includesThermalPaste: true,
            },
            powerW: { typical: 3, peak: 5 },
            dims: { length: 150, width: 135, height: 165, weightG: 1320 },
            eav: [
                { key: 'cooler_type', value: 'Air', groupKey: 'type' },
                { key: 'height_mm', value: '165', unit: 'mm', groupKey: 'physical' },
                { key: 'tdp_rating_w', value: '250', unit: 'W', groupKey: 'performance' },
            ],
        },
        // ── Monitor ───────────────────────────────────────────────────
        {
            sku: 'LG-27GP850B',
            slug: 'lg-27gp850b-b-ultragear-gaming-monitor',
            name: 'LG 27GP850-B UltraGear Gaming Monitor',
            model: '27GP850-B',
            shortDescription: '27" · QHD 2560×1440 · 165Hz · 1ms GtG · IPS · G-Sync Compatible',
            description: 'LG UltraGear 27-inch QHD IPS gaming monitor. High refresh rate, G-Sync Compatible, HDR10.',
            brandId: lg.id,
            componentType: generated_1.ComponentType.MONITOR,
            categoryId: monitorCat.id,
            stock: 35,
            spec: {
                screenSizeInch: 27, resolutionW: 2560, resolutionH: 1440,
                panelType: 'IPS', refreshRateHz: 165, responseTimeMs: 1,
                brightness: 400, contrastRatio: '1000:1',
                colorGamutPercent: { sRGB: 99, DCI_P3: 95 },
                hdrSupport: 'HDR10',
                adaptiveSyncType: 'G-Sync Compatible',
                ports: [
                    { type: 'HDMI 2.0', count: 2 },
                    { type: 'DisplayPort 1.4', count: 1 },
                    { type: 'USB 3.0 Hub', count: 2 },
                ],
                hasBuiltinSpeakers: false, hasUsbHub: true,
                vesa: '100x100', aspectRatio: '16:9',
            },
            powerW: { idle: 5, typical: 35, peak: 55 },
            dims: { length: 614, width: 205, height: 460, weightG: 4900 },
            eav: [
                { key: 'screen_size_inch', value: '27', unit: 'inch', groupKey: 'display' },
                { key: 'refresh_rate_hz', value: '165', unit: 'Hz', groupKey: 'display' },
                { key: 'panel_type', value: 'IPS', groupKey: 'display' },
                { key: 'resolution', value: '2560x1440', groupKey: 'display' },
            ],
        },
    ];
    let productCount = 0;
    for (const p of products) {
        // Upsert base product
        const product = await prisma.product.upsert({
            where: { sku: p.sku },
            update: {},
            create: {
                sku: p.sku,
                slug: p.slug,
                name: p.name,
                model: p.model,
                shortDescription: p.shortDescription,
                description: p.description,
                brandId: p.brandId,
                componentType: p.componentType,
                isActive: true,
                tags: [p.componentType.toLowerCase()],
            },
        });
        // Product → Category (primary)
        await prisma.productCategory.upsert({
            where: { productId_categoryId: { productId: product.id, categoryId: p.categoryId } },
            update: {},
            create: { productId: product.id, categoryId: p.categoryId, isPrimary: true },
        });
        // Normalized spec tables
        if (p.componentType === generated_1.ComponentType.CPU && 'socketType' in p.spec) {
            await prisma.cpuSpec.upsert({
                where: { productId: product.id },
                update: {},
                create: { productId: product.id, ...p.spec },
            });
        }
        else if (p.componentType === generated_1.ComponentType.GPU) {
            await prisma.gpuSpec.upsert({
                where: { productId: product.id },
                update: {},
                create: { productId: product.id, ...p.spec },
            });
        }
        else if (p.componentType === generated_1.ComponentType.MOTHERBOARD) {
            await prisma.motherboardSpec.upsert({
                where: { productId: product.id },
                update: {},
                create: { productId: product.id, ...p.spec },
            });
        }
        else if (p.componentType === generated_1.ComponentType.RAM) {
            await prisma.ramSpec.upsert({
                where: { productId: product.id },
                update: {},
                create: { productId: product.id, ...p.spec },
            });
        }
        else if (p.componentType === generated_1.ComponentType.STORAGE) {
            await prisma.storageSpec.upsert({
                where: { productId: product.id },
                update: {},
                create: { productId: product.id, ...p.spec },
            });
        }
        else if (p.componentType === generated_1.ComponentType.PSU) {
            await prisma.psuSpec.upsert({
                where: { productId: product.id },
                update: {},
                create: { productId: product.id, ...p.spec },
            });
        }
        else if (p.componentType === generated_1.ComponentType.CASE) {
            await prisma.caseSpec.upsert({
                where: { productId: product.id },
                update: {},
                create: { productId: product.id, ...p.spec },
            });
        }
        else if (p.componentType === generated_1.ComponentType.COOLER) {
            await prisma.coolerSpec.upsert({
                where: { productId: product.id },
                update: {},
                create: { productId: product.id, ...p.spec },
            });
        }
        else if (p.componentType === generated_1.ComponentType.MONITOR) {
            await prisma.monitorSpec.upsert({
                where: { productId: product.id },
                update: {},
                create: { productId: product.id, ...p.spec },
            });
        }
        // Power requirement
        if (p.powerW) {
            await prisma.powerRequirement.upsert({
                where: { productId: product.id },
                update: {},
                create: {
                    productId: product.id,
                    idleW: p.powerW.idle,
                    typicalW: p.powerW.typical,
                    peakW: p.powerW.peak,
                    sourceNotes: '[DEMO] Estimated values for seed data',
                },
            });
        }
        // Physical dimensions
        if (p.dims) {
            const d = p.dims;
            await prisma.physicalDimension.upsert({
                where: { productId: product.id },
                update: {},
                create: {
                    productId: product.id,
                    lengthMm: d.length,
                    widthMm: d.width,
                    heightMm: d.height,
                    weightG: d.weightG,
                },
            });
        }
        // EAV spec rows
        if (p.eav) {
            for (const spec of p.eav) {
                await prisma.productSpecification.upsert({
                    where: { productId_key: { productId: product.id, key: spec.key } },
                    update: {},
                    create: {
                        productId: product.id,
                        key: spec.key,
                        value: spec.value,
                        unit: spec.unit,
                        groupKey: spec.groupKey,
                    },
                });
            }
        }
        // Inventory (Platform supplier)
        await prisma.inventory.upsert({
            where: {
                productId_variantId_supplierId: {
                    productId: product.id,
                    variantId: null,
                    supplierId: supplier.id,
                },
            },
            update: {},
            create: {
                productId: product.id,
                supplierId: supplier.id,
                quantity: p.stock ?? 10,
                lowStockThreshold: 3,
            },
        });
        // [DEMO] Price — clearly marked as demo data
        const demoAmount = DEMO_PRICES[p.sku] ?? 9999;
        await prisma.price.upsert({
            where: {
                productId_variantId_priceType_currency: {
                    productId: product.id,
                    variantId: null,
                    priceType: generated_1.PriceType.RETAIL,
                    currency: 'INR',
                },
            },
            update: {},
            create: {
                productId: product.id,
                priceType: generated_1.PriceType.RETAIL,
                amount: demoAmount,
                currency: 'INR',
            },
        });
        // Price history entry
        await prisma.priceHistory.create({
            data: {
                productId: product.id,
                priceType: generated_1.PriceType.RETAIL,
                amount: demoAmount,
                currency: 'INR',
                changedBy: 'system',
                reason: '[DEMO] Initial seed price — not real market pricing',
            },
        });
        productCount++;
    }
    console.log(`  ✔  Products: ${productCount} seeded (with specs, inventory, [DEMO] prices)`);
}
//# sourceMappingURL=07-products.js.map