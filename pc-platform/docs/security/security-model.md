# PC Platform — Application Security Model

**Version:** 2.0.0  
**Status:** Approved & Enforced  
**Scope:** Whole System (`apps/api`, `apps/web`, `apps/admin`, `packages/*`, `services/*`)  
**Last Updated:** September 2026  

---

## 1. Executive Summary & Security Philosophy

The PC Platform architecture implements a zero-trust, defense-in-depth security model designed to safeguard customer personal information, payment transactions, system configurations, and administrative controls.

Security controls are applied across every layer:
- **Network & Gateway:** Strict CORS whitelist, Helmet HTTP security headers, global rate limiting.
- **Application Logic:** Explicit authentication guards, role-based access control (RBAC), strict ownership verification to eliminate Insecure Direct Object References (IDOR), and class-validator DTO validation.
- **Data & Secrets:** Authoritative server-side pricing calculations, bcrypt password hashing, cryptographic token rotation, and parameterized database interactions via Prisma ORM.

---

## 2. Threat Model & Trust Boundaries

```
[ Public Internet / Untrusted Clients ]
      │
      │ HTTPS (TLS 1.3)
      ▼
┌─────────────────────────────────────────────────────────────┐
│ Edge Gateway / Reverse Proxy & Helmet Headers               │
│ - Content-Security-Policy, HSTS, X-Frame-Options            │
│ - Strict CORS origin validation                             │
│ - Global ThrottlerGuard (Rate Limiting)                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ NestJS Application Core (Trust Boundary 1)                  │
│ - JwtAuthGuard (Authentication by default)                  │
│ - RolesGuard & Privilege Escalation Prevention              │
│ - Global ValidationPipe (Whitelist + Forbid unknown)        │
│ - FileInterceptor (MIME Whitelist + 10MB limit)             │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼ (TLS / Unix Socket)          ▼ (Strict HMAC / Signatures)
┌──────────────────────────────┐ ┌────────────────────────────┐
│ PostgreSQL Database (Data)   │ │ External Payment Provider  │
│ - Parameterized Queries      │ │ - Razorpay / Gateway       │
│ - Composite Indexes          │ │ - Authoritative Pricing    │
│ - Encrypted Refresh Tokens   │ │ - Webhook Signature Checks │
└──────────────────────────────┘ └────────────────────────────┘
```

### Trust Zones
1. **Untrusted Zone:** Client browsers, third-party public web crawlers, external API consumers.
2. **DMZ / Border Zone:** Next.js SSR frontend and API gateway reverse proxy terminating TLS.
3. **Core Application Zone:** NestJS API runtime, internal microservices (Compatibility Engine, Recommendation Engine).
4. **Data & Persistence Zone:** PostgreSQL database, Object Storage buckets (GCS / S3 / Local).

---

## 3. Authentication Architecture

### 3.1 Password Security
- **Algorithm:** Passwords are salted and hashed using **bcrypt** with a cost factor of **12** salt rounds (`$2a$12$`).
- **Complexity Policy:** Enforced via DTO validation:
  - Minimum 8 characters.
  - At least 1 uppercase letter (`A-Z`).
  - At least 1 lowercase letter (`a-z`).
  - At least 1 number or special character (`0-9` or `\W+`).
- **Timing Attack Mitigation:** In `AuthService.validateUser`, when a user is not found or is soft-deleted, a dummy bcrypt comparison against a precomputed hash is executed to equalize response latency and prevent user enumeration.

### 3.2 JWT Access Tokens
- **Algorithm:** HMAC-SHA256 (`HS256`).
- **Expiration:** 15 minutes (`JWT_EXPIRES_IN=15m`).
- **Payload (`JwtPayload`):**
  - `sub`: User UUID.
  - `email`: User email address.
  - `roles`: Uppercase role array (`['CUSTOMER']`, `['ADMIN']`, etc.).
  - `type`: Explicit token type (`access`).
- **Production Validation:** If `NODE_ENV === 'production'`, the API fails fast at boot if `JWT_SECRET` is missing, short, or set to development fallback strings.

### 3.3 Refresh Token Rotation & Theft Detection
- **Token Generation:** 40 bytes of cryptographically secure pseudorandom data (`crypto.randomBytes(40).toString('hex')`).
- **Database Storage:** Stored strictly as **SHA-256 digests** in the `refresh_tokens` table. Plaintext tokens are never persisted.
- **Delivery Mechanism:** Sent via HTTP-only cookie (`SameSite=Strict`, `Path=/`, `Secure` in production) and JSON response body for headless clients.
- **Single-Use Rotation:** Every refresh request issues a new token pair and revokes the old refresh token.
- **Reuse Detection:** Attempting to exchange an already revoked refresh token indicates session hijacking. The API immediately revokes **all active sessions** for that user and records a high-priority security audit log.

### 3.4 Google OAuth2 Token Verification
- Google ID tokens are verified authoritatively against Google's OAuth2 endpoints (`https://oauth2.googleapis.com/tokeninfo`).
- The API validates cryptographic authenticity, audience (`aud`), issuer (`accounts.google.com`), and verified email status before provisioning or logging in users.

---

## 4. Authorization & RBAC Model

### 4.1 Role Hierarchy
The platform defines five discrete roles:
1. `SUPER_ADMIN`: Full system access, administrator management, tenant configuration, and permission grant authority.
2. `ADMIN`: Catalog, inventory, order processing, coupon management, and staff supervision.
3. `STAFF`: Day-to-day warehouse operations, order fulfillment, and stock updates.
4. `EDITOR`: Content management (CMS, banners, blog articles, product descriptions).
5. `CUSTOMER`: Standard end-user account (placing orders, saving PC builds, authoring reviews).

### 4.2 Guard Enforcement
- **`JwtAuthGuard`**: Applied globally in `main.ts`. All endpoints are authenticated by default unless explicitly decorated with `@Public()`.
- **`RolesGuard`**: Enforces role requirements declared with `@Roles(...)`. Evaluates user roles in a case-insensitive manner to prevent capitalization bypasses.

### 4.3 Privilege Escalation & Account Safeguards
- **Role Assignment Controls:** Non-super-admins cannot grant or revoke the `super_admin` role.
- **Target Protection:** Non-super-admins cannot alter or delete `super_admin` accounts.
- **Self-Lockout Prevention:** Administrators cannot modify their own roles or delete their own accounts via admin endpoints.

---

## 5. Insecure Direct Object Reference (IDOR) Mitigation

Every mutation and sensitive read operation authoritatively verifies ownership or access permissions at the service layer:

| Domain | Operation | IDOR Defense |
| :--- | :--- | :--- |
| **PC Builds** | `GET /builds/:id` | Throws `403 Forbidden` if `build.userId !== currentUserId` and build is not public. |
| **PC Builds** | `POST /builds/:id/duplicate` | Rejects cloning another user's private build. |
| **Cart** | `POST /cart/bundle/:buildId` | Rejects adding components from another user's private build. |
| **Orders** | `GET /orders/:id` | Verifies `order.userId === currentUserId` unless caller possesses `ADMIN` / `SUPER_ADMIN` role. |
| **Reviews** | `PATCH /reviews/:id` | Only the author (`review.userId === currentUserId`) can edit a review. |
| **Reviews** | `DELETE /reviews/:id` | Only the author or an administrative user can delete a review. |
| **Payments** | `POST /payments/create-intent` | Verifies `order.userId === currentUserId` before creating payment intents. |
| **Payments** | `POST /payments/verify` | Verifies `order.userId === currentUserId` before verifying payment signatures. |

---

## 6. Rate Limiting & DoS Protection

- **Global Throttling:** `ThrottlerGuard` is bound globally via `APP_GUARD` in `AppModule`.
- **Default Thresholds:**
  - Short window: **10 requests per second** (burst mitigation).
  - Medium window: **100 requests per minute** (general scraping & abuse mitigation).
- **Endpoint-Specific Throttling:**
  - `POST /auth/register`: 5 requests per minute.
  - `POST /auth/login`: 10 requests per minute.
  - `POST /auth/forgot-password`: 3 requests per minute.
  - `POST /auth/resend-verification`: 3 requests per minute.

---

## 7. Injection Defense & Data Validation

### 7.1 SQL Injection
- All database interactions utilize the Prisma ORM query builder, which uses parameterized queries across all database drivers.
- Raw SQL queries are prohibited in application code. Health checks utilize static parameterized literals (`` SELECT 1 ``).

### 7.2 Input Validation
- Global NestJS `ValidationPipe` is configured with:
  - `whitelist: true`: Automatically strips undeclared properties from incoming request bodies.
  - `forbidNonWhitelisted: true`: Rejects payloads containing unmapped or unexpected properties.
  - `transform: true`: Automatically casts input data to target DTO types.
- DTO fields are validated using `class-validator` decorators (`@IsString`, `@IsEmail`, `@Min`, `@Matches`, etc.).

---

## 8. File Upload & Storage Security

- **File Size Limit:** Multipart file uploads are capped at **10 MB** in `FileInterceptor` to prevent resource exhaustion and buffer overflows.
- **MIME Whitelist:** Restricted strictly to safe asset types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`
  - `application/pdf`
  - Executables (`.exe`, `.sh`, `.bat`), SVG files with potential inline script tags, and HTML uploads are rejected.
- **Directory Traversal Mitigation:**
  - The `folder` query parameter is sanitized using `folder.replace(/[^a-zA-Z0-9_-]/g, '')`.
  - In `LocalStorageProvider.resolveFilePath`, paths are normalized with `path.resolve` and checked against `uploadDir` using `resolvedPath.startsWith(uploadDir)`. Traversal attempts (e.g. `../../etc/passwd`) throw an immediate security exception.

---

## 9. Cross-Site Scripting (XSS), CSRF & Security Headers

- **Helmet:** Automatically sets HTTP security headers:
  - `Content-Security-Policy`: Active in production.
  - `X-Frame-Options`: Denies iframe clickjacking.
  - `X-Content-Type-Options`: Set to `nosniff`.
  - `Strict-Transport-Security` (HSTS): Enforces HTTPS connections.
- **CSRF Protection:**
  - API mutations require an `Authorization: Bearer <token>` header, rendering browser-based cross-site form submission ineffective.
  - The refresh token cookie uses `SameSite=Strict`, preventing the cookie from being sent on cross-origin requests.
- **CORS:** Origins are explicitly checked against `CORS_ORIGINS` (comma-separated list in `.env`). Wildcard `*` is prohibited when `credentials: true`.

---

## 10. Sensitive Data Exposure & Logging

- **Interceptor Masking:** `LoggingInterceptor` logs only HTTP method, sanitized path, status code, and duration (e.g. `← POST /api/v1/auth/login 200 [42ms]`). Request bodies and authorization headers are never logged.
- **Exception Sanitization:** `AllExceptionsFilter` masks internal database errors, connection strings, and stack traces from API consumers in non-development environments.
- **Payload Hygiene:** Passwords, password reset tokens, and refresh token hashes are excluded from DTO outputs and API serializations.

---

## 11. Payment Security Architecture

- **Authoritative Calculations:** Total amounts, sub-totals, discounts, taxes, and shipping fees are calculated server-side from active database prices. Client-supplied price values are completely ignored.
- **Transaction Atomicity:** Inventory reservation, order status transitions, coupon usage tracking, and payment records are coordinated within database transactions.
- **Signature Verification:** Payment provider callbacks and verification requests mandate cryptographic HMAC signature verification (e.g. Razorpay HMAC SHA-256) before orders transition to `PAID`.
