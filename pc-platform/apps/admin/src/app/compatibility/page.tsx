'use client';

import * as React from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sliders,
  Play,
  RotateCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
} from '@pc-platform/ui';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';
import { StatusBadge } from '../../components/ui/status-badge';

interface CompatibilityRuleItem {
  id: string;
  ruleId: string;
  name: string;
  category: string;
  severity: 'incompatible' | 'warning' | 'unknown';
  enabled: boolean;
  clearanceBuffer?: number;
  explanation: string;
  suggestedResolution: string;
}

const INITIAL_RULES: CompatibilityRuleItem[] = [
  {
    id: 'rule-1',
    ruleId: 'cpu-socket-match',
    name: 'CPU Socket ↔ Motherboard Socket',
    category: 'Socket & Physical',
    severity: 'incompatible',
    enabled: true,
    explanation: 'Evaluates physical pin/pad alignment between the CPU and motherboard socket (e.g. LGA1700, AM5, AM4).',
    suggestedResolution: 'Select a motherboard matching the CPU socket type.',
  },
  {
    id: 'rule-2',
    ruleId: 'cpu-chipset-compat',
    name: 'CPU Chipset & BIOS Compatibility',
    category: 'Firmware & Architecture',
    severity: 'warning',
    enabled: true,
    explanation: 'Verifies motherboard chipset generation supports the chosen CPU architecture, warning if BIOS update is needed.',
    suggestedResolution: 'Ensure motherboard BIOS version 1601+ or select newer chipset.',
  },
  {
    id: 'rule-3',
    ruleId: 'ram-generation-match',
    name: 'RAM Generation ↔ Motherboard (DDR4 / DDR5)',
    category: 'Memory',
    severity: 'incompatible',
    enabled: true,
    explanation: 'Validates DDR generation. DDR4 and DDR5 have different key notches and electrical specs and cannot be interchanged.',
    suggestedResolution: 'Change RAM kit to match motherboard memory type.',
  },
  {
    id: 'rule-4',
    ruleId: 'ram-capacity-limit',
    name: 'Total RAM Capacity ↔ Motherboard Max Limit',
    category: 'Memory',
    severity: 'incompatible',
    enabled: true,
    explanation: 'Checks if total memory exceeds motherboard architectural limits (e.g. 128GB or 192GB maximum).',
    suggestedResolution: 'Reduce total memory capacity to stay within motherboard limit.',
  },
  {
    id: 'rule-5',
    ruleId: 'ram-slot-count',
    name: 'RAM Module Count ↔ Motherboard Slot Limit',
    category: 'Memory',
    severity: 'incompatible',
    enabled: true,
    explanation: 'Ensures total RAM modules (e.g. 4 sticks) does not exceed physical DIMM slots on the board (e.g. ITX has only 2 slots).',
    suggestedResolution: 'Select a 2-stick memory kit or an ATX motherboard with 4 slots.',
  },
  {
    id: 'rule-6',
    ruleId: 'gpu-length-case',
    name: 'GPU Length ↔ Case Max Clearance',
    category: 'Dimensions & Clearances',
    severity: 'incompatible',
    enabled: true,
    clearanceBuffer: 15,
    explanation: 'Checks physical card length in mm against case interior clearance, factoring in front radiator thickness.',
    suggestedResolution: 'Select a shorter GPU model or a larger chassis.',
  },
  {
    id: 'rule-7',
    ruleId: 'cooler-height-case',
    name: 'Air Cooler Height ↔ Case Max Clearance',
    category: 'Dimensions & Clearances',
    severity: 'incompatible',
    enabled: true,
    clearanceBuffer: 5,
    explanation: 'Checks tower cooler height against case glass side panel clearance in mm.',
    suggestedResolution: 'Select a low-profile air cooler or liquid AIO.',
  },
  {
    id: 'rule-8',
    ruleId: 'radiator-mount-support',
    name: 'AIO Radiator Mount ↔ Case Support',
    category: 'Cooling & Airflow',
    severity: 'incompatible',
    enabled: true,
    explanation: 'Validates radiator dimensions (240mm, 280mm, 360mm) against case top/front/side mounting rails.',
    suggestedResolution: 'Choose a compatible radiator size for the chassis mount positions.',
  },
  {
    id: 'rule-9',
    ruleId: 'mobo-form-factor-case',
    name: 'Motherboard Form Factor ↔ Case Support',
    category: 'Dimensions & Clearances',
    severity: 'incompatible',
    enabled: true,
    explanation: 'Verifies motherboard form factor (ATX, Micro-ATX, Mini-ITX) is physically accepted by standoff layout in the chassis.',
    suggestedResolution: 'Choose a chassis that supports your motherboard form factor.',
  },
  {
    id: 'rule-10',
    ruleId: 'psu-wattage-tdp',
    name: 'PSU Wattage ↔ Total System Estimated TDP',
    category: 'Power & Electrical',
    severity: 'incompatible',
    enabled: true,
    explanation: 'Calculates aggregate peak power (CPU + GPU + peripherals) and verifies PSU rated wattage is sufficient.',
    suggestedResolution: 'Upgrade PSU wattage to meet minimum system consumption.',
  },
  {
    id: 'rule-11',
    ruleId: 'psu-headroom-buffer',
    name: 'PSU Headroom Buffer (Recommended 20%+)',
    category: 'Power & Electrical',
    severity: 'warning',
    enabled: true,
    clearanceBuffer: 20,
    explanation: 'Evaluates transient load spikes and ensures a safe 20%+ operating headroom above nominal TDP.',
    suggestedResolution: 'Select a PSU with at least 150W higher capacity for stability.',
  },
  {
    id: 'rule-12',
    ruleId: 'psu-gpu-power-connectors',
    name: 'PSU GPU Connector Pins (12VHPWR / PCIe)',
    category: 'Power & Electrical',
    severity: 'warning',
    enabled: true,
    explanation: 'Checks required power cables (e.g. 1x 16-pin 12V-2x6 or 3x 8-pin PCIe) against PSU native cable outputs.',
    suggestedResolution: 'Use an ATX 3.0 / PCIe 5.0 native power supply or verified adapters.',
  },
  {
    id: 'rule-13',
    ruleId: 'storage-m2-slots-count',
    name: 'M.2 NVMe Slot Availability',
    category: 'Storage',
    severity: 'incompatible',
    enabled: true,
    explanation: 'Verifies the number of requested M.2 NVMe drives does not exceed physical M.2 sockets on the motherboard.',
    suggestedResolution: 'Consolidate storage onto larger capacity drives or add PCIe expansion card.',
  },
  {
    id: 'rule-14',
    ruleId: 'ram-speed-chipset',
    name: 'RAM Speed Limit ↔ Motherboard XMP/EXPO',
    category: 'Memory',
    severity: 'warning',
    enabled: true,
    explanation: 'Warns if memory frequency exceeds officially validated motherboard/IMC speeds.',
    suggestedResolution: 'Memory will automatically downclock to max stable frequency.',
  },
];

export default function AdminCompatibilityPage() {
  const [rules, setRules] = React.useState<CompatibilityRuleItem[]>(INITIAL_RULES);
  const [selectedRule, setSelectedRule] = React.useState<CompatibilityRuleItem | null>(null);

  // Global Engine Buffers
  const [gpuBufferMm, setGpuBufferMm] = React.useState(15);
  const [coolerBufferMm, setCoolerBufferMm] = React.useState(5);
  const [psuHeadroomPct, setPsuHeadroomPct] = React.useState(20);

  // Rule Toggle Handler
  const toggleRuleEnabled = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  };

  // Severity Change Handler
  const changeSeverity = (id: string, severity: 'incompatible' | 'warning' | 'unknown') => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, severity } : r)),
    );
  };

  const columns: ColumnDef<CompatibilityRuleItem>[] = [
    {
      key: 'name',
      header: 'Rule Identifier & Scope',
      sortable: true,
      cell: (r) => (
        <div>
          <div className="font-mono font-semibold text-white">{r.name}</div>
          <div className="text-[10px] font-mono text-cyan-400/80">{r.ruleId}</div>
          <p className="text-[11px] text-cyber-400 line-clamp-1 mt-0.5">{r.explanation}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      cell: (r) => (
        <Badge variant="secondary" className="font-mono text-[10px]">
          {r.category}
        </Badge>
      ),
    },
    {
      key: 'severity',
      header: 'Evaluation Severity',
      sortable: true,
      cell: (r) => {
        let badgeClass = 'border-rose-500/30 text-rose-400 bg-rose-500/10';
        if (r.severity === 'warning') {
          badgeClass = 'border-amber-500/30 text-amber-400 bg-amber-500/10';
        } else if (r.severity === 'unknown') {
          badgeClass = 'border-cyber-600 text-cyber-400 bg-cyber-800/40';
        }

        return (
          <select
            value={r.severity}
            onChange={(e) => changeSeverity(r.id, e.target.value as any)}
            className={`h-7 px-2 rounded border text-[11px] font-mono font-bold bg-cyber-900 focus:outline-none ${badgeClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="incompatible">INCOMPATIBLE (BLOCK)</option>
            <option value="warning">WARNING (ADVISE)</option>
            <option value="unknown">UNKNOWN (INFO)</option>
          </select>
        );
      },
    },
    {
      key: 'enabled',
      header: 'Rule Engine State',
      sortable: true,
      cell: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRuleEnabled(r.id);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
            r.enabled
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-cyber-800/60 text-cyber-500 border border-cyber-700'
          }`}
        >
          {r.enabled ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ENABLED</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-cyber-600" />
              <span>DISABLED</span>
            </>
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Compatibility Rules Engine' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
              COMPATIBILITY RULES GOVERNANCE
            </h1>
            <Badge variant="tech">AUTHORITATIVE ENGINE</Badge>
          </div>
          <p className="text-xs text-cyber-400 mt-1">
            Logically separated from the product catalog. Configure deterministic checks, severities, and safety clearance buffers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5 font-mono text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET DEFAULTS</span>
          </Button>
          <Button variant="gaming" size="sm" className="gap-1.5 font-mono text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SAVE ACTIVE MATRIX</span>
          </Button>
        </div>
      </div>

      {/* Global Engine Clearance Parameters */}
      <Card variant="technical">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-white uppercase flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Engine Safety Tolerances & Headroom Parameters</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Universal tolerances applied across all component pair evaluations.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono">
          <div>
            <label className="text-xs text-cyber-300">GPU Clearance Safety Margin (mm)</label>
            <Input
              type="number"
              value={gpuBufferMm}
              onChange={(e) => setGpuBufferMm(Number(e.target.value))}
              className="mt-1 h-8 text-xs text-white"
            />
            <p className="text-[10px] text-cyber-500 mt-1">Reserve buffer for front intake fans</p>
          </div>

          <div>
            <label className="text-xs text-cyber-300">Cooler Height Glass Clearance (mm)</label>
            <Input
              type="number"
              value={coolerBufferMm}
              onChange={(e) => setCoolerBufferMm(Number(e.target.value))}
              className="mt-1 h-8 text-xs text-white"
            />
            <p className="text-[10px] text-cyber-500 mt-1">Tolerance between tower tips & side panel</p>
          </div>

          <div>
            <label className="text-xs text-cyber-300">PSU Transient Headroom Multiplier (%)</label>
            <Input
              type="number"
              value={psuHeadroomPct}
              onChange={(e) => setPsuHeadroomPct(Number(e.target.value))}
              className="mt-1 h-8 text-xs text-white"
            />
            <p className="text-[10px] text-cyber-500 mt-1">Required buffer above nominal wattage</p>
          </div>
        </CardContent>
      </Card>

      {/* Rules Data Table */}
      <AdminDataTable
        data={rules}
        columns={columns}
        searchPlaceholder="Filter rule definitions by name, ID, or category..."
        searchFilter={(rule, q) =>
          rule.name.toLowerCase().includes(q) ||
          rule.ruleId.toLowerCase().includes(q) ||
          rule.category.toLowerCase().includes(q) ||
          rule.explanation.toLowerCase().includes(q)
        }
        facetFilters={[
          {
            key: 'category',
            label: 'Category',
            options: [
              { label: 'Socket & Physical', value: 'Socket & Physical' },
              { label: 'Dimensions & Clearances', value: 'Dimensions & Clearances' },
              { label: 'Power & Electrical', value: 'Power & Electrical' },
              { label: 'Memory', value: 'Memory' },
              { label: 'Cooling & Airflow', value: 'Cooling & Airflow' },
              { label: 'Firmware & Architecture', value: 'Firmware & Architecture' },
              { label: 'Storage', value: 'Storage' },
            ],
          },
          {
            key: 'severity',
            label: 'Severity',
            options: [
              { label: 'Incompatible (Block)', value: 'incompatible' },
              { label: 'Warning (Advise)', value: 'warning' },
              { label: 'Unknown (Info)', value: 'unknown' },
            ],
          },
        ]}
        pageSize={15}
      />
    </div>
  );
}
