import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiParam } from '@nestjs/swagger';

import { Public } from '../common/decorators/public.decorator';

import { BuildsService } from './builds.service';
import { SharedBuildResponseDto } from './dto/build.dto';

@ApiTags('builds')
@Controller('shared-builds')
export class SharedBuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @Get(':slug')
  @Public()
  @ApiOperation({
    summary: 'Retrieve a public or shared build using its unique share token/slug (🔓 Public)',
  })
  @ApiParam({ name: 'slug', description: 'Unique URL-safe share token/slug' })
  @SwaggerResponse({ status: 200, type: SharedBuildResponseDto })
  getSharedBuild(@Param('slug') slug: string) {
    return this.buildsService.getSharedBuild(slug);
  }
}
