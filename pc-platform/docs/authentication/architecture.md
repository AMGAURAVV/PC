# Authentication & Authorization Architecture — PC Platform

> **Status:** Active | **Module:** `apps/api/src/auth` & `packages/api-client`  
> **Tech Stack:** JWT (Access + Refresh Tokens), Bcrypt, Passport.js, NestJS Guards, Prisma ORM

---

## 1. Module Overview & Responsibilities

The **Authentication & Authorization** subsystem manages identity verification, session persistence, credential security, role-based access control (RBAC), and token lifecycle across the PC Platform.

### Core Responsibilities:
1. **User Registration**: Secure account creation with email uniqueness enforcement, password strength validation, and password hashing using bcrypt (12 rounds).
2. **Credential Authentication**: Validating user email and password; issuing short-lived access tokens and cryptographically secure refresh tokens.
3. **Dual-Token Architecture**:
   - **Access Token**: Short-lived JWT (15 minutes), signed with `JWT_SECRET`, carried in `Authorization: Bearer <token>` headers.
   - **Refresh Token**: Long-lived token (7 days), signed with `JWT_REFRESH_SECRET`, stored hashed in the `refresh_tokens` database table.
4. **Token Rotation & Revocation**: Automatic refresh token replacement on each refresh cycle. Single-use enforcement detects token theft and invalidates entire session families upon replay detection.
5. **Authorization Guards**:
   - `JwtAuthGuard`: Enforces valid, unexpired token signature.
   - `RolesGuard`: Enforces user role membership (`USER`, `ADMIN`).
   - `PermissionsGuard`: Enforces fine-grained capability checks (`products:write`, `orders:refund`).
6. **Password Security**: Zero plaintext password storage, rate-limited login endpoints to defeat brute-force attacks.

---

## 2. Technical Specification & Module Contracts

| Dimension | Specification |
|---|---|
| **Purpose** | Authenticate user identities and enforce granular authorization policies across all platform endpoints. |
| **Responsibilities** | Login, registration, token generation, token verification, session revocation, permission checking. |
| **Inputs** | Login credentials (`email`, `password`), registration payloads, Bearer access tokens, refresh token payloads. |
| **Outputs** | JWT access tokens, refresh tokens, authenticated user profile DTOs (`id`, `email`, `role`, `firstName`, `lastName`). |
| **Dependencies** | `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`, `@pc-platform/database`, `@pc-platform/validation`. |
| **Database Tables** | `users`, `refresh_tokens`, `roles`, `permissions`, `user_roles`, `role_permissions`. |
| **API Endpoints** | `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/api/v1/auth/me`. |

---

## 3. Token Flow & Rotation Mechanics

```
┌──────────────┐                               ┌──────────────┐                               ┌──────────────┐
│    Client    │                               │   API Host   │                               │   Database   │
└──────┬───────┘                               └──────┬───────┘                               └──────┬───────┘
       │                                              │                                              │
       │ 1. POST /api/v1/auth/login                   │                                              │
       ├─────────────────────────────────────────────►│                                              │
       │                                              │ 2. Validate bcrypt password hash             │
       │                                              ├─────────────────────────────────────────────►│
       │                                              │                                              │
       │                                              │ 3. Store SHA-256 hash of refresh token       │
       │                                              ├─────────────────────────────────────────────►│
       │ 4. Return { accessToken, refreshToken, user }│                                              │
       │◄─────────────────────────────────────────────┤                                              │
       │                                              │                                              │
       │ 5. API Call (Bearer accessToken)             │                                              │
       ├─────────────────────────────────────────────►│ (Verified statelessly via JWT_SECRET)        │
       │                                              │                                              │
       │ 6. Access Token Expires (15m)                │                                              │
       │    POST /api/v1/auth/refresh                 │                                              │
       ├─────────────────────────────────────────────►│ 7. Validate & Revoke old token               │
       │                                              ├─────────────────────────────────────────────►│
       │                                              │ 8. Issue NEW access + refresh token          │
       │ 9. Return new token pair                     ├─────────────────────────────────────────────►│
       │◄─────────────────────────────────────────────┤                                              │
```

---

## 4. Failure Modes & Resilience Patterns

| Failure Scenario | Impact | Mitigation / Resilience Pattern |
|---|---|---|
| **Expired Access Token (401)** | User API call rejected | Client interceptor in `@pc-platform/api-client` automatically calls `/auth/refresh` in background and retries original request without user interruption. |
| **Stolen Refresh Token Replay** | Attacker attempts to use an already-rotated refresh token | **Replay Attack Detection**: If a revoked token is presented, the system detects a breach, immediately revokes **all** tokens associated with that user family, and forces re-login. |
| **Brute-Force Attack** | Repeated login attempts with dictionary attacks | `ThrottlerGuard` rate limits login endpoints to 5 failed attempts per IP per minute. Offending IPs receive `429 Too Many Requests`. |
| **Compromised Secrets** | Attackers forge tokens | In case of compromise, rotating `JWT_SECRET` and `JWT_REFRESH_SECRET` in Secret Manager invalidates all active sessions globally. |

---

## 5. Testing Approach

- **Unit Tests (`auth.service.spec.ts`)**:
  - Tests user registration validation, bcrypt password hashing, token generation, and invalid credential rejections.
- **Integration Tests (`auth.integration.spec.ts`)**:
  - Tests the complete HTTP registration, login, token refresh rotation, and protected endpoint access flow against real PostgreSQL.
- **E2E Authentication Tests**:
  - Tests user sign-up, sign-in, session persistence, and logout in Playwright (`tests/e2e/auth.spec.ts`).

---

## 6. How to Modify Safely

1. **Changing Password Requirements**:
   - Update password validation schema in `packages/validation/src/auth.ts`.
   - Update tests in `packages/validation/src/index.spec.ts`.
2. **Adding a New Permission**:
   - Add permission string to the enum in `packages/types/src/index.ts` and `schema.prisma`.
   - Protect endpoints using `@RequirePermissions('permission:name')`.
3. **Updating Token Lifetimes**:
   - Adjust `JWT_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` in `.env.*` and `infrastructure/environments/`.
   - Do **NOT** hardcode token expiry values in service files.
