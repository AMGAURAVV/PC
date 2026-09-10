# How-To: Modify or Add a Compatibility Rule

> **Target Audience:** Systems & Hardware Logic Engineers  
> **Estimated Time:** 20–30 minutes  
> **Files Involved:**  
> - `services/compatibility-engine/src/rules/`  
> - `services/compatibility-engine/src/rules/index.ts`  
> - `services/compatibility-engine/test/`

---

## 1. Overview & Architecture

The Compatibility Engine operates as an isolated, deterministic rule pipeline. Every rule is an independent TypeScript class implementing `CompatibilityRule`:
- **`id`**: Unique kebab-case identifier (e.g., `cpu-socket`, `gpu-case-length`).
- **`condition(context: RuleContext): boolean`**: Fast pre-filter determining whether the required components are present in the build. If `false`, the rule evaluation is skipped.
- **`evaluate(context: RuleContext): RuleEvaluationResult`**: Pure algorithmic evaluation comparing structured specifications.
- **Enriched Results**: Errors (fatal incompatibility), Warnings (sub-optimal performance or tight clearance), and Info (advisories).

---

## 2. Step-by-Step Instructions

### Step 1: Modifying an Existing Rule
To modify an existing rule (e.g. changing PSU wattage headroom threshold):
1. Open [`services/compatibility-engine/src/rules/psu-headroom.rule.ts`](file:///services/compatibility-engine/src/rules/psu-headroom.rule.ts).
2. Locate the calculation logic inside `evaluate(context)`:
```typescript
// Adjust minimum recommended headroom from 20% to 25%
const RECOMMENDED_HEADROOM_RATIO = 1.25;
const recommendedWattage = Math.ceil(estimatedDraw * RECOMMENDED_HEADROOM_RATIO);
```
3. Update warning threshold or explanation text.

---

### Step 2: Creating a Brand New Rule
Let's walk through creating a new rule: `motherboard-m2-gen5.rule.ts` (Warns if a PCIe 5.0 SSD is installed on a motherboard that only supports PCIe 4.0).

1. Create a new file `services/compatibility-engine/src/rules/motherboard-m2-gen5.rule.ts`:
```typescript
import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';
import type { RuleContext } from '../parser/rule-context';
import { CompatibilityCategory } from '@pc-platform/types';

export class MotherboardM2Gen5Rule implements CompatibilityRule {
  readonly id = 'motherboard-m2-gen5';
  readonly name = 'M.2 PCIe Generation Compatibility';
  readonly description = 'Checks whether PCIe 5.0 NVMe SSDs will run at reduced speeds on PCIe 4.0 slots.';
  readonly category = CompatibilityCategory.STORAGE;
  readonly priority = 60;

  condition(context: RuleContext): boolean {
    return !!(context.motherboard && context.storage && context.storage.length > 0);
  }

  evaluate(context: RuleContext): RuleEvaluationResult {
    const warnings = [];
    const mb = context.motherboard!;

    for (const drive of context.storage) {
      if (drive.spec?.interface === 'PCIe 5.0 x4' && !mb.spec?.hasPcie5M2Slot) {
        warnings.push({
          severity: 'warning' as const,
          category: this.category,
          ruleId: this.id,
          title: 'PCIe 5.0 SSD Running at Reduced Bandwidth',
          explanation: `${drive.name} is a PCIe 5.0 SSD, but ${mb.name} only provides PCIe 4.0 M.2 slots. The drive will operate normally, but capped at PCIe 4.0 speeds (~7,500 MB/s).`,
          affectedComponents: [drive.productId, mb.productId],
          suggestedResolution: 'Consider a PCIe 5.0 capable motherboard, or choose a PCIe 4.0 SSD to save cost.',
        });
      }
    }

    return {
      passed: warnings.length === 0,
      issues: [],
      warnings,
    };
  }
}
```

2. Register the new rule in [`services/compatibility-engine/src/rules/index.ts`](file:///services/compatibility-engine/src/rules/index.ts):
```typescript
import { MotherboardM2Gen5Rule } from './motherboard-m2-gen5.rule';

export const ALL_RULES: CompatibilityRule[] = [
  // ... existing rules ...
  new MotherboardM2Gen5Rule(),
];
```

---

## 3. Verification & Writing Tests

Add unit test fixtures in `services/compatibility-engine/test/`:
```typescript
it('should emit a warning when PCIe 5.0 SSD is paired with PCIe 4.0 motherboard', () => {
  const result = engine.validateBuild({
    motherboard: mockMotherboardPcie4,
    storage: [mockPcie5Ssd],
  });
  expect(result.status).toBe('warning');
  expect(result.warnings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ ruleId: 'motherboard-m2-gen5' }),
    ]),
  );
});
```

Run test suite:
```bash
pnpm --filter @pc-platform/compatibility-engine test
```

---

## 4. Common Pitfalls & Guardrails
- **Zero Marketing Guesswork**: Never parse strings like `"PCIe 5.0"` with loose regexes if typed spec properties exist (`spec.interfaceVersion`).
- **Null Safety**: Always check if optional specs exist before accessing sub-properties (`drive.spec?.interface`).
- **Severity Guidelines**:
  - `error`: System physically cannot assemble or will cause damage / failure to boot (e.g. Socket mismatch, insufficient PSU wattage).
  - `warning`: System works, but throttles, downclocks, or has tight clearance.
  - `info`: Non-critical configuration advisory.
