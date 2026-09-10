import { CandidateBuild } from '../domain/interfaces';

export class PowerEfficiencyScorer {
  /**
   * Evaluates power efficiency, 80 Plus rating, and optimal load percentage.
   * Peak PSU efficiency occurs around 50% - 65% capacity.
   * Returns a score between 0 and 100.
   */
  public static score(build: CandidateBuild): number {
    const cpuSpecs = build.cpu?.specifications || {};
    const gpuSpecs = build.gpu?.specifications || {};
    const psuSpecs = build.psu?.specifications || {};

    const cpuTdp = Number(cpuSpecs.tdp || 65);
    const gpuTdp = Number(gpuSpecs.tdp || 150);
    const estimatedSystemDraw = cpuTdp + gpuTdp + 75; // motherboard, fans, storage, RAM
    const psuWattage = Number(psuSpecs.wattage || 650);

    // 1. Efficiency Rating Score (Bronze = 75, Silver = 82, Gold = 92, Platinum = 97, Titanium = 100)
    const ratingStr = String(
      psuSpecs.efficiencyRating || psuSpecs.certification || psuSpecs.rating || '80+ Bronze',
    ).toLowerCase();

    let certScore = 75;
    if (ratingStr.includes('titanium')) certScore = 100;
    else if (ratingStr.includes('platinum')) certScore = 96;
    else if (ratingStr.includes('gold')) certScore = 90;
    else if (ratingStr.includes('silver')) certScore = 82;
    else if (ratingStr.includes('bronze')) certScore = 75;

    // 2. Load Percentage Score
    // Optimal load is 50-65%
    const loadPercentage = psuWattage > 0 ? (estimatedSystemDraw / psuWattage) * 100 : 80;

    let loadScore = 70;
    if (loadPercentage >= 45 && loadPercentage <= 65) {
      loadScore = 100; // Perfect sweet-spot
    } else if (loadPercentage > 65 && loadPercentage <= 75) {
      loadScore = 90;
    } else if (loadPercentage > 75 && loadPercentage <= 85) {
      loadScore = 75;
    } else if (loadPercentage > 85) {
      loadScore = 55; // Pushing PSU hard, higher heat and fan noise
    } else if (loadPercentage < 45) {
      loadScore = 80; // Oversized PSU, operates below optimal curve
    }

    return Math.round(certScore * 0.50 + loadScore * 0.50);
  }
}
