import { WorkloadBudgetShares } from '../domain/interfaces';

export class BudgetAllocator {
  private static readonly WORKLOAD_SHARES: Record<string, WorkloadBudgetShares> = {
    gaming: {
      gpu: 0.42,
      cpu: 0.20,
      motherboard: 0.12,
      ram: 0.08,
      storage: 0.06,
      psu: 0.06,
      case: 0.04,
      cooling: 0.02,
    },
    creator: {
      cpu: 0.28,
      gpu: 0.32,
      ram: 0.14,
      storage: 0.10,
      motherboard: 0.10,
      psu: 0.06,
      case: 0.04,
      cooling: 0.04,
    },
    workstation: {
      cpu: 0.35,
      gpu: 0.25,
      ram: 0.16,
      storage: 0.10,
      motherboard: 0.12,
      psu: 0.07,
      case: 0.05,
      cooling: 0.05,
    },
    streaming: {
      gpu: 0.38,
      cpu: 0.24,
      ram: 0.12,
      motherboard: 0.10,
      storage: 0.06,
      psu: 0.06,
      case: 0.05,
      cooling: 0.03,
    },
    productivity: {
      cpu: 0.30,
      gpu: 0.15,
      motherboard: 0.18,
      ram: 0.14,
      storage: 0.10,
      psu: 0.08,
      case: 0.05,
      cooling: 0.02,
    },
    budget: {
      cpu: 0.25,
      gpu: 0.35,
      motherboard: 0.14,
      ram: 0.09,
      storage: 0.07,
      psu: 0.06,
      case: 0.04,
      cooling: 0.01,
    },
  };

  public static getShares(useCase: string): WorkloadBudgetShares {
    const normalized = (useCase || 'gaming').toLowerCase().trim();
    const fallback: WorkloadBudgetShares = {
      gpu: 0.42,
      cpu: 0.20,
      motherboard: 0.12,
      ram: 0.08,
      storage: 0.06,
      psu: 0.06,
      case: 0.04,
      cooling: 0.02,
    };
    return this.WORKLOAD_SHARES[normalized] ?? fallback;
  }

  public static allocate(
    totalBudget: number,
    useCase: string,
  ): Record<keyof WorkloadBudgetShares, { target: number; min: number; max: number }> {
    const shares = this.getShares(useCase);
    const result: any = {};

    for (const [category, share] of Object.entries(shares) as [keyof WorkloadBudgetShares, number][]) {
      const target = Math.round(totalBudget * share);
      // Give a sensible bandwidth for component matching (+- 35%)
      const min = Math.max(1000, Math.round(target * 0.65));
      const max = Math.round(target * 1.35);
      result[category] = { target, min, max };
    }

    return result;
  }
}
