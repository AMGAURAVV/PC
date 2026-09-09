import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminCategoriesService } from '../services/admin-categories.service';
import {
  AdminCategoryFilterDto,
  AdminCreateCategoryDto,
  AdminUpdateCategoryDto,
  AdminReorderCategoriesDto,
} from '../dto/admin-category.dto';

@ApiTags('admin-categories')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categoriesService: AdminCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories for administration with product counts' })
  findAll(@Query() query: AdminCategoryFilterDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single category details' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  create(@CurrentUser() actor: any, @Body() dto: AdminCreateCategoryDto) {
    return this.categoriesService.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category details' })
  update(@Param('id') id: string, @CurrentUser() actor: any, @Body() dto: AdminUpdateCategoryDto) {
    return this.categoriesService.update(id, dto, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Safely delete a category (blocked if products or subcategories exist)' })
  remove(@Param('id') id: string, @CurrentUser() actor: any, @Query('force') force?: boolean) {
    return this.categoriesService.delete(id, actor, force);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder categories by sortOrder' })
  reorder(@CurrentUser() actor: any, @Body() dto: AdminReorderCategoriesDto) {
    return this.categoriesService.reorder(dto, actor);
  }
}
