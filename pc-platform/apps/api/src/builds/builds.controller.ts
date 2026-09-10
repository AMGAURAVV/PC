import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse as SwaggerResponse,
  ApiParam,
} from '@nestjs/swagger';

import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import type { BuildsService } from './builds.service';
import type {
  CreateBuildDto,
  UpdateBuildDto,
  AddBuildItemDto,
  ReplaceBuildItemDto,
  ReorderBuildItemsDto,
  SaveBuildVersionDto,
  ShareBuildDto,
  EvaluateBuildDto} from './dto/build.dto';
import {
  BuildResponseDto,
  BuildVersionResponseDto,
  SharedBuildResponseDto,
  BuildCalculationsDto,
} from './dto/build.dto';

@ApiTags('builds')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('builds')
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Evaluate compatibility and calculations for a set of component product IDs (🔓 Public)' })
  @SwaggerResponse({ status: 200, type: BuildCalculationsDto })
  evaluate(@Body() dto: EvaluateBuildDto) {
    return this.buildsService.evaluateItems(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new PC build' })
  @SwaggerResponse({ status: 201, type: BuildResponseDto })
  create(@CurrentUser() user: JwtPayload, @Body() createBuildDto: CreateBuildDto) {
    return this.buildsService.create(user.sub, createBuildDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all builds for the authenticated user' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.buildsService.findAllByUser(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a build by ID with components, calculations, and compatibility status' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @SwaggerResponse({ status: 200, type: BuildResponseDto })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.buildsService.findOne(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update build metadata (name, description, visibility, status)' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @SwaggerResponse({ status: 200, type: BuildResponseDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateBuildDto: UpdateBuildDto,
  ) {
    return this.buildsService.update(id, user.sub, updateBuildDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a build' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.buildsService.remove(id, user.sub);
  }

  // ── Component Management ──────────────────────────────────────────────────

  @Post(':id/items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a component to the build' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @SwaggerResponse({ status: 200, type: BuildResponseDto })
  addItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() addItemDto: AddBuildItemDto,
  ) {
    return this.buildsService.addItem(id, user.sub, addItemDto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove a component from the build' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @ApiParam({ name: 'itemId', description: 'Build item UUID' })
  @SwaggerResponse({ status: 200, type: BuildResponseDto })
  removeItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.buildsService.removeItem(id, user.sub, itemId);
  }

  @Put(':id/items/:itemId')
  @ApiOperation({ summary: 'Replace a component in the build' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @ApiParam({ name: 'itemId', description: 'Build item UUID to replace' })
  @SwaggerResponse({ status: 200, type: BuildResponseDto })
  replaceItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() replaceDto: ReplaceBuildItemDto,
  ) {
    return this.buildsService.replaceItem(id, user.sub, itemId, replaceDto);
  }

  @Patch(':id/items/order')
  @ApiOperation({ summary: 'Reorder components in the build' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @SwaggerResponse({ status: 200, type: BuildResponseDto })
  reorderItems(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() reorderDto: ReorderBuildItemsDto,
  ) {
    return this.buildsService.reorderItems(id, user.sub, reorderDto);
  }

  // ── Save & Versioning ─────────────────────────────────────────────────────

  @Post(':id/save')
  @ApiOperation({ summary: 'Save build milestone and create an immutable historical version snapshot' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @SwaggerResponse({ status: 201, type: BuildVersionResponseDto })
  saveVersion(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SaveBuildVersionDto,
  ) {
    return this.buildsService.saveVersion(id, user.sub, dto);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List all historical versions of a build' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @SwaggerResponse({ status: 200, type: [BuildVersionResponseDto] })
  getVersions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.buildsService.getVersions(id, user.sub);
  }

  @Get(':id/versions/:versionNumber')
  @ApiOperation({ summary: 'Get a specific immutable historical version snapshot' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @ApiParam({ name: 'versionNumber', description: 'Version integer (1, 2, ...)' })
  @SwaggerResponse({ status: 200, type: BuildVersionResponseDto })
  getVersion(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
  ) {
    return this.buildsService.getVersion(id, user.sub, versionNumber);
  }

  // ── Duplicate & Check ─────────────────────────────────────────────────────

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing build' })
  @ApiParam({ name: 'id', description: 'Build UUID to clone' })
  @SwaggerResponse({ status: 201, type: BuildResponseDto })
  duplicate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.buildsService.duplicate(id, user.sub);
  }

  @Post(':id/check')
  @ApiOperation({ summary: 'Execute an on-demand hardware compatibility evaluation via the compatibility engine' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  checkCompatibility(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.buildsService.checkCompatibility(id, user.sub);
  }

  // ── Publish / Share ───────────────────────────────────────────────────────

  @Post(':id/share')
  @ApiOperation({ summary: 'Publish and generate a shareable URL/slug for the build' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @SwaggerResponse({ status: 201, type: SharedBuildResponseDto })
  share(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() shareDto: ShareBuildDto,
  ) {
    return this.buildsService.share(id, user.sub, shareDto);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish the build and deactivate all shared links' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  unpublish(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.buildsService.unpublish(id, user.sub);
  }
}
