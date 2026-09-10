# Testing Strategy & QA Manual

This document provides a comprehensive testing guide and architecture reference for the **NexusPC Platform**, covering **Unit Tests**, **Integration Tests**, **End-to-End (E2E) Tests via Playwright**, **Test Fixtures**, and our strict **Mock Payment Isolation Policy**.

---

## 1. Testing Architecture & Test Pyramid

Our testing pyramid ensures maximum reliability, high regression defense, fast developer feedback loops, and zero production side-effects:

```
                  ▲
                 / \
                /   \     E2E Tests (Playwright)
               / E2E \    Cross-browser user journeys (Chrome, Firefox, Safari, Mobile)
              /-------\
             /  Integ  \  Integration Tests (Supertest / NestJS)
            /   Tests   \ HTTP Controllers, DTO Validation, Transactional DB
           /-------------\
          /  Unit Tests   \ Unit Tests (Jest / ts-jest)
         /_________________\ Pure algorithms, calculations, scorers, Zod schemas
```

---

## 2. Test Suites Summary

| Layer | Subsystem / Feature | Location | Key Capabilities Tested |
|---|---|---|---|
| **Unit** | **Compatibility Engine** | `services/compatibility-engine/test/compatibility-engine.spec.ts` | CPU socket, RAM DDR generation, motherboard form factor, GPU length clearance, PSU wattage headroom, cooler height. |
| **Unit** | **Price Calculation** | `apps/api/src/prices/prices.service.spec.ts` | Real-time price resolution, tiered bulk pricing, discount rules, cache invalidation. |
| **Unit** | **Cart Calculations** | `apps/api/src/cart/cart.service.spec.ts` | Line item unit prices, quantity multipliers, total price in paise/rupees, live stock constraints, build bundling, clear cart. |
| **Unit** | **Recommendation Scoring** | `services/recommendation-engine/src/scoring/scoring.spec.ts` | Performance, price-efficiency, power efficiency, upgradeability, hardware compatibility, availability, and user preferences. |
| **Unit** | **Validation Schemas** | `packages/validation/src/index.spec.ts` | Shared Zod schemas: register, login, create/update product, build items, order status, address with 6-digit PIN. |
| **Unit** | **Authorization & Security** | `apps/api/src/common/guards/roles.guard.spec.ts`, `security-remediation.spec.ts` | Role-based access control, privilege escalation defense, IDOR protections, path traversal defense. |
| **Integration** | **Auth API** | `apps/api/src/auth/auth.integration.spec.ts` | Registration, login, JWT token rotation, refresh token reuse detection, password hashing, audit logs. |
| **Integration** | **Products API** | `apps/api/src/products/products.integration.spec.ts` | Catalog CRUD, full-text search, category & brand filtering, price sorting, pagination. |
| **Integration** | **Builds API** | `apps/api/src/builds/builds.integration.spec.ts` | Build creation, real-time `/builds/evaluate` compatibility API, adding items to slots, cloning, shareable links, IDOR prevention. |
| **Integration** | **Cart API** | `apps/api/src/cart/cart.integration.spec.ts` | Active cart retrieval, item insertion, quantity updates, build bundling (`/cart/bundle/:buildId`), item deletion, clear cart. |
| **Integration** | **Orders & Checkout API** | `apps/api/src/orders/orders.integration.spec.ts` | Checkout calculation preview, 7-step order placement, atomic inventory reservation, coupon application, mock payment intent generation. |
| **Integration** | **Compatibility API** | `services/compatibility-engine/test/compatibility.controller.spec.ts` | Isolated microservice `POST /check` contract, rule violation error codes, compatible/incompatible payloads. |
| **E2E** | **Auth User Journey** | `tests/e2e/auth.spec.ts` | User registration flow, email/password validation, session login, redirect to account dashboard. |
| **E2E** | **Catalog Browsing** | `tests/e2e/products.spec.ts` | Product catalog grid, search queries, brand filters, live price display. |
| **E2E** | **PC Builder & Compatibility** | `tests/e2e/builder.spec.ts` | Custom build creation, hardware slot configuration, **real-time compatibility warning receipt**, saving build, sharing link, adding entire build to cart. |
| **E2E** | **Cart & Checkout** | `tests/e2e/checkout.spec.ts` | Cart calculation verification (subtotal, GST 18%, total), 3-step checkout form, mock payment method execution, order confirmation screen. |

---

## 3. Strict Mock Payment Isolation Policy

> [!CAUTION]
> **Zero Real Payment Systems in Test Environments**
> All payment interactions in test environments are strictly mocked. Under no circumstances are live API credentials (e.g., Razorpay live keys, Stripe live keys) permitted in automated test suites.

### How Mock Payments are Enforced:
1. **API Integration Tests (`orders.integration.spec.ts`)**:
   - `PaymentsService` uses `MOCK_SANDBOX_GATEWAY` returning simulated `PaymentIntentResponse` (`isSandbox: true`).
   - No external HTTP requests are made to banking or gateway servers.
2. **Playwright E2E Tests (`tests/fixtures/test-fixtures.ts`)**:
   - The test fixture automatically hooks `page.route` on all test pages.
   - Any network requests matching `/(razorpay|stripe|paypal|cashfree)\.com/` are intercepted and fulfilled with mock client-side SDK objects.
   - Internal routes `/api/v1/payments/**` and `/api/v1/orders/checkout` are intercepted to return deterministic mock order numbers (`PCP-2026-MOCK-XXXX`) and confirmed payment states.

---

## 4. Test Fixtures Reference

Test fixtures are centralized in `tests/fixtures/test-fixtures.ts`:

- **User Accounts**:
  - `TEST_USERS.customer`: Default registered customer (`test.customer@nexuspc.in`).
  - `TEST_USERS.admin`: Default system administrator (`admin.lead@nexuspc.in`).
- **Hardware Components**:
  - `TEST_COMPONENTS.cpu`: AMD Ryzen 7 7800X3D (AM5 socket).
  - `TEST_COMPONENTS.motherboard`: MSI MAG B650 TOMAHAWK WIFI (AM5 socket, DDR5).
  - `TEST_COMPONENTS.incompatibleMotherboard`: ASUS ROG MAXIMUS Z790 HERO (LGA1700 socket). Used to verify compatibility conflict alerts.
  - `TEST_COMPONENTS.gpu`: NVIDIA GeForce RTX 4080 Super (320W TDP).
  - `TEST_COMPONENTS.underpoweredPsu`: Corsair CV450 450W PSU. Used to verify electrical power deficit warnings.
- **Address Data**:
  - `TEST_SHIPPING_ADDRESS`: Standard shipping address with 6-digit Indian PIN code.

---

## 5. Command Reference

### Running All Tests
To run all unit and integration test suites across the entire monorepo:
```bash
pnpm test
```

### Running Unit Tests by Package

#### 1. Validation Schemas (Zod)
```bash
pnpm --filter @pc-platform/validation test
```

#### 2. Compatibility Engine (Rule Algorithms)
```bash
pnpm --filter @pc-platform/compatibility-engine test
```

#### 3. Recommendation Scoring Engine
```bash
pnpm --filter @pc-platform/recommendation-engine test
```

#### 4. Cart Calculations & Line Items
```bash
pnpm --filter @pc-platform/api test -- apps/api/src/cart/cart.service.spec.ts
```

#### 5. Price Calculations
```bash
pnpm --filter @pc-platform/api test -- apps/api/src/prices/prices.service.spec.ts
```

#### 6. Authorization & Guards
```bash
pnpm --filter @pc-platform/api test -- apps/api/src/common/guards/roles.guard.spec.ts
```

---

### Running Integration Tests

#### 1. Builds Lifecycle & Compatibility Evaluate API
```bash
pnpm --filter @pc-platform/api test -- apps/api/src/builds/builds.integration.spec.ts
```

#### 2. Cart Operations & Bundling API
```bash
pnpm --filter @pc-platform/api test -- apps/api/src/cart/cart.integration.spec.ts
```

#### 3. Orders & Checkout API (Mock Payment)
```bash
pnpm --filter @pc-platform/api test -- apps/api/src/orders/orders.integration.spec.ts
```

#### 4. Auth & Security Integration
```bash
pnpm --filter @pc-platform/api test -- apps/api/src/auth/auth.integration.spec.ts
```

#### 5. Products Catalog Integration
```bash
pnpm --filter @pc-platform/api test -- apps/api/src/products/products.integration.spec.ts
```

#### 6. Microservice Compatibility Controller API
```bash
pnpm --filter @pc-platform/compatibility-engine test -- test/compatibility.controller.spec.ts
```

---

### Running End-to-End (Playwright) Tests

#### 1. Run all E2E specs headlessly across all browsers
```bash
pnpm test:e2e
```

#### 2. Run E2E tests in interactive UI mode
```bash
pnpm --filter @pc-platform/tests test:e2e:ui
```

#### 3. Run E2E tests with visible browser window (headed)
```bash
pnpm --filter @pc-platform/tests test:e2e:headed
```

#### 4. Run only on a specific browser (e.g., Chromium)
```bash
pnpm --filter @pc-platform/tests test:e2e -- --project="Desktop Chrome"
```

#### 5. Run a specific E2E test file
```bash
# Auth flow
pnpm --filter @pc-platform/tests test:e2e -- auth.spec.ts

# Builder & compatibility warning flow
pnpm --filter @pc-platform/tests test:e2e -- builder.spec.ts

# Checkout & mock payment flow
pnpm --filter @pc-platform/tests test:e2e -- checkout.spec.ts
```

#### 6. View the HTML test report
```bash
pnpm --filter @pc-platform/tests test:e2e:report
```

---

## 6. Continuous Integration (CI/CD) Workflow

In GitHub Actions (`.github/workflows/ci.yml`), automated tests run in parallel jobs:

```yaml
jobs:
  unit-and-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  e2e-playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: tests/playwright-report/
          retention-days: 14
```
