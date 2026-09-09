# Contributing to PC Platform

Thank you for contributing! Please read this guide before opening issues or pull requests.

---

## Table of Contents

1. [Code of Conduct](#1-code-of-conduct)
2. [Getting Started](#2-getting-started)
3. [Branch Strategy](#3-branch-strategy)
4. [Commit Conventions](#4-commit-conventions)
5. [Pull Request Process](#5-pull-request-process)
6. [Code Standards](#6-code-standards)
7. [Testing Requirements](#7-testing-requirements)
8. [Documentation Requirements](#8-documentation-requirements)
9. [Architecture Rules](#9-architecture-rules)

---

## 1. Code of Conduct

Be professional, constructive, and respectful. Focus feedback on code, not people.

---

## 2. Getting Started

See [DEVELOPMENT.md](./DEVELOPMENT.md) for local setup.

---

## 3. Branch Strategy

We follow a **trunk-based development** model.

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production-ready code | Production |
| `develop` | Integration branch | Staging |
| `feature/<name>` | New features | — |
| `fix/<name>` | Bug fixes | — |
| `chore/<name>` | Maintenance tasks | — |
| `docs/<name>` | Documentation only | — |

### Branch naming examples

```
feature/pc-builder-wizard
feature/razorpay-integration
fix/compatibility-check-cpu-socket
chore/upgrade-nextjs-14
docs/add-api-endpoint-docs
```

Never push directly to `main` or `develop`. Always use a pull request.

---

## 4. Commit Conventions

We use **Conventional Commits** format:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no behavior change |
| `test` | Adding or updating tests |
| `chore` | Build, tooling, dependency updates |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |

### Scopes

Use the package/app name as the scope:

```
feat(web): add PC builder step wizard
fix(api): resolve JWT refresh token expiry bug
feat(compatibility-engine): add DDR5 memory compatibility rule
chore(database): add product index migration
docs(architecture): update system overview diagram
```

### Examples

```bash
feat(api): add product search endpoint with filters
fix(compatibility): socket mismatch not detected for AM5 CPUs
feat(web): implement cart with TanStack Query
chore(deps): upgrade Prisma to 5.12
```

---

## 5. Pull Request Process

### Before opening a PR

- [ ] Branch is up to date with `develop`
- [ ] All tests pass: `pnpm test`
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Formatting is clean: `pnpm format:check`
- [ ] New code has appropriate tests
- [ ] Documentation is updated if needed

### PR title format

Follow the same Conventional Commits format:

```
feat(web): add product comparison page
```

### PR description template

```markdown
## What does this PR do?
<!-- Summary of changes -->

## Why?
<!-- Motivation or linked issue -->

## How to test?
<!-- Steps to verify the change works -->

## Screenshots (if UI change)

## Checklist
- [ ] Tests added/updated
- [ ] Docs updated
- [ ] No secrets committed
- [ ] No console.log left in production code
```

### Review requirements

- Minimum 1 approving review required
- All CI checks must pass
- No unresolved review comments

---

## 6. Code Standards

### TypeScript

- **Strict mode is always on** — no `any`, no `@ts-ignore` without a comment explaining why
- Use `type` imports: `import type { Product } from '@pc-platform/types'`
- Prefer explicit return types on exported functions
- Use Zod for runtime validation — never `as unknown as SomeType`

### Naming

| Thing | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `product-service.ts` |
| Classes | `PascalCase` | `ProductService` |
| Interfaces | `PascalCase` (no `I` prefix) | `Product`, `CreateProductDto` |
| Enums | `PascalCase` | `ComponentCategory` |
| Functions | `camelCase` | `getProductById` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_BUILD_COMPONENTS` |
| React components | `PascalCase` | `ProductCard` |

### NestJS (Backend)

- One module per domain feature
- Services own business logic — controllers are thin
- Use `@Injectable()` for all services
- Use Prisma via the `DatabaseService` abstraction — not raw Prisma imports
- Validate all incoming DTOs with class-validator or Zod pipes

### Next.js (Frontend)

- Prefer Server Components where possible
- Client components are `'use client'` — keep them lean
- All API calls go through `packages/api-client` — no `fetch()` in components
- No hardcoded product data, prices, or compatibility rules in components

---

## 7. Testing Requirements

| Code type | Required tests |
|---|---|
| Compatibility rules | Unit tests (Vitest) — every rule must be tested |
| API endpoints | Integration tests (Supertest) |
| Business logic services | Unit tests |
| UI components | Component tests (optional but encouraged) |
| Critical flows | E2E tests (Playwright) |

Test files live alongside source files:
```
product.service.ts
product.service.spec.ts
```

E2E tests live in `tests/e2e/`.

---

## 8. Documentation Requirements

| Change | Documentation required |
|---|---|
| New API endpoint | Update `docs/api/` |
| New database model | Update `docs/database/database-architecture.md` |
| New compatibility rule | Update `docs/compatibility/compatibility-engine.md` |
| Major architectural decision | New ADR in `docs/decisions/` |
| New environment variable | Update `.env.example` with comment |

---

## 9. Architecture Rules

These rules are non-negotiable. PRs violating them will be rejected.

1. **No direct database access from frontend apps** — `apps/web` and `apps/admin` must never import `packages/database`
2. **No business logic in React components** — move it to a service or server action
3. **No hardcoded prices or product data** — always fetch from API
4. **No compatibility rules outside the engine** — all rules live in `services/compatibility-engine/src/rules/`
5. **No secrets in code** — use environment variables
6. **No circular dependencies between packages** — run `pnpm lint` which includes `import/no-cycle`
7. **API client is the only HTTP layer** — do not call `fetch()` directly in components; use `packages/api-client`
