import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const biosCompatibilityRule: CompatibilityRule = {
  id: 'bios-compatibility',
  name: 'BIOS Version & Flashback Compatibility',
  description: 'Detects if the selected CPU belongs to a newer generation than the motherboard initial chipset release and checks for USB BIOS Flashback support',
  category: CompatibilityCategory.BIOS,
  priority: 60,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.cpu && !!ctx.normalized.motherboard;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const cpu = ctx.normalized.cpu!;
    const mb = ctx.normalized.motherboard!;
    const warnings = [];
    const info = [];

    const cpuName = cpu.name.toLowerCase();
    const chipset = mb.chipset?.toUpperCase() || '';

    // Condition A: Intel 14th Gen on Intel 600-series (Z690, B660, H670, H610) or 700-series initial release
    const isIntel14thGen = cpuName.includes('14900') || cpuName.includes('14700') || cpuName.includes('14600') || cpuName.includes('14400');
    const isIntel600Series = chipset.includes('690') || chipset.includes('660') || chipset.includes('670') || chipset.includes('610');

    // Condition B: Intel 13th Gen on Intel 600-series
    const isIntel13thGen = cpuName.includes('13900') || cpuName.includes('13700') || cpuName.includes('13600') || cpuName.includes('13400');

    // Condition C: AMD Ryzen 9000 series on AMD 600-series (X670, B650, A620)
    const isAmd9000Series = cpuName.includes('9950') || cpuName.includes('9900') || cpuName.includes('9700') || cpuName.includes('9600');
    const isAmd600Series = chipset.includes('670') || chipset.includes('650') || chipset.includes('620');

    // Condition D: AMD Ryzen 5000 series on AMD 400-series (B450, X470)
    const isAmd5000Series = cpuName.includes('5800') || cpuName.includes('5600') || cpuName.includes('5900') || cpuName.includes('5950');
    const isAmd400Series = chipset.includes('450') || chipset.includes('470') || chipset.includes('320');

    const requiresBiosUpdate =
      (isIntel14thGen && (isIntel600Series || chipset.includes('790'))) ||
      (isIntel13thGen && isIntel600Series) ||
      (isAmd9000Series && isAmd600Series) ||
      (isAmd5000Series && isAmd400Series);

    if (requiresBiosUpdate) {
      if (mb.biosFlashback) {
        info.push({
          severity: 'info' as const,
          category: CompatibilityCategory.BIOS,
          ruleId: 'bios-compatibility',
          rule: 'bios-compatibility',
          title: 'BIOS Update Likely Required (USB Flashback Supported)',
          explanation: `${cpu.name} may require a BIOS update to boot on ${mb.name} (${mb.chipset || 'chipset'}). Since this motherboard includes a dedicated USB BIOS Flashback button, you can easily flash the latest BIOS using a USB thumb drive without needing an older CPU.`,
          message: `BIOS update may be needed for ${cpu.name}; motherboard supports USB Flashback.`,
          affectedComponents: [cpu.productId, mb.productId],
          components: [cpu.productId, mb.productId],
          suggestedResolution: 'Download the latest BIOS from the motherboard manufacturer website to a USB stick before initial setup.',
        });
      } else {
        warnings.push({
          severity: 'warning' as const,
          category: CompatibilityCategory.BIOS,
          ruleId: 'bios-compatibility',
          rule: 'bios-compatibility',
          title: 'BIOS Update Required (No USB Flashback Detected)',
          explanation: `${cpu.name} was released after the initial ${mb.name} (${mb.chipset}) manufacturing run and likely requires an updated BIOS to boot. Because this motherboard lacks a hardware USB BIOS Flashback button, updating may require temporarily installing an older compatible CPU if the board does not ship with the latest firmware from the factory.`,
          message: `BIOS update likely required for ${cpu.name}. Motherboard lacks USB Flashback.`,
          affectedComponents: [cpu.productId, mb.productId],
          components: [cpu.productId, mb.productId],
          suggestedResolution: 'Confirm with your retailer that the motherboard has an updated BIOS installed, or choose a motherboard with USB Flashback.',
        });
      }
    }

    return {
      passed: true,
      status: warnings.length > 0 ? 'warning' : 'compatible',
      issues: [],
      warnings,
      info,
    };
  },
};
