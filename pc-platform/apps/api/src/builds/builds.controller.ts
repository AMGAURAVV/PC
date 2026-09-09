import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { BuildsService } from './builds.service';
import { CreateBuildDto, UpdateBuildDto, BuildResponseDto } from './dto/build.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('builds')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('builds')
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new PC build' })
  create(@CurrentUser() user: JwtPayload, @Body() createBuildDto: CreateBuildDto) {
    return this.buildsService.create(user.sub, createBuildDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all builds for the current user' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.buildsService.findAllByUser(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a build by ID' })
  @SwaggerResponse({ status: 200, type: BuildResponseDto })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.buildsService.findOne(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a build' })
  @SwaggerResponse({ status: 200, type: BuildResponseDto })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() updateBuildDto: UpdateBuildDto) {
    return this.buildsService.update(id, user.sub, updateBuildDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a build' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.buildsService.remove(id, user.sub);
  }
}
