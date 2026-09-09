# Compatibility Engine — PC Platform

> Status: Active | Last Updated: 2026-09  
> Service: `services/compatibility-engine`

---

## 1. What Is the Compatibility Engine?

The compatibility engine is a **standalone NestJS service** that validates whether a set of PC components can work together. It is:

- Fully isolated from the main API
- Stateless (no user data, no order logic)
- Independently deployable and scalable
- Callable via HTTP POST with an API key

No compatibility rules exist anywhere in the frontend or the main API. All rules live here.

---

## 2. Why Isolate It?

| Reason | Explanation |
|---|---|
| **Testability** | Rules can be unit-tested without database or HTTP concerns |
| **Replaceability** | Can be replaced with an ML-based engine without touching the API or frontend |
| **Scalability** | PC builder pages generate many compatibility checks; this can be scaled independently |
| **Auditability** | A single place to audit and update hardware rules |
| **Domain isolation** | Business logic for hardware compatibility is distinct from e-commerce business logic |

---

## 3. Service Structure

```
services/compatibility-engine/
├── src/
│   ├── main.ts                        # Bootstrap NestJS app on :4001
│   ├── app.module.ts
│   │
│   ├── compatibility/
│   │   ├── compatibility.module.ts
│   │   ├── compatibility.controller.ts  # POST /check
│   │   ├── compatibility.service.ts     # Orchestrates rule checks
│   │   └── compatibility.service.spec.ts
│   │
│   ├── rules/                           # One file per rule category
│   │   ├── index.ts                     # Exports all rules
│   │   ├── cpu-socket.rule.ts
│   │   ├── ram-type.rule.ts
│   │   ├── ram-capacity.rule.ts
│   │   ├── psu-wattage.rule.ts
│   │   ├── case-form-factor.rule.ts
│   │   ├── gpu-clearance.rule.ts
│   │   ├── storage-interface.rule.ts
│   │   └── cooling-tdp.rule.ts
│   │
│   ├── guards/
│   │   └── api-key.guard.ts             # Validates internal API key
│   │
│   └── dto/
│       ├── build-components.dto.ts
│       └── compatibility-result.dto.ts
│
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## 4. API Contract

### Endpoint

```
POST /check
Authorization: x-api-key: <COMPATIBILITY_ENGINE_API_KEY>
Content-Type: application/json
```

### Request Body — `BuildComponents`

```typescript
interface BuildComponents {
  cpu?: ComponentSpec;
  motherboard?: ComponentSpec;
  ram?: ComponentSpec[];
  gpu?: ComponentSpec;
  storage?: ComponentSpec[];
  psu?: ComponentSpec;
  case?: ComponentSpec;
  cooling?: ComponentSpec;
}

interface ComponentSpec {
  productId: string;
  name: string;
  category: ComponentCategory;
  specs: Record<string, string | number | boolean>;
}
```

### Response — `CompatibilityResult`

```typescript
interface CompatibilityResult {
  compatible: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
  summary: string;
}

interface CompatibilityIssue {
  severity: 'error';
  rule: string;
  message: string;
  components: string[];  // productIds involved
}

interface CompatibilityWarning {
  severity: 'warning';
  rule: string;
  message: string;
  components: string[];
}
```

### Example Response

```json
{
  "compatible": false,
  "issues": [
    {
      "severity": "error",
      "rule": "cpu-socket",
      "message": "AMD Ryzen 9 7950X (AM5) is not compatible with ASUS Prime Z690-P (LGA1700)",
      "components": ["prod_cpu_001", "prod_mb_002"]
    }
  ],
  "warnings": [
    {
      "severity": "warning",
      "rule": "psu-wattage",
      "message": "Estimated system TDP (520W) exceeds 80% of PSU capacity (650W). Consider a 750W or higher PSU.",
      "components": ["prod_psu_001"]
    }
  ],
  "summary": "1 compatibility error, 1 warning. Build is not compatible."
}
```

---

## 5. Rule Definitions

### Rule Interface

```typescript
interface CompatibilityRule {
  id: string;
  name: string;
  description: string;
  check(components: BuildComponents): RuleResult;
}

interface RuleResult {
  passed: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
}
```

### Rule Categories

| Rule ID | What It Checks |
|---|---|
| `cpu-socket` | CPU socket matches motherboard socket (e.g., AM5 ↔ AM5) |
| `ram-type` | RAM type matches motherboard supported type (DDR5, DDR4) |
| `ram-capacity` | Total RAM does not exceed motherboard max capacity |
| `ram-slots` | Number of RAM sticks does not exceed available slots |
| `psu-wattage` | Total system TDP < PSU wattage (with 80% headroom warning) |
| `case-form-factor` | Motherboard form factor fits case (ATX in ATX case, mATX in mATX/ATX case) |
| `gpu-clearance` | GPU length ≤ case max GPU length |
| `storage-interface` | M.2 drives match available M.2 slots; SATA count within SATA port limit |
| `cooling-tdp` | CPU cooler TDP rating ≥ CPU TDP |

### Rule Implementation Example

```typescript
// services/compatibility-engine/src/rules/cpu-socket.rule.ts

export const cpuSocketRule: CompatibilityRule = {
  id: 'cpu-socket',
  name: 'CPU Socket Compatibility',
  description: 'Ensures the CPU socket matches the motherboard socket type',

  check(components: BuildComponents): RuleResult {
    if (!components.cpu || !components.motherboard) {
      return { passed: true, issues: [], warnings: [] };
    }

    const cpuSocket = components.cpu.specs['socketType'];
    const mbSocket = components.motherboard.specs['socketType'];

    if (!cpuSocket || !mbSocket) {
      return { passed: true, issues: [], warnings: [] };
    }

    if (cpuSocket !== mbSocket) {
      return {
        passed: false,
        issues: [{
          severity: 'error',
          rule: 'cpu-socket',
          message: `${components.cpu.name} (${cpuSocket}) is not compatible with ${components.motherboard.name} (${mbSocket})`,
          components: [components.cpu.productId, components.motherboard.productId],
        }],
        warnings: [],
      };
    }

    return { passed: true, issues: [], warnings: [] };
  },
};
```

---

## 6. Engine Orchestration

```typescript
// compatibility.service.ts

@Injectable()
export class CompatibilityService {
  private readonly rules: CompatibilityRule[] = [
    cpuSocketRule,
    ramTypeRule,
    ramCapacityRule,
    psuWattageRule,
    caseFormFactorRule,
    gpuClearanceRule,
    storageInterfaceRule,
    coolingTdpRule,
  ];

  check(components: BuildComponents): CompatibilityResult {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];

    for (const rule of this.rules) {
      const result = rule.check(components);
      issues.push(...result.issues);
      warnings.push(...result.warnings);
    }

    const compatible = issues.length === 0;
    return {
      compatible,
      issues,
      warnings,
      summary: compatible
        ? `${warnings.length} warning(s). Build is compatible.`
        : `${issues.length} error(s), ${warnings.length} warning(s). Build is not compatible.`,
    };
  }
}
```

---

## 7. Security

- The `/check` endpoint is **not publicly exposed** via Nginx
- Protected by `ApiKeyGuard` which validates `x-api-key` header against `COMPATIBILITY_ENGINE_API_KEY`
- The API key is an internal secret — never exposed to the frontend

---

## 8. Extending the Engine

To add a new rule:

1. Create `services/compatibility-engine/src/rules/<rule-name>.rule.ts`
2. Implement the `CompatibilityRule` interface
3. Export from `rules/index.ts`
4. Register in `CompatibilityService.rules` array
5. Write unit tests in `<rule-name>.rule.spec.ts`
6. Update this document

---

## 9. Future: Rule-as-Data

Currently rules are hardcoded TypeScript. Future enhancement: store rules in the database (JSON rule definitions) and evaluate them dynamically. This would allow non-engineers to manage compatibility rules via the admin UI.
