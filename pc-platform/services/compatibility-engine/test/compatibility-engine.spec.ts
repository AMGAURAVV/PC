import { CompatibilityService } from '../src/compatibility/compatibility.service';

import {
  highEndAmdCompatibleBuild,
  intelLiquidCooledBuild,
  budgetMicroAtxBuild,
  socketMismatchBuild,
  chipsetMismatchBuild,
  ramGenerationMismatchBuild,
  ramCapacityExceededBuild,
  ramSlotLimitExceededBuild,
  gpuLengthExceededBuild,
  coolerHeightExceededBuild,
  radiatorSizeExceededBuild,
  formFactorMismatchBuild,
  psuWattageDeficitBuild,
  psuMissingGpuConnectorsBuild,
  sataPortsExceededBuild,
  m2SlotsExceededBuild,
  sataM2InPcieOnlySlotBuild,
  pcieSlotsExceededBuild,
  expansionSlotsExceededBuild,
  coolerSocketUnsupportedBuild,
  coolerTdpInsufficientBuild,
  motherboardEpsMissingBuild,
  tightPsuHeadroomBuild,
  ramSpeedDownclockBuild,
  fanHeadersExceededBuild,
  biosUpdateWithFlashbackBuild,
  biosUpdateWithoutFlashbackBuild,
  dualEpsRecommendedBuild,
  missingCpuSocketBuild,
  missingGpuDimensionsBuild,
  missingCoolerHeightBuild,
  missingPsuWattageBuild,
  missingRadiatorSizeBuild,
} from './fixtures';

describe('CompatibilityEngine Service (Integration Suite)', () => {
  let service: CompatibilityService;

  beforeEach(() => {
    service = new CompatibilityService();
  });

  describe('1. Compatible Builds Verification', () => {
    it('should evaluate high-end AMD AM5 flagship build as fully compatible', () => {
      const result = service.check(highEndAmdCompatibleBuild);
      expect(result.status).toBe('compatible');
      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.summary).toContain('fully compatible');
      expect(result.telemetry).toBeDefined();
      expect(result.telemetry?.evaluatedRulesCount).toBeGreaterThan(10);
      expect(result.telemetry?.failedRulesCount).toBe(0);
    });

    it('should evaluate Intel 13th Gen liquid cooled build as fully compatible', () => {
      const result = service.check(intelLiquidCooledBuild);
      expect(result.status).toBe('compatible');
      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should evaluate budget Micro-ATX build as fully compatible', () => {
      const result = service.check(budgetMicroAtxBuild);
      expect(result.status).toBe('compatible');
      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('2. Incompatible Builds Verification (All Error Rules)', () => {
    it('Rule 1: should detect CPU socket ↔ motherboard socket mismatch', () => {
      const result = service.check(socketMismatchBuild);
      expect(result.status).toBe('incompatible');
      expect(result.compatible).toBe(false);
      const issue = result.issues.find((i) => i.ruleId === 'cpu-socket');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('error');
      expect(issue?.category).toBe('SOCKET');
      expect(issue?.title).toContain('Socket Mismatch');
      expect(issue?.suggestedResolution).toContain('AM5');
      expect(issue?.affectedComponents).toEqual(['cpu-7950x', 'mb-z790']);
    });

    it('Rule 2: should detect CPU chipset platform incompatibility', () => {
      const result = service.check(chipsetMismatchBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'cpu-chipset');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('error');
      expect(issue?.category).toBe('CHIPSET');
    });

    it('Rule 3: should detect RAM generation (DDR4 vs DDR5) mismatch', () => {
      const result = service.check(ramGenerationMismatchBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'ram-generation');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('error');
      expect(issue?.category).toBe('MEMORY');
      expect(issue?.explanation).toContain('DDR4');
    });

    it('Rule 4: should detect RAM capacity exceeding motherboard maximum', () => {
      const result = service.check(ramCapacityExceededBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'ram-capacity');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('error');
      expect(issue?.explanation).toContain('256GB');
      expect(issue?.explanation).toContain('128GB');
    });

    it('Rule 5: should detect RAM physical stick count exceeding motherboard slots', () => {
      const result = service.check(ramSlotLimitExceededBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'ram-slot-limit');
      expect(issue).toBeDefined();
      expect(issue?.explanation).toContain('6 physical RAM sticks');
    });

    it('Rule 7: should detect GPU physical length exceeding case clearance', () => {
      const result = service.check(gpuLengthExceededBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'gpu-case-length');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('error');
      expect(issue?.category).toBe('PHYSICAL_CLEARANCE');
      expect(issue?.explanation).toContain('357.6mm');
    });

    it('Rule 8: should detect air CPU cooler height exceeding case clearance', () => {
      const result = service.check(coolerHeightExceededBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'cooler-case-height');
      expect(issue).toBeDefined();
      expect(issue?.explanation).toContain('165mm');
      expect(issue?.explanation).toContain('145mm');
    });

    it('Rule 9: should detect liquid cooler radiator exceeding case radiator mount locations', () => {
      const result = service.check(radiatorSizeExceededBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'radiator-case-fit');
      expect(issue).toBeDefined();
      expect(issue?.explanation).toContain('420mm');
    });

    it('Rule 10: should detect motherboard form factor exceeding case supported form factors', () => {
      const result = service.check(formFactorMismatchBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'motherboard-case-form-factor');
      expect(issue).toBeDefined();
      expect(issue?.explanation).toContain('ATX');
      expect(issue?.explanation).toContain('Mini-ITX');
    });

    it('Rule 11: should detect total system power draw exceeding continuous PSU wattage', () => {
      const result = service.check(psuWattageDeficitBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'psu-wattage');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('error');
      expect(issue?.explanation).toContain('450W');
    });

    it('Rule 13: should detect missing GPU auxiliary PCIe / 12VHPWR power connectors on PSU', () => {
      const result = service.check(psuMissingGpuConnectorsBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'psu-gpu-connectors');
      expect(issue).toBeDefined();
      expect(issue?.explanation).toContain('3x 8-pin');
    });

    it('Rule 14: should detect SATA drive count exceeding motherboard SATA ports', () => {
      const result = service.check(sataPortsExceededBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'storage-interface');
      expect(issue).toBeDefined();
      expect(issue?.explanation).toContain('6 SATA storage drives');
      expect(issue?.explanation).toContain('4 SATA ports');
    });

    it('Rule 15: should detect M.2 SSD count exceeding motherboard M.2 sockets', () => {
      const result = service.check(m2SlotsExceededBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'm2-slot-availability');
      expect(issue).toBeDefined();
      expect(issue?.explanation).toContain('4 M.2');
      expect(issue?.explanation).toContain('2 onboard M.2');
    });

    it('Rule 16: should detect SATA M.2 SSD in PCIe-only M.2 sockets', () => {
      const result = service.check(sataM2InPcieOnlySlotBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'm2-key-interface');
      expect(issue).toBeDefined();
      expect(issue?.explanation).toContain('wired exclusively for PCIe / NVMe');
    });

    it('Rule 17: should detect expansion card count exceeding available motherboard PCIe slots', () => {
      const result = service.check(pcieSlotsExceededBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'pcie-slot-requirements');
      expect(issue).toBeDefined();
    });

    it('Rule 18: should detect expansion card slot width exceeding case rear PCI bracket slots', () => {
      const result = service.check(expansionSlotsExceededBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'expansion-slot-availability');
      expect(issue).toBeDefined();
    });

    it('Rule 21a: should detect cooler lacking mounting bracket for CPU socket', () => {
      const result = service.check(coolerSocketUnsupportedBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'cooling-requirements');
      expect(issue).toBeDefined();
      expect(issue?.explanation).toContain('AM5');
    });

    it('Rule 21b: should detect cooler TDP rating lower than CPU base TDP', () => {
      const result = service.check(coolerTdpInsufficientBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'cooling-requirements');
      expect(issue).toBeDefined();
      expect(issue?.explanation).toContain('170W');
      expect(issue?.explanation).toContain('65W');
    });

    it('Rule 22: should detect missing EPS CPU power cables from PSU', () => {
      const result = service.check(motherboardEpsMissingBuild);
      expect(result.status).toBe('incompatible');
      const issue = result.issues.find((i) => i.ruleId === 'motherboard-power-connectors');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('error');
    });
  });

  describe('3. Borderline & Warning Builds Verification', () => {
    it('Rule 12: should produce warning when system load exceeds 80% PSU capacity', () => {
      const result = service.check(tightPsuHeadroomBuild);
      expect(result.status).toBe('warning');
      expect(result.compatible).toBe(true);
      const warn = result.warnings.find((w) => w.ruleId === 'psu-headroom');
      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');
      expect(warn?.explanation).toContain('80%');
    });

    it('Rule 6: should produce warning when RAM speed exceeds motherboard max rating', () => {
      const result = service.check(ramSpeedDownclockBuild);
      expect(result.status).toBe('warning');
      expect(result.compatible).toBe(true);
      const warn = result.warnings.find((w) => w.ruleId === 'ram-speed');
      expect(warn).toBeDefined();
      expect(warn?.explanation).toContain('downclock');
    });

    it('Rule 20: should produce warning when fan count exceeds motherboard fan headers', () => {
      const result = service.check(fanHeadersExceededBuild);
      expect(result.status).toBe('warning');
      expect(result.compatible).toBe(true);
      const warn = result.warnings.find((w) => w.ruleId === 'fan-connector-availability');
      expect(warn).toBeDefined();
      expect(warn?.suggestedResolution).toContain('splitter');
    });

    it('Rule 19: should generate info when BIOS update is needed and motherboard has USB Flashback', () => {
      const result = service.check(biosUpdateWithFlashbackBuild);
      expect(result.status).toBe('compatible');
      const info = result.info?.find((i) => i.ruleId === 'bios-compatibility');
      expect(info).toBeDefined();
      expect(info?.title).toContain('USB Flashback Supported');
    });

    it('Rule 19: should generate warning when BIOS update is needed and motherboard lacks USB Flashback', () => {
      const result = service.check(biosUpdateWithoutFlashbackBuild);
      expect(result.status).toBe('warning');
      const warn = result.warnings.find((w) => w.ruleId === 'bios-compatibility');
      expect(warn).toBeDefined();
      expect(warn?.title).toContain('No USB Flashback Detected');
    });

    it('Rule 22: should recommend dual EPS cables for high-wattage CPUs on dual-8pin boards', () => {
      const result = service.check(dualEpsRecommendedBuild);
      expect(result.status).toBe('warning');
      const warn = result.warnings.find((w) => w.ruleId === 'motherboard-power-connectors');
      expect(warn).toBeDefined();
      expect(warn?.title).toContain('Second EPS 8-Pin Cable Recommended');
    });
  });

  describe('4. Missing-Data Builds Verification (Unknown Status)', () => {
    it('should return unknown status when CPU socket is missing', () => {
      const result = service.check(missingCpuSocketBuild);
      expect(result.status).toBe('unknown');
      expect(result.compatible).toBe(false);
      const issue = result.issues.find((i) => i.severity === 'unknown');
      expect(issue).toBeDefined();
      expect(issue?.title).toContain('Missing Data');
    });

    it('should return unknown status when GPU length is missing', () => {
      const result = service.check(missingGpuDimensionsBuild);
      expect(result.status).toBe('unknown');
      const issue = result.issues.find((i) => i.severity === 'unknown');
      expect(issue).toBeDefined();
    });

    it('should return unknown status when cooler height is missing', () => {
      const result = service.check(missingCoolerHeightBuild);
      expect(result.status).toBe('unknown');
      const issue = result.issues.find((i) => i.severity === 'unknown');
      expect(issue).toBeDefined();
    });

    it('should return unknown status when PSU wattage is missing', () => {
      const result = service.check(missingPsuWattageBuild);
      expect(result.status).toBe('unknown');
      const issue = result.issues.find((i) => i.severity === 'unknown');
      expect(issue).toBeDefined();
    });

    it('should return unknown status when liquid cooler radiator size is missing', () => {
      const result = service.check(missingRadiatorSizeBuild);
      expect(result.status).toBe('unknown');
      const issue = result.issues.find((i) => i.severity === 'unknown');
      expect(issue).toBeDefined();
    });
  });

  describe('5. Issue Structure & Schema Compliance', () => {
    it('every generated issue must contain all required structured fields', () => {
      const result = service.check(socketMismatchBuild);
      expect(result.issues.length).toBeGreaterThan(0);
      for (const issue of result.issues) {
        expect(issue.severity).toBeDefined();
        expect(issue.category).toBeDefined();
        expect(issue.title).toBeDefined();
        expect(issue.explanation).toBeDefined();
        expect(issue.affectedComponents).toBeInstanceOf(Array);
        expect(issue.ruleId).toBeDefined();
        expect(issue.suggestedResolution).toBeDefined();
        // Backward-compat aliases:
        expect(issue.rule).toBe(issue.ruleId);
        expect(issue.message).toBeDefined();
        expect(issue.components).toEqual(issue.affectedComponents);
      }
    });
  });
});
