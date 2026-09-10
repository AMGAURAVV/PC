import { CandidateBuild } from '../domain/interfaces';
import { CompatibilityStatus } from '@pc-platform/types';

export class CompatibilityScorer {
  /**
   * Evaluates hardware compatibility and clearance margins.
   * Returns a score between 0 and 100.
   */
  public static score(build: CandidateBuild): {
    score: number;
    status: CompatibilityStatus;
    notes: string[];
  } {
    const notes: string[] = [];
    let score = 100;
    let status: CompatibilityStatus = 'compatible';

    const cpuSpecs = build.cpu?.specifications || {};
    const mbSpecs = build.motherboard?.specifications || {};
    const ramSpecs = build.ram?.specifications || {};
    const psuSpecs = build.psu?.specifications || {};
    const caseSpecs = build.case?.specifications || {};
    const gpuSpecs = build.gpu?.specifications || {};
    const coolerSpecs = build.cooling?.specifications || {};

    // 1. CPU Socket vs Motherboard Socket
    const cpuSocket = String(cpuSpecs.socket || cpuSpecs.socketType || '').toLowerCase().trim();
    const mbSocket = String(mbSpecs.socket || mbSpecs.socketType || '').toLowerCase().trim();
    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      score -= 80;
      status = 'incompatible';
      notes.push(`Socket mismatch: CPU (${cpuSocket}) does not fit Motherboard (${mbSocket})`);
    }

    // 2. RAM Generation vs Motherboard RAM Type
    const ramGen = String(ramSpecs.type || ramSpecs.ramType || '').toLowerCase().trim();
    const mbRamGen = String(mbSpecs.memoryType || mbSpecs.ramType || '').toLowerCase().trim();
    if (ramGen && mbRamGen && !mbRamGen.includes(ramGen) && !ramGen.includes(mbRamGen)) {
      score -= 80;
      status = 'incompatible';
      notes.push(`Memory mismatch: RAM (${ramGen.toUpperCase()}) not supported by Motherboard (${mbRamGen.toUpperCase()})`);
    }

    // 3. Estimated Power Draw vs PSU Wattage
    const cpuTdp = Number(cpuSpecs.tdp || 65);
    const gpuTdp = Number(gpuSpecs.tdp || 150);
    const systemDraw = cpuTdp + gpuTdp + 80; // Baseline motherboard, RAM, storage, fans
    const psuWatts = Number(psuSpecs.wattage || 650);

    if (psuWatts < systemDraw) {
      score -= 60;
      status = 'incompatible';
      notes.push(`Power deficit: PSU wattage (${psuWatts}W) is lower than estimated peak draw (${systemDraw}W)`);
    } else if (psuWatts < systemDraw * 1.2) {
      score -= 15;
      if (status === 'compatible') status = 'warning';
      notes.push(`Low PSU headroom: ${psuWatts}W allows less than 20% transient headroom`);
    }

    // 4. GPU Length vs Case Max GPU Clearance
    const gpuLength = Number(gpuSpecs.length || gpuSpecs.lengthMm || 280);
    const caseGpuMax = Number(caseSpecs.maxGpuLength || caseSpecs.maxGpuLengthMm || 360);
    if (gpuLength > caseGpuMax) {
      score -= 70;
      status = 'incompatible';
      notes.push(`GPU physical clearance issue: GPU (${gpuLength}mm) exceeds case limit (${caseGpuMax}mm)`);
    }

    // 5. Cooler Height vs Case Max CPU Cooler Clearance
    const coolerHeight = Number(coolerSpecs.height || coolerSpecs.heightMm || 155);
    const caseCoolerMax = Number(caseSpecs.maxCpuCoolerHeight || caseSpecs.maxCoolerHeightMm || 165);
    if (coolerHeight > caseCoolerMax) {
      score -= 70;
      status = 'incompatible';
      notes.push(`Cooler clearance issue: Cooler (${coolerHeight}mm) exceeds case max (${caseCoolerMax}mm)`);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      status,
      notes,
    };
  }
}
