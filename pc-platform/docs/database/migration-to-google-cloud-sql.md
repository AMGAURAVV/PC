# Database Portability Architecture & Migration to Google Cloud SQL

> **Role:** Database Portability Architect  
> **Target RDBMS:** PostgreSQL 16  
> **Source:** Local Docker PostgreSQL  
> **Destination:** Google Cloud SQL for PostgreSQL (`asia-south1`)  
> **Status:** Approved Architectural Blueprint

---

## 1. Storage Technology Classification & Architecture Recommendation

Before planning database portability and cloud migration, we must rigorously categorize Google Cloud's data storage options to prevent anti-patterns.

### 1.1 Comparative Analysis: Cloud Storage vs. Cloud SQL vs. Firestore

| Feature / Dimension | Google Cloud Storage (GCS) | Google Cloud SQL (PostgreSQL) | Google Cloud Firestore |
|---|---|---|---|
| **Data Model** | Unstructured Object / Blob Store | Relational (RDBMS) / SQL tables | Document / Semi-Structured NoSQL |
| **Is it a Database?** | ❌ **NO.** It is a file/object repository. | ✅ **YES.** Fully managed ACID relational engine. | ✅ **YES.** Serverless document database. |
| **ACID Transactions** | None (atomic single-object overwrite only) | Full Multi-Row, Multi-Table ACID Transactions | Document-level & batched multi-document ACID |
| **Query Engine** | Key-based fetch (`gs://bucket/object`) | Full ANSI SQL, Subqueries, Joins, Aggregations | Filter/Sort by indexed fields, No native multi-table joins |
| **Foreign Keys & Integrity** | None | Enforced via declarative schema constraints | None (application-level maintenance only) |
| **Complex Relationships** | Unsuitable | Ideal for normalized 3NF schemas (Build ➔ Component ➔ Spec) | Denormalized subcollections or duplicated references |
| **Primary Use Case in PC Platform** | Product images, invoice PDFs, database dump backups | **Core platform database** (Users, Products, Orders, Specs) | Ephemeral presence or real-time collaborative configurators |

> [!CAUTION]
> **Architectural Guardrail: Cloud Storage is NOT a Relational Database**  
> Cloud Storage stores immutable binary large objects (BLOBs). Attempting to use Cloud Storage as a structured database (e.g., querying JSON or Parquet files directly from an OLTP web app) introduces severe data corruption risks, lacks concurrency locking, eliminates indexing, and causes catastrophic latency. Cloud Storage in this architecture is used **strictly** for assets (images, manuals) and backup dump files.

### 1.2 Firestore vs. Cloud SQL for PC Platform

While Firestore excels at mobile document sync and high-volume schemaless streams, it is fundamentally mismatched for custom PC building:
1. **Relational Interdependence**: A PC build references CPUs, Motherboards, RAM, GPUs, and Coolers. In Firestore, verifying socket compatibility across 10 components would require multiple round-trips or massive denormalization.
2. **Financial & Inventory Transactions**: E-commerce checkouts require atomic row-level locks on stock quantities (`inventory.quantity >= order.quantity`) and guaranteed rollback on payment failure. Cloud SQL PostgreSQL handles this natively with row-level locks and isolation levels.
3. **Data Integrity & Evolution**: PC Platform relies on 1,700+ lines of normalized Prisma schema with enums, constraints, and cascading deletes that prevent orphaned orders or invalid component specs.

### 1.3 Architect Recommendation
**Google Cloud SQL for PostgreSQL 16 is recommended as the primary relational database for the PC Platform.**

---

## 2. Database Portability Audit

A comprehensive code and schema audit was conducted across all monorepo packages (`apps/web`, `apps/admin`, `apps/api`, `packages/database`, `packages/types`, `packages/validation`, `packages/api-client`).

### 2.1 Frontend Database Isolation Audit
- **Verification Result: PASS (Zero Database Knowledge)**.
- Neither `apps/web` (Next.js storefront) nor `apps/admin` (backoffice) contains any imports of `@prisma/client`, `@pc-platform/database`, `pg`, or database connection strings.
- Frontends interact exclusively with the backend via the typesafe HTTP client package (`@pc-platform/api-client`) communicating over standard REST/JSON endpoints (`/api/v1/...`).
- **Portability Guarantee**: Switching the database from a local Docker container to Google Cloud SQL requires **ZERO frontend code modifications**. Frontends are completely unaware of the underlying database engine, connection string, or hosting provider.

### 2.2 Backend Abstraction & Repository Pattern Audit
- **Verification Result: PASS**.
- Database access is strictly encapsulated within `packages/database`, which exposes the injectable `DatabaseService` (extending `PrismaClient`).
- In `apps/api`, domain logic does not construct raw database commands. Instead, feature modules communicate through dedicated repository classes:
  - `ProductsRepository` (`src/products/products.repository.ts`)
  - `OrdersRepository` (`src/orders/orders.repository.ts`)
  - `CartRepository` (`src/cart/cart.repository.ts`)
  - `BuildsRepository` (`src/builds/builds.repository.ts`)
  - `PricesRepository` (`src/prices/prices.repository.ts`)
  - `UsersRepository` (`src/users/users.repository.ts`)
  - `InventoryRepository` (`src/inventory/inventory.repository.ts`)
  - `ReviewsRepository` (`src/reviews/reviews.repository.ts`)
  - `AdminRepository` (`src/admin/admin.repository.ts`)

### 2.3 SQL Queries & Raw SQL Audit
- **Verification Result: PASS (Zero Proprietary Raw SQL)**.
- A search for `$queryRaw` and `$executeRaw` across the codebase revealed only a single occurrence:
  ```typescript
  // apps/api/src/health/health.service.ts
  await this.db.$queryRaw`SELECT 1`;
  ```
- `SELECT 1` is universal ANSI SQL supported across all PostgreSQL versions, MySQL, SQLite, and CockroachDB. There are no proprietary database engine functions or vendor-specific stored procedures.

### 2.4 Database-Specific Extensions Audit
- **Verification Result: PASS (Zero Engine Extension Dependencies)**.
- The codebase does **NOT** require `pg_trgm`, `uuid-ossp`, `postgis`, `hstore`, or proprietary C extensions.
- Full-text and multi-field search in `PostgresSearchProvider` is implemented using standard Prisma queries with `contains` and `mode: 'insensitive'`. This guarantees identical search behavior on both local Docker and managed Cloud SQL without needing superuser privileges to run `CREATE EXTENSION`.

### 2.5 UUID Handling Audit
- **Verification Result: PASS (Client/ORM-Generated UUIDs)**.
- Every model in `packages/database/prisma/schema.prisma` uses `@id @default(uuid())`.
- Prisma generates RFC 4122 v4 UUIDs inside the Node.js application process before sending insert statements to the database. It does **NOT** rely on database-level engine functions like `uuid_generate_v4()` or `gen_random_uuid()`. This eliminates version discrepancies between PostgreSQL distributions.

### 2.6 JSON / JSONB Fields Audit
- **Verification Result: PASS**.
- All polymorphic attributes (e.g., `cpuSpec.socket`, `caseSpec.radiatorSupport`, `order.snapshot`, `auditLog.metadata`) use Prisma's `Json` type.
- PostgreSQL natively maps Prisma `Json` to `JSONB`. Both local Docker PostgreSQL 16 and Google Cloud SQL PostgreSQL 16 support JSONB operations with binary storage and indexing.

### 2.7 Transactions & Concurrency Audit
- **Verification Result: PASS**.
- Financial checkout operations (`OrdersService.createOrder`, `PaymentsService.handlePaymentCaptured`) utilize standard interactive transactions:
  ```typescript
  await this.db.$transaction(async (tx) => {
    // 1. Verify and deduct stock
    // 2. Create order record
    // 3. Record payment ledger entry
  });
  ```
- This relies strictly on PostgreSQL's standard ACID transaction semantics (`BEGIN`, `COMMIT`, `ROLLBACK`), working identically across local Docker and Cloud SQL.

### 2.8 Indexes & Schema Constraints Audit
- **Verification Result: PASS**.
- All indexes use standard B-Tree indexing (`@@index([productId, effectiveDate])`).
- Foreign keys use standard declarative constraints with `@relation(fields: [...], references: [...])`.
- Zero vendor-specific index operators (e.g., no custom operator classes or specialized GiST configurations that require custom PostgreSQL extensions).

---

## 3. Environment Strategy Matrix

The database architecture is designed so that transitioning between environments requires **only environment configuration changes**, with zero code refactoring:

| Dimension | 1. Local Development | 2. Staging | 3. Production |
|---|---|---|---|
| **Hosting Model** | Docker container (`postgres:16-alpine`) | Google Cloud SQL (Single Zone) | Google Cloud SQL (Regional High Availability) |
| **GCP Instance Tier** | N/A (Localhost) | `db-custom-2-7680` (2 vCPU, 7.5 GB RAM) | `db-custom-4-15360` (4 vCPU, 15 GB RAM) + Read Replica |
| **Connection Method** | Local TCP `localhost:5432` | Cloud SQL Auth Proxy / Private IP | Private IP VPC Peering + Cloud SQL Auth Proxy sidecars |
| **SSL Enforcement** | Disabled (`sslmode=disable`) | Required (`sslmode=require`) | Strictly Enforced TLS 1.3 with Cloud SQL IAM / SSL certs |
| **High Availability** | None | None (Dev/test economics) | Multi-AZ Automated Failover (Synchronous Replication) |
| **Point-in-Time Recovery** | None | 3 Days | 7 Days continuous WAL archiving |
| **Automated Backups** | None | Daily (Retained 7 days) | Daily + Transaction logs (Retained 30 days) |
| **Configuration File** | `.env.development` | `.env.staging` | `.env.production` (Secret Manager injected) |

---

## 4. Google Cloud SQL Setup Guide

This section outlines the exact steps to provision a production-grade PostgreSQL 16 Cloud SQL instance in GCP region `asia-south1` (Mumbai).

### 4.1 Step 1: Create VPC & Private Services Access (VPC Peering)

Cloud SQL instances must never be exposed directly to the public internet without defense-in-depth:

```bash
# Set project and region
export GCP_PROJECT_ID="pc-platform-prod"
export GCP_REGION="asia-south1"

gcloud config set project $GCP_PROJECT_ID

# 1. Allocate IP range for Private Services Connection
gcloud compute addresses create google-managed-services-default \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network=default

# 2. Create private VPC connection
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-default \
  --network=default
```

### 4.2 Step 2: Provision High-Availability Cloud SQL Instance

```bash
gcloud sql instances create pc-platform-db-prod \
  --database-version=POSTGRES_16 \
  --tier=db-custom-4-15360 \
  --region=$GCP_REGION \
  --availability-type=REGIONAL \
  --storage-type=SSD \
  --storage-size=100GB \
  --storage-auto-increase \
  --storage-auto-increase-limit=500GB \
  --network=default \
  --no-assign-ip \
  --backup-start-time=02:00 \
  --enable-point-in-time-recovery \
  --retained-backups-count=30 \
  --retained-transaction-log-days=7 \
  --database-flags=cloudsql.iam_authentication=on,log_checkpoints=on,log_connections=on,log_disconnections=on,shared_buffers=3932160,work_mem=65536
```

### 4.3 Step 3: Create Database and User

```bash
# Create application database
gcloud sql databases create pc_platform \
  --instance=pc-platform-db-prod

# Create secure application database user with high-entropy password
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create pc_platform_app \
  --instance=pc-platform-db-prod \
  --password="$DB_PASSWORD"

# Store generated password in Google Secret Manager
echo -n "$DB_PASSWORD" | gcloud secrets create db-prod-password --data-file=-
```

### 4.4 Step 4: Secure Connectivity Configurations

#### Option A: Cloud SQL Auth Proxy (Recommended for Cloud Run / GKE / Local Devs)
The Cloud SQL Auth Proxy provides automatic IAM authentication and 128-bit TLS encryption without requiring SSL certificate rotation:

```bash
# Download and start proxy locally or in sidecar
cloud-sql-proxy pc-platform-prod:asia-south1:pc-platform-db-prod --port 5432
```
Connection String:
```
DATABASE_URL="postgresql://pc_platform_app:${DB_PASSWORD}@127.0.0.1:5432/pc_platform?schema=public&sslmode=disable"
```

#### Option B: Private IP Direct Connection (For services in the same VPC)
```
DATABASE_URL="postgresql://pc_platform_app:${DB_PASSWORD}@<PRIVATE_IP>:5432/pc_platform?schema=public&sslmode=require"
```

#### Option C: Unix Domain Socket (Cloud Run Native)
```
DATABASE_URL="postgresql://pc_platform_app:${DB_PASSWORD}@localhost/pc_platform?host=/cloudsql/pc-platform-prod:asia-south1:pc-platform-db-prod"
```

---

## 5. End-to-End Migration Process

Follow this runbook to migrate data from the local/existing PostgreSQL instance to Google Cloud SQL with zero frontend impact.

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌────────────────────────┐
│ 1. Pre-Flight Checks   ├─────►│ 2. Schema Deploy        ├─────►│ 3. Data Export         │
│ (Connections, Backup)  │      │ (prisma migrate deploy) │      │ (pg_dump custom format)│
└────────────────────────┘      └─────────────────────────┘      └───────────┬────────────┘
                                                                             │
┌────────────────────────┐      ┌─────────────────────────┐      ┌───────────▼────────────┐
│ 6. Traffic Cutover     │◄─────┤ 5. Verification & Tests │◄─────┤ 4. Cloud SQL Restore   │
│ (Switch DATABASE_URL)  │      │ (Row counts, Health API)│      │ (pg_restore / import)  │
└────────────────────────┘      └─────────────────────────┘      └────────────────────────┘
```

### 5.1 Phase 1: Pre-Flight Validation
1. Verify target Cloud SQL connectivity using `nc -zv <PRIVATE_IP> 5432` or `cloud-sql-proxy`.
2. Confirm PostgreSQL versions match: Source = PostgreSQL 16, Target = PostgreSQL 16.

### 5.2 Phase 2: Schema Deployment
Apply all committed Prisma migrations directly to the Cloud SQL database to ensure tables, indexes, and constraints exist:

```bash
export DATABASE_URL="postgresql://pc_platform_app:${DB_PASSWORD}@127.0.0.1:5432/pc_platform?schema=public"
pnpm --filter @pc-platform/database prisma migrate deploy
```

### 5.3 Phase 3: Consistent Data Export
Take a consistent snapshot of the source database. If performing a live migration, place the application in a brief read-only maintenance window:

```bash
# Export using pg_dump with custom compressed archive format
pg_dump \
  -h localhost \
  -p 5432 \
  -U postgres \
  -d pc_platform \
  --format=custom \
  --no-owner \
  --no-privileges \
  --data-only \
  --file="pc_platform_data_export_$(date +%Y%m%d_%H%M%S).dump"
```

### 5.4 Phase 4: Import into Google Cloud SQL
Upload the dump to an authorized Google Cloud Storage bucket and import it into Cloud SQL:

```bash
# 1. Upload dump to temporary migration bucket
gsutil cp pc_platform_data_export_*.dump gs://pc-platform-migration-temp/

# 2. Grant Cloud SQL service account access to bucket
CLOUD_SQL_SA=$(gcloud sql instances describe pc-platform-db-prod --format="value(serviceAccountEmailAddress)")
gsutil iam ch serviceAccount:${CLOUD_SQL_SA}:roles/storage.objectViewer gs://pc-platform-migration-temp

# 3. Restore data into Cloud SQL
pg_restore \
  -h 127.0.0.1 \
  -p 5432 \
  -U pc_platform_app \
  -d pc_platform \
  --data-only \
  --disable-triggers \
  "pc_platform_data_export_*.dump"
```

### 5.5 Phase 5: Verification & Integrity Validation
Run automated verification queries comparing source and target row counts:

```sql
SELECT 'users' AS table_name, count(*) FROM users
UNION ALL
SELECT 'products', count(*) FROM products
UNION ALL
SELECT 'orders', count(*) FROM orders
UNION ALL
SELECT 'builds', count(*) FROM builds
UNION ALL
SELECT 'categories', count(*) FROM categories;
```

### 5.6 Phase 6: Application Cutover
Update the application configuration secret in GitHub Secrets / Google Secret Manager:

```bash
# Update Secret Manager with production Cloud SQL connection string
gcloud secrets versions add database-url --data-file=- <<EOF
postgresql://pc_platform_app:${DB_PASSWORD}@127.0.0.1:5432/pc_platform?schema=public&sslmode=disable
EOF

# Restart API deployment to pick up new connection pool
# Verify API health check
curl -fsSL https://api.pcplatform.in/api/v1/health/db
# Expected response: {"database":"connected"}
```

---

## 6. Backup Strategy

The Cloud SQL backup strategy guarantees continuous data protection and compliance:

### 6.1 Automated High-Frequency Backups
1. **Daily Automated Snapshots**:
   - Scheduled during low-traffic windows (02:00 - 06:00 IST).
   - Retained for 30 days.
   - Storage is redundant across zones within `asia-south1`.
2. **Continuous Point-in-Time Recovery (PITR)**:
   - Binary write-ahead logging (WAL) archives all database modifications continuously.
   - Enables restoring the database to any exact second within the preceding 7 days.
3. **On-Demand Pre-Deployment Backups**:
   - Before running any production migration, create an immutable snapshot:
     ```bash
     gcloud sql backups create \
       --instance=pc-platform-db-prod \
       --description="Pre-deployment-backup-release-$(git rev-parse --short HEAD)"
     ```

### 6.2 Logical Archive Offsite Storage
For catastrophic disaster recovery, weekly logical dumps are exported to a Coldline Cloud Storage bucket:

```bash
gcloud sql export sql pc-platform-db-prod \
  gs://pc-platform-longterm-db-backups/pc_platform_$(date +%Y%m%d).sql.gz \
  --database=pc_platform
```

---

## 7. Rollback Strategy

If a migration failure, data discrepancy, or unexpected latency spike occurs post-cutover, execute the following rollback plan:

### 7.1 Fast-Rollback: Instant Traffic Reversion (< 2 Minutes)
If the previous database is still online and untouched:
1. Revert `DATABASE_URL` in Secret Manager / CI environment secrets to the previous database instance.
2. Trigger an immediate rolling restart of the API containers.
3. The frontend requires **zero changes** and seamlessly resumes traffic.

### 7.2 Point-in-Time Recovery (PITR) Rollback (< 10 Minutes)
If an errant migration corrupted data or altered columns in Cloud SQL:
1. Identify the timestamp immediately prior to migration execution (e.g., `2026-09-10T18:30:00Z`).
2. Restore the database to a new instance using PITR:
   ```bash
   gcloud sql instances clone pc-platform-db-prod pc-platform-db-restored \
     --point-in-time="2026-09-10T18:30:00.000000Z"
   ```
3. Update `DATABASE_URL` to point to `pc-platform-db-restored`.
4. Validate health check endpoints and resume user traffic.

### 7.3 Schema Rollback Guidelines (Expand-and-Contract Discipline)
- All schema changes in PC Platform strictly adhere to the **Expand-and-Contract (Parallel Run) Pattern**:
  1. **Phase 1 (Expand)**: Add new columns as optional/nullable. Both old and new code run concurrently.
  2. **Phase 2 (Migrate Data)**: Backfill data in background tasks.
  3. **Phase 3 (Contract)**: After all application services are running the new release, drop deprecated columns in a subsequent release.
- **Never drop columns or tables in the same deployment as application code changes.** This guarantees that application rollbacks can execute without schema incompatibility errors.
