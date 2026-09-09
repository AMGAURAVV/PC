# Product Catalog Backend Architecture & Specification

## 1. Overview
The PC Platform Catalog backend is engineered to handle complex e-commerce browsing, searching, and technical hardware filtering for custom PC components. It adheres to a clean layered architecture:

```
                  +----------------------------------------------+
                  |         HTTP Request (REST / OpenAPI)         |
                  +----------------------------------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |              ProductsController              |
                  |  - Swagger / OpenAPI documentation           |
                  |  - Role-based authorization                  |
                  |  - ValidationPipe (whitelist & transforms)   |
                  +----------------------------------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |               ProductsService                |
                  |  - Price resolution & discount calculations  |
                  |  - Stock aggregation & status determination  |
                  |  - Comparison matrix engine                  |
                  |  - CacheService TTL read / invalidation      |
                  +----------------------------------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |              ProductsRepository              |
                  |  - Dynamic multi-table Prisma queries        |
                  |  - Hardware spec relational filtering        |
                  |  - Full-text search & sorting expressions    |
                  +----------------------------------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |           PostgreSQL Database                |
                  |  - Normalized spec tables (cpu_specs, etc.)  |
                  |  - Indexed B-tree & Foreign Keys             |
                  +----------------------------------------------+
```

---

## 2. Normalized Data Model vs Generic Strings

Arbitrary JSON or string representations of hardware specifications fail when performing range-based filters, type compatibility validations, or sorting (e.g. `cores >= 8`, `lengthMm <= 320`, `wattage >= 850`).

The catalog uses **dedicated normalized tables** for every hardware category:
- [`CpuSpec`](file:///d:/project/pc-platform/packages/database/prisma/schema.prisma): `socketType`, `cores`, `threads`, `baseClockMhz`, `boostClockMhz`, `l2CacheMb`, `l3CacheMb`, `tdpW`, `memoryType`, `maxMemoryGb`, `hasIgpu`
- [`GpuSpec`](file:///d:/project/pc-platform/packages/database/prisma/schema.prisma): `chipset`, `gpuArchitecture`, `vramGb`, `vramType`, `vramBusBit`, `baseClockMhz`, `boostClockMhz`, `tdpW`, `recommendedPsuW`, `powerConnectors`, `lengthMm`, `slotWidth`
- [`MotherboardSpec`](file:///d:/project/pc-platform/packages/database/prisma/schema.prisma): `socketType`, `chipset`, `formFactor`, `supportedMemTypes`, `ramSlots`, `maxRamGb`, `pcieX16Slots`, `m2Slots`, `hasWifi`
- [`RamSpec`](file:///d:/project/pc-platform/packages/database/prisma/schema.prisma): `memType`, `totalCapacityGb`, `stickCount`, `capacityPerStickGb`, `speedMhz`, `casLatency`, `timing`, `voltageV`
- [`StorageSpec`](file:///d:/project/pc-platform/packages/database/prisma/schema.prisma): `storageType`, `capacityGb`, `interface`, `formFactor`, `seqReadMbps`, `seqWriteMbps`, `tbw`, `dramCache`
- [`PsuSpec`](file:///d:/project/pc-platform/packages/database/prisma/schema.prisma): `wattage`, `efficiencyRating`, `modular`, `formFactor`, `hasAtx3Connector`, `warrantyYears`
- [`CaseSpec`](file:///d:/project/pc-platform/packages/database/prisma/schema.prisma): `caseType`, `supportedFormFactors`, `maxMbFormFactor`, `maxGpuLengthMm`, `maxCpuCoolerHeightMm`, `radiatorSupport`, `hasFrontUsbc`
- [`CoolerSpec`](file:///d:/project/pc-platform/packages/database/prisma/schema.prisma): `coolerType`, `supportedSockets`, `tdpRatingW`, `radiatorSizeMm`, `fanSizeMm`

---

## 3. Query & Filtering Architecture

All queries pass through [`ProductFilterDto`](file:///d:/project/pc-platform/apps/api/src/products/dto/product-filter.dto.ts). Dynamic SQL conditions are synthesized in [`ProductsRepository`](file:///d:/project/pc-platform/apps/api/src/products/products.repository.ts):

### Supported Hardware Filters:
1. **CPU**:
   - `cpuSocket`: Matches CPU socket (e.g. `AM5`, `LGA1700`).
   - `minCores` & `maxCores`: Relational range check on `cpuSpec.cores`.
   - `minThreads` & `maxThreads`: Relational range check on `cpuSpec.threads`.
   - `minBaseClockMhz` & `maxBaseClockMhz`: Relational range check on `cpuSpec.baseClockMhz`.
   - `minBoostClockMhz` & `maxBoostClockMhz`: Relational range check on `cpuSpec.boostClockMhz`.
2. **GPU**:
   - `gpuChipset`: Case-insensitive substring match on `gpuSpec.chipset`.
   - `minVramGb` & `maxVramGb`: Relational range check on `gpuSpec.vramGb`.
   - `maxGpuLengthMm`: Physical clearance filter (`gpuSpec.lengthMm <= maxGpuLengthMm`).
   - `maxTdpW`: Power envelope filter (`gpuSpec.tdpW <= maxTdpW`).
   - `gpuManufacturer`: Case-insensitive brand lookup.
3. **Motherboard**:
   - `mbSocket`: Matches motherboard socket.
   - `mbChipset`: Case-insensitive substring match on `motherboardSpec.chipset`.
   - `mbRamType`: Array containment check on `motherboardSpec.supportedMemTypes`.
   - `minRamSlots`: Number of RAM slots available.
   - `mbFormFactor`: Matches form factor (`ATX`, `mATX`, `Mini-ITX`).
4. **RAM**:
   - `ramMemType`: Generation check (`DDR4`, `DDR5`).
   - `ramCapacityGb`: Total memory kit capacity.
   - `minRamSpeedMhz`: Memory transfer rate.
   - `ramStickCount`: Number of modules in kit (e.g. `2`).
5. **Storage**:
   - `storageInterface`: Interface standard (e.g. `PCIe 4.0 x4`, `SATA III`).
   - `storageCapacityGb`: Drive capacity.
   - `storageFormFactor`: Form factor (`M.2 2280`, `2.5"`).
6. **PSU**:
   - `minWattage` & `maxWattage`: Continuous wattage capacity.
   - `psuEfficiency`: Certification (`80+ Gold`, `80+ Platinum`).
   - `psuModularity`: Cabling modularity (`Full`, `Semi`, `Non-modular`).
7. **Case**:
   - `caseMbFormFactor`: Array containment in `caseSpec.supportedFormFactors`.
   - `minSupportedGpuLengthMm`: Ensures case can fit GPUs (`caseSpec.maxGpuLengthMm >= filter`).
   - `minSupportedCoolerHeightMm`: Ensures case can fit coolers (`caseSpec.maxCpuCoolerHeightMm >= filter`).
   - `hasRadiatorSupport`: Liquid cooling radiator support validation.

---

## 4. Price & Inventory Computation Engine

### Active Retail Price Resolution
Products can have multiple prices in `prices` table (retail, sale, wholesale, scheduled). The active retail price is resolved by:
1. Selecting rows where `priceType = 'RETAIL'` and `isActive = true`.
2. Verifying temporal validity (`startsAt <= now` and `endsAt >= now` or null).
3. If `compareAt > amount`, computing percentage savings: `round(((compareAt - amount) / compareAt) * 100)`.
4. Computing variant price bounds (`minPrice`, `maxPrice`) across all active variants.

### Inventory Availability Aggregation
1. `totalQuantity = SUM(inventory.quantity)` across all warehouses and suppliers.
2. `reservedQuantity = SUM(inventory.reservedQty)`.
3. `availableQuantity = MAX(0, totalQuantity - reservedQuantity)`.
4. `stockStatus`:
   - `OUT_OF_STOCK`: `availableQuantity === 0`
   - `LOW_STOCK`: `0 < availableQuantity <= 5`
   - `IN_STOCK`: `availableQuantity > 5`

---

## 5. Product Comparison Engine

The comparison endpoint (`GET /api/v1/products/compare?ids=id1,id2,...`) delivers side-by-side matrices:
- **Input Validation**: Accepts 2 to 5 product IDs.
- **Spec Extraction**: Flattens normalized specifications across all products.
- **Difference Highlighting**: Identifies every key where values differ (`differenceKeys`).
- **Compatibility Flag**: Computes `isSameComponentType` to warn users if comparing mismatched hardware (e.g. CPU vs GPU).

---

## 6. Caching Architecture

Catalog read operations have high read-to-write ratios. The system uses a tag-invalidatable caching layer [`CacheService`](file:///d:/project/pc-platform/apps/api/src/common/cache/cache.service.ts):
- **Catalog List**: `catalog:products:list:<hash>` (TTL: 60s)
- **Product Details**: `catalog:products:id:<id>` and `catalog:products:slug:<slug>` (TTL: 120s)
- **Category Tree**: `catalog:categories:tree` (TTL: 300s)
- **Brand List**: `catalog:brands:list:<hash>` (TTL: 180s)
- **Invalidation Strategy**: Any product creation, update, publish, archive, deletion, variant update, or image upload triggers `cacheService.invalidateByTag('catalog:products')`, ensuring stale cache is purged immediately.
