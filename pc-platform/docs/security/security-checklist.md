# PC Platform — Application Security Checklist

**Version:** 2.0.0  
**Target:** Engineering, DevOps, and Security Operations  
**Usage:** Required for every major release and production deployment.  

---

## 1. Authentication & Session Management

- [x] **Password Hashing:** Passwords hashed with bcrypt (salt rounds >= 12).
- [x] **Timing Attack Mitigation:** Constant-time dummy compare executed on user-not-found login attempts.
- [x] **Password Complexity:** Minimum 8 characters with mixed case, digits, and special characters enforced via DTO.
- [x] **Access Token Lifetime:** Access token expiration configured to <= 15 minutes (`JWT_EXPIRES_IN=15m`).
- [x] **Refresh Token Storage:** Stored in database as SHA-256 hashes; never stored in plaintext.
- [x] **Refresh Token Rotation:** Refresh tokens rotated on every single use; previous token immediately revoked.
- [x] **Reuse Detection:** Attempted reuse of revoked tokens revokes all sessions across all devices for that user.
- [x] **Cookie Security:** Refresh token cookie set with `httpOnly=true`, `SameSite=Strict`, `Path=/`, and `secure=true` (production).
- [x] **Google OAuth2 Verification:** Google ID tokens cryptographically verified against official Google tokeninfo endpoints.
- [x] **Account State Verification:** Inactive or suspended accounts blocked during credential check and JWT validation.

---

## 2. Authorization & RBAC

- [x] **Default Deny:** Global `JwtAuthGuard` enforced on all endpoints; public access requires explicit `@Public()` decorator.
- [x] **Role Checking:** `RolesGuard` evaluates required roles case-insensitively (`SUPER_ADMIN`, `ADMIN`, `STAFF`, `EDITOR`, `CUSTOMER`).
- [x] **Privilege Escalation Prevention:** Non-super-admins cannot assign or revoke the `super_admin` role.
- [x] **Administrative Hierarchy:** Non-super-admins cannot delete or modify `super_admin` user accounts.
- [x] **Self-Modification Prevention:** Administrators cannot alter their own roles or self-delete via administrative endpoints.
- [x] **Audit Trail:** Every administrative role change, user status change, or destructive operation logged to `AuditLog`.

---

## 3. IDOR (Insecure Direct Object Reference) Prevention

- [x] **PC Builds Ownership:** Duplicating or viewing private builds restricted strictly to the build author.
- [x] **Cart Bundling:** Adding components from a saved build to cart verifies build ownership or public status.
- [x] **Order History:** Customer order lookup checks `order.userId === currentUserId`. Admin access verified via case-insensitive role check.
- [x] **Review Moderation:** Customers can only modify or delete their own product reviews.
- [x] **Payment Initiation:** Payments can only be initiated or verified by the customer who placed the order.

---

## 4. Rate Limiting & DoS Protection

- [x] **Global Guard Binding:** `ThrottlerGuard` registered globally via `APP_GUARD` in `AppModule`.
- [x] **Burst Limit:** Short window rate limit enforced (10 requests per second per IP).
- [x] **General Limit:** Medium window rate limit enforced (100 requests per minute per IP).
- [x] **Auth Endpoint Throttling:** Strict per-endpoint limits:
  - `POST /auth/register`: 5/min
  - `POST /auth/login`: 10/min
  - `POST /auth/forgot-password`: 3/min
- [x] **HTTP Caching Offload:** Public read endpoints emit `Cache-Control` headers, allowing CDN edge caching to mitigate origin load.

---

## 5. Input Validation & Injection Defenses

- [x] **Prisma ORM Parameterization:** All database queries parameterized; zero string-concatenated SQL queries in codebase.
- [x] **Global Validation Pipe:** NestJS `ValidationPipe` configured with `whitelist: true` and `forbidNonWhitelisted: true`.
- [x] **DTO Type Safety:** All incoming payloads validated via `class-validator` and typed DTOs.
- [x] **Search Sanitization:** Full-text search and specification filter inputs trimmed and case-folded safely.
- [x] **XSS Prevention:** Next.js React JSX auto-escaping active; dangerous `dangerouslySetInnerHTML` prohibited in user-submitted contexts.

---

## 6. File Upload & Storage Security

- [x] **File Size Limit:** Multipart uploads capped at 10 MB in `FileInterceptor`.
- [x] **MIME Whitelist:** Only safe image and document types permitted (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`).
- [x] **Executable Rejection:** Executable extensions (`.exe`, `.sh`, `.bat`), SVG with script injection risks, and HTML files rejected.
- [x] **Path Traversal Mitigation:** Folder parameters stripped of non-alphanumeric characters (`[^a-zA-Z0-9_-]`).
- [x] **Canonical Path Verification:** `LocalStorageProvider` verifies canonical target paths with `path.resolve` against base directory.

---

## 7. Network, CORS & HTTP Headers

- [x] **CORS Whitelist:** Explicit origin checking (`CORS_ORIGINS`); wildcard `*` prohibited when credentials enabled.
- [x] **Helmet Security Headers:**
  - Content-Security-Policy enabled in production.
  - `X-Frame-Options: SAMEORIGIN` or `DENY` prevents clickjacking.
  - `X-Content-Type-Options: nosniff` prevents MIME confusion attacks.
  - `Strict-Transport-Security` (HSTS) enforces HTTPS.
- [x] **TLS/HTTPS:** All external communications terminated with TLS 1.3/1.2 in production.

---

## 8. Secrets & Environment Configuration

- [x] **Git Tracking:** `.env*` files verified excluded in `.gitignore` and untracked by Git.
- [x] **Production Secret Enforcement:** `AuthModule`, `JwtStrategy`, and `AuthService` fail-fast in production if `JWT_SECRET` is missing or default.
- [x] **Client Secrets Isolation:** Next.js public variables strictly restricted to `NEXT_PUBLIC_*` prefixes; private database and API secrets not exposed to frontend bundles.
- [x] **Internal Microservice Auth:** Compatibility Engine calls secured via internal API key header verification (`COMPATIBILITY_ENGINE_API_KEY`).

---

## 9. Payment & Financial Security

- [x] **Authoritative Pricing:** Item totals, discounts, coupons, shipping, and order grand totals computed solely on server.
- [x] **Idempotency:** Payment intent creation and verification guard against duplicate charge processing.
- [x] **Cryptographic Signatures:** Razorpay and gateway webhook callbacks verified with HMAC SHA-256 signatures before status mutation.
- [x] **Order Lock:** Payments cannot be created or verified for cancelled, refunded, or already-completed orders.

---

## 10. Pre-Deployment Verification Protocol

Run the following test commands prior to each production deployment:

```bash
# 1. Typecheck all packages and applications
pnpm --filter @pc-platform/api typecheck
pnpm --filter @pc-platform/web typecheck

# 2. Run full backend unit and integration test suite (25 suites, 270+ tests)
pnpm --filter @pc-platform/api test

# 3. Run security regression tests specifically
pnpm --filter @pc-platform/api test src/common/guards/security-remediation.spec.ts

# 4. Verify Next.js production build succeeds
pnpm --filter @pc-platform/web build
```
