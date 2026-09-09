# Product Catalog API Reference

> **Base path:** `/` (all routes documented relative to API root)
> **Authentication:** Annotated per endpoint — public endpoints require no token; admin endpoints require `Authorization: Bearer <access-token>`.
> **Response envelope:** Every response is wrapped in a consistent JSON envelope (see [Response Format](#response-format)).

---

## Table of Contents

1. [Response Format](#response-format)
2. [Products](#products)
3. [Product Variants](#product-variants)
4. [Product Images](#product-images)
5. [Product Specifications](#product-specifications)
6. [Categories](#categories)
7. [Brands](#brands)
8. [Filter Parameters Reference](#filter-parameters-reference)
9. [Architecture Notes](#architecture-notes)

---

## Response Format

All successful responses follow a consistent envelope:

```json
// Single resource
{
  "success": true,
  "data": {},
  "timestamp": "2026-09-09T08:00:00.000Z"
}

// Paginated list
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}

// Error
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": ["name should not be empty"],
  "path": "/products"
}
```

---

## Products

### GET /products

List, search, and filter products.

**Access:** Public

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page 1-100 (default: 20) |
| sortBy | enum | newest, price_asc, price_desc, name_asc, name_desc, featured |
| search | string | Full-text across name, description, SKU, brand, tags |
| componentType | string | CPU, GPU, MOTHERBOARD, RAM, STORAGE, PSU, CASE, COOLER, MONITOR |
| brandId | UUID | Filter by brand UUID |
| brandSlug | string | Filter by brand slug |
| categoryId | UUID | Filter by category UUID |
| categorySlug | string | Filter by category slug |
| minPrice | number | Minimum retail price |
| maxPrice | number | Maximum retail price |
| inStock | boolean | Only in-stock items |
| isFeatured | boolean | Only featured items |

Plus hardware-specific filters — see Filter Parameters Reference.

### GET /products/:id

Get single product by UUID. Returns 404 if not found.

### GET /products/slug/:slug

Get single product by URL slug. Returns 404 if not found.

### GET /products/compare

Compare 2-5 products side-by-side with spec difference detection.

**Query:** `ids=uuid1,uuid2,uuid3`

**Errors:** 400 if fewer than 2 or more than 5 IDs; 404 if any ID not found.

### POST /products

Create a product (draft by default).

**Access:** admin, staff, editor

Required: `name`, `description`, `componentType`, `brandId`, `basePrice`

### PATCH /products/:id

Update product metadata, price, categories.

**Access:** admin, staff, editor

### PATCH /products/:id/publish

Publish draft to live catalog. Returns 400 if product has no active price.

**Access:** admin, staff, editor

### PATCH /products/:id/archive

Deactivate a product from catalog.

**Access:** admin, staff, editor

### DELETE /products/:id

Soft-delete (sets deletedAt). Data preserved for order history.

**Access:** admin, staff

---

## Product Variants

### POST /products/:id/variants

Required: `name`, `sku`

### PATCH /products/:id/variants/:variantId

Update variant fields.

### DELETE /products/:id/variants/:variantId

Soft-removes variant (isActive = false).

---

## Product Images

### POST /products/:id/images

Required: `url`. Set `isPrimary: true` to promote and demote all others.

### DELETE /products/:id/images/:imageId

Permanently removes image record.

### PATCH /products/:id/images/:imageId/primary

Promotes image to primary; demotes all others automatically.

---

## Product Specifications

### PUT /products/:id/specifications/:componentType

Upserts structured specification data.

**componentType:** CPU, GPU, MOTHERBOARD, RAM, STORAGE, PSU, CASE, COOLER, FAN, MONITOR

#### CPU Fields
socketType*, architecture, processTech, cores*, threads*, baseClockMhz*, boostClockMhz, l2CacheMb, l3CacheMb, tdpW*, maxTdpW, memoryType*, maxMemoryGb*, maxMemorySpeedMhz, memoryChannels, pcieGen, pcieLanes, hasIgpu, igpuModel, coolerIncluded

#### GPU Fields
chipset*, gpuArchitecture, processTech, vramGb*, vramType*, vramBusBit*, baseClockMhz, boostClockMhz, tdpW*, recommendedPsuW, powerConnectors*, pcieSlot, pcieGen, slotWidth, lengthMm*, widthMm, heightMm, displayports, hdmiPorts, hdmiVersion, dpVersion, hasRaytracing, hasDlss, hasFsr

#### MOTHERBOARD Fields
socketType*, chipset*, formFactor*, supportedMemTypes*, ramSlots*, maxRamGb*, maxRamSpeedMhz, pcieX16Slots, m2Slots, sataSlots, hasWifi, wifiStandard, hasBluetooth, biosFlashback

#### RAM Fields
memType*, totalCapacityGb*, stickCount*, capacityPerStickGb*, speedMhz*, casLatency, timing, voltageV, formFactor, hasHeatspreader, hasRgb

#### STORAGE Fields
storageType*, capacityGb*, interface*, formFactor*, nandType, seqReadMbps, seqWriteMbps, tbw, dramCache

#### PSU Fields
wattage*, efficiencyRating*, modular*, formFactor, atx12vVersion, hasAtx3Connector, warrantyYears

#### CASE Fields
caseType*, supportedFormFactors*, maxMbFormFactor*, maxGpuLengthMm*, maxCpuCoolerHeightMm*, maxPsuLengthMm, hasFrontUsbc, hasGlassPanel, hasRgb

(*) = required

---

## Categories

### GET /categories — flat list with product counts
### GET /categories/tree — hierarchical tree with nested children
### GET /categories/:id — by UUID
### GET /categories/slug/:slug — by slug
### POST /categories — create (admin/staff/editor)
### PATCH /categories/:id — update (admin/staff/editor)
### DELETE /categories/:id — delete (admin/staff)

---

## Brands

### GET /brands — paginated with product counts (page, limit, search, isActive)
### GET /brands/:id — by UUID
### GET /brands/slug/:slug — by slug
### POST /brands — create (admin/staff/editor)
### PATCH /brands/:id — update (admin/staff/editor)
### DELETE /brands/:id — delete (admin/staff)

---

## Filter Parameters Reference

### CPU Filters

| Parameter | Type | Description |
|---|---|---|
| cpuSocket | string | Socket type — AM5, LGA1700 (exact, case-insensitive) |
| minCores | integer | Minimum core count |
| maxCores | integer | Maximum core count |
| minThreads | integer | Minimum thread count |
| maxThreads | integer | Maximum thread count |
| minBaseClockMhz | integer | Minimum base clock MHz |
| maxBaseClockMhz | integer | Maximum base clock MHz |
| minBoostClockMhz | integer | Minimum boost clock MHz |
| maxBoostClockMhz | integer | Maximum boost clock MHz |

### GPU Filters

| Parameter | Type | Description |
|---|---|---|
| gpuChipset | string | Chipset substring — AD103, RTX 4080 |
| minVramGb | integer | Minimum VRAM GB |
| maxVramGb | integer | Maximum VRAM GB |
| maxGpuLengthMm | integer | Maximum card length mm |
| maxTdpW | integer | Maximum TDP Watts |
| gpuManufacturer | string | Board partner — ASUS, MSI, Gigabyte |

### Motherboard Filters

| Parameter | Type | Description |
|---|---|---|
| mbSocket | string | Socket type — AM5, LGA1700 |
| mbChipset | string | Chipset substring — B650, X670E, Z790 |
| mbRamType | string | Supported DDR gen — DDR4, DDR5 |
| minRamSlots | integer | Minimum RAM slot count |
| mbFormFactor | string | Form factor — ATX, mATX, Mini-ITX |

### RAM Filters

| Parameter | Type | Description |
|---|---|---|
| ramMemType | string | DDR generation — DDR4, DDR5 |
| ramCapacityGb | integer | Total kit capacity GB (exact) |
| minRamSpeedMhz | integer | Minimum rated speed MHz |
| ramStickCount | integer | Module count in kit (exact) |

### Storage Filters

| Parameter | Type | Description |
|---|---|---|
| storageInterface | string | Interface substring — PCIe 4.0 x4, SATA III |
| storageCapacityGb | integer | Capacity GB (exact) |
| storageFormFactor | string | Form factor substring — M.2, 2.5", 3.5" |

### PSU Filters

| Parameter | Type | Description |
|---|---|---|
| minWattage | integer | Minimum rated wattage |
| maxWattage | integer | Maximum rated wattage |
| psuEfficiency | string | Tier substring — Gold, Platinum, Titanium |
| psuModularity | string | Modularity type — Full, Semi, Non-modular |

### Case Filters

| Parameter | Type | Description |
|---|---|---|
| caseMbFormFactor | string | Required motherboard support — ATX, E-ATX, mATX |
| minSupportedGpuLengthMm | integer | Minimum GPU clearance mm the case must provide |
| minSupportedCoolerHeightMm | integer | Minimum CPU cooler height clearance mm |
| hasRadiatorSupport | boolean | Must support radiator/AIO |

---

## Architecture Notes

### Caching

In-memory tagged cache (swappable with Redis). All product mutations invalidate the `catalog:products` tag.

| Cache Key | TTL |
|---|---|
| catalog:products:list:* | 60 s |
| catalog:products:id:* | 120 s |
| catalog:categories:tree | 300 s |
| catalog:brands:list:* | 180 s |

### Specification Storage

Each component type has a dedicated normalized table (CpuSpec, GpuSpec, MotherboardSpec, etc.) with typed numeric columns. This enables indexed range queries (`WHERE cpuSpec.cores >= 8`) and accurate comparison diffs instead of freeform string matching.

### Price Architecture

A product has multiple Price records (RETAIL, SALE, WHOLESALE). The catalog surfaces the active RETAIL price. `discountPercent` is computed at read time from `compareAt` and `amount`.

### Soft Delete

Products use soft delete (`deletedAt`). All queries filter `WHERE deletedAt IS NULL`. Deleted products are preserved for order history referential integrity.
