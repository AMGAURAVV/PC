import {
  getBuilds,
  getBuildById,
  createBuild,
  updateBuild,
  deleteBuild,
  checkCompatibility,
  evaluateBuild,
} from '../lib/api/client';
import { API_ENDPOINTS } from '../lib/api/endpoints';
import type {
  Build,
  BuildComponents,
  CompatibilityResult,
  CreateBuildInput,
  EvaluateBuildInput,
  BuildCalculations,
  ApiResponse,
  PaginatedResponse,
} from '@pc-platform/types';

export interface AddBuildItemInput {
  productId: string;
  category: string;
  quantity?: number;
  slot?: number;
}

export interface SaveBuildInput {
  changeSummary?: string;
  isMajor?: boolean;
}

export const buildsService = {
  async getBuilds(): Promise<PaginatedResponse<Build>> {
    return getBuilds();
  },

  async getBuildById(id: string): Promise<ApiResponse<Build>> {
    return getBuildById(id);
  },

  async createBuild(input: CreateBuildInput): Promise<ApiResponse<Build>> {
    return createBuild(input);
  },

  async updateBuild(id: string, input: Partial<CreateBuildInput>): Promise<ApiResponse<Build>> {
    return updateBuild(id, input);
  },

  async deleteBuild(id: string): Promise<void> {
    return deleteBuild(id);
  },

  async checkCompatibility(components: BuildComponents): Promise<ApiResponse<CompatibilityResult>> {
    return checkCompatibility(components);
  },

  async evaluateBuild(input: EvaluateBuildInput): Promise<ApiResponse<BuildCalculations>> {
    return evaluateBuild(input);
  },

  // Extended Build Engine API
  async addItem(buildId: string, item: AddBuildItemInput): Promise<ApiResponse<Build>> {
    const res = await fetch(`${API_ENDPOINTS.BUILDS.ITEMS(buildId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.json();
  },

  async removeItem(buildId: string, itemId: string): Promise<ApiResponse<Build>> {
    const res = await fetch(`${API_ENDPOINTS.BUILDS.ITEM_DETAIL(buildId, itemId)}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async saveBuild(buildId: string, input?: SaveBuildInput): Promise<ApiResponse<Build>> {
    const res = await fetch(`${API_ENDPOINTS.BUILDS.SAVE(buildId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input || {}),
    });
    return res.json();
  },

  async duplicateBuild(buildId: string, newName?: string): Promise<ApiResponse<Build>> {
    const res = await fetch(`${API_ENDPOINTS.BUILDS.DUPLICATE(buildId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    return res.json();
  },

  async publishBuild(buildId: string): Promise<ApiResponse<{ shareUrl: string }>> {
    const res = await fetch(`${API_ENDPOINTS.BUILDS.PUBLISH(buildId)}`, {
      method: 'POST',
    });
    return res.json();
  },

  async unpublishBuild(buildId: string): Promise<ApiResponse<{ published: boolean }>> {
    const res = await fetch(`${API_ENDPOINTS.BUILDS.UNPUBLISH(buildId)}`, {
      method: 'POST',
    });
    return res.json();
  },

  async getSharedBuild(shareUrl: string): Promise<ApiResponse<Build>> {
    const res = await fetch(`${API_ENDPOINTS.BUILDS.SHARE(shareUrl)}`);
    return res.json();
  },
};
