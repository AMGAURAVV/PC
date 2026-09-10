# How-To: Change the Database Provider or Deployment

> **Target Audience:** DevOps, Platform & Backend Engineers  
> **Estimated Time:** 15–20 minutes  
> **Files Involved:**  
> - `.env` or GitHub Environment Secrets (`DATABASE_URL`)  
> - `infrastructure/environments/`  
> - `packages/database/`

---

## 1. Overview & Portability Guarantee

Because PC Platform adheres to strict database portability guidelines:
- **The frontend has ZERO knowledge of the database.** Changing database providers requires **NO frontend code changes**.
- **The backend uses Prisma ORM and Repository abstractions.** Changing between PostgreSQL providers (Local Docker, Google Cloud SQL, Supabase, AWS RDS, Neon, Railway) requires **NO backend TypeScript changes**.
- The entire transition is achieved purely through **environment configuration and migration execution**.

---

## 2. Step-by-Step Instructions

### Step 1: Provision the New PostgreSQL Instance
Ensure the target database is running **PostgreSQL 16** and you have obtained:
- Database host / private IP
- Port (default `5432`)
- Database name (e.g. `pc_platform`)
- User credentials (e.g. `pc_platform_app` + strong password)
- SSL requirement (`sslmode=require`)

---

### Step 2: Format the Target `DATABASE_URL`
Select the format matching your target provider:

#### Google Cloud SQL (via Cloud SQL Auth Proxy):
```bash
DATABASE_URL="postgresql://pc_platform_app:YOUR_PASSWORD@127.0.0.1:5432/pc_platform?schema=public&sslmode=disable"
```

#### Google Cloud SQL (Direct Private IP):
```bash
DATABASE_URL="postgresql://pc_platform_app:YOUR_PASSWORD@10.128.0.3:5432/pc_platform?schema=public&sslmode=require"
```

#### Supabase:
```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres?schema=public&sslmode=require"
```

#### AWS RDS:
```bash
DATABASE_URL="postgresql://dbadmin:YOUR_PASSWORD@pc-platform-db.xxxxxx.ap-south-1.rds.amazonaws.com:5432/pc_platform?schema=public&sslmode=require"
```

---

### Step 3: Run Database Migrations on New Provider
Before redirecting live application traffic, deploy the schema to the new database:

```bash
# Set target DATABASE_URL in shell session
export DATABASE_URL="<your-new-connection-string>"

# Deploy all committed Prisma migrations idempotently
pnpm --filter @pc-platform/database prisma migrate deploy
```

If migrating data from an existing database:
```bash
# Dump from old provider
pg_dump -h <old_host> -U <old_user> -d pc_platform --format=custom --no-owner --data-only > data.dump

# Restore into new provider
pg_restore -h <new_host> -U <new_user> -d pc_platform --data-only --disable-triggers data.dump
```

---

### Step 4: Update Application Configuration
Update the `DATABASE_URL` secret in your target environment:
- **Local Dev**: Edit `.env`.
- **Staging / Production**: Update GitHub Environment Secrets (`STAGING_DATABASE_URL` or `PROD_DATABASE_URL`) or Google Secret Manager.

Restart or redeploy the API service:
```bash
# Example Kubernetes / Cloud Run rolling restart
kubectl rollout restart deployment/pc-platform-api
```

---

## 3. Verification & Health Checks

Verify that the backend established connection cleanly:
```bash
curl -f http://localhost:4000/api/v1/health/db
```
Expected response:
```json
{
  "status": "ok",
  "database": "connected"
}
```

Verify that frontend operations (browsing, cart, checkout) function with zero console errors or network failures.

---

## 4. Common Pitfalls & Guardrails
- **SSL Handshake Errors**: When connecting across public clouds, ensure `sslmode=require` is appended to `DATABASE_URL`.
- **Connection Pool Exhaustion**: On serverless environments (Cloud Run), append `&connection_limit=20` to prevent exhausting PostgreSQL connection limits during auto-scaling spikes.
