import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type {
  CreateBuildTemplateDto,
  UpdateBuildTemplateDto,
  BuildTemplateFilterDto,
} from '../dto/admin-template.dto';
import type { AdminTemplatesService } from '../services/admin-templates.service';

@ApiTags('admin-build-templates')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/build-templates')
export class AdminTemplatesController {
  constructor(private readonly templatesService: AdminTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List and search curated PC build templates' })
  findAll(@Query() query: BuildTemplateFilterDto) {
    return this.templatesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a build template' })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new curated build template' })
  create(@CurrentUser() actor: any, @Body() dto: CreateBuildTemplateDto) {
    return this.templatesService.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a build template' })
  update(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: UpdateBuildTemplateDto,
  ) {
    return this.templatesService.update(id, dto, actor);
  }

  @Patch(':id/toggle-featured')
  @ApiOperation({ summary: 'Toggle featured status of a build template' })
  toggleFeatured(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.templatesService.toggleFeatured(id, actor);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle active status of a build template' })
  toggleActive(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.templatesService.toggleActive(id, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a build template' })
  remove(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.templatesService.delete(id, actor);
  }
}
