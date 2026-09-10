# Monitoring, Telemetry & Observability — PC Platform

> **Status:** Active | **System:** Infrastructure & Operational Telemetry  
> **Tech Stack:** Structured JSON Logging, Health Probes, Prometheus Metrics, CloudWatch / GCP Cloud Monitoring

---

## 1. Module Overview & Responsibilities

The **Monitoring & Observability** system provides 24/7 visibility into system health, latency profiles, error frequencies, and database connection states across all deployed containers.

### Core Responsibilities:
1. **Health Check Probes**: Exposing high-reliability HTTP health check endpoints for container orchestrators (Docker, Kubernetes, Cloud Run).
2. **Structured JSON Logging**: Standardized JSON output across all services, ensuring zero plaintext sensitive data leakage and seamless ingestion into log sinks (Datadog, GCP Cloud Logging, CloudWatch).
3. **Performance Metrics Tracking**: Tracking p50, p95, and p99 request latencies, database query duration, cache hit ratios, and external payment provider roundtrips.
4. **Error Alerting & Diagnostics**: Categorizing exceptions by severity (`WARN`, `ERROR`, `FATAL`) and routing alerts to on-call engineering.
5. **Correlation ID Tracking**: Attaching a unique `x-request-id` to every incoming request, propagated across microservices for distributed tracing.

---

## 2. Technical Specification & Module Contracts

| Dimension | Specification |
|---|---|
| **Purpose** | Ensure operational visibility, early fault detection, and rapid root-cause analysis for production workloads. |
| **Responsibilities** | Liveness/readiness probes, metrics collection, structured logging, audit trails, alert threshold enforcement. |
| **Inputs** | Application log events, HTTP traffic metrics, database pool telemetry, container CPU/RAM metrics. |
| **Outputs** | Structured JSON stdout streams, health check status responses (`{ status: "ok" }`), metrics time-series data. |
| **Dependencies** | `@nestjs/terminus`, `Pino` / NestJS Logger, Google Cloud Monitoring / Prometheus. |
| **Database Tables** | `audit_logs` (for user-level audit trail); database connection pool inspected dynamically via `DatabaseService`. |
| **Health API Endpoints** | `GET /api/v1/health` (Application Liveness), `GET /api/v1/health/db` (Database Readiness Probe). |

---

## 3. Health Probe Specifications

### 3.1 Liveness Probe (`GET /api/v1/health`)
- **Purpose**: Verify that the Node.js event loop is responsive and HTTP server can accept connections.
- **Expected Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-10T18:00:00.000Z",
    "uptime": 86400
  }
  ```
- **HTTP Status Code**: `200 OK`

### 3.2 Readiness Probe (`GET /api/v1/health/db`)
- **Purpose**: Verify that the database connection pool is healthy and capable of executing queries.
- **Implementation**: Executes `SELECT 1` via `DatabaseService`.
- **Expected Response**:
  ```json
  {
    "status": "ok",
    "database": "connected"
  }
  ```
- **Failure Status**: `503 Service Unavailable` if database is down or connection pool is exhausted.

---

## 4. Structured Logging Standard

All log lines in production are emitted to `stdout` in JSON format:

```json
{
  "level": "info",
  "timestamp": "2026-09-10T18:00:00.123Z",
  "context": "OrdersService",
  "requestId": "req-98f2b314-e05e-4c57",
  "message": "Order confirmed successfully",
  "orderId": "ord-789a",
  "totalAmount": 154999.00
}
```

### Sensitive Data Masking Rules:
- Passwords, credit card numbers, CVVs, full JWT tokens, and `DATABASE_URL` credentials are **strictly masked** (`***`) before being passed to the logger.

---

## 5. Alert Thresholds & Incident Runbooks

| Alert Condition | Threshold | Severity | Immediate Action |
|---|---|---|---|
| **API 5xx Error Spike** | > 1% of total requests over 5 min | P1 (Critical) | Check error logs for database timeouts or third-party service failures. Scale pods or rollback deployment if related to new release. |
| **Database Connection Exhaustion** | Pool utilization > 90% | P1 (Critical) | Investigate unindexed queries or long-running transactions. Increase `connection_limit` or restart leaking instances. |
| **High Latency (p95)** | > 800ms over 5 min | P2 (High) | Check slow query logs in Cloud SQL / PostgreSQL. Verify cache hit ratio. |
| **Compatibility Engine Failure** | Error rate > 0.5% | P2 (High) | Check compatibility engine logs for unhandled rule exceptions or payload parsing failures. |

---

## 6. How to Modify Safely

1. **Adding a New Health Probe**:
   - Update `apps/api/src/health/health.controller.ts` and `health.service.ts`.
   - Ensure the probe does not perform expensive operations (e.g. table scans) that could degrade system performance during automated Kubernetes polling.
2. **Adding Custom Telemetry to a Service**:
   - Inject the `Logger` from `@nestjs/common` with the service name as context:
     ```typescript
     private readonly logger = new Logger(MyService.name);
     ```
   - Log structured metadata as the second parameter:
     ```typescript
     this.logger.log('Action performed', { entityId, userId });
     ```
3. **Adjusting Alert Thresholds**:
   - Update CloudWatch / GCP Cloud Monitoring alerting policies in `infrastructure/terraform/` or monitoring console.
