import { ComponentCategory } from '@pc-platform/types';

import {
  normalizeSocket,
  normalizeFormFactor,
  normalizeMemType,
  parseNumber,
  parseStringArray,
  SpecNormalizer,
} from '../src/parser/spec-normalizer';

describe('SpecNormalizer Unit Tests', () => {
  describe('normalizeSocket', () => {
    it('should normalize AM5 variants', () => {
      expect(normalizeSocket('Socket AM5')).toBe('AM5');
      expect(normalizeSocket('am5')).toBe('AM5');
      expect(normalizeSocket('AMD AM5')).toBe('AM5');
    });

    it('should normalize LGA1700 variants', () => {
      expect(normalizeSocket('LGA 1700')).toBe('LGA1700');
      expect(normalizeSocket('lga1700')).toBe('LGA1700');
      expect(normalizeSocket('Intel LGA 1700')).toBe('LGA1700');
    });

    it('should handle undefined or empty strings', () => {
      expect(normalizeSocket(undefined)).toBeUndefined();
      expect(normalizeSocket('')).toBeUndefined();
    });
  });

  describe('normalizeFormFactor', () => {
    it('should normalize standard form factors', () => {
      expect(normalizeFormFactor('ATX')).toBe('ATX');
      expect(normalizeFormFactor('mATX')).toBe('Micro-ATX');
      expect(normalizeFormFactor('micro-atx')).toBe('Micro-ATX');
      expect(normalizeFormFactor('Mini-ITX')).toBe('Mini-ITX');
      expect(normalizeFormFactor('EATX')).toBe('E-ATX');
    });
  });

  describe('normalizeMemType', () => {
    it('should normalize DDR types', () => {
      expect(normalizeMemType('DDR5')).toBe('DDR5');
      expect(normalizeMemType('ddr5-6000')).toBe('DDR5');
      expect(normalizeMemType('DDR4')).toBe('DDR4');
    });
  });

  describe('parseNumber', () => {
    it('should extract numeric values from strings with units', () => {
      expect(parseNumber('170W')).toBe(170);
      expect(parseNumber('165 mm')).toBe(165);
      expect(parseNumber('6000MHz')).toBe(6000);
      expect(parseNumber('32GB')).toBe(32);
      expect(parseNumber(450)).toBe(450);
      expect(parseNumber('357.6mm')).toBe(357.6);
      expect(parseNumber(undefined)).toBeUndefined();
      expect(parseNumber('invalid')).toBeUndefined();
    });
  });

  describe('parseStringArray', () => {
    it('should parse arrays and delimited strings', () => {
      expect(parseStringArray(['AM5', 'AM4'])).toEqual(['AM5', 'AM4']);
      expect(parseStringArray('AM5, AM4; LGA1700')).toEqual(['AM5', 'AM4', 'LGA1700']);
      expect(parseStringArray(undefined)).toEqual([]);
    });
  });

  describe('SpecNormalizer.normalizeGpu', () => {
    it('should parse 16-pin 12VHPWR connectors from strings', () => {
      const gpu = SpecNormalizer.normalizeGpu({
        productId: 'gpu-1',
        name: 'RTX 4090',
        category: ComponentCategory.GPU,
        specs: {
          powerConnectors: '1x 16-pin (600W)',
          lengthMm: '336mm',
          tdpW: '450W',
        },
      });

      expect(gpu?.pciePowerConnectors?.pin16Count).toBe(1);
      expect(gpu?.lengthMm).toBe(336);
      expect(gpu?.tdpW).toBe(450);
    });

    it('should parse multiple 8-pin connectors from string', () => {
      const gpu = SpecNormalizer.normalizeGpu({
        productId: 'gpu-2',
        name: 'RX 7900 XTX',
        category: ComponentCategory.GPU,
        specs: {
          powerConnectors: '3x 8-pin',
        },
      });

      expect(gpu?.pciePowerConnectors?.pin8Count).toBe(3);
    });
  });
});
