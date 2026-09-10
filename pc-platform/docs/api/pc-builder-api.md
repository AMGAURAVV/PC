# PC Builder Backend API Reference

> **Base URL:** `/api/v1`
> **Authentication:** Requires `Authorization: Bearer <access-token>` header unless marked with **🔓 Public**.
> **Response Envelope:** All responses follow the standard platform response format `{ success: true, data: T, timestamp: string }` or paginated response format with `meta`.
> **Source of Truth:** All authoritative compatibility checks are performed server-side by calling the microservice compatibility engine. Frontend may provide optimistic UI hints, but the backend is the sole source of truth.

---

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Calculations & Scores](#calculations--scores)
3. [Build Lifecycle Endpoints](#build-lifecycle-endpoints)
   - [POST /builds](#post-builds) — Create Build
   - [GET /builds](#get-builds) — List User Builds
   - [GET /builds/:id](#get-buildsid) — Get Build Details
   - [PATCH /builds/:id](#patch-buildsid) — Update Build Metadata
   - [DELETE /builds/:id](#delete-buildsid) — Delete Build
   - [POST /builds/:id/duplicate](#post-buildsidduplicate) — Duplicate Build
4. [Component Item Operations](#component-item-operations)
   - [POST /builds/:id/items](#post-buildsiditems) — Add Component
   - [DELETE /builds/:id/items/:itemId](#delete-buildsiditemsitemid) — Remove Component
   - [PUT /builds/:id/items/:itemId](#put-buildsiditemsitemid) — Replace Component
   - [PATCH /builds/:id/items/order](#patch-buildsiditemsorder) — Reorder Components
5. [Immutable Versioning](#immutable-versioning)
   - [POST /builds/:id/save](#post-buildsidsave) — Save Milestone Snapshot
   - [GET /builds/:id/versions](#get-buildsidversions) — List Version History
   - [GET /builds/:id/versions/:versionNumber](#get-buildsidversionsversionnumber) — Get Specific Version
6. [Compatibility & Validation](#compatibility--validation)
   - [POST /builds/:id/check](#post-buildsidcheck) — On-demand Compatibility Check
7. [Publishing & Sharing](#publishing--sharing)
   - [POST /builds/:id/share](#post-buildsidshare) — Publish & Share Build
   - [POST /builds/:id/unpublish](#post-buildsidunpublish) — Unpublish Build
   - [GET /shared-builds/:slug](#get-shared-buildsslug) — Retrieve Public Shared Build (🔓 Public)

---

## Architectural Overview

```
                          ┌───────────────────────────┐
                          │   Frontend / Client UI    │
                          │   (Non-authoritative)     │
                          └─────────────┬─────────────┘
                                        │ REST API (Bearer JWT)
                                        ▼
                          ┌───────────────────────────┐
                          │         apps/api          │
                          │      (BuildsService)      │
                          └──────┬─────────────┬──────┘
                                 │             │
                Prisma / Postgres│             │ HTTP POST /check
                                 ▼             ▼
                     ┌───────────────┐   ┌──────────────────────────┐
                     │   Database    │   │   Compatibility Engine   │
                     │  - builds     │   │   (Logically Independent │
                     │  - build_items│   │    Microservice on :4001)│
                     │  - build_vers │   │  - 22 validation rules   │
                     │  - shared_link│   │  - Spec normalizer       │
                     └───────────────┘   └──────────────────────────┘
```

- **Independent Compatibility Service**: Evaluates 22 hardware compatibility rules (CPU socket, RAM speeds/slots, cooler clearance, PSU wattage & 12VHPWR connectors, M.2 keys, PCIe dimensions, etc.).
- **Automatic Versioning**: Whenever a user saves a build milestone via `POST /builds/:id/save`, an immutable record in `BuildVersion` stores the full configuration snapshot, component prices, power calculations, and compatibility status.
- **Dynamic Price Recomputation**: `totalPriceCache` is denormalized and recomputed whenever items are added, removed, or replaced.

---

## Calculations & Scores

Every build retrieval or update dynamically computes:

| Calculation | Logic / Formula |
| :--- | :--- |
| **Total Price** | $\sum (\text{Active Unit Price or Price Snapshot} \times \text{Quantity})$ in INR. |
| **Estimated System Power** | $50\text{W Base Platform} + \text{CPU TDP} + \text{GPU TDP} + \sum \text{RAM/Storage/Fan/Cooler wattage}$. |
| **Recommended PSU** | $\max(\lceil\text{Power} \times 1.30 / 50\rceil \times 50,\; \text{GPU Recommended PSU},\; 450\text{W})$. |
| **Compatibility Status** | `compatible` \| `incompatible` \| `warning` \| `unknown` returned by compatibility engine. |
| **Warnings & Issues** | Array of detailed issue items with `severity`, `category`, `title`, `explanation`, `affectedComponents`, and `suggestedResolution`. |
| **Performance Score** | Standardized 0–100 index derived from CPU architecture/cores/frequency and GPU compute/VRAM/TDP. |
| **Value Score** | Standardized 0–100 index derived from performance score per unit cost relative to market baseline. |

---

## Build Lifecycle Endpoints

### POST /builds

Create a new PC build. Automatically initializes Version 1 immutable snapshot.

- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "name": "White Aesthetic 1440p Rig",
  "description": "High refresh gaming and streaming build",
  "isPublic": false,
  "items": [
    {
      "productId": "8a3e7420-1b5e-4c3e-90e1-482487d2ef01",
      "quantity": 1,
      "notes": "Purchased on discount"
    }
  ]
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "b1f07420-1b5e-4c3e-90e1-482487d2ef01",
    "userId": "u1a07420-1b5e-4c3e-90e1-482487d2ef02",
    "name": "White Aesthetic 1440p Rig",
    "description": "High refresh gaming and streaming build",
    "status": "DRAFT",
    "isPublic": false,
    "items": [...],
    "calculations": {
      "totalPrice": 38999,
      "estimatedPowerW": 170,
      "recommendedPsuW": 450,
      "compatibilityStatus": "compatible",
      "warnings": [],
      "performanceScore": 45,
      "valueScore": 78
    },
    "shareUrl": null,
    "activeShareToken": null,
    "versionsCount": 1,
    "createdAt": "2026-09-09T04:30:00.000Z",
    "updatedAt": "2026-09-09T04:30:00.000Z"
  }
}
```

---

### GET /builds

List all builds owned by the authenticated user with pagination.

- **Auth:** Bearer Token
- **Query Parameters:** `page` (default 1), `limit` (default 10)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "b1f07420-1b5e-4c3e-90e1-482487d2ef01",
      "name": "White Aesthetic 1440p Rig",
      "status": "DRAFT",
      "isPublic": false,
      "calculations": {
        "totalPrice": 145000,
        "estimatedPowerW": 540,
        "recommendedPsuW": 750,
        "compatibilityStatus": "compatible"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### GET /builds/:id

Get complete build details including component specifications, calculations, and compatibility status.

- **Auth:** Bearer Token
- **Path Parameters:** `id` — Build UUID
- **Response (200 OK):** Returns full `BuildResponseDto`.

---

### PATCH /builds/:id

Update build metadata (name, description, visibility, status).

- **Auth:** Bearer Token
- **Path Parameters:** `id` — Build UUID
- **Request Body:**
```json
{
  "name": "Updated Rig Name",
  "description": "Updated description",
  "isPublic": true,
  "status": "COMPLETE"
}
```
- **Response (200 OK):** Returns updated `BuildResponseDto`.

---

### DELETE /builds/:id

Soft-delete a build (`deletedAt` timestamp recorded; preserved for order references).

- **Auth:** Bearer Token
- **Path Parameters:** `id` — Build UUID
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Build deleted successfully"
  }
}
```

---

### POST /builds/:id/duplicate

Clone an existing build and all its components. Creates a new build with `" (Copy)"` appended to the name and an initial Version 1 snapshot.

- **Auth:** Bearer Token
- **Path Parameters:** `id` — Build UUID to clone
- **Response (201 Created):** Returns cloned `BuildResponseDto`.

---

## Component Item Operations

### POST /builds/:id/items

Add a component product to the build. Auto-detects component category, captures current price snapshot, and recomputes total price and compatibility.

- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "productId": "8a3e7420-1b5e-4c3e-90e1-482487d2ef01",
  "productVariantId": "c2b07384-d113-4a44-93ff-183cf99f6421",
  "quantity": 1,
  "sortOrder": 0,
  "notes": "Corsair Dominator Titanium 32GB"
}
```
- **Response (200 OK):** Returns updated `BuildResponseDto`.

---

### DELETE /builds/:id/items/:itemId

Remove a component item from the build.

- **Auth:** Bearer Token
- **Path Parameters:**
  - `id`: Build UUID
  - `itemId`: Build item UUID
- **Response (200 OK):** Returns updated `BuildResponseDto`.

---

### PUT /builds/:id/items/:itemId

Replace an existing component with another product (e.g., swapping a graphics card or motherboard).

- **Auth:** Bearer Token
- **Path Parameters:**
  - `id`: Build UUID
  - `itemId`: Build item UUID
- **Request Body:**
```json
{
  "newProductId": "9b3e7420-1b5e-4c3e-90e1-482487d2ef02",
  "newProductVariantId": null,
  "quantity": 1,
  "notes": "Upgraded from RTX 4070 to RTX 4080 Super"
}
```
- **Response (200 OK):** Returns updated `BuildResponseDto`.

---

### PATCH /builds/:id/items/order

Reorder components in the build for custom display sequencing.

- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "items": [
    { "itemId": "item-uuid-cpu", "sortOrder": 0 },
    { "itemId": "item-uuid-cooler", "sortOrder": 1 },
    { "itemId": "item-uuid-motherboard", "sortOrder": 2 }
  ]
}
```
- **Response (200 OK):** Returns updated `BuildResponseDto`.

---

## Immutable Versioning

Every saved build has immutable historical snapshots stored in the `BuildVersion` table.

### POST /builds/:id/save

Create an immutable historical milestone snapshot of the current build state.

- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "label": "Stable 1440p Gaming Milsetone"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "v2f07420-1b5e-4c3e-90e1-482487d2ef01",
    "buildId": "b1f07420-1b5e-4c3e-90e1-482487d2ef01",
    "versionNumber": 2,
    "label": "Stable 1440p Gaming Milsetone",
    "snapshot": { ... },
    "createdBy": "u1a07420-1b5e-4c3e-90e1-482487d2ef02",
    "createdAt": "2026-09-09T04:35:00.000Z"
  }
}
```

---

### GET /builds/:id/versions

List all historical version snapshots for the build in descending order (`versionNumber`).

- **Auth:** Bearer Token
- **Response (200 OK):** Array of version summaries.

---

### GET /builds/:id/versions/:versionNumber

Retrieve a specific historical version snapshot by version number (e.g. `1`, `2`).

- **Auth:** Bearer Token
- **Response (200 OK):** Full snapshot payload of the build as it existed at that point in time.

---

## Compatibility & Validation

### POST /builds/:id/check

Executes a live hardware compatibility evaluation against the standalone compatibility engine.

- **Auth:** Bearer Token
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "compatible",
    "compatible": true,
    "issues": [],
    "warnings": [],
    "info": [],
    "summary": "Build is fully compatible. All checked hardware specifications match.",
    "telemetry": {
      "evaluatedRulesCount": 22,
      "passedRulesCount": 22,
      "failedRulesCount": 0,
      "warningRulesCount": 0,
      "unknownRulesCount": 0,
      "executionTimeMs": 2
    }
  }
}
```

If issues exist:
```json
{
  "status": "incompatible",
  "compatible": false,
  "issues": [
    {
      "severity": "error",
      "category": "PHYSICAL_CLEARANCE",
      "title": "GPU Exceeds Case Maximum Length",
      "explanation": "GPU length (340mm) exceeds case maximum GPU clearance (315mm).",
      "affectedComponents": ["gpu-uuid", "case-uuid"],
      "ruleId": "CASE_GPU_LENGTH",
      "suggestedResolution": "Choose a case with at least 340mm GPU clearance or select a more compact GPU model."
    }
  ]
}
```

---

## Publishing & Sharing

### POST /builds/:id/share

Publish the build and generate a shareable token and URL. Sets `isPublic = true` and generates a URL-safe token.

- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "label": "Shared on forum",
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "maxViews": 500
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "token": "4f9a8b1c7d2e0f3a",
    "build": { ... },
    "label": "Shared on forum",
    "viewCount": 0,
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "createdAt": "2026-09-09T04:40:00.000Z"
  }
}
```

---

### POST /builds/:id/unpublish

Unpublish the build. Deactivates all active share links and sets `isPublic = false`.

- **Auth:** Bearer Token
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Build has been unpublished. All shared links are now deactivated."
  }
}
```

---

### GET /shared-builds/:slug

**🔓 Public Endpoint** (No authentication required).

Retrieves a public or shared build using its unique token/slug. Increments the view counter and verifies expiration and view limit quotas.

- **Auth:** None (Public)
- **Path Parameters:** `slug` — Unique share token (e.g. `4f9a8b1c7d2e0f3a`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "4f9a8b1c7d2e0f3a",
    "build": {
      "id": "b1f07420-1b5e-4c3e-90e1-482487d2ef01",
      "name": "White Aesthetic 1440p Rig",
      "description": "High refresh gaming setup",
      "items": [...],
      "calculations": {
        "totalPrice": 160997,
        "estimatedPowerW": 490,
        "recommendedPsuW": 750,
        "compatibilityStatus": "compatible",
        "warnings": [],
        "performanceScore": 91,
        "valueScore": 84
      },
      "shareUrl": "https://pcplatform.com/b/4f9a8b1c7d2e0f3a"
    },
    "viewCount": 1,
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "createdAt": "2026-09-09T04:40:00.000Z"
  }
}
```
