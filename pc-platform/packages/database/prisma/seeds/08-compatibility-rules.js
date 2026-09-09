"use strict";
/**
 * Seed: 08-compatibility-rules.ts
 *
 * Seeds the core compatibility rules that the compatibility-engine service
 * reads at runtime to evaluate PC builds.
 *
 * IMPORTANT: These are DATA records only.
 * The compatibility-engine service evaluates them — no DB triggers.
 *
 * Rules seeded:
 *   1. CPU ↔ Motherboard socket match (ERROR)
 *   2. RAM type ↔ Motherboard supported types (ERROR)
 *   3. GPU length ≤ Case max GPU length (ERROR)
 *   4. CPU cooler height ≤ Case max cooler height (ERROR)
 *   5. PSU wattage ≥ build total TDP × 1.2 safety margin (WARNING)
 *   6. Motherboard form factor fits case (ERROR)
 *   7. GPU slot width ≤ case available PCI slots (ERROR)
 *   8. RAM capacity ≤ Motherboard max RAM (WARNING)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCompatibilityRules = seedCompatibilityRules;
const generated_1 = require("../src/generated");
const RULES = [
    {
        name: 'cpu_mb_socket_match',
        description: 'CPU socket type must match the motherboard socket type.',
        ruleType: generated_1.CompatibilityRuleType.SOCKET_MATCH,
        severity: generated_1.CompatibilitySeverity.ERROR,
        priority: 10,
        tags: ['cpu', 'motherboard', 'socket'],
        conditions: [
            {
                conditionIndex: 0,
                componentType: generated_1.ComponentType.CPU,
                attributePath: 'socketType',
                operator: 'ne', // "not equal to"
                compareToComponentType: generated_1.ComponentType.MOTHERBOARD,
                compareToAttributePath: 'socketType',
            },
        ],
        result: {
            title: 'CPU/Motherboard Socket Mismatch',
            message: 'The CPU uses {{CPU.socketType}} socket but the selected motherboard has {{MOTHERBOARD.socketType}} socket. These are incompatible.',
            suggestion: 'Select a motherboard with {{CPU.socketType}} socket, or choose a CPU compatible with {{MOTHERBOARD.socketType}}.',
        },
    },
    {
        name: 'ram_type_mb_match',
        description: 'RAM memory type must be in the motherboard supported memory types list.',
        ruleType: generated_1.CompatibilityRuleType.ENUM_MEMBERSHIP,
        severity: generated_1.CompatibilitySeverity.ERROR,
        priority: 20,
        tags: ['ram', 'motherboard', 'ddr'],
        conditions: [
            {
                conditionIndex: 0,
                componentType: generated_1.ComponentType.RAM,
                attributePath: 'memType',
                operator: 'not_in',
                compareToComponentType: generated_1.ComponentType.MOTHERBOARD,
                compareToAttributePath: 'supportedMemTypes',
            },
        ],
        result: {
            title: 'RAM/Motherboard Memory Type Mismatch',
            message: 'The RAM kit uses {{RAM.memType}} but the motherboard only supports {{MOTHERBOARD.supportedMemTypes}}.',
            suggestion: 'Select a RAM kit with {{MOTHERBOARD.supportedMemTypes}} memory type.',
        },
    },
    {
        name: 'gpu_length_case_fit',
        description: 'GPU card length must not exceed the case maximum GPU length clearance.',
        ruleType: generated_1.CompatibilityRuleType.PHYSICAL_FIT,
        severity: generated_1.CompatibilitySeverity.ERROR,
        priority: 30,
        tags: ['gpu', 'case', 'clearance'],
        conditions: [
            {
                conditionIndex: 0,
                componentType: generated_1.ComponentType.GPU,
                attributePath: 'lengthMm',
                operator: 'gt',
                compareToComponentType: generated_1.ComponentType.CASE,
                compareToAttributePath: 'maxGpuLengthMm',
            },
        ],
        result: {
            title: 'GPU Too Long for Case',
            message: 'The GPU is {{GPU.lengthMm}}mm long but the case only supports up to {{CASE.maxGpuLengthMm}}mm.',
            suggestion: 'Select a shorter GPU or a case with at least {{GPU.lengthMm}}mm GPU clearance.',
        },
    },
    {
        name: 'cpu_cooler_height_case_fit',
        description: 'CPU cooler height must not exceed the case maximum CPU cooler height.',
        ruleType: generated_1.CompatibilityRuleType.PHYSICAL_FIT,
        severity: generated_1.CompatibilitySeverity.ERROR,
        priority: 40,
        tags: ['cooler', 'case', 'clearance'],
        conditions: [
            {
                conditionIndex: 0,
                componentType: generated_1.ComponentType.COOLER,
                attributePath: 'heightMm',
                operator: 'gt',
                compareToComponentType: generated_1.ComponentType.CASE,
                compareToAttributePath: 'maxCpuCoolerHeightMm',
            },
        ],
        result: {
            title: 'CPU Cooler Too Tall for Case',
            message: 'The CPU cooler is {{COOLER.heightMm}}mm tall but the case allows a maximum of {{CASE.maxCpuCoolerHeightMm}}mm.',
            suggestion: 'Select a lower-profile cooler or a case with more cooler clearance.',
        },
    },
    {
        name: 'psu_wattage_adequacy',
        description: 'PSU wattage must be at least 20% above the total system TDP.',
        ruleType: generated_1.CompatibilityRuleType.VALUE_RANGE,
        severity: generated_1.CompatibilitySeverity.WARNING,
        priority: 50,
        tags: ['psu', 'power', 'wattage'],
        conditions: [
            {
                conditionIndex: 0,
                componentType: generated_1.ComponentType.PSU,
                attributePath: 'wattage',
                operator: 'lt_computed',
                // Computed: sum of CPU.tdpW + GPU.tdpW (evaluated by compatibility engine)
                literalValue: 'TOTAL_SYSTEM_TDP * 1.20',
            },
        ],
        result: {
            title: 'PSU Wattage May Be Insufficient',
            message: 'The selected PSU ({{PSU.wattage}}W) is below the recommended 120% safety margin of estimated system TDP ({{COMPUTED.totalTdpW}}W total).',
            suggestion: 'Upgrade to a PSU with at least {{COMPUTED.recommendedPsuW}}W for stable operation.',
            documentationUrl: 'https://docs.pcplatform.in/compatibility/psu-sizing',
        },
    },
    {
        name: 'mb_form_factor_case_fit',
        description: 'Motherboard form factor must be supported by the case.',
        ruleType: generated_1.CompatibilityRuleType.ENUM_MEMBERSHIP,
        severity: generated_1.CompatibilitySeverity.ERROR,
        priority: 60,
        tags: ['motherboard', 'case', 'form-factor'],
        conditions: [
            {
                conditionIndex: 0,
                componentType: generated_1.ComponentType.MOTHERBOARD,
                attributePath: 'formFactor',
                operator: 'not_in',
                compareToComponentType: generated_1.ComponentType.CASE,
                compareToAttributePath: 'supportedFormFactors',
            },
        ],
        result: {
            title: 'Motherboard Form Factor Not Supported by Case',
            message: 'The motherboard is {{MOTHERBOARD.formFactor}} but the case supports: {{CASE.supportedFormFactors}}.',
            suggestion: 'Select a case that supports {{MOTHERBOARD.formFactor}} motherboards, or choose a different motherboard.',
        },
    },
    {
        name: 'cooler_socket_support',
        description: 'CPU cooler must explicitly support the CPU socket type.',
        ruleType: generated_1.CompatibilityRuleType.ENUM_MEMBERSHIP,
        severity: generated_1.CompatibilitySeverity.ERROR,
        priority: 15,
        tags: ['cooler', 'cpu', 'socket'],
        conditions: [
            {
                conditionIndex: 0,
                componentType: generated_1.ComponentType.CPU,
                attributePath: 'socketType',
                operator: 'not_in',
                compareToComponentType: generated_1.ComponentType.COOLER,
                compareToAttributePath: 'supportedSockets',
            },
        ],
        result: {
            title: 'CPU Cooler Does Not Support CPU Socket',
            message: 'The cooler does not include a mounting bracket for {{CPU.socketType}} socket.',
            suggestion: 'Verify cooler socket support for {{CPU.socketType}}, or select a compatible cooler.',
        },
    },
    {
        name: 'ram_capacity_mb_max',
        description: 'Total RAM capacity should not exceed the motherboard maximum supported RAM.',
        ruleType: generated_1.CompatibilityRuleType.VALUE_RANGE,
        severity: generated_1.CompatibilitySeverity.WARNING,
        priority: 70,
        tags: ['ram', 'motherboard', 'capacity'],
        conditions: [
            {
                conditionIndex: 0,
                componentType: generated_1.ComponentType.RAM,
                attributePath: 'totalCapacityGb',
                operator: 'gt',
                compareToComponentType: generated_1.ComponentType.MOTHERBOARD,
                compareToAttributePath: 'maxRamGb',
            },
        ],
        result: {
            title: 'RAM Exceeds Motherboard Maximum',
            message: 'The selected RAM ({{RAM.totalCapacityGb}}GB) exceeds the motherboard maximum of {{MOTHERBOARD.maxRamGb}}GB.',
            suggestion: 'Select a RAM kit with ≤{{MOTHERBOARD.maxRamGb}}GB total capacity.',
        },
    },
];
async function seedCompatibilityRules(prisma) {
    for (const rule of RULES) {
        const { conditions, result, ...ruleData } = rule;
        const created = await prisma.compatibilityRule.upsert({
            where: { name: ruleData.name },
            update: { isActive: true },
            create: { ...ruleData, isActive: true },
        });
        // Upsert conditions
        for (const cond of conditions) {
            // Delete existing conditions for this rule first (idempotent)
            await prisma.compatibilityRuleCondition.deleteMany({
                where: { ruleId: created.id, conditionIndex: cond.conditionIndex },
            });
            await prisma.compatibilityRuleCondition.create({
                data: { ruleId: created.id, ...cond },
            });
        }
        // Upsert result
        await prisma.compatibilityRuleResult.upsert({
            where: { ruleId: created.id },
            update: {},
            create: { ruleId: created.id, ...result },
        });
    }
    console.log(`  ✔  Compatibility rules: ${RULES.length} seeded`);
}
//# sourceMappingURL=08-compatibility-rules.js.map