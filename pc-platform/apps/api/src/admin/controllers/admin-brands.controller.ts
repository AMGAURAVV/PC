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
  AdminBrandFilterDto,
  AdminCreateBrandDto,
  AdminUpdateBrandDto,
} from '../dto/admin-brand.dto';
import type { AdminBrandsService } from '../services/admin-brands.service';

@ApiTags('admin-brands')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/brands')
export class AdminBrandsController {
  constructor(private readonly brandsService: AdminBrandsService) {}

  @Get()
  @ApiOperation({ summary: 'List brands for administration with product counts' })
  findAll(@Query() query: AdminBrandFilterDto) {
    return this.brandsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single brand details' })
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new brand' })
  create(@CurrentUser() actor: any, @Body() dto: AdminCreateBrandDto) {
    return this.brandsService.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update brand details' })
  update(@Param('id') id: string, @CurrentUser() actor: any, @Body() dto: AdminUpdateBrandDto) {
    return this.brandsService.update(id, dto, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Safely delete a brand (blocked if products exist)' })
  remove(@Param('id') id: string, @CurrentUser() actor: any, @Query('force') force?: boolean) {
    return this.brandsService.delete(id, actor, force);
  }
}
