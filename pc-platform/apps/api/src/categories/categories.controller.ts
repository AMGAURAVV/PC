import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';

import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import type { CategoriesService } from './categories.service';
import type { CreateCategoryDto, UpdateCategoryDto} from './dto/category.dto';
import { CategoryResponseDto } from './dto/category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Create a new category (Admin / Staff / Editor)' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all categories with product counts' })
  @SwaggerResponse({ status: 200, type: [CategoryResponseDto] })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('tree')
  @Public()
  @ApiOperation({ summary: 'Get hierarchical category tree with nested children and counts' })
  @SwaggerResponse({ status: 200, type: [CategoryResponseDto] })
  findTree() {
    return this.categoriesService.findTree();
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get a category by slug' })
  @SwaggerResponse({ status: 200, type: CategoryResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a category by ID' })
  @SwaggerResponse({ status: 200, type: CategoryResponseDto })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Update a category (Admin / Staff / Editor)' })
  @SwaggerResponse({ status: 200, type: CategoryResponseDto })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Delete a category (Admin / Staff)' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
