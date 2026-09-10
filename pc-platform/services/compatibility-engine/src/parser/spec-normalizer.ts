import type { BuildComponents, CompatibilityComponentSpec } from '@pc-platform/types';

import type {
  NormalizedBuild,
  NormalizedCpu,
  NormalizedMotherboard,
  NormalizedRam,
  NormalizedGpu,
  NormalizedStorage,
  NormalizedPsu,
  NormalizedCase,
  NormalizedCooler,
  NormalizedFan,
  NormalizedExpansionCard,
  NormalizedMonitor,
  NormalizedOther,
  M2SlotDetail,
  RadiatorPositionSupport,
  FormFactor,
} from './specs.interface';

/**
 * Normalizes socket naming conventions.
 * E.g., "Socket AM5", "am5", "AM 5" -> "AM5"
 * "LGA 1700", "lga1700", "Intel LGA 1700" -> "LGA1700"
 */
export function normalizeSocket(socket?: string | null): string | undefined {
  if (!socket || typeof socket !== 'string') return undefined;
  const clean = socket.trim();
  const upper = clean.toUpperCase().replace(/\s+/g, '').replace(/^SOCKET/, '');
  if (upper.includes('AM5')) return 'AM5';
  if (upper.includes('AM4')) return 'AM4';
  if (upper.includes('LGA1700') || upper.includes('1700')) return 'LGA1700';
  if (upper.includes('LGA1851') || upper.includes('1851')) return 'LGA1851';
  if (upper.includes('LGA1200') || upper.includes('1200')) return 'LGA1200';
  if (upper.includes('LGA115') || upper.includes('1151') || upper.includes('1150')) return 'LGA115X';
  if (upper.includes('TR5') || upper.includes('STR5')) return 'sTR5';
  if (upper.includes('TR4') || upper.includes('STRX4')) return 'sTRX4';
  return upper;
}

/**
 * Normalizes form factor strings.
 */
export function normalizeFormFactor(ff?: string | null): FormFactor | undefined {
  if (!ff || typeof ff !== 'string') return undefined;
  const upper = ff.trim().toUpperCase().replace(/[\s_-]/g, '');
  if (upper === 'EATX' || upper === 'EXTENDEDATX') return 'E-ATX';
  if (upper === 'ATX') return 'ATX';
  if (upper === 'MICROATX' || upper === 'MATX' || upper === 'UATX') return 'Micro-ATX';
  if (upper === 'MINIITX' || upper === 'ITX' || upper === 'MITX') return 'Mini-ITX';
  return ff.trim();
}

/**
 * Parses numeric values from numbers or strings with unit suffixes.
 * E.g. "170W" -> 170, "165 mm" -> 165, "6000MHz" -> 6000, 32 -> 32
 */
export function parseNumber(val: any): number | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : val;
  if (typeof val === 'string') {
    const match = val.replace(/,/g, '').match(/[-+]?\d+(\.\d+)?/);
    if (match) {
      const parsed = parseFloat(match[0]);
      return isNaN(parsed) ? undefined : parsed;
    }
  }
  return undefined;
}

/**
 * Parses array or comma-separated string of strings.
 */
export function parseStringArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val
      .split(/[,;/|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Normalizes memory type string (e.g., "DDR5", "DDR4", "DDR3").
 */
export function normalizeMemType(val: any): string | undefined {
  if (!val) return undefined;
  const str = String(val).trim().toUpperCase();
  if (str.includes('DDR5')) return 'DDR5';
  if (str.includes('DDR4')) return 'DDR4';
  if (str.includes('DDR3')) return 'DDR3';
  return str;
}

export class SpecNormalizer {
  public static normalizeBuild(components: BuildComponents): NormalizedBuild {
    return {
      cpu: this.normalizeCpu(components.cpu),
      motherboard: this.normalizeMotherboard(components.motherboard),
      cpuCooler: this.normalizeCooler(components.cpuCooler || components.cooling),
      ram: this.normalizeRamList(components.ram),
      gpu: this.normalizeGpu(components.gpu),
      storage: this.normalizeStorageList(components.storage),
      psu: this.normalizePsu(components.psu),
      case: this.normalizeCase(components.case),
      fans: this.normalizeFansList(components.fans),
      expansionCards: this.normalizeExpansionCards(components.expansionCards),
      monitor: this.normalizeMonitor(components.monitor),
      otherComponents: this.normalizeOtherList(components.otherComponents),
    };
  }

  public static normalizeCpu(comp?: CompatibilityComponentSpec): NormalizedCpu | undefined {
    if (!comp) return undefined;
    const s = comp.specs || {};
    const socket = normalizeSocket(s.socketType || s.socket || s.cpuSocket);
    const tdp = parseNumber(s.tdpW || s.tdp || s.thermalDesignPower);
    const maxTdp = parseNumber(s.maxTdpW || s.maxTdp || s.peakTdp || s.ppt || s.pl2) || tdp;

    return {
      productId: comp.productId,
      name: comp.name,
      socketType: socket,
      architecture: (s.architecture || s.arch) as string | undefined,
      generation: (s.generation || s.series) as string | undefined,
      cores: parseNumber(s.cores),
      threads: parseNumber(s.threads),
      tdpW: tdp,
      maxTdpW: maxTdp,
      memoryType: normalizeMemType(s.memoryType || s.memType),
      maxMemoryGb: parseNumber(s.maxMemoryGb || s.maxRamGb),
      maxMemorySpeedMhz: parseNumber(s.maxMemorySpeedMhz || s.maxMemorySpeed),
      pcieGen: parseNumber(s.pcieGen),
      pcieLanes: parseNumber(s.pcieLanes),
      hasIgpu: s.hasIgpu === true || s.has_igpu === 'true' || s.has_igpu === true,
      coolerIncluded: s.coolerIncluded === true || s.cooler_included === true,
    };
  }

  public static normalizeMotherboard(comp?: CompatibilityComponentSpec): NormalizedMotherboard | undefined {
    if (!comp) return undefined;
    const s = comp.specs || {};
    const socket = normalizeSocket(s.socketType || s.socket);
    const rawMemTypes = parseStringArray(s.supportedMemTypes || s.ramType || s.memoryType);
    const memTypes = rawMemTypes.map(normalizeMemType).filter(Boolean) as string[];

    // Parse M.2 slot details
    let m2Slots = parseNumber(s.m2Slots || s.m2Count);
    let m2Details: M2SlotDetail[] = [];
    if (Array.isArray(s.m2Details)) {
      m2Details = s.m2Details.map((slot: any, idx: number) => ({
        slotNumber: parseNumber(slot.slot) || idx + 1,
        key: (slot.key || 'M').toUpperCase(),
        pcieGen: parseNumber(slot.pcie || slot.pcieGen),
        pcieLanes: parseNumber(slot.lanes) || 4,
        supportsSata: slot.sata === true,
        supportsNvme: slot.nvme !== false,
        maxFormFactor: slot.maxFormFactor || '2280',
      }));
      if (m2Slots === undefined) {
        m2Slots = m2Details.length;
      }
    } else if (m2Slots !== undefined && m2Slots > 0) {
      // Create synthetic M.2 slots if only count is given
      for (let i = 1; i <= m2Slots; i++) {
        m2Details.push({
          slotNumber: i,
          key: 'M',
          pcieGen: 4,
          pcieLanes: 4,
          supportsSata: true,
          supportsNvme: true,
          maxFormFactor: '2280',
        });
      }
    }

    // CPU power connectors (EPS)
    let cpuPower: string[] = [];
    if (Array.isArray(s.cpuPowerConnectors)) {
      cpuPower = s.cpuPowerConnectors.map(String);
    } else if (typeof s.cpuPowerConnectors === 'string') {
      cpuPower = s.cpuPowerConnectors.split('+').map((c) => c.trim());
    } else if (s.epsConnectors) {
      const count = parseNumber(s.epsConnectors) || 1;
      cpuPower = Array(count).fill('8-pin');
    } else {
      cpuPower = ['8-pin']; // Standard default
    }

    const fanHeadersCount = parseNumber(
      s.fanHeaders ||
        (parseNumber(s.chassisFanHeaders || 0) || 0) +
          (parseNumber(s.cpuFanHeaders || 0) || 0) +
          (parseNumber(s.pumpHeaders || 0) || 0)
    );

    return {
      productId: comp.productId,
      name: comp.name,
      socketType: socket,
      chipset: (s.chipset as string | undefined)?.toUpperCase().trim(),
      formFactor: normalizeFormFactor(s.formFactor as string),
      supportedMemTypes: memTypes.length > 0 ? memTypes : ['DDR5'],
      ramSlots: parseNumber(s.ramSlots) ?? 4,
      maxRamGb: parseNumber(s.maxRamGb) ?? 128,
      maxRamSpeedMhz: parseNumber(s.maxRamSpeedMhz || s.maxSpeedMhz),
      pcieX16Slots: parseNumber(s.pcieX16Slots) ?? 1,
      pcieX4Slots: parseNumber(s.pcieX4Slots) ?? 0,
      pcieX1Slots: parseNumber(s.pcieX1Slots) ?? 0,
      m2Slots: m2Slots ?? m2Details.length,
      m2Details: m2Details.length > 0 ? m2Details : undefined,
      sataSlots: parseNumber(s.sataSlots || s.sataPorts) ?? 4,
      biosFlashback: s.biosFlashback === true || s.bios_flashback === true,
      minBiosVersionForCpu: s.minBiosVersionForCpu,
      cpuPowerConnectors: cpuPower,
      fanHeaders: fanHeadersCount,
      chassisFanHeaders: parseNumber(s.chassisFanHeaders),
      cpuFanHeaders: parseNumber(s.cpuFanHeaders) ?? 1,
      pumpHeaders: parseNumber(s.pumpHeaders),
      argbHeaders: parseNumber(s.argbHeaders || (s.hasArgbHeaders ? 2 : 0)),
      rgbHeaders: parseNumber(s.rgbHeaders || (s.hasRgbHeaders ? 1 : 0)),
      hasWifi: s.hasWifi === true,
    };
  }

  public static normalizeRamList(ramList?: CompatibilityComponentSpec[]): NormalizedRam[] {
    if (!ramList || !Array.isArray(ramList)) return [];
    return ramList.map((ram) => {
      const s = ram.specs || {};
      const memType = normalizeMemType(s.memType || s.memoryType || s.ramType);
      const totalCapacity = parseNumber(s.totalCapacityGb || s.capacityGb || s.capacity) || 16;
      const stickCount = parseNumber(s.stickCount || s.sticks || s.modules) || 1;
      const capacityPerStick = parseNumber(s.capacityPerStickGb) || totalCapacity / stickCount;

      return {
        productId: ram.productId,
        name: ram.name,
        memType,
        totalCapacityGb: totalCapacity,
        stickCount,
        capacityPerStickGb: capacityPerStick,
        speedMhz: parseNumber(s.speedMhz || s.speed || s.frequency),
        casLatency: parseNumber(s.casLatency || s.cl),
        voltageV: parseNumber(s.voltageV || s.voltage),
        heightMm: parseNumber(s.heightMm || s.height),
        isEcc: s.isEcc === true,
      };
    });
  }

  public static normalizeGpu(comp?: CompatibilityComponentSpec): NormalizedGpu | undefined {
    if (!comp) return undefined;
    const s = comp.specs || {};

    // Parse PCIe power connector requirements
    let pin16Count = 0;
    let pin8Count = 0;
    let pin6Count = 0;

    const rawConn = s.powerConnectors || s.pcieConnectors || s.powerConnector;
    if (typeof rawConn === 'string') {
      const lower = rawConn.toLowerCase();
      if (lower.includes('16-pin') || lower.includes('12vhpwr') || lower.includes('12v-2x6')) {
        const m = lower.match(/(\d+)\s*x\s*(16-pin|12vhpwr)/);
        pin16Count = m && m[1] ? parseInt(m[1], 10) : 1;
      }
      const m8 = lower.match(/(\d+)\s*x\s*8-pin/);
      if (m8 && m8[1]) pin8Count = parseInt(m8[1], 10);
      else if (lower.includes('8-pin') && !lower.includes('16-pin')) pin8Count = 1;

      const m6 = lower.match(/(\d+)\s*x\s*6-pin/);
      if (m6 && m6[1]) pin6Count = parseInt(m6[1], 10);
    } else if (Array.isArray(rawConn)) {
      for (const item of rawConn) {
        if (typeof item === 'object') {
          const type = String(item.type).toLowerCase();
          const count = parseNumber(item.count) || 1;
          if (type.includes('16-pin') || type.includes('12vhpwr')) pin16Count += count;
          else if (type.includes('8-pin')) pin8Count += count;
          else if (type.includes('6-pin')) pin6Count += count;
        }
      }
    }

    const tdp = parseNumber(s.tdpW || s.tdp);

    return {
      productId: comp.productId,
      name: comp.name,
      lengthMm: parseNumber(s.lengthMm || s.length),
      widthMm: parseNumber(s.widthMm || s.width),
      heightMm: parseNumber(s.heightMm || s.height),
      slotWidth: parseNumber(s.slotWidth || s.slots) ?? 2,
      tdpW: tdp,
      recommendedPsuW: parseNumber(s.recommendedPsuW || s.recommendedPsu),
      pciePowerConnectors: {
        pin16Count,
        pin8Count,
        pin6Count,
      },
      requiredPcieSlotWidth: s.pcieSlot || 'x16',
      pcieGen: parseNumber(s.pcieGen),
      vramGb: parseNumber(s.vramGb),
    };
  }

  public static normalizeStorageList(storageList?: CompatibilityComponentSpec[]): NormalizedStorage[] {
    if (!storageList || !Array.isArray(storageList)) return [];
    return storageList.map((st) => {
      const s = st.specs || {};
      const storageType = (s.storageType || s.type) as string | undefined;
      const iface = (s.interface || s.bus) as string | undefined;
      const formFactor = (s.formFactor || s.ff) as string | undefined;

      const isM2 =
        formFactor?.toLowerCase().includes('m.2') ||
        storageType?.toLowerCase().includes('m.2') ||
        iface?.toLowerCase().includes('nvme') ||
        false;

      const isSata =
        iface?.toLowerCase().includes('sata') ||
        storageType?.toLowerCase().includes('sata') ||
        false;

      const isNvme =
        iface?.toLowerCase().includes('nvme') ||
        iface?.toLowerCase().includes('pcie') ||
        storageType?.toLowerCase().includes('nvme') ||
        false;

      return {
        productId: st.productId,
        name: st.name,
        storageType,
        interface: iface,
        formFactor,
        isM2,
        isSata,
        isNvme,
        m2Key: (s.m2Key || (isM2 ? 'M' : undefined)) as any,
        capacityGb: parseNumber(s.capacityGb || s.capacity),
      };
    });
  }

  public static normalizePsu(comp?: CompatibilityComponentSpec): NormalizedPsu | undefined {
    if (!comp) return undefined;
    const s = comp.specs || {};

    let has12vhpwr = s.hasAtx3Connector === true || s.has12vhpwr === true;
    let pcie8PinCount = parseNumber(s.pcie8PinConnectors);
    let pcie6PinCount = parseNumber(s.pcie6PinConnectors) || 0;

    if (Array.isArray(s.pcieConnectors)) {
      for (const item of s.pcieConnectors) {
        if (typeof item === 'object') {
          const type = String(item.type).toLowerCase();
          const count = parseNumber(item.count) || 1;
          if (type.includes('16-pin') || type.includes('12vhpwr')) has12vhpwr = true;
          else if (type.includes('8-pin') || type.includes('6+2')) pcie8PinCount = (pcie8PinCount || 0) + count;
          else if (type.includes('6-pin')) pcie6PinCount += count;
        }
      }
    } else if (typeof s.pcieConnectors === 'string') {
      const lower = s.pcieConnectors.toLowerCase();
      if (lower.includes('16-pin') || lower.includes('12vhpwr')) has12vhpwr = true;
      const m8 = lower.match(/(\d+)\s*x\s*8-pin/);
      if (m8 && m8[1]) pcie8PinCount = parseInt(m8[1], 10);
    }

    return {
      productId: comp.productId,
      name: comp.name,
      wattage: parseNumber(s.wattage || s.watts || s.capacityW),
      efficiencyRating: s.efficiencyRating as string | undefined,
      formFactor: normalizeFormFactor(s.formFactor as string) || 'ATX',
      lengthMm: parseNumber(s.lengthMm || s.length),
      has12vhpwr,
      pcie8PinCount: pcie8PinCount ?? (has12vhpwr ? 4 : 2),
      pcie6PinCount,
      eps12vConnectors: parseNumber(s.eps12vConnectors ?? s.cpuConnectors) ?? 1,
      sataPowerConnectors: parseNumber(s.sataConnectors ?? s.sataPower) ?? 6,
    };
  }

  public static normalizeCase(comp?: CompatibilityComponentSpec): NormalizedCase | undefined {
    if (!comp) return undefined;
    const s = comp.specs || {};

    const rawFf = parseStringArray(s.supportedFormFactors || s.formFactor);
    const supportedFf = rawFf.map(normalizeFormFactor).filter(Boolean) as FormFactor[];

    // Parse radiator support
    const radiatorSupport: RadiatorPositionSupport[] = [];
    let maxRadiatorSizeMm = 0;

    if (Array.isArray(s.radiatorSupport)) {
      for (const item of s.radiatorSupport) {
        if (typeof item === 'object') {
          const size = parseNumber(item.maxMm || item.sizeMm) || 0;
          radiatorSupport.push({
            location: item.location || 'unknown',
            maxMm: size,
          });
          if (size > maxRadiatorSizeMm) maxRadiatorSizeMm = size;
        }
      }
    } else if (s.maxRadiatorMm) {
      maxRadiatorSizeMm = parseNumber(s.maxRadiatorMm) || 0;
      radiatorSupport.push({ location: 'top', maxMm: maxRadiatorSizeMm });
    }

    return {
      productId: comp.productId,
      name: comp.name,
      caseType: s.caseType as string | undefined,
      supportedFormFactors: supportedFf.length > 0 ? supportedFf : ['ATX'],
      maxGpuLengthMm: parseNumber(s.maxGpuLengthMm || s.maxGpuLength),
      maxGpuWidthMm: parseNumber(s.maxGpuWidthMm),
      maxCpuCoolerHeightMm: parseNumber(s.maxCpuCoolerHeightMm || s.maxCpuCoolerHeight),
      maxPsuLengthMm: parseNumber(s.maxPsuLengthMm),
      pciSlots: parseNumber(s.pciSlots || s.expansionSlots) ?? 7,
      radiatorSupport,
      maxRadiatorSizeMm: maxRadiatorSizeMm > 0 ? maxRadiatorSizeMm : undefined,
      includedFans: parseNumber(s.includedFans) ?? 0,
      maxFans: parseNumber(s.maxFans) ?? 6,
    };
  }

  public static normalizeCooler(comp?: CompatibilityComponentSpec): NormalizedCooler | undefined {
    if (!comp) return undefined;
    const s = comp.specs || {};

    const rawSockets = parseStringArray(s.supportedSockets || s.sockets || s.socketSupport);
    const sockets = rawSockets.map(normalizeSocket).filter(Boolean) as string[];

    const coolerTypeStr = (s.coolerType || s.type || '').toString().toLowerCase();
    const coolerType: 'Air' | 'Liquid' | 'Passive' = coolerTypeStr.includes('liquid') ||
      coolerTypeStr.includes('aio') ||
      s.radiatorSizeMm
      ? 'Liquid'
      : coolerTypeStr.includes('passive')
      ? 'Passive'
      : 'Air';

    return {
      productId: comp.productId,
      name: comp.name,
      coolerType,
      supportedSockets: sockets,
      heightMm: parseNumber(s.heightMm || s.height),
      radiatorSizeMm: parseNumber(s.radiatorSizeMm || s.radiatorSize),
      tdpRatingW: parseNumber(s.tdpRatingW || s.tdpRating || s.maxTdp || s.tdp),
      fanCount: parseNumber(s.fanCount) ?? (coolerType === 'Liquid' ? 2 : 1),
      fanHeadersNeeded: parseNumber(s.fanHeadersNeeded) ?? (coolerType === 'Liquid' ? 2 : 1),
      rgbType: s.hasArgb ? 'ARGB' : s.hasRgb ? 'RGB' : 'None',
    };
  }

  public static normalizeFansList(fansList?: CompatibilityComponentSpec[]): NormalizedFan[] {
    if (!fansList || !Array.isArray(fansList)) return [];
    return fansList.map((fan) => {
      const s = fan.specs || {};
      return {
        productId: fan.productId,
        name: fan.name,
        sizeMm: parseNumber(s.sizeMm || s.size) || 120,
        quantity: parseNumber(s.quantity || s.count) || 1,
        connectorType: s.connectorType || '4-pin PWM',
        rgbType: s.hasArgb ? 'ARGB' : s.hasRgb ? 'RGB' : 'None',
      };
    });
  }

  public static normalizeExpansionCards(cardsList?: CompatibilityComponentSpec[]): NormalizedExpansionCard[] {
    if (!cardsList || !Array.isArray(cardsList)) return [];
    return cardsList.map((card) => {
      const s = card.specs || {};
      const width = (s.requiredPcieSlotWidth || s.pcieSlot || 'x1').toString().toLowerCase();
      const pcieWidth: 'x1' | 'x4' | 'x8' | 'x16' = width.includes('16')
        ? 'x16'
        : width.includes('8')
        ? 'x8'
        : width.includes('4')
        ? 'x4'
        : 'x1';

      return {
        productId: card.productId,
        name: card.name,
        cardType: s.cardType || 'Expansion Card',
        requiredPcieSlotWidth: pcieWidth,
        pcieGen: parseNumber(s.pcieGen) || 4,
        slotWidth: parseNumber(s.slotWidth || s.bracketSlots) || 1,
        powerRequiredW: parseNumber(s.powerRequiredW || s.powerW) || 25,
      };
    });
  }

  public static normalizeMonitor(comp?: CompatibilityComponentSpec): NormalizedMonitor | undefined {
    if (!comp) return undefined;
    const s = comp.specs || {};
    return {
      productId: comp.productId,
      name: comp.name,
      resolution: (s.resolution || `${s.resolutionW}x${s.resolutionH}`) as string | undefined,
      refreshRateHz: parseNumber(s.refreshRateHz),
      ports: parseStringArray(s.ports || s.inputPorts),
    };
  }

  public static normalizeOtherList(otherList?: CompatibilityComponentSpec[]): NormalizedOther[] {
    if (!otherList || !Array.isArray(otherList)) return [];
    return otherList.map((other) => ({
      productId: other.productId,
      name: other.name,
      powerW: parseNumber(other.specs?.powerW || other.specs?.tdpW) || 10,
      rawSpecs: other.specs || {},
    }));
  }
}
