import { CandidateBuild } from '../domain/interfaces';
import { Product } from '@pc-platform/types';

export class AvailabilityScorer {
  /**
   * Evaluates inventory stock levels and part availability.
   * Returns a score between 0 and 100.
   */
  public static score(build: CandidateBuild): number {
    const components: (Product | undefined)[] = [
      build.cpu,
      build.motherboard,
      build.gpu,
      build.ram,
      build.storage,
      build.psu,
      build.case,
      build.cooling,
    ].filter(Boolean);

    if (components.length === 0) return 0;

    let totalScore = 0;

    for (const comp of components) {
      if (!comp) continue;
      const stock = comp.stock ?? 10;
      const isActive = comp.isActive ?? true;

      if (!isActive || stock <= 0) {
        totalScore += 0;
      } else if (stock <= 2) {
        totalScore += 60; // Low stock urgency / risk
      } else if (stock <= 5) {
        totalScore += 80;
      } else {
        totalScore += 100; // Readily available
      }
    }

    return Math.round(totalScore / components.length);
  }
}
