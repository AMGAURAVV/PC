import {
  getConfiguratorUseCases,
  getBaseBuilds,
  getConfiguratorOptions,
} from '../lib/api/client';
import type {
  UseCaseDefinition,
  ConfiguratorBaseBuild,
  ConfiguratorOptionsResponse,
  ApiResponse,
} from '@pc-platform/types';

export const configuratorService = {
  async getUseCases(): Promise<ApiResponse<UseCaseDefinition[]>> {
    return getConfiguratorUseCases();
  },

  async getBaseBuilds(params?: {
    useCase?: string;
    budgetMin?: number;
    budgetMax?: number;
  }): Promise<ApiResponse<ConfiguratorBaseBuild[]>> {
    return getBaseBuilds(params);
  },

  async getConfiguratorOptions(
    baseBuildId: string,
  ): Promise<ApiResponse<ConfiguratorOptionsResponse>> {
    return getConfiguratorOptions(baseBuildId);
  },
};
