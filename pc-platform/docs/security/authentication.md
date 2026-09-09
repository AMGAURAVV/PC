# Authentication & Security Architecture — PC Platform

**Version:** 2.0.0  
**Status:** Production  
**Scope:** `@pc-platform/api` (`apps/api`)

---

## 1. Security Philosophy & Threat Model

The PC Platform authentication system is built to enterprise security standards, prioritizing defense-in-depth, zero-trust token issuance, and tamper resistance.

### Primary Defenses
- **No Plaintext Passwords or Leaked Hashes**: Passwords are unconditionally hashed using bcrypt with salt factor 12. Password hashes are never written to logs, serialized in API responses, or exposed to frontend layers.
- **Timing Attack Mitigation**: When authentication fails (e.g. non-existent email), a simulated bcrypt comparison is executed to ensure constant-time response behavior, neutralizing user enumeration via response timing.
- **Credential Stuffing & Brute-Force Resistance**: Strict throttling is enforced at the controller boundary via `@nestjs/throttler` (e.g., max 5 registrations/min, 10 logins/min, 3 forgot-password requests/min per IP).
- **Token Hijacking & Theft Detection**: Refresh tokens are single-use with automatic rotation. Re-submitting an already-revoked refresh token indicates theft and triggers an automatic, immediate revocation of **all active sessions** for that user account.
- **Session Revocation**: Full revocation capabilities for single sessions or global multi-device logout (`POST /api/v1/auth/revoke-all` and upon password reset).

---

## 2. Token Architecture & Lifecycle

```
Client (Browser / SPA)               API Gateway / NestJS Server                PostgreSQL Database
       │                                         │                                      │
       │── POST /auth/login (email, password) ──▶│                                      │
       │                                         │── Validate credentials & status ────▶│
       │                                         │◀─ User verified (ACTIVE) ────────────│
       │                                         │── Store SHA-256(RefreshToken) ──────▶│
       │◀─ Set-Cookie: refreshToken (httpOnly) ──│                                      │
       │◀─ Body: { accessToken, user } ──────────│                                      │
       │                                         │                                      │
       │── Request with Bearer AccessToken ─────▶│── Verify JWT Signature (Local)       │
       │                                         │                                      │
       │── POST /auth/refresh (Cookie / Body) ──▶│                                      │
       │                                         │── Query & Revoke Old RefreshToken ──▶│
       │                                         │── Store New Rotated RefreshToken ───▶│
       │◀─ Set-Cookie: newRefreshToken ──────────│                                      │
       │◀─ Body: { newAccessToken } ─────────────│                                      │
```

### Access Token (JWT)
- **Algorithm**: HS256 (HMAC-SHA256)
- **Lifespan**: 15 minutes (`JWT_EXPIRES_IN=15m`)
- **Payload (`JwtPayload`)**:
  ```json
  {
    "sub": "b2f6e91a-7b3f-4e01-92cb-1d5ef23961f7",
    "email": "user@example.com",
    "roles": ["CUSTOMER"],
    "type": "access",
    "iat": 1788880000,
    "exp": 1788880900
  }
  ```

### Refresh Token (Database Backed)
- **Generation**: Cryptographically random 40-byte hex strings (`crypto.randomBytes(40)`).
- **Storage**: Stored in `refresh_tokens` table strictly as **SHA-256 digests** (`token_hash`).
- **Transmission**: Sent to web clients via secure HTTP headers:
  - `HttpOnly`: Inaccessible to JavaScript (XSS immunity).
  - `Secure`: HTTPS-only transmission in production.
  - `SameSite: Strict`: CSRF mitigation.
  - `Max-Age`: 7 days.
- **Rotation & Reuse Detection**:
  - Upon presentation, the existing token is marked `revoked_at = NOW()`.
  - A new refresh token is minted, hashed, and persisted.
  - If a token with `revoked_at != null` is ever presented, the system treats the event as a session breach, immediately revokes all active tokens for that user, and emits a high-priority security audit log.

---

## 3. Account Status State Machine

Every user account has an authoritative status attribute:

```
                  ┌──────────────────────────────┐
                  │    PENDING_VERIFICATION      │
                  └──────────────┬───────────────┘
                                 │
                     Verify Email / Google OAuth
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │            ACTIVE            │◀────┐
                  └──────────┬────────┬──────────┘     │
                             │        │                │
            Admin Suspends   │        │ Admin Deactivates
                             ▼        ▼                │
                  ┌────────────┐   ┌────────────┐      │
                  │ SUSPENDED  │   │  INACTIVE  │──────┘ (Reactivation)
                  └────────────┘   └────────────┘
```

| Status | Login Allowed? | API Response Behavior |
|---|---|---|
| `ACTIVE` | ✅ Yes | Standard JWT issuance and session tracking. |
| `PENDING_VERIFICATION` | ❌ No | `401 Unauthorized`: `"Please verify your email address before logging in."` |
| `SUSPENDED` | ❌ No | `401 Unauthorized`: `"Your account has been suspended. Please contact support."` |
| `INACTIVE` | ❌ No | `401 Unauthorized`: `"Your account is inactive. Please contact support."` |
| Soft-Deleted (`deletedAt`) | ❌ No | Treated as non-existent (`401 Unauthorized`: `"Invalid email or password"`). |

---

## 4. Role-Based Access Control (RBAC)

The platform enforces five canonical roles defined in [`apps/api/src/common/enums/role.enum.ts`](file:///d:/project/pc-platform/apps/api/src/common/enums/role.enum.ts):

| Role | Intended Scope & Capabilities |
|---|---|
| `CUSTOMER` | Default user role. Browse catalog, manage builds, shopping cart, orders, reviews, addresses. |
| `ADMIN` | Platform administrator. Manage users, orders, global categories, brands, system settings. |
| `STAFF` | Operations & customer support. View orders, assist customers, process RMA and tickets. |
| `EDITOR` | Content & catalog manager. Edit product descriptions, specifications, compatibility guides. |
| `INVENTORY_MANAGER` | Stock & supply chain manager. Manage warehouse allocations, SKU inventory, and suppliers. |

### Route Protection
```typescript
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.INVENTORY_MANAGER)
@Patch('inventory/:id')
updateStock(...) {}
```
The `RolesGuard` evaluates normalized, case-insensitive role memberships present in the verified JWT payload.

---

## 5. Email Verification & Password Reset Protocols

### Email Verification
1. Registration generates an email verification token:
   - Signed JWT with claims `{ sub: userId, email: user.email, type: "email_verification" }`.
   - 24-hour expiration.
2. User submits token to `POST /api/v1/auth/verify-email`.
3. Valid token transitions user to `status: ACTIVE`, `isVerified: true`, and updates `verified_at`.
4. Resend endpoint (`POST /api/v1/auth/resend-verification`) returns a constant generic message regardless of user existence to prevent account enumeration.

### Password Reset
1. User requests reset via `POST /api/v1/auth/forgot-password`.
2. Always responds with: `"If an account exists with this email, a password reset link has been sent."`
3. Token generation: Cryptographically signed token incorporating user's current password hash fragment into the secret key.
   - **Self-Invalidating**: The moment the password changes, any previously issued token becomes cryptographically invalid.
4. User submits new password to `POST /api/v1/auth/reset-password`.
5. Upon successful reset:
   - Password is re-hashed with bcrypt (salt factor 12).
   - **All active refresh tokens across all devices are immediately revoked**.
   - Security audit log is recorded.

---

## 6. Google OAuth 2.0 Integration

### SPA & Mobile Client Flow (ID Token Exchange)
```
Frontend (Google Sign-In SDK)                API (/auth/google/token)
       │                                                  │
       │── Google Sign-In Dialog ─────────┐               │
       │◀─ Returns Google ID Token (JWT) ─┘               │
       │                                                  │
       │── POST /api/v1/auth/google/token { idToken } ───▶│
       │                                                  │── Verify Google Token
       │                                                  │── Lookup / Create User
       │                                                  │   (Verified = true, ACTIVE)
       │                                                  │── Issue Access + Refresh Tokens
       │◀─ HTTP 200 { accessToken, user } ────────────────│
       │◀─ Set-Cookie: refreshToken ──────────────────────│
```

- If account exists: links session, marks email verified, updates `last_login_at`.
- If account is new: auto-provisions user with `CUSTOMER` role, cryptographically random strong password, and `status: ACTIVE`.

---

## 7. Audit Logging Catalog

All critical security events are recorded in the `audit_logs` table via `AuditLogsService`:

| Action | Entity Type | Trigger Description |
|---|---|---|
| `CREATE` | `User` | User registration (logs initial status, IP, user-agent). |
| `LOGIN` | `User` | Successful login or failed attempt (captures IP and reason). |
| `LOGOUT` | `User` | Explicit session termination. |
| `UPDATE` | `Security` | **`RefreshTokenReuseDetected`**: Token reuse alert (all sessions revoked). |
| `UPDATE` | `User` | `PASSWORD_RESET_REQUESTED` / `PASSWORD_RESET_COMPLETED`. |
| `ACTIVATE` | `User` | `EMAIL_VERIFIED`: Verification token redeemed. |
| `LOGOUT` | `User` | `ALL_SESSIONS_REVOKED`: Multi-device session purge. |
