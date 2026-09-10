import { Controller, Get, Param, Query } from '@nestjs/common';
import type {
  UseCaseDefinition,
  ConfiguratorBaseBuild,
  ConfiguratorOptionsResponse,
  ApiResponse,
} from '@pc-platform/types';

import { Public } from '../common/decorators/public.decorator';

import type { ConfiguratorService } from './configurator.service';
import type { GetBaseBuildsQueryDto } from './dto/configurator.dto';

@Controller('configurator')
export class ConfiguratorController {
  constructor(private readonly configuratorService: ConfiguratorService) {}

  @Public()
  @Get('use-cases')
  getUseCases(): ApiResponse<UseCaseDefinition[]> {
    const data = this.configuratorService.getUseCases();
    return { success: true, data };
  }

  @Public()
  @Get('base-builds')
  getBaseBuilds(
    @Query() query: GetBaseBuildsQueryDto,
  ): ApiResponse<ConfiguratorBaseBuild[]> {
    const data = this.configuratorService.getBaseBuilds(query);
    return { success: true, data };
  }

  @Public()
  @Get('base-builds/:id')
  getBaseBuildById(@Param('id') id: string): ApiResponse<ConfiguratorBaseBuild> {
    const data = this.configuratorService.getBaseBuildById(id);
    return { success: true, data };
  }

  @Public()
  @Get('base-builds/:id/options')
  async getBaseBuildOptions(
    @Param('id') id: string,
  ): Promise<ApiResponse<ConfiguratorOptionsResponse>> {
    const data = await this.configuratorService.getBaseBuildOptions(id);
    return { success: true, data };
  }
}
