# PC Platform — Technical Documentation Hub

> **System:** Production-Grade Custom PC Building & E-Commerce Platform  
> **Architecture:** Modular Monorepo (Next.js 14, NestJS 10, Prisma ORM, PostgreSQL 16)

Welcome to the technical documentation hub for the PC Platform. This documentation is structured so that any developer can understand, operate, or modify any single subsystem without needing to read the entire application codebase.

---

## 📁 Documentation Map

```
docs/
├── architecture/       # Cross-system architectural models & design documents
├── frontend/           # Storefront (web), Backoffice (admin), Design System (ui)
├── backend/            # NestJS API, modular architecture, Admin system
├── database/           # PostgreSQL architecture & Google Cloud SQL migration runbooks
├── compatibility/      # Hardware compatibility rules engine & physical metrics
├── api/                # REST API reference, conventions, endpoint matrices
├── authentication/     # Dual-token JWT auth, refresh rotation, RBAC guards
├── deployment/         # CI/CD architecture (GitHub Actions), Docker, deployment guide
├── security/           # Threat models, security checklist, vulnerability remediations
├── operations/         # Monitoring, health checks, structured logging, runbooks
└── how-to/             # Standalone, step-by-step developer guides
```

---

## 🏛️ System Core Modules

| Module | Documentation File | Description |
|---|---|---|
| **Architecture** | [`architecture/system-overview.md`](./architecture/system-overview.md) | High-level system topology, layers, and communication contracts |
| **Frontend** | [`frontend/architecture.md`](./frontend/architecture.md) | Next.js 14 App Router, Server/Client components, React Query caching |
| **Backend** | [`backend/architecture.md`](./backend/architecture.md) | NestJS modular architecture, repository pattern, error handling |
| **Admin System** | [`backend/admin-system.md`](./backend/admin-system.md) | Backoffice management, RBAC permission engine, audit logging |
| **Database** | [`database/database-architecture.md`](./database/database-architecture.md) | Prisma schema, models, indexing, and migration rules |
| **Cloud SQL** | [`database/migration-to-google-cloud-sql.md`](./database/migration-to-google-cloud-sql.md) | Migration runbook, backup strategy, and Cloud SQL setup |
| **Compatibility** | [`compatibility/compatibility-engine.md`](./compatibility/compatibility-engine.md) | Pure hardware compatibility engine, 22 evaluation rules |
| **Authentication**| [`authentication/architecture.md`](./authentication/architecture.md) | JWT access/refresh token rotation, bcrypt hashing, and guards |
| **REST API** | [`api/rest-api-reference.md`](./api/rest-api-reference.md) | Comprehensive endpoint catalog, query filters, and error schemas |
| **Deployment** | [`deployment/deployment-architecture.md`](./deployment/deployment-architecture.md) | 7-stage CI/CD pipeline, environments, secret protection |
| **Security** | [`security/security-model.md`](./security/security-model.md) | STRIDE threat model, OWASP Top 10 mitigations, payment safety |
| **Operations** | [`operations/monitoring-and-observability.md`](./operations/monitoring-and-observability.md) | Liveness/readiness health probes, structured logging, alerts |

---

## 🛠️ Step-by-Step Developer How-To Guides

Quick-start guides for completing specific engineering tasks in isolation:

1. 🏠 **[How to Modify the Homepage](./how-to/change-homepage.md)**  
   *Edit hero headline, CTA buttons, featured carousel, or add new homepage sections.*

2. 🎴 **[How to Modify the Product Card](./how-to/change-product-card.md)**  
   *Add metadata badges, adjust pricing display, or update interactive actions.*

3. 🗄️ **[How to Modify the Product Database Schema](./how-to/change-product-schema.md)**  
   *Add schema fields, run Prisma migrations, update types, and avoid downtime.*

4. ⚙️ **[How to Modify or Add a Compatibility Rule](./how-to/change-compatibility-rule.md)**  
   *Implement a new physical, electrical, or socket compatibility rule.*

5. 🔄 **[How to Change the Database Provider](./how-to/change-database-provider.md)**  
   *Switch from local Docker PostgreSQL to Google Cloud SQL or AWS RDS.*

6. ☁️ **[How to Change or Add a Storage Provider](./how-to/change-storage-provider.md)**  
   *Configure Google Cloud Storage, AWS S3, or implement custom blob storage.*

7. 🧩 **[How to Add a New Component Type](./how-to/add-new-component-type.md)**  
   *Introduce a new hardware category (e.g. Capture Cards) across DB, API, and UI.*

8. 💳 **[How to Add a New Payment Provider](./how-to/add-new-payment-provider.md)**  
   *Implement a new checkout gateway using the abstracted `PaymentProvider` interface.*
