'use client';

import * as React from 'react';
import { Input, Label } from '@pc-platform/ui';

interface SpecEditorProps {
  componentType: string;
  specs: Record<string, any>;
  onChange: (specs: Record<string, any>) => void;
}

export function SpecEditor({ componentType, specs, onChange }: SpecEditorProps) {
  const normType = (componentType || 'OTHER').toUpperCase();

  const handleChange = (field: string, value: any) => {
    onChange({
      ...specs,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-cyber-800 pb-3">
        <div>
          <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            {normType} Architectural & Physical Specifications
          </h4>
          <p className="text-xs text-cyber-400">
            Engine uses these exact parameters for rule-based PC compatibility evaluation.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
          SCHEMA: {normType}_SPEC
        </span>
      </div>

      {normType === 'CPU' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-mono text-cyber-300">Socket (e.g. LGA1700, AM5)</Label>
            <Input
              value={specs.socket || ''}
              onChange={(e) => handleChange('socket', e.target.value)}
              placeholder="LGA1700 / AM5"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Cores Count</Label>
            <Input
              type="number"
              value={specs.coreCount ?? ''}
              onChange={(e) => handleChange('coreCount', Number(e.target.value))}
              placeholder="e.g. 16"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Threads Count</Label>
            <Input
              type="number"
              value={specs.threadCount ?? ''}
              onChange={(e) => handleChange('threadCount', Number(e.target.value))}
              placeholder="e.g. 24"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Base Clock (GHz)</Label>
            <Input
              type="number"
              step="0.1"
              value={specs.baseClockGhz ?? ''}
              onChange={(e) => handleChange('baseClockGhz', Number(e.target.value))}
              placeholder="e.g. 3.4"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Boost Clock (GHz)</Label>
            <Input
              type="number"
              step="0.1"
              value={specs.boostClockGhz ?? ''}
              onChange={(e) => handleChange('boostClockGhz', Number(e.target.value))}
              placeholder="e.g. 5.6"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Thermal Design Power TDP (Watts)</Label>
            <Input
              type="number"
              value={specs.tdpWatts ?? ''}
              onChange={(e) => handleChange('tdpWatts', Number(e.target.value))}
              placeholder="e.g. 125"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">PCIe Version</Label>
            <Input
              value={specs.pcieVersion || ''}
              onChange={(e) => handleChange('pcieVersion', e.target.value)}
              placeholder="e.g. PCIe 5.0"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Integrated Graphics</Label>
            <Input
              value={specs.integratedGpu || ''}
              onChange={(e) => handleChange('integratedGpu', e.target.value)}
              placeholder="e.g. Intel UHD 770 / None"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="includesCooler"
              checked={Boolean(specs.includesCooler)}
              onChange={(e) => handleChange('includesCooler', e.target.checked)}
              className="rounded bg-cyber-900 border-cyber-700 text-cyan-500"
            />
            <label htmlFor="includesCooler" className="text-xs font-mono text-cyber-300 cursor-pointer">
              Includes Box Cooler
            </label>
          </div>
        </div>
      )}

      {normType === 'MOTHERBOARD' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-mono text-cyber-300">CPU Socket</Label>
            <Input
              value={specs.socket || ''}
              onChange={(e) => handleChange('socket', e.target.value)}
              placeholder="LGA1700 / AM5"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Chipset</Label>
            <Input
              value={specs.chipset || ''}
              onChange={(e) => handleChange('chipset', e.target.value)}
              placeholder="e.g. Z790, B650, X670E"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Form Factor</Label>
            <Input
              value={specs.formFactor || ''}
              onChange={(e) => handleChange('formFactor', e.target.value)}
              placeholder="ATX / Micro-ATX / Mini-ITX"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Memory Type (DDR4 / DDR5)</Label>
            <Input
              value={specs.memoryType || ''}
              onChange={(e) => handleChange('memoryType', e.target.value)}
              placeholder="DDR5"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Memory Slots</Label>
            <Input
              type="number"
              value={specs.memorySlots ?? ''}
              onChange={(e) => handleChange('memorySlots', Number(e.target.value))}
              placeholder="e.g. 4"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Max Memory Capacity (GB)</Label>
            <Input
              type="number"
              value={specs.maxMemoryGb ?? ''}
              onChange={(e) => handleChange('maxMemoryGb', Number(e.target.value))}
              placeholder="e.g. 192"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">M.2 NVMe Slots Count</Label>
            <Input
              type="number"
              value={specs.m2SlotsCount ?? ''}
              onChange={(e) => handleChange('m2SlotsCount', Number(e.target.value))}
              placeholder="e.g. 4"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">PCIe x16 Slots Count</Label>
            <Input
              type="number"
              value={specs.pcieSlotsCount ?? ''}
              onChange={(e) => handleChange('pcieSlotsCount', Number(e.target.value))}
              placeholder="e.g. 2"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="hasWifi"
              checked={Boolean(specs.hasWifi)}
              onChange={(e) => handleChange('hasWifi', e.target.checked)}
              className="rounded bg-cyber-900 border-cyber-700 text-cyan-500"
            />
            <label htmlFor="hasWifi" className="text-xs font-mono text-cyber-300 cursor-pointer">
              Built-in Wi-Fi & Bluetooth
            </label>
          </div>
        </div>
      )}

      {normType === 'GPU' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-mono text-cyber-300">Graphics Chipset</Label>
            <Input
              value={specs.chipset || ''}
              onChange={(e) => handleChange('chipset', e.target.value)}
              placeholder="e.g. RTX 4080 Super / RX 7900 XTX"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">VRAM Capacity (GB)</Label>
            <Input
              type="number"
              value={specs.vramGb ?? ''}
              onChange={(e) => handleChange('vramGb', Number(e.target.value))}
              placeholder="e.g. 16"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Physical Length (mm)</Label>
            <Input
              type="number"
              value={specs.lengthMm ?? ''}
              onChange={(e) => handleChange('lengthMm', Number(e.target.value))}
              placeholder="e.g. 336"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Slot Width (e.g. 2.5, 3.5 slots)</Label>
            <Input
              type="number"
              step="0.5"
              value={specs.slotWidth ?? ''}
              onChange={(e) => handleChange('slotWidth', Number(e.target.value))}
              placeholder="e.g. 3.2"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Board Power TDP (Watts)</Label>
            <Input
              type="number"
              value={specs.tdpWatts ?? ''}
              onChange={(e) => handleChange('tdpWatts', Number(e.target.value))}
              placeholder="e.g. 320"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Recommended PSU (Watts)</Label>
            <Input
              type="number"
              value={specs.psuRecommendedWatts ?? ''}
              onChange={(e) => handleChange('psuRecommendedWatts', Number(e.target.value))}
              placeholder="e.g. 750"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-mono text-cyber-300">Power Connector Interface</Label>
            <Input
              value={specs.powerConnectors || ''}
              onChange={(e) => handleChange('powerConnectors', e.target.value)}
              placeholder="e.g. 1x 16-pin 12VHPWR or 2x 8-pin PCIe"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
        </div>
      )}

      {normType === 'RAM' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-mono text-cyber-300">DDR Generation</Label>
            <Input
              value={specs.ddrGeneration || ''}
              onChange={(e) => handleChange('ddrGeneration', e.target.value)}
              placeholder="DDR5 / DDR4"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Total Capacity (GB)</Label>
            <Input
              type="number"
              value={specs.capacityGb ?? ''}
              onChange={(e) => handleChange('capacityGb', Number(e.target.value))}
              placeholder="e.g. 32"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Module Count (e.g. 2x16GB = 2)</Label>
            <Input
              type="number"
              value={specs.modulesCount ?? ''}
              onChange={(e) => handleChange('modulesCount', Number(e.target.value))}
              placeholder="e.g. 2"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Speed (MHz)</Label>
            <Input
              type="number"
              value={specs.speedMhz ?? ''}
              onChange={(e) => handleChange('speedMhz', Number(e.target.value))}
              placeholder="e.g. 6000"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">CAS Latency (CL)</Label>
            <Input
              value={specs.casLatency || ''}
              onChange={(e) => handleChange('casLatency', e.target.value)}
              placeholder="e.g. CL30"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isRgb"
              checked={Boolean(specs.isRgb)}
              onChange={(e) => handleChange('isRgb', e.target.checked)}
              className="rounded bg-cyber-900 border-cyber-700 text-cyan-500"
            />
            <label htmlFor="isRgb" className="text-xs font-mono text-cyber-300 cursor-pointer">
              RGB Lighting Equipped
            </label>
          </div>
        </div>
      )}

      {normType === 'CASE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-mono text-cyber-300">Motherboard Form Factor Support</Label>
            <Input
              value={specs.formFactorSupport || ''}
              onChange={(e) => handleChange('formFactorSupport', e.target.value)}
              placeholder="ATX, Micro-ATX, Mini-ITX"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Max GPU Length Clearance (mm)</Label>
            <Input
              type="number"
              value={specs.maxGpuLengthMm ?? ''}
              onChange={(e) => handleChange('maxGpuLengthMm', Number(e.target.value))}
              placeholder="e.g. 400"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Max CPU Cooler Height (mm)</Label>
            <Input
              type="number"
              value={specs.maxCoolerHeightMm ?? ''}
              onChange={(e) => handleChange('maxCoolerHeightMm', Number(e.target.value))}
              placeholder="e.g. 175"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Max Radiator Mount Size (mm)</Label>
            <Input
              type="number"
              value={specs.radiatorSupportMm ?? ''}
              onChange={(e) => handleChange('radiatorSupportMm', Number(e.target.value))}
              placeholder="e.g. 360"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Included Fans Count</Label>
            <Input
              type="number"
              value={specs.includedFansCount ?? ''}
              onChange={(e) => handleChange('includedFansCount', Number(e.target.value))}
              placeholder="e.g. 4"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
        </div>
      )}

      {normType === 'PSU' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-mono text-cyber-300">Wattage (W)</Label>
            <Input
              type="number"
              value={specs.wattage ?? ''}
              onChange={(e) => handleChange('wattage', Number(e.target.value))}
              placeholder="e.g. 850"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">80+ Efficiency Rating</Label>
            <Input
              value={specs.efficiencyRating || ''}
              onChange={(e) => handleChange('efficiencyRating', e.target.value)}
              placeholder="80+ Gold / Platinum"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Modularity</Label>
            <Input
              value={specs.modularity || ''}
              onChange={(e) => handleChange('modularity', e.target.value)}
              placeholder="Full Modular / Semi"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Form Factor</Label>
            <Input
              value={specs.formFactor || ''}
              onChange={(e) => handleChange('formFactor', e.target.value)}
              placeholder="ATX / SFX"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="hasAtx3"
              checked={Boolean(specs.hasAtx3)}
              onChange={(e) => handleChange('hasAtx3', e.target.checked)}
              className="rounded bg-cyber-900 border-cyber-700 text-cyan-500"
            />
            <label htmlFor="hasAtx3" className="text-xs font-mono text-cyber-300 cursor-pointer">
              ATX 3.0 / PCIe 5.0 (12VHPWR Native)
            </label>
          </div>
        </div>
      )}

      {/* Fallback for general hardware / additional key-values */}
      {['STORAGE', 'COOLER', 'FAN', 'MONITOR', 'OTHER'].includes(normType) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-mono text-cyber-300">Interface / Standard</Label>
            <Input
              value={specs.interface || ''}
              onChange={(e) => handleChange('interface', e.target.value)}
              placeholder="e.g. PCIe 4.0 x4 / SATA 3"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Form Factor / Size</Label>
            <Input
              value={specs.formFactor || ''}
              onChange={(e) => handleChange('formFactor', e.target.value)}
              placeholder="e.g. M.2 2280 / 120mm / 27-inch"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-cyber-300">Primary Capacity / Metric</Label>
            <Input
              value={specs.capacity || ''}
              onChange={(e) => handleChange('capacity', e.target.value)}
              placeholder="e.g. 2TB / 240Hz / 360mm"
              className="mt-1 h-8 text-xs font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
